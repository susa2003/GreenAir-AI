import pytest
from backend.app.agent.tool_registry import ALLOWLISTED_TOOLS, execute_tool

def test_tool_registry_execution():
    """Verify individual allowlisted tools execute directly with validated types."""
    # Test predict_air_quality
    out, ms, ok, err = execute_tool("predict_air_quality", {
        "pm25": 30.0,
        "pm10": 50.0,
        "no2": 20.0,
        "co": 0.5,
        "so2": 10.0,
        "o3": 30.0,
    })
    assert ok is True
    assert out is not None
    assert "category" in out

    # Test analyze_pollutants
    out2, ms2, ok2, err2 = execute_tool("analyze_pollutants", {
        "pm25": 45.0,
        "pm10": 70.0,
        "no2": 25.0,
        "co": 0.8,
        "so2": 12.0,
        "o3": 35.0,
    })
    assert ok2 is True
    assert "dominant_pollutant" in out2

    # Test unauthorized tool execution
    bad_out, _, bad_ok, bad_err = execute_tool("os_system_command", {})
    assert bad_ok is False
    assert "Security Error" in bad_err

def test_agent_chat_endpoint_runs_tools(client):
    """Test POST /api/chat triggers real tools and persists session conversation."""
    payload = {
        "message": "Predict the air quality for PM2.5: 35.0, PM10: 55.0, NO2: 22.0, CO: 0.6, SO2: 12.0, O3: 32.0",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "response" in data
    assert len(data["tools_executed"]) >= 1
    tool_names = [t["tool_name"] for t in data["tools_executed"]]
    assert "predict_air_quality" in tool_names
    assert "tools_executed" in data

    # Verify session is persisted
    session_id = data["session_id"]
    sess_resp = client.get(f"/api/chat/sessions/{session_id}")
    assert sess_resp.status_code == 200
    messages = sess_resp.json()["messages"]
    assert len(messages) >= 2  # user + assistant
