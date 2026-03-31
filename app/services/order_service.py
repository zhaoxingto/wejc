from datetime import datetime, timezone
import time
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.context import RequestContext
from app.core.exceptions import CustomerNotFound, InsufficientStock, ProductNotFound, SkuNotFound
from app.models.customer import ChannelOrder, ChannelOrderItem, OrderPushTask
from app.models.product import ProductSku
from app.repositories.integration_repo import IntegrationRepository
from app.repositories.customer_repo import CustomerRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.order import CreateOrderRequest, OrderItemRead, OrderRead


class OrderService:
    def __init__(
        self,
        session: Session,
        customer_repository: CustomerRepository,
        product_repository: ProductRepository,
        order_repository: OrderRepository,
        integration_repository: IntegrationRepository,
    ) -> None:
        self.session = session
        self.customer_repository = customer_repository
        self.product_repository = product_repository
        self.order_repository = order_repository
        self.integration_repository = integration_repository

    def create_order(self, context: RequestContext, payload: CreateOrderRequest) -> OrderRead:
        customer = self.customer_repository.get_by_id(payload.customer_id, context.tenant_id, context.shop_id)
        if customer is None:
            raise CustomerNotFound()

        total_amount = Decimal("0.00")
        order = ChannelOrder(
            id=self._next_id(),
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            customer_id=payload.customer_id,
            order_no=self._generate_order_no(),
            status="created",
            push_status="pending",
            total_amount=Decimal("0.00"),
            remark=payload.remark,
            address_json=payload.address_json,
        )
        self.order_repository.add_order(order)

        for item in payload.items:
            product = self.product_repository.get_store_product(context.tenant_id, context.shop_id, item.product_id)
            if product is None:
                raise ProductNotFound()

            sku = self.product_repository.get_sku(context.tenant_id, context.shop_id, item.product_id, item.sku_id)
            if sku is None:
                raise SkuNotFound()
            self._ensure_stock(sku, item.qty)

            amount = Decimal(str(sku.price)) * item.qty
            total_amount += amount
            sku.stock -= item.qty

            order_item = ChannelOrderItem(
                id=self._next_id(),
                tenant_id=context.tenant_id,
                shop_id=context.shop_id,
                order_id=order.id,
                product_id=product.id,
                sku_id=sku.id,
                product_title=product.title,
                sku_text=self._build_sku_text(sku),
                price=sku.price,
                qty=item.qty,
                amount=amount,
            )
            self.order_repository.add_order_item(order_item)

        order.total_amount = total_amount
        integration = self.integration_repository.get_active_order_push_integration(context.tenant_id)
        push_task = OrderPushTask(
            id=self._next_id(),
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            order_id=order.id,
            integration_id=integration.id if integration else None,
            push_type="order_create",
            status="pending",
            retry_count=0,
            next_retry_at=None,
            last_error=None,
            request_json={"order_no": order.order_no},
            response_json=None,
        )
        self.order_repository.add_push_task(push_task)

        self.session.commit()
        self.session.refresh(order)
        return self._to_order_read(order)

    def list_customer_orders(self, context: RequestContext, customer_id: int) -> list[OrderRead]:
        customer = self.customer_repository.get_by_id(customer_id, context.tenant_id, context.shop_id)
        if customer is None:
            raise CustomerNotFound()
        orders = self.order_repository.list_customer_orders(context.tenant_id, context.shop_id, customer_id)
        return [self._to_order_read(order) for order in orders]

    def list_merchant_orders(self, context: RequestContext) -> list[OrderRead]:
        orders = self.order_repository.list_merchant_orders(context.tenant_id, context.shop_id)
        return [self._to_order_read(order) for order in orders]

    @staticmethod
    def _ensure_stock(sku: ProductSku, qty: int) -> None:
        if sku.stock < qty:
            raise InsufficientStock()

    @staticmethod
    def _build_sku_text(sku: ProductSku) -> str:
        return ",".join(str(value_id) for value_id in sku.spec_value_ids_json)

    @staticmethod
    def _to_order_read(order: ChannelOrder) -> OrderRead:
        return OrderRead(
            id=order.id,
            customer_id=order.customer_id,
            order_no=order.order_no,
            status=order.status,
            push_status=order.push_status,
            total_amount=order.total_amount,
            remark=order.remark,
            address_json=order.address_json,
            created_at=order.created_at,
            items=[
                OrderItemRead(
                    id=item.id,
                    product_id=item.product_id,
                    sku_id=item.sku_id,
                    product_title=item.product_title,
                    sku_text=item.sku_text,
                    price=item.price,
                    qty=item.qty,
                    amount=item.amount,
                    created_at=item.created_at,
                )
                for item in order.items
            ],
        )

    @staticmethod
    def _generate_order_no() -> str:
        return f"ORD{int(time.time() * 1000)}"

    @staticmethod
    def _next_id() -> int:
        return time.time_ns()
