import os
import uuid

import httpx

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


def create_contact_submission():
    unique_email = f"pipeline-{uuid.uuid4()}@example.com"

    payload = {
        "first_name": "Pipeline",
        "last_name": "Tester",
        "email": unique_email,
        "phone": "0400000000",
        "company": "SIT223",
        "subject": "Integration Test",
        "message": "Testing API and database integration from pytest.",
        "source": "jenkins-integration-test",
    }

    return httpx.post(
        f"{API_BASE_URL}/v1/contact/",
        json=payload,
        timeout=10,
    )


def test_create_contact_submission_returns_created_status():
    response = create_contact_submission()

    assert response.status_code == 201


def test_create_contact_submission_returns_submitted_email():
    response = create_contact_submission()

    assert response.json()["email"].startswith("pipeline-")

