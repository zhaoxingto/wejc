from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_platform_admin, get_platform_admin_claims, get_platform_service
from app.models.platform_admin import PlatformAdmin
from app.schemas.common import ResponseEnvelope
from app.schemas.platform import (
    PlatformAlertHandleRequest,
    PlatformAlertSummaryRead,
    PlatformAlertRead,
    PlatformAuditLogRead,
    PlatformDashboardRead,
    PlatformChannelProductRead,
    PlatformIntegrationHealthRead,
    PlatformIntegrationRead,
    PlatformPage,
    PlatformOrderRead,
    PlatformPushLogRead,
    PlatformPushTaskRead,
    PlatformPublishSourceProductRequest,
    PlatformShopRead,
    PlatformSourceProductRead,
    PlatformTenantRead,
    PlatformIntegrationWrite,
    PlatformShopWrite,
    PlatformTenantWrite,
)
from app.services.platform_service import PlatformService

router = APIRouter(dependencies=[Depends(get_platform_admin_claims)])


@router.get("/dashboard", response_model=ResponseEnvelope[PlatformDashboardRead])
async def get_dashboard(
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformDashboardRead]:
    return ResponseEnvelope.success(service.get_dashboard())


@router.get("/tenants", response_model=ResponseEnvelope[PlatformPage])
async def list_tenants(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_tenants_page(q, page, page_size))


@router.get("/shops", response_model=ResponseEnvelope[PlatformPage])
async def list_shops(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_shops_page(q, page, page_size))


@router.get("/integrations", response_model=ResponseEnvelope[PlatformPage])
async def list_integrations(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_integrations_page(q, page, page_size))


@router.get("/integration-health", response_model=ResponseEnvelope[PlatformPage])
async def list_integration_health(
    q: str | None = Query(default=None),
    tenant_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    connectivity_status: str | None = Query(default=None),
    health_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(
        service.list_integration_health_page(q, page, page_size, tenant_id, status, connectivity_status, health_status)
    )


@router.get("/source-products", response_model=ResponseEnvelope[PlatformPage])
async def list_source_products(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_source_products_page(q, page, page_size))


@router.get("/channel-products", response_model=ResponseEnvelope[PlatformPage])
async def list_channel_products(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_channel_products_page(q, page, page_size))


@router.get("/orders", response_model=ResponseEnvelope[PlatformPage])
async def list_orders(
    q: str | None = Query(default=None),
    tenant_id: int | None = Query(default=None),
    shop_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    push_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_orders_page(q, page, page_size, tenant_id, shop_id, status, push_status))


@router.get("/push-tasks", response_model=ResponseEnvelope[PlatformPage])
async def list_push_tasks(
    q: str | None = Query(default=None),
    tenant_id: int | None = Query(default=None),
    shop_id: int | None = Query(default=None),
    integration_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(
        service.list_push_tasks_page(q, page, page_size, tenant_id, shop_id, integration_id, status)
    )


@router.get("/push-logs", response_model=ResponseEnvelope[PlatformPage])
async def list_push_logs(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_push_logs_page(q, page, page_size))


@router.get("/audit-logs", response_model=ResponseEnvelope[PlatformPage])
async def list_audit_logs(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_audit_logs_page(q, page, page_size))


@router.get("/alerts", response_model=ResponseEnvelope[PlatformPage])
async def list_alerts(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    handling_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPage]:
    return ResponseEnvelope.success(service.list_alerts_page(q, page, page_size, category, severity, handling_status))


@router.get("/alerts/summary", response_model=ResponseEnvelope[PlatformAlertSummaryRead])
async def get_alert_summary(
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformAlertSummaryRead]:
    return ResponseEnvelope.success(service.get_alert_summary())


@router.post("/alerts/{resource_type}/{resource_id}/handle", response_model=ResponseEnvelope[PlatformAlertRead])
async def handle_alert(
    resource_type: str,
    resource_id: str,
    payload: PlatformAlertHandleRequest,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformAlertRead]:
    return ResponseEnvelope.success(service.handle_alert(current_admin, resource_type, resource_id, payload))


@router.post("/tenants", response_model=ResponseEnvelope[PlatformTenantRead])
async def create_tenant(
    payload: PlatformTenantWrite,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformTenantRead]:
    return ResponseEnvelope.success(service.create_tenant(current_admin, payload))


@router.put("/tenants/{tenant_id}", response_model=ResponseEnvelope[PlatformTenantRead])
async def update_tenant(
    tenant_id: int,
    payload: PlatformTenantWrite,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformTenantRead]:
    return ResponseEnvelope.success(service.update_tenant(current_admin, tenant_id, payload))


@router.post("/shops", response_model=ResponseEnvelope[PlatformShopRead])
async def create_shop(
    payload: PlatformShopWrite,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformShopRead]:
    return ResponseEnvelope.success(service.create_shop(current_admin, payload))


@router.put("/shops/{shop_id}", response_model=ResponseEnvelope[PlatformShopRead])
async def update_shop(
    shop_id: int,
    payload: PlatformShopWrite,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformShopRead]:
    return ResponseEnvelope.success(service.update_shop(current_admin, shop_id, payload))


@router.post("/integrations", response_model=ResponseEnvelope[PlatformIntegrationRead])
async def create_integration(
    payload: PlatformIntegrationWrite,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformIntegrationRead]:
    return ResponseEnvelope.success(service.create_integration(current_admin, payload))


@router.put("/integrations/{integration_id}", response_model=ResponseEnvelope[PlatformIntegrationRead])
async def update_integration(
    integration_id: int,
    payload: PlatformIntegrationWrite,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformIntegrationRead]:
    return ResponseEnvelope.success(service.update_integration(current_admin, integration_id, payload))


@router.post("/source-products/{source_product_id}/publish", response_model=ResponseEnvelope[PlatformChannelProductRead])
async def publish_source_product(
    source_product_id: int,
    payload: PlatformPublishSourceProductRequest,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformChannelProductRead]:
    return ResponseEnvelope.success(service.publish_source_product(current_admin, source_product_id, payload))


@router.post("/push-tasks/{task_id}/retry", response_model=ResponseEnvelope[PlatformPushTaskRead])
async def retry_push_task(
    task_id: int,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformService = Depends(get_platform_service),
) -> ResponseEnvelope[PlatformPushTaskRead]:
    return ResponseEnvelope.success(service.retry_push_task(current_admin, task_id))
