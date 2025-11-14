import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import CertificateTemplate

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    
    # Add default template
    db = TestingSessionLocal()
    template = CertificateTemplate(
        template_name="Test Template",
        pdf_template_path="certificate_template.html",
        description="Test template",
        is_active=True
    )
    db.add(template)
    db.commit()
    db.close()
    
    with TestClient(app) as c:
        yield c
    
    Base.metadata.drop_all(bind=engine)

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data

def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data

def test_generate_certificate(client):
    """Test certificate generation"""
    cert_data = {
        "verification_id": 1,
        "trip_id": 123,
        "user_id": 456,
        "credit_amount": 25.50,
        "template_id": 1
    }
    
    response = client.post("/api/certificates/generate", json=cert_data)
    assert response.status_code == 201
    data = response.json()
    assert data["verification_id"] == 1
    assert data["trip_id"] == 123
    assert data["user_id"] == 456
    assert float(data["credit_amount"]) == 25.50
    assert "cert_hash" in data
    assert "id" in data

def test_list_certificates(client):
    """Test listing certificates"""
    # First create a certificate
    cert_data = {
        "verification_id": 2,
        "trip_id": 124,
        "user_id": 456,
        "credit_amount": 30.00,
        "template_id": 1
    }
    client.post("/api/certificates/generate", json=cert_data)
    
    # Now list certificates
    response = client.get("/api/certificates?user_id=456")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1

def test_get_certificate(client):
    """Test getting certificate details"""
    # Create a certificate first
    cert_data = {
        "verification_id": 3,
        "trip_id": 125,
        "user_id": 457,
        "credit_amount": 35.00,
        "template_id": 1
    }
    create_response = client.post("/api/certificates/generate", json=cert_data)
    cert_id = create_response.json()["id"]
    
    # Get certificate details
    response = client.get(f"/api/certificates/{cert_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == cert_id
    assert data["trip_id"] == 125

def test_verify_certificate(client):
    """Test certificate verification"""
    # Create a certificate first
    cert_data = {
        "verification_id": 4,
        "trip_id": 126,
        "user_id": 458,
        "credit_amount": 40.00,
        "template_id": 1
    }
    create_response = client.post("/api/certificates/generate", json=cert_data)
    cert_id = create_response.json()["id"]
    
    # Verify certificate
    response = client.post(
        f"/api/certificates/{cert_id}/verify?verified_by=789&method=manual"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["cert_id"] == cert_id
    assert data["verified_by"] == 789
    assert data["verification_method"] == "manual"

def test_public_verification(client):
    """Test public certificate verification by hash"""
    # Create a certificate first
    cert_data = {
        "verification_id": 5,
        "trip_id": 127,
        "user_id": 459,
        "credit_amount": 45.00,
        "template_id": 1
    }
    create_response = client.post("/api/certificates/generate", json=cert_data)
    cert_hash = create_response.json()["cert_hash"]
    
    # Verify by hash
    response = client.get(f"/api/certificates/public/{cert_hash}")
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] == True
    assert data["certificate"] is not None
    assert data["message"] == "Certificate is valid"

def test_certificate_not_found(client):
    """Test getting non-existent certificate"""
    response = client.get("/api/certificates/99999")
    assert response.status_code == 404

def test_invalid_certificate_data(client):
    """Test creating certificate with invalid data"""
    invalid_data = {
        "verification_id": -1,  # Invalid
        "trip_id": 128,
        "user_id": 460,
        "credit_amount": -10.00,  # Invalid (negative)
        "template_id": 1
    }
    
    response = client.post("/api/certificates/generate", json=invalid_data)
    assert response.status_code == 422  # Validation error