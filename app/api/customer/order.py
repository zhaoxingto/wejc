from fastapi import APIRouter, Depends, Query

from app.api.deps import get_order_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.order import CreateOrderRequest, OrderRead
from app.services.order_service import OrderService

router = APIRouter()


@router.post("/orders", response_model=ResponseEnvelope[OrderRead])
async def create_order(
    payload: CreateOrderRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: OrderService = Depends(get_order_service),
) -> ResponseEnvelope[OrderRead]:
    return ResponseEnvelope.success(service.create_order(context, payload))


@router.get("/orders", response_model=ResponseEnvelope[list[OrderRead]])
async def list_customer_orders(
    customer_id: int = Query(...),
    context: RequestContext = Depends(get_store_request_context),
    service: OrderService = Depends(get_order_service),
) -> ResponseEnvelope[list[OrderRead]]:
    return ResponseEnvelope.success(service.list_customer_orders(context, customer_id))
