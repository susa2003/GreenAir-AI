import pytest
from backend.app.tools.pollutant_analysis import analyze_pollutants

def test_pollutant_analysis_dominant_driver():
    """Verify that PM2.5 is identified as dominant when significantly elevated."""
    res = analyze_pollutants(
        pm25=120.0,  # 2.0x standard 60 benchmark
        pm10=80.0,   # 0.8x standard 100 benchmark
        no2=40.0,    # 0.5x standard 80 benchmark
        co=0.8,      # 0.4x standard 2.0 benchmark
        so2=15.0,    # 0.19x standard 80 benchmark
        o3=30.0,     # 0.3x standard 100 benchmark
    )
    assert res["dominant_pollutant"] == "PM2.5"
    assert res["highest_benchmark_ratio"] == 2.0
    assert len(res["attention_flags"]) >= 1
    assert any("PM2.5" in flag for flag in res["attention_flags"])
    assert "scientific_context" in res

def test_pollutant_analysis_api_endpoint(client):
    """Test POST /api/analysis/pollutants."""
    payload = {
        "PM2.5": 40.0,
        "PM10": 150.0,  # Exceeds PM10 benchmark 100
        "NO2": 30.0,
        "CO": 0.5,
        "SO2": 10.0,
        "O3": 25.0
    }
    response = client.post("/api/analysis/pollutants", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dominant_pollutant"] == "PM10"
    assert data["highest_benchmark_ratio"] == 1.5
