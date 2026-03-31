from fastapi import APIRouter, Depends

from app.api.deps import get_order_push_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.merchant import MerchantPushLogRead
from app.services.order_push_service import OrderPushService

router = APIRouter()


@router.post("/orders/{order_id}/repush", response_model=ResponseEnvelope[dict[str, str]])
async def repush_order(
    order_id: int,
    context: RequestContext = Depends(get_store_request_context),
    service: OrderPushService = Depends(get_order_push_service),
) -> ResponseEnvelope[dict[str, str]]:
    service.repush_order(context.tenant_id, context.shop_id, order_id)
    return ResponseEnvelope.success({"status": "queued"})


@router.get("/push-logs", response_model=ResponseEnvelope[list[MerchantPushLogRead]])
async def list_push_logs(
    context: RequestContext = Depends(get_store_request_context),
    service: OrderPushService = Depends(get_order_push_service),
) -> ResponseEnvelope[list[MerchantPushLogRead]]:
    return ResponseEnvelope.success(service.list_push_logs(context.tenant_id, context.shop_id))
