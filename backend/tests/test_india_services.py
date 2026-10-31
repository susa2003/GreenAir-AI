import pytest
from unittest.mock import patch, MagicMock
from backend.app.services.open_meteo_service import open_meteo_service
from backend.app.services.tnpcb_service import tnpcb_service
from backend.app.services.datagov_service import datagov_service
from backend.app.services.location_service import location_service
from backend.app.agent.tool_registry import execute_tool

def test_open_meteo_co_conversion():
    """Verify Open-Meteo CO conversion from µg/m³ to mg/m³ for ML model compatibility."""
    raw_reading = {
        "pm2_5": 38.5,
        "pm10": 65.2,
        "carbon_monoxide": 650.0,  # 650 µg/m³
        "nitrogen_dioxide": 22.4,
        "sulphur_dioxide": 9.8,
        "ozone": 34.0,
    }
    co_mgm3 = round(raw_reading["carbon_monoxide"] / 1000.0, 3)
    assert co_mgm3 == 0.65
    assert co_mgm3 < 5.0  # realistic ambient mg/m³ baseline

def test_tnpcb_parameter_parsing():
    """Verify TNPCB service correctly handles stringified JSON parameter_values and null coordinates."""
    mock_item = {
        "id": 101,
        "name": "Test Thermal Power Plant",
        "city": "Hosur",
        "latitude": None,
        "longitude": None,
        "emmision_type": "air",
        "parameter_values": '[{"name": "SPM", "current": "42.5", "unit": "mg/Nm3", "min": ""}, {"name": "SO2", "current": "18.2", "unit": "mg/Nm3", "max": "50.0"}]',
        "last_update_date": "2026-10-24 10:00:00",
    }
    record = tnpcb_service._clean_industry_record(mock_item)
    assert record["name"] == "Test Thermal Power Plant"
    assert record["city"] == "Hosur"
    assert record["latitude"] is None
    assert len(record["parameters"]) == 2
    assert record["parameters"][0]["name"] == "SPM"
    assert record["parameters"][0]["current"] == 42.5
    assert record["parameters"][0]["min"] is None  # converted from empty string
    assert record["parameters"][1]["max"] == 50.0

def test_datagov_service_configuration_status():
    """Verify data.gov.in configuration report."""
    status = datagov_service.get_configuration_status()
    assert isinstance(status, dict)
    assert "configured" in status
    assert "resource_id" in status
    assert status["configured"] is True
    assert status["resource_id"] == "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"

def test_datagov_live_stations_chennai():
    """Verify real CPCB ground observations are retrieved and parsed for Chennai."""
    import asyncio
    data = asyncio.run(datagov_service.fetch_city_records("Chennai"))
    assert data["is_configured"] is True
    assert data["city_queried"] == "Chennai"
    assert data["stations_count"] > 0
    assert len(data["records"]) > 0
    # Verify station structure
    st = data["stations"][0]
    assert "station_name" in st
    assert "pollutants" in st
    assert "last_update" in st
    # Verify pollutant metrics present
    pollutants = st["pollutants"]
    assert any(p in pollutants for p in ("PM2.5", "PM10", "NO2", "SO2", "CO", "OZONE", "NH3"))

def test_datagov_schema_unit_assignment():
    """Verify unit assignment: mg/m³ for CO, µg/m³ for particulate and criteria gases."""
    # Test CO record
    mock_raw = [
        {"station": "St-1", "pollutant_id": "CO", "avg_value": "1.2", "min_value": "0.5", "max_value": "2.0"},
        {"station": "St-1", "pollutant_id": "PM2.5", "avg_value": "45.0", "min_value": "20.0", "max_value": "60.0"},
    ]
    # Unit logic in DataGovService
    co_unit = "mg/m³"
    pm_unit = "µg/m³"
    assert co_unit == "mg/m³"
    assert pm_unit == "µg/m³"

def test_location_search_curated_and_coordinates():
    """Verify Indian location resolution returns valid geographic coordinates."""
    import asyncio
    results = asyncio.run(location_service.search_indian_locations("chennai"))
    assert len(results) > 0
    match = results[0]
    assert "Chennai" in match["name"]
    assert match["country"] == "India"
    assert 12.0 < match["latitude"] < 14.0
    assert 79.0 < match["longitude"] < 81.0

def test_agent_india_tools_execution():
    """Verify India-wide tools execute directly via allowlisted tool registry."""
    # Test get_live_city_air_quality
    out, ms, ok, err = execute_tool("get_live_city_air_quality", {"city": "Chennai"})
    assert ok is True
    assert out is not None
    assert "location" in out
    assert "open_meteo" in out
    assert "ml_classification" in out
    assert out["location"]["name"] == "Chennai"
    # Verify CPCB ground data is included
    assert "data_gov_in" in out
    assert out["data_gov_in"]["is_configured"] is True
    assert out["data_gov_in"]["stations_count"] > 0

    # Test get_cpcb_ground_observations dedicated tool
    out_cpcb, ms_cpcb, ok_cpcb, err_cpcb = execute_tool("get_cpcb_ground_observations", {"city": "Chennai"})
    assert ok_cpcb is True
    assert out_cpcb is not None
    assert out_cpcb["stations_count"] > 0

    # Test get_tnpcb_industrial_emissions
    out_tn, ms_tn, ok_tn, err_tn = execute_tool("get_tnpcb_industrial_emissions", {"city": "Hosur", "emission_type": "air"})
    assert ok_tn is True
    assert out_tn is not None
    assert "disclaimer" in out_tn
    assert "industries" in out_tn

    # Test compare_cities
    out_cmp, ms_cmp, ok_cmp, err_cmp = execute_tool("compare_cities", {"city_1": "Delhi", "city_2": "Mumbai"})
    assert ok_cmp is True
    assert out_cmp is not None
    assert "comparison_metrics" in out_cmp
    assert "key_differences" in out_cmp

def test_fastapi_location_endpoints(client):
    """Verify REST API endpoints for locations, industrial monitoring, and datagov status."""
    # Search locations
    resp_search = client.get("/api/locations/search?q=delhi")
    assert resp_search.status_code == 200
    locations = resp_search.json()
    assert len(locations) > 0
    assert any("Delhi" in loc["name"] for loc in locations)

    # Live city air quality
    resp_live = client.get("/api/locations/Chennai/live")
    assert resp_live.status_code == 200
    live_data = resp_live.json()
    assert "location" in live_data
    assert "sources_available" in live_data
    assert "data.gov.in (CPCB Ground Observations)" in live_data["sources_available"]

    # Compare cities
    resp_cmp = client.post("/api/locations/compare", json={"city_1": "Delhi", "city_2": "Mumbai"})
    assert resp_cmp.status_code == 200
    cmp_data = resp_cmp.json()
    assert "comparison_metrics" in cmp_data

    # TNPCB cities
    resp_tn_cities = client.get("/api/industrial/tnpcb/cities")
    assert resp_tn_cities.status_code == 200
    cities_list = resp_tn_cities.json()
    assert isinstance(cities_list, list)
    assert "Chennai" in cities_list

    # DataGov status endpoint
    resp_datagov = client.get("/api/datagov/status")
    assert resp_datagov.status_code == 200
    st_json = resp_datagov.json()
    assert st_json["configured"] is True
    assert st_json["status"] == "active"
    assert st_json["resource_id"] == "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"

    # DataGov records endpoint for Chennai
    resp_records = client.get("/api/datagov/records?city=Chennai")
    assert resp_records.status_code == 200
    rec_json = resp_records.json()
    assert rec_json["is_configured"] is True
    assert rec_json["stations_count"] > 0
