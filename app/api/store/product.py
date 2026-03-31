from fastapi import APIRouter, Depends

from app.api.deps import get_product_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.product import StoreProductDetail, StoreProductListItem
from app.services.product_service import ProductService

router = APIRouter()


@router.get("/products", response_model=ResponseEnvelope[list[StoreProductListItem]])
async def list_store_products(
    context: RequestContext = Depends(get_store_request_context),
    service: ProductService = Depends(get_product_service),
) -> ResponseEnvelope[list[StoreProductListItem]]:
    return ResponseEnvelope.success(service.list_store_products(context))


@router.get("/products/{product_id}", response_model=ResponseEnvelope[StoreProductDetail])
async def get_store_product(
    product_id: int,
    context: RequestContext = Depends(get_store_request_context),
    service: ProductService = Depends(get_product_service),
) -> ResponseEnvelope[StoreProductDetail]:
    return ResponseEnvelope.success(service.get_store_product(context, product_id))
