import pytest
import os
import shutil
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure test database and paths
os.environ["ENVIRONMENT"] = "testing"
os.environ["OMP_NUM_THREADS"] = "1"

from backend.app.config import settings
from backend.app.database.connection import init_db
from backend.app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test database and temporary storage."""
    test_db = settings.DATA_DIR / "test_greenair.db"
    settings.DATABASE_PATH = test_db
    init_db()
    yield
    # Cleanup test db
    if test_db.exists():
        try:
            test_db.unlink()
        except Exception:
            pass

@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)
