from fastapi import APIRouter, Depends

from app.api.deps import get_cart_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.order import CartAddRequest, CartRead
from app.services.cart_service import CartService

router = APIRouter()


@router.post("/cart/add", response_model=ResponseEnvelope[CartRead])
async def add_cart_item(
    payload: CartAddRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: CartService = Depends(get_cart_service),
) -> ResponseEnvelope[CartRead]:
    return ResponseEnvelope.success(service.add_item(context, payload))
