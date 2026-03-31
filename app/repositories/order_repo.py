from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import ChannelOrder, ChannelOrderItem, OrderPushTask
from app.models.integration import OrderPushLog
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def add_order(self, order: ChannelOrder) -> ChannelOrder:
        self.session.add(order)
        return order

    def add_order_item(self, order_item: ChannelOrderItem) -> ChannelOrderItem:
        self.session.add(order_item)
        return order_item

    def add_push_task(self, push_task: OrderPushTask) -> OrderPushTask:
        self.session.add(push_task)
        return push_task

    def add_push_log(self, push_log: OrderPushLog) -> OrderPushLog:
        self.session.add(push_log)
        return push_log

    def list_customer_orders(self, tenant_id: int | None, shop_id: int | None, customer_id: int) -> list[ChannelOrder]:
        stmt: Select[tuple[ChannelOrder]] = (
            select(ChannelOrder)
            .options(selectinload(ChannelOrder.items))
            .where(
                ChannelOrder.tenant_id == tenant_id,
                ChannelOrder.shop_id == shop_id,
                ChannelOrder.customer_id == customer_id,
            )
            .order_by(ChannelOrder.id.desc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def list_merchant_orders(self, tenant_id: int | None, shop_id: int | None) -> list[ChannelOrder]:
        stmt: Select[tuple[ChannelOrder]] = (
            select(ChannelOrder)
            .options(selectinload(ChannelOrder.items))
            .where(ChannelOrder.tenant_id == tenant_id, ChannelOrder.shop_id == shop_id)
            .order_by(ChannelOrder.id.desc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_push_task(self, tenant_id: int | None, shop_id: int | None, order_id: int) -> OrderPushTask | None:
        stmt = select(OrderPushTask).where(
            OrderPushTask.tenant_id == tenant_id,
            OrderPushTask.shop_id == shop_id,
            OrderPushTask.order_id == order_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_push_task_by_id(self, task_id: int) -> OrderPushTask | None:
        stmt = select(OrderPushTask).where(OrderPushTask.id == task_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def list_pending_push_tasks(self) -> list[OrderPushTask]:
        stmt = (
            select(OrderPushTask)
            .where(OrderPushTask.status.in_(["pending", "retrying"]))
            .order_by(OrderPushTask.id.asc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def list_push_logs(self, tenant_id: int | None, shop_id: int | None) -> list[OrderPushLog]:
        stmt = (
            select(OrderPushLog)
            .where(OrderPushLog.tenant_id == tenant_id, OrderPushLog.shop_id == shop_id)
            .order_by(OrderPushLog.created_at.desc(), OrderPushLog.id.desc())
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_order_with_items(self, order_id: int, tenant_id: int | None, shop_id: int | None) -> ChannelOrder | None:
        stmt: Select[tuple[ChannelOrder]] = (
            select(ChannelOrder)
            .options(selectinload(ChannelOrder.items))
            .where(
                ChannelOrder.id == order_id,
                ChannelOrder.tenant_id == tenant_id,
                ChannelOrder.shop_id == shop_id,
            )
        )
        return self.session.execute(stmt).scalar_one_or_none()
