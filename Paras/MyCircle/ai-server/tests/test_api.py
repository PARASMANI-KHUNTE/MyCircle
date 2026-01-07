from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Inference Server is running", "docs": "/docs"}

def test_health_live():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}

def test_health_ready():
    # In our mock, text model loads at startup, so this might be ready or loading depending on speed
    # But TestClient runs synchronously usually, so startup event should have fired.
    response = client.get("/health/ready")
    assert response.status_code in [200, 503]

def test_text_analyze_unauthorized():
    response = client.post("/text/analyze", json={"text": "Hello"})
    # No header provided
    assert response.status_code == 403

def test_text_analyze_authorized():
    headers = {settings.API_KEY_NAME: settings.API_SECRET_KEY}
    response = client.post(
        "/text/analyze", 
        json={"text": "Hello world", "context": "post"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "sentiment" in data
    assert "toxicity_score" in data

def test_text_moderate_block():
    headers = {settings.API_KEY_NAME: settings.API_SECRET_KEY}
    # Mocked bad word "badword1"
    response = client.post(
        "/text/moderate",
        json={"text": "This contains badword1", "strict": True},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["allowed"] is False
    assert response.json()["reason"] == "bad_keywords_detected"

def test_text_length_limit():
    headers = {settings.API_KEY_NAME: settings.API_SECRET_KEY}
    long_text = "a" * (settings.MAX_TEXT_LENGTH + 10)
    response = client.post(
        "/text/analyze",
        json={"text": long_text, "context": "post"},
        headers=headers
    )
    assert response.status_code == 400
