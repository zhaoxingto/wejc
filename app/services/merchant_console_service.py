import time

import httpx
from sqlalchemy.orm import Session

from app.core.context import RequestContext
from app.core.exceptions import ChannelProductNotFound, IntegrationNotFound, SkuNotFound, SourceProductNotFound
from app.models.product import ChannelProduct, ProductSku
from app.repositories.integration_repo import IntegrationRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.shop_repo import ShopRepository
from app.schemas.merchant import (
    MerchantChannelProductDetailRead,
    MerchantPublishSourceProductRequest,
    MerchantChannelProductRead,
    MerchantChannelProductUpdateRequest,
    MerchantIntegrationRead,
    MerchantIntegrationTestRead,
    MerchantSourceProductRead,
    MerchantIntegrationUpdateRequest,
    MerchantSkuCreateRequest,
    MerchantSkuRead,
    MerchantSkuUpdateRequest,
    MerchantSpecRead,
    MerchantSpecValueRead,
)
from app.services.integration_service import IntegrationService


class MerchantConsoleService:
    def __init__(
        self,
        session: Session,
        product_repository: ProductRepository,
        integration_repository: IntegrationRepository,
        shop_repository: ShopRepository,
        integration_service: IntegrationService,
    ) -> None:
        self.session = session
        self.product_repository = product_repository
        self.integration_repository = integration_repository
        self.shop_repository = shop_repository
        self.integration_service = integration_service

    def list_source_products(self, context: RequestContext) -> list[MerchantSourceProductRead]:
        integration = self._resolve_store_integration(context)
        source_products = self.product_repository.list_source_products(integration.tenant_id, integration.id)
        if not source_products:
            source_products = self.product_repository.list_source_products(integration.tenant_id, None)
        channel_products = self.product_repository.list_channel_products(context.tenant_id, context.shop_id)
        published_by_source = {
            product.source_product_id: product for product in channel_products if product.source_product_id is not None
        }
        return [
            MerchantSourceProductRead(
                id=product.id,
                integration_id=product.integration_id,
                source_product_id=product.source_product_id,
                source_type=product.source_type,
                sku_mode=product.sku_mode,
                name=product.name,
                description=product.description,
                sync_status=product.sync_status,
                last_sync_at=product.last_sync_at,
                published=published_by_source.get(product.id) is not None,
                channel_product_id=published_by_source.get(product.id).id if published_by_source.get(product.id) else None,
                channel_product_title=published_by_source.get(product.id).title if published_by_source.get(product.id) else None,
                channel_product_status=published_by_source.get(product.id).status if published_by_source.get(product.id) else None,
            )
            for product in source_products
        ]

    def publish_source_product(
        self,
        context: RequestContext,
        source_product_id: int,
        payload: MerchantPublishSourceProductRequest,
    ) -> MerchantChannelProductRead:
        source_product = self.product_repository.get_source_product_by_id(source_product_id)
        if source_product is None or source_product.tenant_id != context.tenant_id:
            raise SourceProductNotFound()

        channel_product = self.product_repository.get_channel_product_by_source_and_shop(source_product_id, context.shop_id)
        if channel_product is None:
            channel_product = ChannelProduct(
                id=self._next_id(),
                tenant_id=context.tenant_id,
                shop_id=context.shop_id,
                source_product_id=source_product.id,
                title=payload.title or source_product.name,
                subtitle=payload.subtitle,
                cover=None,
                album_json=None,
                category_id=None,
                status=payload.status,
                sort_no=0,
            )
            self.product_repository.add_channel_product(channel_product)
        else:
            channel_product.title = payload.title or source_product.name
            channel_product.subtitle = payload.subtitle
            channel_product.status = payload.status

        self.session.commit()
        self.session.refresh(channel_product)
        return self._to_channel_product_read(channel_product)

    def list_channel_products(self, context: RequestContext) -> list[MerchantChannelProductRead]:
        products = self.product_repository.list_channel_products(context.tenant_id, context.shop_id)
        return [self._to_channel_product_read(product) for product in products]

    def get_channel_product_detail(
        self,
        context: RequestContext,
        product_id: int,
    ) -> MerchantChannelProductDetailRead:
        product = self.product_repository.get_channel_product_for_store(context.tenant_id, context.shop_id, product_id)
        if product is None:
            raise ChannelProductNotFound()
        return self._to_channel_product_detail_read(product)

    def update_channel_product(
        self,
        context: RequestContext,
        product_id: int,
        payload: MerchantChannelProductUpdateRequest,
    ) -> MerchantChannelProductRead:
        product = self.product_repository.get_channel_product_for_store(context.tenant_id, context.shop_id, product_id)
        if product is None:
            raise ChannelProductNotFound()

        data = payload.model_dump(exclude_none=True)
        for field, value in data.items():
            setattr(product, field, value)

        self.session.commit()
        self.session.refresh(product)
        return self._to_channel_product_read(product)

    def delete_channel_product(self, context: RequestContext, product_id: int) -> None:
        product = self.product_repository.get_channel_product_for_store(context.tenant_id, context.shop_id, product_id)
        if product is None:
            raise ChannelProductNotFound()
        self.product_repository.delete_channel_product(product)
        self.session.commit()

    def list_product_skus(self, context: RequestContext, product_id: int) -> list[MerchantSkuRead]:
        product = self.product_repository.get_channel_product_for_store(context.tenant_id, context.shop_id, product_id)
        if product is None:
            raise ChannelProductNotFound()

        skus = self.product_repository.list_product_skus(context.tenant_id, context.shop_id, product_id)
        value_lookup = self._build_value_lookup(product)
        return [self._to_sku_read(sku, value_lookup) for sku in skus]

    def update_sku(self, context: RequestContext, sku_id: int, payload: MerchantSkuUpdateRequest) -> MerchantSkuRead:
        sku = self.product_repository.get_sku_by_id(context.tenant_id, context.shop_id, sku_id)
        if sku is None:
            raise SkuNotFound()

        product = self.product_repository.get_channel_product_for_store(context.tenant_id, context.shop_id, sku.product_id)
        if product is None:
            raise ChannelProductNotFound()

        data = payload.model_dump(exclude_none=True)
        for field, value in data.items():
            setattr(sku, field, value)

        self.session.commit()
        self.session.refresh(sku)
        value_lookup = self._build_value_lookup(product)
        return self._to_sku_read(sku, value_lookup)

    def create_sku(
        self,
        context: RequestContext,
        product_id: int,
        payload: MerchantSkuCreateRequest,
    ) -> MerchantSkuRead:
        product = self.product_repository.get_channel_product_for_store(context.tenant_id, context.shop_id, product_id)
        if product is None:
            raise ChannelProductNotFound()

        sku = ProductSku(
            id=self._next_id(),
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            product_id=product_id,
            sku_code=payload.sku_code,
            spec_value_ids_json=payload.spec_value_ids_json,
            price=payload.price,
            market_price=payload.market_price,
            stock=payload.stock,
            status=payload.status,
        )
        self.product_repository.add_sku(sku)
        self.session.commit()
        self.session.refresh(sku)
        value_lookup = self._build_value_lookup(product)
        return self._to_sku_read(sku, value_lookup)

    def delete_sku(self, context: RequestContext, sku_id: int) -> None:
        sku = self.product_repository.get_sku_by_id(context.tenant_id, context.shop_id, sku_id)
        if sku is None:
            raise SkuNotFound()
        self.product_repository.delete_sku(sku)
        self.session.commit()

    def get_integration_config(self, context: RequestContext) -> MerchantIntegrationRead:
        integration = self._resolve_store_integration(context)
        return self._to_integration_read(integration)

    def update_integration_config(
        self,
        context: RequestContext,
        payload: MerchantIntegrationUpdateRequest,
    ) -> MerchantIntegrationRead:
        integration = self._resolve_store_integration(context)
        data = payload.model_dump(exclude_none=True)
        for field, value in data.items():
            setattr(integration, field, value)
        self.session.commit()
        self.session.refresh(integration)
        return self._to_integration_read(integration)

    def test_integration_config(self, context: RequestContext) -> MerchantIntegrationTestRead:
        integration = self._resolve_store_integration(context)
        request_url = f"{integration.api_base_url.rstrip('/')}/products/pull" if integration.api_base_url else None
        try:
            payload = self.integration_service.pull_products(integration)
            items = payload if isinstance(payload, list) else payload.get("items", [])
            sample_count = len(items) if isinstance(items, list) else 0
            if integration.api_base_url:
                message = "连通性正常，已成功请求产品拉取接口"
            elif sample_count > 0:
                message = "当前使用演示商品数据，未配置真实接口地址"
            else:
                message = "未配置接口地址，当前也没有演示商品数据"
            return MerchantIntegrationTestRead(
                reachable=bool(integration.api_base_url or sample_count > 0),
                message=message,
                request_url=request_url,
                sample_count=sample_count,
            )
        except httpx.HTTPError as exc:
            return MerchantIntegrationTestRead(
                reachable=False,
                message=f"请求失败：{exc}",
                request_url=request_url,
                sample_count=0,
            )

    def _resolve_store_integration(self, context: RequestContext):
        shop = self.shop_repository.get_by_context(context.tenant_id, context.shop_id, context.shop_code)
        if shop and shop.default_integration_id is not None:
            integration = self.integration_repository.get_any_by_id(shop.default_integration_id, context.tenant_id)
            if integration is not None:
                return integration

        integration = self.integration_repository.get_first_for_tenant(context.tenant_id)
        if integration is None:
            raise IntegrationNotFound()
        return integration

    @staticmethod
    def _to_integration_read(integration) -> MerchantIntegrationRead:
        return MerchantIntegrationRead(
            id=integration.id,
            name=integration.name,
            integration_type=integration.integration_type,
            status=integration.status,
            product_sync_enabled=integration.product_sync_enabled,
            order_push_enabled=integration.order_push_enabled,
            api_base_url=integration.api_base_url,
            api_key=integration.api_key,
            has_api_secret=bool(integration.api_secret),
            config_json=integration.config_json,
        )

    @staticmethod
    def _build_value_lookup(product) -> dict[int, str]:
        value_lookup: dict[int, str] = {}
        for spec in product.specs:
            for value in spec.values:
                value_lookup[value.id] = f"{spec.name}: {value.value}"
        return value_lookup

    @staticmethod
    def _to_channel_product_read(product) -> MerchantChannelProductRead:
        return MerchantChannelProductRead(
            id=product.id,
            source_product_id=product.source_product_id,
            source_product_name=product.source_product.name if product.source_product else None,
            title=product.title,
            subtitle=product.subtitle,
            cover=product.cover,
            status=product.status,
            sort_no=product.sort_no,
            sku_count=len(product.skus),
        )

    def _to_channel_product_detail_read(self, product) -> MerchantChannelProductDetailRead:
        return MerchantChannelProductDetailRead(
            **self._to_channel_product_read(product).model_dump(),
            album_json=product.album_json,
            category_id=product.category_id,
            source_product_description=product.source_product.description if product.source_product else None,
            specs=[
                MerchantSpecRead(
                    id=spec.id,
                    name=spec.name,
                    sort_no=spec.sort_no,
                    values=[
                        MerchantSpecValueRead(id=value.id, value=value.value, sort_no=value.sort_no)
                        for value in spec.values
                    ],
                )
                for spec in product.specs
            ],
        )

    @staticmethod
    def _to_sku_read(sku, value_lookup: dict[int, str]) -> MerchantSkuRead:
        return MerchantSkuRead(
            id=sku.id,
            product_id=sku.product_id,
            sku_code=sku.sku_code,
            spec_text=" / ".join(value_lookup.get(value_id, str(value_id)) for value_id in sku.spec_value_ids_json),
            spec_value_ids_json=sku.spec_value_ids_json,
            price=sku.price,
            market_price=sku.market_price,
            stock=sku.stock,
            status=sku.status,
        )

    @staticmethod
    def _next_id() -> int:
        return time.time_ns()
