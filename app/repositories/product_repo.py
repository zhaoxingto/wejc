from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.product import ChannelProduct, ProductSku, ProductSpec, SourceProduct
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_store_products(self, tenant_id: int | None, shop_id: int | None) -> list[ChannelProduct]:
        stmt = (
            select(ChannelProduct)
            .where(
                ChannelProduct.tenant_id == tenant_id,
                ChannelProduct.shop_id == shop_id,
                ChannelProduct.status == "active",
            )
            .order_by(ChannelProduct.sort_no.asc(), ChannelProduct.id.asc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_store_product(
        self,
        tenant_id: int | None,
        shop_id: int | None,
        product_id: int,
    ) -> ChannelProduct | None:
        stmt: Select[tuple[ChannelProduct]] = (
            select(ChannelProduct)
            .options(
                selectinload(ChannelProduct.specs).selectinload(ProductSpec.values),
                selectinload(ChannelProduct.skus),
            )
            .where(
                ChannelProduct.tenant_id == tenant_id,
                ChannelProduct.shop_id == shop_id,
                ChannelProduct.id == product_id,
                ChannelProduct.status == "active",
            )
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_sku(self, tenant_id: int | None, shop_id: int | None, product_id: int, sku_id: int) -> ProductSku | None:
        stmt = select(ProductSku).where(
            ProductSku.id == sku_id,
            ProductSku.tenant_id == tenant_id,
            ProductSku.shop_id == shop_id,
            ProductSku.product_id == product_id,
            ProductSku.status == "active",
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_source_product(
        self,
        tenant_id: int | None,
        integration_id: int | None,
        source_product_id: str,
    ) -> SourceProduct | None:
        stmt = select(SourceProduct).where(
            SourceProduct.tenant_id == tenant_id,
            SourceProduct.integration_id == integration_id,
            SourceProduct.source_product_id == source_product_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def add_source_product(self, product: SourceProduct) -> None:
        self.session.add(product)

    def list_source_products(self, tenant_id: int | None, integration_id: int | None) -> list[SourceProduct]:
        stmt = (
            select(SourceProduct)
            .where(
                SourceProduct.tenant_id == tenant_id,
                SourceProduct.integration_id == integration_id,
            )
            .order_by(SourceProduct.id.asc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_source_product_by_id(self, source_product_id: int) -> SourceProduct | None:
        stmt = select(SourceProduct).where(SourceProduct.id == source_product_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_channel_product_by_id(self, product_id: int) -> ChannelProduct | None:
        stmt = select(ChannelProduct).where(ChannelProduct.id == product_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_channel_product_by_source_and_shop(self, source_product_id: int, shop_id: int) -> ChannelProduct | None:
        stmt = select(ChannelProduct).where(
            ChannelProduct.source_product_id == source_product_id,
            ChannelProduct.shop_id == shop_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def add_channel_product(self, product: ChannelProduct) -> None:
        self.session.add(product)

    def list_channel_products(self, tenant_id: int | None, shop_id: int | None) -> list[ChannelProduct]:
        stmt: Select[tuple[ChannelProduct]] = (
            select(ChannelProduct)
            .options(
                selectinload(ChannelProduct.source_product),
                selectinload(ChannelProduct.skus),
            )
            .where(
                ChannelProduct.tenant_id == tenant_id,
                ChannelProduct.shop_id == shop_id,
            )
            .order_by(ChannelProduct.sort_no.asc(), ChannelProduct.id.asc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_channel_product_for_store(
        self,
        tenant_id: int | None,
        shop_id: int | None,
        product_id: int,
    ) -> ChannelProduct | None:
        stmt: Select[tuple[ChannelProduct]] = (
            select(ChannelProduct)
            .options(
                selectinload(ChannelProduct.source_product),
                selectinload(ChannelProduct.skus),
                selectinload(ChannelProduct.specs).selectinload(ProductSpec.values),
            )
            .where(
                ChannelProduct.tenant_id == tenant_id,
                ChannelProduct.shop_id == shop_id,
                ChannelProduct.id == product_id,
            )
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def list_product_skus(self, tenant_id: int | None, shop_id: int | None, product_id: int) -> list[ProductSku]:
        stmt = (
            select(ProductSku)
            .where(
                ProductSku.tenant_id == tenant_id,
                ProductSku.shop_id == shop_id,
                ProductSku.product_id == product_id,
            )
            .order_by(ProductSku.id.asc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_sku_by_id(self, tenant_id: int | None, shop_id: int | None, sku_id: int) -> ProductSku | None:
        stmt = select(ProductSku).where(
            ProductSku.tenant_id == tenant_id,
            ProductSku.shop_id == shop_id,
            ProductSku.id == sku_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def add_sku(self, sku: ProductSku) -> None:
        self.session.add(sku)

    def delete_sku(self, sku: ProductSku) -> None:
        self.session.delete(sku)
