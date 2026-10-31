import pytest
import io
import pandas as pd
from unittest.mock import patch, AsyncMock, PropertyMock
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.data_service import data_service
from backend.app.services.datagov_service import datagov_service
from backend.app.services.open_meteo_service import open_meteo_service
from backend.app.database.repository import list_datasets, get_dataset
from backend.app.tools.dataset_analysis import analyze_dataset
from backend.app.tools.trend_analysis import analyze_trends

client = TestClient(app)

def test_cpcb_import_pivots_and_preserves_missing_values():
    """Verify that CPCB tall observations are correctly pivoted and missing values are NOT fabricated."""
    mock_cpcb_response = {
        "is_configured": True,
        "city_queried": "Chennai",
        "total_records": 10,
        "stations_count": 2,
        "stations": [
            {
                "station_name": "Arumbakkam, Chennai - CPCB",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "latitude": 13.0664,
                "longitude": 80.2112,
                "last_update": "24-10-2026 16:00:00",
                "pollutants": {
                    "PM2.5": {"avg": 25.0, "min": 10.0, "max": 40.0, "unit": "µg/m³"},
                    "PM10": {"avg": 60.0, "min": 30.0, "max": 90.0, "unit": "µg/m³"},
                    "NO2": {"avg": 18.0, "min": 10.0, "max": 25.0, "unit": "µg/m³"},
                    # Note: CO and O3 are missing for this station
                }
            },
            {
                "station_name": "Perungudi, Chennai - TNPCB",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "latitude": 12.9533,
                "longitude": 80.2357,
                "last_update": "24-10-2026 16:00:00",
                "pollutants": {
                    "PM2.5": {"avg": 22.0, "min": 15.0, "max": 30.0, "unit": "µg/m³"},
                    "CO": {"avg": 0.8, "min": 0.5, "max": 1.2, "unit": "mg/m³"},
                    "SO2": {"avg": 5.0, "min": 3.0, "max": 8.0, "unit": "µg/m³"},
                    # Note: PM10 is missing for this station
                }
            }
        ],
        "records": [],
        "source": "Central Pollution Control Board (CPCB) via data.gov.in",
        "resource_id": "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
    }

    with patch.object(datagov_service, "fetch_city_records", new=AsyncMock(return_value=mock_cpcb_response)), \
         patch("backend.app.services.datagov_service.DataGovService.is_configured", new_callable=PropertyMock, return_value=True):
        
        response = client.post("/api/datasets/import/cpcb?city=Chennai")
        assert response.status_code == 200, response.text
        data = response.json()

        assert data["filename"] == "cpcb_chennai_observations.csv"
        assert data["row_count"] == 2
        assert data["source_type"] == "cpcb_ground"
        assert data["is_synthetic"] is False
        assert data["is_time_series"] is False
        assert "Central Pollution Control Board" in data["source_description"]

        # Load stored CSV and verify missing values are preserved as NaN (not fabricated)
        df = pd.read_csv(data["stored_path"])
        arumbakkam = df[df["station"].str.contains("Arumbakkam")].iloc[0]
        perungudi = df[df["station"].str.contains("Perungudi")].iloc[0]

        assert arumbakkam["PM2.5"] == 25.0
        assert arumbakkam["PM10"] == 60.0
        assert pd.isna(arumbakkam["CO"])  # Missing, NOT fabricated as 0.0 or mean
        assert pd.isna(arumbakkam["O3"])  # Missing, NOT fabricated

        assert perungudi["PM2.5"] == 22.0
        assert pd.isna(perungudi["PM10"])  # Missing, NOT fabricated

def test_open_meteo_import_time_series():
    """Verify that Open-Meteo creates an hourly multi-timestamp series dataset."""
    mock_hourly_points = []
    for i in range(24):
        mock_hourly_points.append({
            "time": f"2026-10-24T{i:02d}:00",
            "pm2_5": 20.0 + i * 0.5,
            "pm10": 40.0 + i * 0.8,
            "nitrogen_dioxide": 15.0,
            "carbon_monoxide": 0.4,
            "sulphur_dioxide": 5.0,
            "ozone": 25.0,
            "us_aqi": 68
        })

    mock_aq_response = {
        "latitude": 13.0827,
        "longitude": 80.2707,
        "current": {},
        "hourly_points": mock_hourly_points,
        "cached": False,
        "disclaimer": "Modelled estimates"
    }

    with patch.object(open_meteo_service, "get_air_quality", new=AsyncMock(return_value=mock_aq_response)):
        response = client.post("/api/datasets/import/open-meteo?city=Chennai&latitude=13.0827&longitude=80.2707")
        assert response.status_code == 200, response.text
        data = response.json()

        assert "openmeteo_chennai_72h_series.csv" in data["filename"]
        assert data["row_count"] == 24
        assert data["has_timestamps"] is True
        assert data["is_time_series"] is True
        assert data["source_type"] == "open_meteo_model"
        assert data["is_synthetic"] is False

def test_single_snapshot_vs_time_series_trend_validation():
    """Verify that a single-snapshot dataset raises clear guidance while a time-series dataset succeeds."""
    # 1. Single timestamp dataset (e.g. 5 stations observed at the exact same hour)
    snap_csv = """timestamp,station,city,PM2.5,PM10,NO2,CO,SO2,O3
2026-10-24 16:00:00,Station-A,Chennai,25.0,50.0,15.0,0.5,8.0,20.0
2026-10-24 16:00:00,Station-B,Chennai,30.0,55.0,18.0,0.6,9.0,22.0
2026-10-24 16:00:00,Station-C,Chennai,28.0,52.0,16.0,0.5,8.5,21.0
2026-10-24 16:00:00,Station-D,Chennai,32.0,60.0,20.0,0.7,10.0,25.0
"""
    snap_summary = data_service.process_uploaded_file(snap_csv.encode("utf-8"), "spatial_snapshot.csv")
    
    with pytest.raises(ValueError) as excinfo:
        data_service.analyze_trends(snap_summary["stored_path"], pollutant="PM2.5")
    assert "single observation time snapshot" in str(excinfo.value)

    # 2. Multi-timestamp chronological dataset
    multi_csv = """timestamp,station,city,PM2.5,PM10,NO2,CO,SO2,O3
2026-10-24 12:00:00,Station-A,Chennai,20.0,40.0,12.0,0.4,6.0,18.0
2026-10-24 13:00:00,Station-A,Chennai,25.0,45.0,14.0,0.5,7.0,20.0
2026-10-24 14:00:00,Station-A,Chennai,30.0,50.0,16.0,0.6,8.0,22.0
2026-10-24 15:00:00,Station-A,Chennai,35.0,55.0,18.0,0.7,9.0,24.0
"""
    multi_summary = data_service.process_uploaded_file(multi_csv.encode("utf-8"), "chronological_series.csv")
    trend_res = data_service.analyze_trends(multi_summary["stored_path"], pollutant="PM2.5")
    assert trend_res["trend_direction"] == "Increasing"
    assert trend_res["slope"] > 0
    assert len(trend_res["data_points"]) == 4

def test_dataset_analysis_tool_identifies_synthetic_vs_real():
    """Verify that analyze_dataset tool flags synthetic demo vs real datasets transparently."""
    # Synthetic demo
    synth_csv = """timestamp,PM2.5,PM10,NO2,CO,SO2,O3
2026-10-01,25.0,50.0,15.0,0.5,8.0,20.0
2026-10-02,28.0,55.0,18.0,0.6,9.0,22.0
"""
    synth_summary = data_service.process_uploaded_file(synth_csv.encode("utf-8"), "synthetic_air_quality_demo.csv")
    from backend.app.database.repository import save_dataset
    did = save_dataset(synth_summary)

    tool_result = analyze_dataset(did)
    assert tool_result["is_synthetic"] is True
    assert tool_result["source_type"] == "synthetic_demo"
    assert "SYNTHETIC DEMO" in tool_result["summary"]
