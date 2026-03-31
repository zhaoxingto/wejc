from fastapi import APIRouter, Depends

from app.api.deps import get_order_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.order import OrderRead
from app.services.order_service import OrderService

router = APIRouter()


@router.get("/orders", response_model=ResponseEnvelope[list[OrderRead]])
async def list_merchant_orders(
    context: RequestContext = Depends(get_store_request_context),
    service: OrderService = Depends(get_order_service),
) -> ResponseEnvelope[list[OrderRead]]:
    return ResponseEnvelope.success(service.list_merchant_orders(context))
