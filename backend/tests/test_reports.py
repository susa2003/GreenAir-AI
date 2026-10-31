import pytest
from pathlib import Path

def test_generate_and_download_pdf_report(client):
    """Test generating a PDF report and downloading it."""
    req_payload = {
        "report_type": "pdf",
        "title": "Comprehensive Unit Test Assessment",
        "pollutant_inputs": {"PM2.5": 35.0, "PM10": 60.0, "NO2": 22.0, "CO": 0.6, "SO2": 11.0, "O3": 32.0}
    }
    create_resp = client.post("/api/reports", json=req_payload)
    assert create_resp.status_code == 200
    report_data = create_resp.json()
    assert report_data["file_type"] == "pdf"
    assert report_data["size_bytes"] > 0
    assert "download_url" in report_data

    # Test download
    report_id = report_data["report_id"]
    download_resp = client.get(f"/api/reports/{report_id}/download")
    assert download_resp.status_code == 200
    assert download_resp.headers["content-type"] == "application/pdf"
    assert len(download_resp.content) == report_data["size_bytes"]

def test_report_listing(client):
    """Test listing generated reports."""
    resp = client.get("/api/reports")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_report_download_not_found(client):
    """Test non-existent report ID returns 404."""
    resp = client.get("/api/reports/non-existent-uuid/download")
    assert resp.status_code == 404
