import time
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.context import RequestContext
from app.core.exceptions import IntegrationNotFound, ProductSyncPayloadInvalid
from app.models.integration import Integration
from app.models.product import SourceProduct
from app.models.shop import Shop
from app.repositories.integration_repo import IntegrationRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.shop_repo import ShopRepository
from app.schemas.integration import ProductSyncResponse, SourceProductSyncRead
from app.services.integration_service import IntegrationService


class ProductSyncService:
    def __init__(
        self,
        session: Session,
        integration_repository: IntegrationRepository,
        product_repository: ProductRepository,
        shop_repository: ShopRepository,
        integration_service: IntegrationService,
    ) -> None:
        self.session = session
        self.integration_repository = integration_repository
        self.product_repository = product_repository
        self.shop_repository = shop_repository
        self.integration_service = integration_service

    def sync_for_store(self, context: RequestContext) -> ProductSyncResponse:
        shop = self.shop_repository.get_by_context(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            shop_code=context.shop_code,
        )
        integration = self._resolve_store_integration(shop, context.tenant_id)
        return self._sync(integration)

    def pull_by_integration(self, tenant_id: int, integration_id: int | None = None) -> ProductSyncResponse:
        integration = self._resolve_integration(tenant_id, integration_id)
        return self._sync(integration)

    def list_source_products_for_store(self, context: RequestContext) -> list[SourceProductSyncRead]:
        shop = self.shop_repository.get_by_context(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            shop_code=context.shop_code,
        )
        integration = self._resolve_store_integration(shop, context.tenant_id)
        source_products = self.product_repository.list_source_products(integration.tenant_id, integration.id)
        return [SourceProductSyncRead.model_validate(product) for product in source_products]

    def _sync(self, integration: Integration) -> ProductSyncResponse:
        raw_payload = self.integration_service.pull_products(integration)
        items = self._extract_items(raw_payload)
        created_count = 0
        updated_count = 0
        skipped_count = 0

        for item in items:
            normalized = self._normalize_item(item, integration)
            if normalized is None:
                skipped_count += 1
                continue

            source_product_id = normalized["source_product_id"]
            product = self.product_repository.get_source_product(
                tenant_id=integration.tenant_id,
                integration_id=integration.id,
                source_product_id=source_product_id,
            )

            if product is None:
                product = SourceProduct(
                    id=self._next_id(),
                    tenant_id=integration.tenant_id,
                    integration_id=integration.id,
                    source_type=normalized["source_type"],
                    source_product_id=source_product_id,
                    sku_mode=normalized["sku_mode"],
                    name=normalized["name"],
                    description=normalized["description"],
                    raw_data_json=normalized["raw_data_json"],
                    sync_status="synced",
                    last_sync_at=normalized["last_sync_at"],
                )
                self.product_repository.add_source_product(product)
                created_count += 1
            else:
                product.source_type = normalized["source_type"]
                product.sku_mode = normalized["sku_mode"]
                product.name = normalized["name"]
                product.description = normalized["description"]
                product.raw_data_json = normalized["raw_data_json"]
                product.sync_status = "synced"
                product.last_sync_at = normalized["last_sync_at"]
                updated_count += 1

        self.session.commit()
        source_products = self.product_repository.list_source_products(integration.tenant_id, integration.id)
        return ProductSyncResponse(
            integration_id=integration.id,
            pulled_count=len(items),
            created_count=created_count,
            updated_count=updated_count,
            skipped_count=skipped_count,
            source_products=[SourceProductSyncRead.model_validate(product) for product in source_products],
        )

    def _resolve_store_integration(self, shop: Shop | None, tenant_id: int) -> Integration:
        if shop is None:
            raise IntegrationNotFound()

        if shop.default_integration_id is not None:
            integration = self.integration_repository.get_by_id(shop.default_integration_id, tenant_id)
            if integration is not None and integration.product_sync_enabled:
                return integration

        return self._resolve_integration(tenant_id, None)

    def _resolve_integration(self, tenant_id: int, integration_id: int | None) -> Integration:
        if integration_id is not None:
            integration = self.integration_repository.get_by_id(integration_id, tenant_id)
            if integration is None or not integration.product_sync_enabled:
                raise IntegrationNotFound()
            return integration

        integration = self.integration_repository.get_active_product_sync_integration(tenant_id)
        if integration is None:
            raise IntegrationNotFound()
        return integration

    @staticmethod
    def _extract_items(payload: dict | list) -> list[dict]:
        if isinstance(payload, list):
            items = payload
        elif isinstance(payload, dict):
            items = payload.get("items", [])
        else:
            raise ProductSyncPayloadInvalid()

        if not isinstance(items, list):
            raise ProductSyncPayloadInvalid()
        return [item for item in items if isinstance(item, dict)]

    @staticmethod
    def _normalize_item(item: dict, integration: Integration) -> dict | None:
        source_product_id = item.get("source_product_id") or item.get("product_id") or item.get("id")
        name = item.get("name") or item.get("title")
        if source_product_id is None or name is None:
            return None

        return {
            "source_product_id": str(source_product_id),
            "source_type": str(item.get("source_type") or integration.integration_type or "erp"),
            "sku_mode": str(item.get("sku_mode") or "single"),
            "name": str(name),
            "description": item.get("description"),
            "raw_data_json": item,
            "last_sync_at": datetime.now(timezone.utc),
        }

    @staticmethod
    def _next_id() -> int:
        return time.time_ns()
