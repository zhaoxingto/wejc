from fastapi import APIRouter, Depends

from app.api.deps import get_order_push_service
from app.schemas.common import ResponseEnvelope
from app.schemas.integration import PushTaskExecuteResponse
from app.services.order_push_service import OrderPushService
from app.tasks.order_push_task import run_order_push_tasks

router = APIRouter()


@router.post("/orders/push", response_model=ResponseEnvelope[PushTaskExecuteResponse])
async def execute_order_push_tasks(
    service: OrderPushService = Depends(get_order_push_service),
) -> ResponseEnvelope[PushTaskExecuteResponse]:
    processed = run_order_push_tasks(service)
    return ResponseEnvelope.success(PushTaskExecuteResponse(processed=processed))
