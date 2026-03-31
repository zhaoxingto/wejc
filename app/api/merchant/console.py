from fastapi import APIRouter, Depends

from app.api.deps import get_merchant_console_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.merchant import (
    MerchantChannelProductDetailRead,
    MerchantChannelProductRead,
    MerchantChannelProductUpdateRequest,
    MerchantIntegrationRead,
    MerchantIntegrationTestRead,
    MerchantIntegrationUpdateRequest,
    MerchantSkuCreateRequest,
    MerchantSkuRead,
    MerchantSkuUpdateRequest,
)
from app.services.merchant_console_service import MerchantConsoleService

router = APIRouter()


@router.get("/channel-products", response_model=ResponseEnvelope[list[MerchantChannelProductRead]])
async def list_channel_products(
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[list[MerchantChannelProductRead]]:
    return ResponseEnvelope.success(service.list_channel_products(context))


@router.get("/channel-products/{product_id}", response_model=ResponseEnvelope[MerchantChannelProductDetailRead])
async def get_channel_product_detail(
    product_id: int,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantChannelProductDetailRead]:
    return ResponseEnvelope.success(service.get_channel_product_detail(context, product_id))


@router.put("/channel-products/{product_id}", response_model=ResponseEnvelope[MerchantChannelProductRead])
async def update_channel_product(
    product_id: int,
    payload: MerchantChannelProductUpdateRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantChannelProductRead]:
    return ResponseEnvelope.success(service.update_channel_product(context, product_id, payload))


@router.get("/channel-products/{product_id}/skus", response_model=ResponseEnvelope[list[MerchantSkuRead]])
async def list_product_skus(
    product_id: int,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[list[MerchantSkuRead]]:
    return ResponseEnvelope.success(service.list_product_skus(context, product_id))


@router.post("/channel-products/{product_id}/skus", response_model=ResponseEnvelope[MerchantSkuRead])
async def create_sku(
    product_id: int,
    payload: MerchantSkuCreateRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantSkuRead]:
    return ResponseEnvelope.success(service.create_sku(context, product_id, payload))


@router.put("/skus/{sku_id}", response_model=ResponseEnvelope[MerchantSkuRead])
async def update_sku(
    sku_id: int,
    payload: MerchantSkuUpdateRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantSkuRead]:
    return ResponseEnvelope.success(service.update_sku(context, sku_id, payload))


@router.delete("/skus/{sku_id}", response_model=ResponseEnvelope[None])
async def delete_sku(
    sku_id: int,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[None]:
    service.delete_sku(context, sku_id)
    return ResponseEnvelope.success()


@router.get("/integration-config", response_model=ResponseEnvelope[MerchantIntegrationRead])
async def get_integration_config(
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantIntegrationRead]:
    return ResponseEnvelope.success(service.get_integration_config(context))


@router.put("/integration-config", response_model=ResponseEnvelope[MerchantIntegrationRead])
async def update_integration_config(
    payload: MerchantIntegrationUpdateRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantIntegrationRead]:
    return ResponseEnvelope.success(service.update_integration_config(context, payload))


@router.post("/integration-config/test", response_model=ResponseEnvelope[MerchantIntegrationTestRead])
async def test_integration_config(
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantIntegrationTestRead]:
    return ResponseEnvelope.success(service.test_integration_config(context))
