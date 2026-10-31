import pytest
from backend.app.services.ml_service import ml_service

def test_valid_prediction(client):
    """Test valid prediction request returns category and probabilities."""
    payload = {
        "PM2.5": 30.0,
        "PM10": 50.0,
        "NO2": 20.0,
        "CO": 0.5,
        "SO2": 10.0,
        "O3": 30.0
    }
    response = client.post("/api/predictions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert data["category"] in ["Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
    assert "probabilities" in data
    assert "confidence_pct" in data
    assert "health_guidance" in data
    assert "disclaimer" in data

def test_missing_pollutant_fails(client):
    """Test that omitting a required pollutant returns 422 validation error."""
    payload = {
        "PM2.5": 30.0,
        "PM10": 50.0,
        "NO2": 20.0,
        # Missing CO, SO2, O3
    }
    response = client.post("/api/predictions", json=payload)
    assert response.status_code == 422

def test_negative_pollutant_fails(client):
    """Test that negative pollutant values are strictly rejected."""
    payload = {
        "PM2.5": -10.0,
        "PM10": 50.0,
        "NO2": 20.0,
        "CO": 0.5,
        "SO2": 10.0,
        "O3": 30.0
    }
    response = client.post("/api/predictions", json=payload)
    assert response.status_code == 422

def test_nonnumeric_pollutant_fails(client):
    """Test that non-numeric values are rejected."""
    payload = {
        "PM2.5": "hazardous",
        "PM10": 50.0,
        "NO2": 20.0,
        "CO": 0.5,
        "SO2": 10.0,
        "O3": 30.0
    }
    response = client.post("/api/predictions", json=payload)
    assert response.status_code == 422

def test_ml_service_fallback_behavior():
    """Verify deterministic fallback engine generates structured outputs safely."""
    inputs = {
        "PM2.5": 180.0,
        "PM10": 260.0,
        "NO2": 95.0,
        "CO": 3.8,
        "SO2": 85.0,
        "O3": 120.0
    }
    res = ml_service._fallback_classify(inputs)
    assert res["category"] in ["Very Poor", "Severe"]
    assert res["is_fallback"] is True
    assert "disclaimer" in res
