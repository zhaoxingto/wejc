from app.core.security import get_store_context_token_manager


def test_store_resolve_success(client, seeded_shop) -> None:
    response = client.post("/api/store/resolve", json={"code": seeded_shop["shop_code"]})

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["tenant_id"] == seeded_shop["tenant_id"]
    assert body["data"]["shop_id"] == seeded_shop["shop_id"]
    assert body["data"]["shop_name"] == "A商家订货店"

    token_manager = get_store_context_token_manager()
    context = token_manager.loads(body["data"]["store_context_token"])
    assert context.tenant_id == seeded_shop["tenant_id"]
    assert context.shop_id == seeded_shop["shop_id"]
    assert context.shop_code == seeded_shop["shop_code"]


def test_store_resolve_not_found(client) -> None:
    response = client.post("/api/store/resolve", json={"code": "UNKNOWN"})

    assert response.status_code == 404
    assert response.json() == {
        "code": 4001,
        "message": "shop not found",
        "data": None,
    }
