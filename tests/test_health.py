def test_healthcheck(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["code"] == 0
    assert response.json()["data"]["status"] == "ok"


def test_platform_ping(client) -> None:
    response = client.get("/api/platform/ping")

    assert response.status_code == 200
    assert response.json() == {
        "code": 0,
        "message": "ok",
        "data": {"message": "pong"},
    }
