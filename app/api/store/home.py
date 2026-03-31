from fastapi import APIRouter, Depends

from app.api.deps import get_store_request_context, get_storefront_service
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.store import StoreHomeResponse
from app.services.storefront_service import StorefrontService

router = APIRouter()


@router.get("/home", response_model=ResponseEnvelope[StoreHomeResponse])
async def get_store_home(
    context: RequestContext = Depends(get_store_request_context),
    service: StorefrontService = Depends(get_storefront_service),
) -> ResponseEnvelope[StoreHomeResponse]:
    return ResponseEnvelope.success(service.get_home(context))
