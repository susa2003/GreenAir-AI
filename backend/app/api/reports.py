from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from pathlib import Path
import os

from backend.app.config import settings
from backend.app.schemas.schemas import ReportRequest, ReportResponse
from backend.app.tools.report_generation import generate_report
from backend.app.database.repository import list_reports, get_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse)
def create_report(req: ReportRequest):
    """Generate an environmental assessment report in PDF or CSV format."""
    try:
        res = generate_report(
            report_type=req.report_type,
            title=req.title or "GreenAir Environmental Assessment Report",
            dataset_id=req.dataset_id,
            prediction_id=req.prediction_id,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(exc)}")

@router.get("", response_model=List[ReportResponse])
def get_reports():
    """List all generated environmental reports."""
    reports = list_reports()
    result = []
    for r in reports:
        result.append(ReportResponse(
            report_id=r["id"],
            filename=r["filename"],
            file_type=r["report_type"],
            size_bytes=r["size_bytes"],
            download_url=f"/api/reports/{r['id']}/download",
            title=r["title"],
            generated_at=r["created_at"],
            summary_findings=r.get("summary_findings", []),
        ))
    return result

@router.get("/{report_id}/download")
def download_report(report_id: str):
    """Download a generated PDF or CSV report file safely."""
    meta = get_report(report_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Report ID '{report_id}' not found.")

    file_path = Path(meta["stored_path"]).resolve()
    reports_dir = settings.REPORTS_DIR.resolve()

    # Prevent directory traversal: verify file is strictly inside reports directory
    try:
        file_path.relative_to(reports_dir)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied: Invalid report file location.")

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found on disk.")

    media_type = "application/pdf" if meta["report_type"] == "pdf" else "text/csv"
    return FileResponse(
        path=str(file_path),
        filename=meta["filename"],
        media_type=media_type,
    )
