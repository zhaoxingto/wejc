from sqlalchemy import JSON, BigInteger, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.tenant import Tenant


class Shop(BaseModelMixin):
    __tablename__ = "shop"
    __table_args__ = (
        Index("ix_shop_tenant_id_shop_code", "tenant_id", "shop_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)
    shop_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    cover: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    intro: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    theme_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    default_integration_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    tenant: Mapped[Tenant] = relationship()
