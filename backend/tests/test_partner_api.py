import pytest
from fastapi.testclient import TestClient
from main import app # Assuming your FastAPI app instance is named 'app' in main.py
from uuid import uuid4

client = TestClient(app)

def test_ping_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "SOS Nairobi Backend is running"}

def test_register_new_organization_and_user():
    unique_email = f"testuser_{uuid4()}@example.com"
    unique_org_name = f"Test Org {uuid4()}"

    response = client.post(
        "/api/v1/partner/auth/register",
        json={
            "organization_name": unique_org_name,
            "organization_type": "NGO",
            "admin_email": unique_email,
            "admin_full_name": "Test User",
            "admin_password": "testpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email
    assert data["role"] == "admin"
    assert "user_id" in data
    assert "organization_id" in data

    # Try to register the same email again
    response_fail = client.post(
        "/api/v1/partner/auth/register",
        json={
            "organization_name": f"Another Org {uuid4()}",
            "organization_type": "NGO",
            "admin_email": unique_email, # Same email
            "admin_full_name": "Another User",
            "admin_password": "testpassword123"
        }
    )
    assert response_fail.status_code == 400 # Expecting bad request due to duplicate email

    # Try to register the same org name again
    response_org_fail = client.post(
        "/api/v1/partner/auth/register",
        json={
            "organization_name": unique_org_name, # Same org name
            "organization_type": "NGO",
            "admin_email": f"new_user_{uuid4()}@example.com",
            "admin_full_name": "New User",
            "admin_password": "testpassword123"
        }
    )
    assert response_org_fail.status_code == 400 # Expecting bad request due to duplicate org name


def test_login_partner_user():
    unique_email = f"loginuser_{uuid4()}@example.com"
    unique_org_name = f"Login Org {uuid4()}"
    password = "loginpassword123"

    # Register user first
    reg_response = client.post(
        "/api/v1/partner/auth/register",
        json={
            "organization_name": unique_org_name,
            "organization_type": "MedicalFacility",
            "admin_email": unique_email,
            "admin_full_name": "Login User",
            "admin_password": password
        }
    )
    assert reg_response.status_code == 200

    # Attempt login
    login_response = client.post(
        "/api/v1/partner/auth/token",
        data={"username": unique_email, "password": password} # Form data
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Attempt login with wrong password
    login_fail_response = client.post(
        "/api/v1/partner/auth/token",
        data={"username": unique_email, "password": "wrongpassword"}
    )
    assert login_fail_response.status_code == 401


def test_get_partner_me():
    unique_email = f"me_user_{uuid4()}@example.com"
    unique_org_name = f"Me Org {uuid4()}"
    password = "mepassword123"

    # Register
    client.post(
        "/api/v1/partner/auth/register",
        json={
            "organization_name": unique_org_name,
            "organization_type": "Other",
            "admin_email": unique_email,
            "admin_full_name": "Me User",
            "admin_password": password
        }
    )

    # Login to get token
    login_response = client.post(
        "/api/v1/partner/auth/token",
        data={"username": unique_email, "password": password}
    )
    token = login_response.json()["access_token"]

    # Get /me
    me_response = client.get(
        "/api/v1/partner/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    user_data = me_response.json()
    assert user_data["email"] == unique_email
    assert user_data["full_name"] == "Me User"

    # Get /me with bad token
    me_fail_response = client.get(
        "/api/v1/partner/auth/me",
        headers={"Authorization": "Bearer badtoken"}
    )
    assert me_fail_response.status_code == 401

def test_dashboard_summary_placeholder_auth():
    # This test assumes a user is registered and logged in.
    # For simplicity, let's register and login a new user for this test.
    unique_email = f"dash_user_{uuid4()}@example.com"
    unique_org_name = f"Dashboard Org {uuid4()}"
    password = "dashpassword123"

    client.post("/api/v1/partner/auth/register", json={
        "organization_name": unique_org_name, "organization_type": "NGO",
        "admin_email": unique_email, "admin_full_name": "Dash User", "admin_password": password
    })
    login_resp = client.post("/api/v1/partner/auth/token", data={"username": unique_email, "password": password})
    token = login_resp.json()["access_token"]

    response = client.get("/api/v1/partner/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "Dashboard summary for organization" in data["message"]

    # Test without token
    response_no_auth = client.get("/api/v1/partner/dashboard/summary")
    assert response_no_auth.status_code == 401 # Expecting unauthorized
