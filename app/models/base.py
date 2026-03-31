from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class TimestampMixin:
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TenantShopMixin:
    tenant_id: Mapped[int] = mapped_column(index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(index=True, nullable=False)


class BaseModelMixin(Base, TimestampMixin):
    __abstract__ = True
