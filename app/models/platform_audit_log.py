from sqlalchemy import BigInteger, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModelMixin


class PlatformAuditLog(BaseModelMixin):
    __tablename__ = "platform_audit_log"
    __table_args__ = (
        Index("ix_platform_audit_log_admin_created", "admin_id", "created_at"),
        Index("ix_platform_audit_log_resource", "resource_type", "resource_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    admin_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("platform_admin.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    admin_username: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(64), nullable=False)
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    detail_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
