def test_list_store_products_success(client, store_context_token, seeded_products) -> None:
    response = client.get(
        "/api/store/products",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["id"] == seeded_products["product_id"]
    assert body["data"][0]["title"] == "精品咖啡豆"


def test_get_store_product_detail_success(client, store_context_token, seeded_products) -> None:
    response = client.get(
        f"/api/store/products/{seeded_products['product_id']}",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["title"] == "精品咖啡豆"
    assert len(body["data"]["specs"]) == 1
    assert len(body["data"]["specs"][0]["values"]) == 2
    assert len(body["data"]["skus"]) == 2


def test_get_store_product_detail_requires_context(client, seeded_products) -> None:
    response = client.get(f"/api/store/products/{seeded_products['product_id']}")

    assert response.status_code == 422


def test_get_store_product_detail_not_found(client, store_context_token) -> None:
    response = client.get(
        "/api/store/products/999999",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 404
    assert response.json() == {
        "code": 4005,
        "message": "product not found",
        "data": None,
    }
