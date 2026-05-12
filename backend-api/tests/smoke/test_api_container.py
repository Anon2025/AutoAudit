import os

import httpx

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


def test_api_root_endpoint_is_reachable():
    response = httpx.get(f"{API_BASE_URL}/", timeout=10)

    assert response.status_code == 200


def test_api_root_endpoint_reports_status_ok():
    response = httpx.get(f"{API_BASE_URL}/", timeout=10)

    assert response.json()["status"] == "ok"


def test_openapi_schema_is_reachable():
    response = httpx.get(f"{API_BASE_URL}/openapi.json", timeout=10)

    assert response.status_code == 200


def test_openapi_schema_contains_api_title():
    response = httpx.get(f"{API_BASE_URL}/openapi.json", timeout=10)

    assert response.json()["info"]["title"] == "AutoAudit API"

