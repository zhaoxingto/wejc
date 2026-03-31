from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.customer import ChannelOrder, OrderPushTask
from app.models.tenant import Tenant


class Integration(BaseModelMixin):
    __tablename__ = "integration"
    __table_args__ = (
        Index("ix_integration_tenant_status", "tenant_id", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    integration_type: Mapped[str] = mapped_column(String(32), nullable=False, default="none")
    api_base_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    api_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    product_sync_enabled: Mapped[bool] = mapped_column(nullable=False, default=False)
    order_push_enabled: Mapped[bool] = mapped_column(nullable=False, default=True)
    config_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    tenant: Mapped[Tenant] = relationship()


class OrderPushLog(BaseModelMixin):
    __tablename__ = "order_push_log"
    __table_args__ = (
        Index("ix_order_push_log_task_id", "task_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    task_id: Mapped[int] = mapped_column(ForeignKey("order_push_task.id"), nullable=False)
    order_id: Mapped[int] = mapped_column(ForeignKey("channel_order.id"), nullable=False)
    request_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    success: Mapped[bool] = mapped_column(nullable=False, default=False)
    pushed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped[ChannelOrder] = relationship()
    task: Mapped[OrderPushTask] = relationship()
