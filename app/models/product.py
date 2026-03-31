from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.shop import Shop
from app.models.tenant import Tenant


class SourceProduct(BaseModelMixin):
    __tablename__ = "source_product"
    __table_args__ = (
        Index("ix_source_product_tenant_integration_source", "tenant_id", "integration_id", "source_product_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    integration_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source_product_id: Mapped[str] = mapped_column(String(128), nullable=False)
    sku_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="single")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_data_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    sync_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant: Mapped[Tenant] = relationship()
    channel_products: Mapped[list["ChannelProduct"]] = relationship(back_populates="source_product")


class ChannelProduct(BaseModelMixin):
    __tablename__ = "channel_product"
    __table_args__ = (
        Index("ix_channel_product_tenant_shop_status", "tenant_id", "shop_id", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    source_product_id: Mapped[int | None] = mapped_column(ForeignKey("source_product.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cover: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    album_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    category_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    sort_no: Mapped[int] = mapped_column(nullable=False, default=0)

    tenant: Mapped[Tenant] = relationship()
    shop: Mapped[Shop] = relationship()
    source_product: Mapped[SourceProduct | None] = relationship(back_populates="channel_products")
    specs: Mapped[list["ProductSpec"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductSpec.sort_no.asc()",
    )
    skus: Mapped[list["ProductSku"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductSku.id.asc()",
    )


class ProductSpec(BaseModelMixin):
    __tablename__ = "product_spec"
    __table_args__ = (
        Index("ix_product_spec_tenant_shop_product", "tenant_id", "shop_id", "product_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("channel_product.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    sort_no: Mapped[int] = mapped_column(nullable=False, default=0)

    product: Mapped[ChannelProduct] = relationship(back_populates="specs")
    values: Mapped[list["ProductSpecValue"]] = relationship(
        back_populates="spec",
        cascade="all, delete-orphan",
        order_by="ProductSpecValue.sort_no.asc()",
    )


class ProductSpecValue(BaseModelMixin):
    __tablename__ = "product_spec_value"
    __table_args__ = (
        Index("ix_product_spec_value_spec_id", "spec_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    spec_id: Mapped[int] = mapped_column(ForeignKey("product_spec.id"), nullable=False)
    value: Mapped[str] = mapped_column(String(64), nullable=False)
    sort_no: Mapped[int] = mapped_column(nullable=False, default=0)

    spec: Mapped[ProductSpec] = relationship(back_populates="values")


class ProductSku(BaseModelMixin):
    __tablename__ = "product_sku"
    __table_args__ = (
        Index("ix_product_sku_tenant_shop_product", "tenant_id", "shop_id", "product_id"),
        Index("ix_product_sku_sku_code", "sku_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("channel_product.id"), nullable=False)
    sku_code: Mapped[str] = mapped_column(String(128), nullable=False)
    spec_value_ids_json: Mapped[list[int]] = mapped_column(JSON, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    market_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    product: Mapped[ChannelProduct] = relationship(back_populates="skus")
