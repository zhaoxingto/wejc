import httpx


def test_list_channel_products(client, store_context_token, seeded_products) -> None:
    response = client.get(
        "/api/merchant/channel-products",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["source_product_id"] == seeded_products["source_product_id"]


def test_get_channel_product_detail(client, store_context_token, seeded_products) -> None:
    response = client.get(
        f"/api/merchant/channel-products/{seeded_products['product_id']}",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["id"] == seeded_products["product_id"]
    assert len(body["data"]["specs"]) == 1
    assert body["data"]["specs"][0]["values"][0]["value"] == "250g"


def test_update_channel_product(client, store_context_token, seeded_products) -> None:
    response = client.put(
        f"/api/merchant/channel-products/{seeded_products['product_id']}",
        json={
            "status": "draft",
            "sort_no": 9,
            "subtitle": "已改标题",
            "cover": "https://example.com/updated.png",
            "album_json": ["https://example.com/updated.png"],
        },
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["status"] == "draft"
    assert body["data"]["sort_no"] == 9
    assert body["data"]["subtitle"] == "已改标题"


def test_list_product_skus(client, store_context_token, seeded_products) -> None:
    response = client.get(
        f"/api/merchant/channel-products/{seeded_products['product_id']}/skus",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 2
    assert "250g" in body["data"][0]["spec_text"]


def test_list_source_products_with_publish_state(client, store_context_token, seeded_products, seeded_integration) -> None:
    response = client.get(
        "/api/merchant/source-products",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["published"] is True
    assert body["data"][0]["channel_product_id"] == 4001


def test_publish_source_product_for_store(client, store_context_token, db_session, seeded_products, seeded_integration) -> None:
    from app.models.product import ChannelProduct, ProductSku, ProductSpec, ProductSpecValue

    db_session.query(ProductSku).delete()
    db_session.query(ProductSpecValue).delete()
    db_session.query(ProductSpec).delete()
    db_session.query(ChannelProduct).delete()
    db_session.commit()

    response = client.post(
        "/api/merchant/source-products/3001/publish",
        json={"title": "Published By Merchant", "subtitle": "Merchant Flow", "status": "active"},
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["title"] == "Published By Merchant"
    assert body["data"]["status"] == "active"
    assert body["data"]["source_product_id"] == 3001


def test_create_update_and_delete_sku(client, store_context_token, seeded_products) -> None:
    create_response = client.post(
        f"/api/merchant/channel-products/{seeded_products['product_id']}/skus",
        json={
            "sku_code": "SKU-NEW",
            "spec_value_ids_json": [6001, 6002],
            "price": "129.90",
            "market_price": "149.90",
            "stock": 18,
            "status": "active",
        },
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert create_response.status_code == 200
    create_body = create_response.json()
    assert create_body["code"] == 0
    assert create_body["data"]["sku_code"] == "SKU-NEW"
    assert create_body["data"]["spec_value_ids_json"] == [6001, 6002]

    sku_id = create_body["data"]["id"]
    update_response = client.put(
        f"/api/merchant/skus/{sku_id}",
        json={
            "sku_code": "SKU-NEW-2",
            "price": "139.90",
            "stock": 66,
            "status": "disabled",
        },
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert update_response.status_code == 200
    update_body = update_response.json()
    assert update_body["code"] == 0
    assert update_body["data"]["stock"] == 66
    assert update_body["data"]["status"] == "disabled"
    assert update_body["data"]["sku_code"] == "SKU-NEW-2"

    delete_response = client.delete(
        f"/api/merchant/skus/{sku_id}",
        headers={"X-Store-Context-Token": store_context_token},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["code"] == 0

    list_response = client.get(
        f"/api/merchant/channel-products/{seeded_products['product_id']}/skus",
        headers={"X-Store-Context-Token": store_context_token},
    )
    listed_codes = [item["sku_code"] for item in list_response.json()["data"]]
    assert "SKU-NEW-2" not in listed_codes


def test_delete_channel_product(client, store_context_token, seeded_products) -> None:
    response = client.delete(
        f"/api/merchant/channel-products/{seeded_products['product_id']}",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    assert response.json()["code"] == 0

    detail_response = client.get(
        f"/api/merchant/channel-products/{seeded_products['product_id']}",
        headers={"X-Store-Context-Token": store_context_token},
    )
    assert detail_response.status_code == 404


def test_upload_merchant_image(client, store_context_token) -> None:
    response = client.post(
        "/api/merchant/uploads/image",
        content=b"\x89PNG\r\n\x1a\nfake-image",
        headers={
            "X-Store-Context-Token": store_context_token,
            "Content-Type": "image/png",
            "X-Upload-Filename": "cover.png",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["url"].startswith("/uploads/merchant/1001/2001/")
    assert body["data"]["content_type"] == "image/png"


def test_get_and_update_integration_config(client, store_context_token, seeded_integration) -> None:
    response = client.get(
        "/api/merchant/integration-config",
        headers={"X-Store-Context-Token": store_context_token},
    )
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Default ERP"

    update_response = client.put(
        "/api/merchant/integration-config",
        json={
            "name": "Shop ERP",
            "api_base_url": "https://merchant.example.com/api",
            "product_sync_enabled": True,
        },
        headers={"X-Store-Context-Token": store_context_token},
    )
    assert update_response.status_code == 200
    body = update_response.json()
    assert body["data"]["name"] == "Shop ERP"
    assert body["data"]["api_base_url"] == "https://merchant.example.com/api"
    assert body["data"]["product_sync_enabled"] is True


def test_integration_config_connectivity_test(client, store_context_token, seeded_integration, monkeypatch) -> None:
    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"items": [{"id": "ERP-1"}, {"id": "ERP-2"}]}

    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: FakeResponse())

    response = client.post(
        "/api/merchant/integration-config/test",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["reachable"] is True
    assert body["data"]["sample_count"] == 2
    assert body["data"]["request_url"] == "https://erp.example.com/api/products/pull"


def test_integration_config_connectivity_test_with_demo_products(
    client,
    store_context_token,
    seeded_integration,
) -> None:
    update_response = client.put(
        "/api/merchant/integration-config",
        json={
            "api_base_url": "",
            "config_json": {"demo_products": [{"id": "demo-1"}]},
        },
        headers={"X-Store-Context-Token": store_context_token},
    )
    assert update_response.status_code == 200

    response = client.post(
        "/api/merchant/integration-config/test",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["reachable"] is True
    assert body["data"]["sample_count"] == 1
    assert body["data"]["request_url"] is None
