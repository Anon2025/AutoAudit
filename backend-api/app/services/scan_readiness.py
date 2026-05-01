"""Pre-scan readiness checks for M365 compliance scans.

This module validates whether a selected M365 connection and benchmark are
ready enough to start a scan with actionable results.
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.services.m365_graph import (
    M365ConnectionError,
    acquire_graph_access_token,
    validate_m365_connection,
)


CRITICAL_BASELINE_PERMISSIONS = {
    "Organization.Read.All",
    "User.Read.All",
    "RoleManagement.Read.Directory",
}

# Probe endpoints used to test whether the token can access data that requires
# each permission. If a permission isn't mapped, we report it as unverified.
PERMISSION_PROBES: dict[str, str] = {
    "Organization.Read.All": "/v1.0/organization?$top=1&$select=id",
    "User.Read.All": "/v1.0/users?$top=1&$select=id",
    # directoryRoles does not support $top; use a minimal supported projection instead.
    "RoleManagement.Read.Directory": "/v1.0/directoryRoles?$select=id",
    "Group.Read.All": "/v1.0/groups?$top=1&$select=id",
    "Domain.Read.All": "/v1.0/domains?$top=1&$select=id",
    "Policy.Read.All": "/v1.0/policies/authorizationPolicy?$select=id",
    "OrgSettings-Forms.Read.All": "/beta/admin/forms/settings",
    "OrgSettings-AppsAndServices.Read.All": "/beta/admin/appsAndServices",
}


@dataclass
class ReadinessCheck:
    key: str
    label: str
    status: str
    severity: str
    message: str


@dataclass
class ReadinessResult:
    ready: bool
    summary: str
    required_permissions: list[str]
    missing_permissions: list[str]
    unverified_permissions: list[str]
    checks: list[ReadinessCheck]


def extract_graph_error_detail(response: httpx.Response) -> str | None:
    """Extract a short Graph error message for non-auth probe failures."""
    try:
        payload = response.json()
    except Exception:
        payload = None

    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            message = error.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
        detail = payload.get("detail")
        if isinstance(detail, str) and detail.strip():
            return detail.strip()

    text = (response.text or "").strip()
    if text:
        return text.splitlines()[0].strip()

    return None


def extract_required_permissions(controls: list[dict]) -> list[str]:
    """Extract unique required permissions for automated/ready controls."""
    permissions: set[str] = set()

    for control in controls:
        if control.get("automation_status") != "ready":
            continue
        required = control.get("requires_permissions") or []
        for permission in required:
            if isinstance(permission, str) and permission.strip():
                permissions.add(permission.strip())

    return sorted(permissions)


async def evaluate_scan_readiness(
    *,
    tenant_id: str,
    client_id: str,
    client_secret: str,
    required_permissions: list[str],
) -> ReadinessResult:
    """Run connection + permission checks for a scan request."""
    checks: list[ReadinessCheck] = []
    missing_permissions: set[str] = set()
    unverified_permissions: set[str] = set()

    try:
        await validate_m365_connection(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
        )
        checks.append(
            ReadinessCheck(
                key="connection_auth",
                label="M365 connection authentication",
                status="pass",
                severity="critical",
                message="Successfully authenticated and queried tenant information.",
            )
        )
    except M365ConnectionError as exc:
        checks.append(
            ReadinessCheck(
                key="connection_auth",
                label="M365 connection authentication",
                status="fail",
                severity="critical",
                message=str(exc),
            )
        )
        return ReadinessResult(
            ready=False,
            summary="Not ready: connection authentication failed.",
            required_permissions=required_permissions,
            missing_permissions=[],
            unverified_permissions=[],
            checks=checks,
        )

    try:
        access_token = await acquire_graph_access_token(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
        )
    except M365ConnectionError as exc:
        checks.append(
            ReadinessCheck(
                key="token_acquisition",
                label="Graph access token acquisition",
                status="fail",
                severity="critical",
                message=str(exc),
            )
        )
        return ReadinessResult(
            ready=False,
            summary="Not ready: failed to acquire Graph access token.",
            required_permissions=required_permissions,
            missing_permissions=[],
            unverified_permissions=[],
            checks=checks,
        )

    permissions_to_probe = sorted(
        set(required_permissions).union(CRITICAL_BASELINE_PERMISSIONS)
    )

    async with httpx.AsyncClient(
        base_url="https://graph.microsoft.com",
        timeout=12.0,
    ) as http:
        for permission in permissions_to_probe:
            probe_path = PERMISSION_PROBES.get(permission)
            if not probe_path:
                unverified_permissions.add(permission)
                checks.append(
                    ReadinessCheck(
                        key=f"perm_{permission}",
                        label=f"Permission: {permission}",
                        status="warn",
                        severity="warning",
                        message="No automatic probe is defined for this permission.",
                    )
                )
                continue

            try:
                response = await http.get(
                    probe_path,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
            except Exception:
                checks.append(
                    ReadinessCheck(
                        key=f"perm_{permission}",
                        label=f"Permission: {permission}",
                        status="warn",
                        severity="warning",
                        message="Could not verify this permission due to a network/API error.",
                    )
                )
                continue

            if 200 <= response.status_code < 300:
                checks.append(
                    ReadinessCheck(
                        key=f"perm_{permission}",
                        label=f"Permission: {permission}",
                        status="pass",
                        severity=(
                            "critical"
                            if permission in CRITICAL_BASELINE_PERMISSIONS
                            else "warning"
                        ),
                        message="Permission probe succeeded.",
                    )
                )
                continue

            if response.status_code in (401, 403):
                missing_permissions.add(permission)
                is_critical = permission in CRITICAL_BASELINE_PERMISSIONS
                checks.append(
                    ReadinessCheck(
                        key=f"perm_{permission}",
                        label=f"Permission: {permission}",
                        status="fail" if is_critical else "warn",
                        severity="critical" if is_critical else "warning",
                        message="Permission probe was denied. Grant admin consent for this permission.",
                    )
                )
                continue

            checks.append(
                ReadinessCheck(
                    key=f"perm_{permission}",
                    label=f"Permission: {permission}",
                    status="warn",
                    severity="warning",
                    message=(
                        f"Permission probe returned HTTP {response.status_code}"
                        + (
                            f": {detail}"
                            if (detail := extract_graph_error_detail(response))
                            else "."
                        )
                    ),
                )
            )

    has_critical_failure = any(
        check.status == "fail" and check.severity == "critical" for check in checks
    )
    ready = not has_critical_failure
    summary = "Ready to start scan." if ready else "Not ready: resolve critical checks."
    if ready and (missing_permissions or unverified_permissions):
        summary = "Ready with warnings: some controls may be skipped or fail."

    return ReadinessResult(
        ready=ready,
        summary=summary,
        required_permissions=required_permissions,
        missing_permissions=sorted(missing_permissions),
        unverified_permissions=sorted(unverified_permissions),
        checks=checks,
    )
