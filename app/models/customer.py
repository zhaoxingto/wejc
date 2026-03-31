from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.product import ChannelProduct, ProductSku
from app.models.shop import Shop
from app.models.tenant import Tenant


class Customer(BaseModelMixin):
    __tablename__ = "customer"
    __table_args__ = (
        Index("ix_customer_tenant_shop_openid", "tenant_id", "shop_id", "openid"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    openid: Mapped[str | None] = mapped_column(String(128), nullable=True)
    unionid: Mapped[str | None] = mapped_column(String(128), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(128), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    mobile: Mapped[str | None] = mapped_column(String(32), nullable=True)

    tenant: Mapped[Tenant] = relationship()
    shop: Mapped[Shop] = relationship()


class Cart(BaseModelMixin):
    __tablename__ = "cart"
    __table_args__ = (
        Index("ix_cart_tenant_shop_customer", "tenant_id", "shop_id", "customer_id"),
        Index("ix_cart_customer_sku", "customer_id", "sku_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("channel_product.id"), nullable=False)
    sku_id: Mapped[int] = mapped_column(ForeignKey("product_sku.id"), nullable=False)
    qty: Mapped[int] = mapped_column(nullable=False, default=1)

    customer: Mapped[Customer] = relationship()
    product: Mapped[ChannelProduct] = relationship()
    sku: Mapped[ProductSku] = relationship()


class ChannelOrder(BaseModelMixin):
    __tablename__ = "channel_order"
    __table_args__ = (
        Index("ix_channel_order_tenant_shop_customer", "tenant_id", "shop_id", "customer_id"),
        Index("ix_channel_order_order_no", "order_no", unique=True),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"), nullable=False)
    order_no: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="created")
    push_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    remark: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    customer: Mapped[Customer] = relationship()
    items: Mapped[list["ChannelOrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class ChannelOrderItem(BaseModelMixin):
    __tablename__ = "channel_order_item"
    __table_args__ = (
        Index("ix_channel_order_item_order_id", "order_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    order_id: Mapped[int] = mapped_column(ForeignKey("channel_order.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("channel_product.id"), nullable=False)
    sku_id: Mapped[int] = mapped_column(ForeignKey("product_sku.id"), nullable=False)
    product_title: Mapped[str] = mapped_column(String(255), nullable=False)
    sku_text: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    qty: Mapped[int] = mapped_column(nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped[ChannelOrder] = relationship(back_populates="items")


class OrderPushTask(BaseModelMixin):
    __tablename__ = "order_push_task"
    __table_args__ = (
        Index("ix_order_push_task_status", "status"),
        Index("ix_order_push_task_tenant_shop_order", "tenant_id", "shop_id", "order_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shop.id"), index=True, nullable=False)
    order_id: Mapped[int] = mapped_column(ForeignKey("channel_order.id"), nullable=False)
    integration_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    push_type: Mapped[str] = mapped_column(String(32), nullable=False, default="order_create")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    retry_count: Mapped[int] = mapped_column(nullable=False, default=0)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    request_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
