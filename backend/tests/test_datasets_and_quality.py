import io
import pytest

def test_upload_valid_csv(client):
    """Test valid CSV upload with timestamps and pollutant columns."""
    csv_content = (
        "timestamp,PM2.5,PM10,NO2,CO,SO2,O3\n"
        "2026-10-01 10:00:00,25.4,45.2,18.0,0.4,8.0,30.0\n"
        "2026-10-02 10:00:00,28.1,49.0,20.2,0.5,9.2,32.4\n"
        "2026-10-03 10:00:00,31.0,53.8,22.1,0.55,10.0,34.0\n"
    )
    files = {"file": ("test_air.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] == 3
    assert data["has_timestamps"] is True
    assert "PM2.5" in data["pollutant_columns"]
    assert data["missing_values_count"] == 0
    assert data["duplicate_rows_count"] == 0
    assert data["data_quality_score"] > 80.0

def test_missing_values_and_duplicate_detection(client):
    """Test that missing values and duplicate rows are correctly flagged in data quality audit."""
    csv_content = (
        "timestamp,PM2.5,PM10,NO2,CO,SO2,O3\n"
        "2026-10-01 10:00:00,25.4,45.2,,0.4,8.0,30.0\n"  # missing NO2
        "2026-10-01 10:00:00,25.4,45.2,,0.4,8.0,30.0\n"  # duplicate row
        "2026-10-02 10:00:00,28.1,49.0,20.2,0.5,9.2,32.4\n"
    )
    files = {"file": ("test_dirty.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["missing_values_count"] >= 1
    assert data["duplicate_rows_count"] >= 1
    assert len(data["quality_warnings"]) >= 1

def test_invalid_file_extension(client):
    """Test that non-CSV/Excel files are rejected with 400 error."""
    files = {"file": ("malicious.exe", io.BytesIO(b"binary data"), "application/octet-stream")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
