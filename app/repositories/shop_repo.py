from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.shop import Shop
from app.repositories.base import BaseRepository


class ShopRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_by_id(self, shop_id: int) -> Shop | None:
        stmt = select(Shop).where(Shop.id == shop_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_code(self, shop_code: str) -> Shop | None:
        stmt = select(Shop).where(Shop.shop_code == shop_code)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_context(self, tenant_id: int | None, shop_id: int | None, shop_code: str | None) -> Shop | None:
        stmt = select(Shop).where(
            Shop.tenant_id == tenant_id,
            Shop.id == shop_id,
            Shop.shop_code == shop_code,
        )
        return self.session.execute(stmt).scalar_one_or_none()
