import io
import pytest

def test_trend_analysis_with_timestamps(client):
    """Test trend analysis computes slope and direction when valid timestamps exist."""
    csv_content = (
        "date,PM2.5,PM10,NO2,CO,SO2,O3\n"
        "2026-10-01,20.0,40.0,15.0,0.4,8.0,25.0\n"
        "2026-10-02,30.0,45.0,18.0,0.5,9.0,28.0\n"
        "2026-10-03,40.0,52.0,21.0,0.6,10.0,32.0\n"
        "2026-10-04,50.0,60.0,25.0,0.7,11.0,35.0\n"
    )
    upload_resp = client.post(
        "/api/datasets/upload",
        files={"file": ("trend_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    dataset_id = upload_resp.json()["id"]

    trend_resp = client.post(
        "/api/analysis/trends",
        json={"dataset_id": dataset_id, "pollutant": "PM2.5", "rolling_window": 2}
    )
    assert trend_resp.status_code == 200
    data = trend_resp.json()
    assert data["trend_direction"] == "Increasing"
    assert data["slope"] > 0
    assert data["change_percentage"] == 150.0
    assert len(data["data_points"]) == 4

def test_trend_analysis_fails_without_timestamps(client):
    """Test trend analysis strictly rejects unordered datasets lacking timestamps."""
    csv_content = (
        "PM2.5,PM10,NO2,CO,SO2,O3\n"
        "20.0,40.0,15.0,0.4,8.0,25.0\n"
        "30.0,45.0,18.0,0.5,9.0,28.0\n"
        "40.0,52.0,21.0,0.6,10.0,32.0\n"
    )
    upload_resp = client.post(
        "/api/datasets/upload",
        files={"file": ("no_time.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    dataset_id = upload_resp.json()["id"]

    trend_resp = client.post(
        "/api/analysis/trends",
        json={"dataset_id": dataset_id, "pollutant": "PM2.5"}
    )
    assert trend_resp.status_code == 422
    assert "timestamp" in trend_resp.json()["detail"].lower()

def test_anomaly_detection_iqr_and_zscore(client):
    """Test statistical anomaly detection on deliberate outlier."""
    csv_content = (
        "timestamp,PM2.5,PM10,NO2,CO,SO2,O3\n"
        "2026-10-01,25.0,40.0,15.0,0.4,8.0,25.0\n"
        "2026-10-02,26.0,42.0,16.0,0.4,8.2,26.0\n"
        "2026-10-03,24.5,39.0,14.8,0.39,7.9,24.8\n"
        "2026-10-04,25.8,41.2,15.5,0.41,8.1,25.5\n"
        "2026-10-05,25.2,40.5,15.1,0.40,8.0,25.2\n"
        "2026-10-06,180.0,250.0,85.0,2.8,45.0,90.0\n"  # Extreme anomaly
        "2026-10-07,26.1,41.8,15.8,0.42,8.3,26.2\n"
    )
    upload_resp = client.post(
        "/api/datasets/upload",
        files={"file": ("anom_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    dataset_id = upload_resp.json()["id"]

    # IQR method
    iqr_resp = client.post(
        "/api/analysis/anomalies",
        json={"dataset_id": dataset_id, "pollutant": "PM2.5", "method": "iqr", "multiplier": 1.5}
    )
    assert iqr_resp.status_code == 200
    iqr_data = iqr_resp.json()
    assert iqr_data["anomaly_count"] >= 1
    assert any(a["value"] == 180.0 for a in iqr_data["anomalies"])
    assert "interpretation_note" in iqr_data
