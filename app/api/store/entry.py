from fastapi import APIRouter, Depends

from app.api.deps import get_store_entry_service
from app.schemas.common import ResponseEnvelope
from app.schemas.shop import StoreResolveRequest, StoreResolveResponse
from app.services.store_entry_service import StoreEntryService

router = APIRouter()


@router.post("/resolve", response_model=ResponseEnvelope[StoreResolveResponse])
async def resolve_store(
    payload: StoreResolveRequest,
    service: StoreEntryService = Depends(get_store_entry_service),
) -> ResponseEnvelope[StoreResolveResponse]:
    data = service.resolve(payload.code)
    return ResponseEnvelope.success(data)
