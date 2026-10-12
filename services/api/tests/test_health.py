from fastapi.testclient import TestClient

from app.main import VERSION, app

client = TestClient(app)


def test_healthz() -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"ok": True, "version": VERSION}


def test_unknown_route_uses_error_shape() -> None:
    res = client.get("/nope")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "http_404"
    assert res.json()["error"]["retryable"] is False
