from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModelMixin


class PlatformAlertCase(BaseModelMixin):
    __tablename__ = "platform_alert_case"
    __table_args__ = (
        Index("ix_platform_alert_case_resource", "resource_type", "resource_id", unique=True),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    handled_by_admin_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("platform_admin.id", ondelete="SET NULL"),
        nullable=True,
    )
    handled_by_username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    handled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
