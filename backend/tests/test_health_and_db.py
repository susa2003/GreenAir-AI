import pytest
from backend.app.database.repository import (
    create_session, get_session, add_message, get_session_messages,
    save_analysis_record, list_analysis_records
)

def test_health_endpoint(client):
    """Test health endpoint returns 200 with model and DB status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "model" in data
    assert "database" in data
    assert data["database"]["status"] == "connected"
    assert "ai_engine" in data

def test_database_initialization_and_history():
    """Test session, messages, and analysis record database persistence."""
    sid = create_session(title="Unit Test Session")
    assert sid is not None
    session_data = get_session(sid)
    assert session_data["title"] == "Unit Test Session"

    mid = add_message(sid, "user", "What is the air quality today?")
    assert mid is not None
    messages = get_session_messages(sid)
    assert len(messages) == 1
    assert messages[0]["content"] == "What is the air quality today?"

    # Analysis record
    rid = save_analysis_record(
        record_type="test_type",
        title="Test Record",
        input_summary={"sample": 123},
        result={"status": "ok"}
    )
    assert rid is not None
    history = list_analysis_records(limit=10, record_type="test_type")
    assert any(r["id"] == rid for r in history)
