from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_by_id(self, customer_id: int, tenant_id: int | None, shop_id: int | None) -> Customer | None:
        stmt = select(Customer).where(
            Customer.id == customer_id,
            Customer.tenant_id == tenant_id,
            Customer.shop_id == shop_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()
