# ============================================
# Basic tests cho API endpoints
# ============================================
import pytest
from fastapi import status


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "OK"


def test_create_verification(client):
    """Test create verification"""
    data = {
        "trip_id": "trip-test-001",
        "user_id": "user-test-001",
        "co2_saved_kg": 3.5,
        "credits_suggested": 0.0035
    }
    
    response = client.post("/api/v1/verifications", json=data)
    assert response.status_code == status.HTTP_201_CREATED
    
    result = response.json()
    assert result["trip_id"] == data["trip_id"]
    assert result["status"] == "PENDING"


def test_get_verifications(client, sample_verification):
    """Test get verifications list"""
    response = client.get("/api/v1/verifications")
    assert response.status_code == 200
    
    result = response.json()
    assert "items" in result
    assert "total" in result
    assert result["total"] >= 1


def test_get_verification_by_id(client, sample_verification):
    """Test get verification by ID"""
    response = client.get(f"/api/v1/verifications/{sample_verification.id}")
    assert response.status_code == 200
    
    result = response.json()
    assert result["id"] == sample_verification.id
    assert result["trip_id"] == sample_verification.trip_id


def test_approve_verification(client, sample_verification):
    """Test approve verification"""
    data = {
        "remarks": "Approved after verification"
    }
    
    response = client.post(
        f"/api/v1/verifications/{sample_verification.id}/approve",
        json=data
    )
    assert response.status_code == 200
    
    result = response.json()
    assert result["status"] == "APPROVED"
    assert result["signature_hash"] is not None


def test_reject_verification(client, sample_verification):
    """Test reject verification"""
    data = {
        "remarks": "GPS data inconsistent with distance calculation"
    }
    
    response = client.post(
        f"/api/v1/verifications/{sample_verification.id}/reject",
        json=data
    )
    assert response.status_code == 200
    
    result = response.json()
    assert result["status"] == "REJECTED"
    assert result["remarks"] == data["remarks"]


def test_get_statistics(client, sample_verification):
    """Test get statistics"""
    response = client.get("/api/v1/verifications/stats/summary")
    assert response.status_code == 200
    
    result = response.json()
    assert "total" in result
    assert "pending" in result
    assert "approved" in result
    assert "rejected" in result