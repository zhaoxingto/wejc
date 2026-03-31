from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Cart
from app.repositories.base import BaseRepository


class CartRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_by_customer_sku(self, customer_id: int, sku_id: int) -> Cart | None:
        stmt = select(Cart).where(Cart.customer_id == customer_id, Cart.sku_id == sku_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def add(self, cart: Cart) -> Cart:
        self.session.add(cart)
        return cart
