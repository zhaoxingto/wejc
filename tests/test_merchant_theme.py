def test_get_storefront_theme(client, store_context_token) -> None:
    response = client.get(
        "/api/merchant/storefront-theme",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["preset_key"] == "amber"
    assert body["data"]["colors"]["primary_color"] == "#8F5A2A"


def test_update_storefront_theme(client, store_context_token) -> None:
    response = client.put(
        "/api/merchant/storefront-theme",
        json={
            "preset_key": "forest",
            "colors": {
                "primary_color": "#24513E",
                "surface_color": "#F8FFFB",
            },
        },
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["preset_key"] == "forest"
    assert body["data"]["colors"]["primary_color"] == "#24513E"
    assert body["data"]["colors"]["surface_color"] == "#F8FFFB"

    check = client.get(
        "/api/store/home",
        headers={"X-Store-Context-Token": store_context_token},
    )
    data = check.json()["data"]
    assert data["theme"]["preset_key"] == "forest"
    assert data["theme"]["colors"]["primary_color"] == "#24513E"
