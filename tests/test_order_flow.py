from sqlalchemy import select

from app.models.customer import ChannelOrder, OrderPushTask


def test_add_cart_item_success(client, store_context_token, seeded_products, seeded_customer) -> None:
    response = client.post(
        "/api/customer/cart/add",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "product_id": seeded_products["product_id"],
            "sku_id": 7001,
            "qty": 2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["customer_id"] == seeded_customer["customer_id"]
    assert body["data"]["qty"] == 2


def test_create_order_success(client, db_session, store_context_token, seeded_products, seeded_customer) -> None:
    response = client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [
                {
                    "product_id": seeded_products["product_id"],
                    "sku_id": 7001,
                    "qty": 2,
                }
            ],
            "remark": "尽快发货",
            "address_json": {"name": "张三", "mobile": "13800000000", "detail": "测试地址"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["status"] == "created"
    assert body["data"]["push_status"] == "pending"
    assert body["data"]["total_amount"] == "119.80"
    assert len(body["data"]["items"]) == 1

    order_count = db_session.execute(select(ChannelOrder)).scalars().all()
    push_tasks = db_session.execute(select(OrderPushTask)).scalars().all()
    assert len(order_count) == 1
    assert len(push_tasks) == 1
    assert push_tasks[0].status == "pending"


def test_list_customer_orders_success(client, store_context_token, seeded_products, seeded_customer) -> None:
    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 1}],
        },
    )

    response = client.get(
        f"/api/customer/orders?customer_id={seeded_customer['customer_id']}",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["customer_id"] == seeded_customer["customer_id"]


def test_list_merchant_orders_success(client, store_context_token, seeded_products, seeded_customer) -> None:
    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7002, "qty": 1}],
        },
    )

    response = client.get(
        "/api/merchant/orders",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["items"][0]["sku_id"] == 7002
