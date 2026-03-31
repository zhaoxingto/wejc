from types import SimpleNamespace

import httpx
from sqlalchemy import select

from app.models.customer import ChannelOrder, OrderPushTask
from app.models.integration import OrderPushLog


def test_execute_order_push_tasks_success(
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
        status_code = 200
        text = '{"status":"ok"}'

        @staticmethod
        def raise_for_status() -> None:
            return None

        @staticmethod
        def json() -> dict:
            return {"status": "ok"}

    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: FakeResponse())

    response = client.post("/api/integration/orders/push")

    assert response.status_code == 200
    assert response.json()["data"]["processed"] == 1

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    order = db_session.execute(select(ChannelOrder)).scalar_one()
    push_log = db_session.execute(select(OrderPushLog)).scalar_one()

    assert task.status == "success"
    assert order.push_status == "success"
    assert push_log.success is True


def test_execute_order_push_tasks_retry_on_failure(
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

    def fake_post(*args, **kwargs):
        raise httpx.ConnectError("upstream down")

    monkeypatch.setattr(httpx, "post", fake_post)

    response = client.post("/api/integration/orders/push")

    assert response.status_code == 200
    task = db_session.execute(select(OrderPushTask)).scalar_one()
    order = db_session.execute(select(ChannelOrder)).scalar_one()
    push_log = db_session.execute(select(OrderPushLog)).scalar_one()

    assert task.status == "retrying"
    assert task.retry_count == 1
    assert task.last_error is not None
    assert task.next_retry_at is not None
    assert order.push_status == "retrying"
    assert push_log.success is False


def test_repush_order_success(
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
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7002, "qty": 1}],
        },
    )

    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: SimpleNamespace(
        raise_for_status=lambda: None,
        json=lambda: {"status": "ok"},
        text='{"status":"ok"}',
    ))

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    task.status = "retrying"
    task.retry_count = 2
    db_session.commit()

    order = db_session.execute(select(ChannelOrder)).scalar_one()
    response = client.post(
        f"/api/merchant/orders/{order.id}/repush",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    db_session.refresh(task)
    assert task.status == "success"
