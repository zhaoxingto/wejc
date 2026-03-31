from sqlalchemy import select

from app.models.customer import OrderPushTask
from app.models.integration import OrderPushLog


def test_create_order_insufficient_stock(
    client,
    store_context_token,
    seeded_products,
    seeded_customer,
) -> None:
    response = client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 9999}],
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": 4008,
        "message": "insufficient stock",
        "data": None,
    }


def test_manual_repush_creates_log(
    client,
    db_session,
    monkeypatch,
    store_context_token,
    seeded_products,
    seeded_customer,
    seeded_integration,
) -> None:
    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 1}],
        },
    )

    class FakeResponse:
        text = '{"status":"ok"}'

        @staticmethod
        def raise_for_status() -> None:
            return None

        @staticmethod
        def json() -> dict:
            return {"status": "ok"}

    import httpx

    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: FakeResponse())

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    response = client.post(
        f"/api/merchant/orders/{task.order_id}/repush",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    logs = db_session.execute(select(OrderPushLog)).scalars().all()
    assert len(logs) == 1
