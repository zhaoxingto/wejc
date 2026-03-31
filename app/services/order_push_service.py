import time
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.orm import Session

from app.core.exceptions import OrderPushTaskNotFound, ShopNotFound
from app.models.customer import ChannelOrder, OrderPushTask
from app.models.integration import OrderPushLog
from app.repositories.integration_repo import IntegrationRepository
from app.repositories.order_repo import OrderRepository
from app.schemas.merchant import MerchantPushLogRead
from app.services.integration_service import IntegrationService


class OrderPushService:
    def __init__(
        self,
        session: Session,
        order_repository: OrderRepository,
        integration_repository: IntegrationRepository,
        integration_service: IntegrationService,
    ) -> None:
        self.session = session
        self.order_repository = order_repository
        self.integration_repository = integration_repository
        self.integration_service = integration_service

    def execute_pending_tasks(self) -> int:
        tasks = self.order_repository.list_pending_push_tasks()
        processed = 0
        for task in tasks:
            self.execute_task(task)
            processed += 1
        return processed

    def repush_order(self, tenant_id: int | None, shop_id: int | None, order_id: int) -> None:
        task = self.order_repository.get_push_task(tenant_id, shop_id, order_id)
        if task is None:
            raise OrderPushTaskNotFound()
        task.status = "pending"
        task.next_retry_at = None
        self.session.commit()
        self.execute_task(task)

    def execute_task(self, task: OrderPushTask) -> None:
        order = self.order_repository.get_order_with_items(task.order_id, task.tenant_id, task.shop_id)
        if order is None:
            raise ShopNotFound()

        integration = (
            self.integration_repository.get_by_id(task.integration_id, task.tenant_id)
            if task.integration_id is not None
            else self.integration_repository.get_active_order_push_integration(task.tenant_id)
        )

        payload = self._build_payload(order)
        task.request_json = payload

        if integration is None:
            self._mark_success(task, payload, {"status": "skipped", "reason": "no active integration"})
            return

        try:
            response_payload = self.integration_service.push_order(integration, payload)
            task.integration_id = integration.id
            self._mark_success(task, payload, response_payload)
        except httpx.HTTPError as exc:
            self._mark_failure(task, payload, {"error": str(exc)})

    def list_push_logs(self, tenant_id: int | None, shop_id: int | None) -> list[MerchantPushLogRead]:
        logs = self.order_repository.list_push_logs(tenant_id, shop_id)
        return [MerchantPushLogRead.model_validate(item) for item in logs]

    def _mark_success(self, task: OrderPushTask, request_payload: dict, response_payload: dict) -> None:
        task.status = "success"
        task.response_json = response_payload
        task.last_error = None
        task.next_retry_at = None

        push_log = OrderPushLog(
            id=self._next_id(),
            tenant_id=task.tenant_id,
            shop_id=task.shop_id,
            task_id=task.id,
            order_id=task.order_id,
            request_json=request_payload,
            response_json=response_payload,
            success=True,
            pushed_at=datetime.now(timezone.utc),
        )
        self.order_repository.add_push_log(push_log)

        order = self.order_repository.get_order_with_items(task.order_id, task.tenant_id, task.shop_id)
        order.push_status = "success"
        self.session.commit()

    def _mark_failure(self, task: OrderPushTask, request_payload: dict, response_payload: dict) -> None:
        task.retry_count += 1
        task.status = "retrying"
        task.last_error = response_payload.get("error")
        task.response_json = response_payload
        task.next_retry_at = datetime.now(timezone.utc) + timedelta(minutes=min(task.retry_count * 5, 30))

        push_log = OrderPushLog(
            id=self._next_id(),
            tenant_id=task.tenant_id,
            shop_id=task.shop_id,
            task_id=task.id,
            order_id=task.order_id,
            request_json=request_payload,
            response_json=response_payload,
            success=False,
            pushed_at=datetime.now(timezone.utc),
        )
        self.order_repository.add_push_log(push_log)

        order = self.order_repository.get_order_with_items(task.order_id, task.tenant_id, task.shop_id)
        order.push_status = "retrying"
        self.session.commit()

    @staticmethod
    def _build_payload(order: ChannelOrder) -> dict:
        return {
            "order_no": order.order_no,
            "customer_id": order.customer_id,
            "total_amount": str(order.total_amount),
            "remark": order.remark,
            "address": order.address_json,
            "items": [
                {
                    "product_id": item.product_id,
                    "sku_id": item.sku_id,
                    "product_title": item.product_title,
                    "sku_text": item.sku_text,
                    "price": str(item.price),
                    "qty": item.qty,
                    "amount": str(item.amount),
                }
                for item in order.items
            ],
        }

    @staticmethod
    def _next_id() -> int:
        return time.time_ns()
