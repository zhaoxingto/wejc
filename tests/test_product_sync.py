from datetime import datetime, timezone

import httpx
from sqlalchemy import select

from app.models.bootstrap import Integration, SourceProduct


def test_merchant_sync_products_success(
    client,
    db_session,
    monkeypatch,
    store_context_token,
    seeded_shop,
    seeded_integration,
) -> None:
    integration = db_session.execute(select(Integration).where(Integration.id == seeded_integration["integration_id"])).scalar_one()
    integration.product_sync_enabled = True
    db_session.commit()

    class FakeResponse:
        @staticmethod
        def raise_for_status() -> None:
            return None

        @staticmethod
        def json() -> dict:
            return {
                "items": [
                    {
                        "product_id": "ERP-9002",
                        "name": "Manual Sync Product",
                        "description": "pulled from erp",
                        "sku_mode": "multiple",
                    }
                ]
            }

    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: FakeResponse())

    response = client.post(
        "/api/merchant/products/sync",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["integration_id"] == seeded_integration["integration_id"]
    assert body["pulled_count"] == 1
    assert body["created_count"] == 1
    assert body["updated_count"] == 0
    assert body["skipped_count"] == 0
    assert body["source_products"][0]["source_product_id"] == "ERP-9002"

    products = db_session.execute(
        select(SourceProduct).where(
            SourceProduct.tenant_id == seeded_shop["tenant_id"],
            SourceProduct.integration_id == seeded_integration["integration_id"],
        )
    ).scalars().all()
    assert len(products) == 1
    assert products[0].name == "Manual Sync Product"


def test_integration_pull_products_updates_existing_source_product(
    client,
    db_session,
    monkeypatch,
    seeded_shop,
    seeded_integration,
) -> None:
    integration = db_session.execute(select(Integration).where(Integration.id == seeded_integration["integration_id"])).scalar_one()
    integration.product_sync_enabled = True

    existing = SourceProduct(
        id=3100,
        tenant_id=seeded_shop["tenant_id"],
        integration_id=integration.id,
        source_type="erp",
        source_product_id="ERP-9003",
        sku_mode="single",
        name="Old Name",
        description="old description",
        raw_data_json={"version": 1},
        sync_status="pending",
        last_sync_at=datetime(2026, 3, 12, 10, 0, 0, tzinfo=timezone.utc),
    )
    db_session.add(existing)
    db_session.commit()

    class FakeResponse:
        @staticmethod
        def raise_for_status() -> None:
            return None

        @staticmethod
        def json() -> list[dict]:
            return [
                {
                    "source_product_id": "ERP-9003",
                    "name": "Updated Name",
                    "description": "new description",
                    "sku_mode": "multiple",
                }
            ]

    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: FakeResponse())

    response = client.post(
        "/api/integration/products/pull",
        json={"tenant_id": seeded_shop["tenant_id"], "integration_id": seeded_integration["integration_id"]},
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["pulled_count"] == 1
    assert body["created_count"] == 0
    assert body["updated_count"] == 1
    assert body["source_products"][0]["name"] == "Updated Name"

    db_session.refresh(existing)
    assert existing.name == "Updated Name"
    assert existing.description == "new description"
    assert existing.sku_mode == "multiple"
    assert existing.sync_status == "synced"


def test_list_source_products_for_store_success(
    client,
    db_session,
    store_context_token,
    seeded_shop,
    seeded_integration,
) -> None:
    integration = db_session.execute(select(Integration).where(Integration.id == seeded_integration["integration_id"])).scalar_one()
    integration.product_sync_enabled = True

    source_product = SourceProduct(
        id=3200,
        tenant_id=seeded_shop["tenant_id"],
        integration_id=integration.id,
        source_type="erp",
        source_product_id="ERP-3200",
        sku_mode="single",
        name="Listed Product",
        description="source product",
        raw_data_json={"source": "erp"},
        sync_status="synced",
        last_sync_at=datetime(2026, 3, 12, 10, 0, 0, tzinfo=timezone.utc),
    )
    db_session.add(source_product)
    db_session.commit()

    response = client.get(
        "/api/merchant/source-products",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert len(body) == 1
    assert body[0]["source_product_id"] == "ERP-3200"
    assert body[0]["name"] == "Listed Product"
