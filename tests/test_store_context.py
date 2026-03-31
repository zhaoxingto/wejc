from app.models.shop import Shop


def test_store_home_success(client, store_context_token, seeded_shop) -> None:
    response = client.get(
        "/api/store/home",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["tenant_id"] == seeded_shop["tenant_id"]
    assert body["data"]["shop_id"] == seeded_shop["shop_id"]
    assert body["data"]["shop_code"] == seeded_shop["shop_code"]
    assert body["data"]["shop_name"] == "A商家订货店"
    assert body["data"]["theme"]["preset_key"] == "amber"
    assert body["data"]["theme"]["colors"]["primary_color"] == "#8F5A2A"


def test_store_context_token_invalid(client) -> None:
    response = client.get(
        "/api/store/home",
        headers={"X-Store-Context-Token": "bad-token"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "code": 4004,
        "message": "invalid store context token",
        "data": None,
    }


def test_store_context_token_rejects_inactive_shop(client, db_session, store_context_token) -> None:
    shop = db_session.get(Shop, 2001)
    shop.status = "disabled"
    db_session.commit()

    response = client.get(
        "/api/store/home",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": 4002,
        "message": "shop inactive",
        "data": None,
    }
