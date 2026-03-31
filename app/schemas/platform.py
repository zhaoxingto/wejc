from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.theme import StoreThemeColorsWrite


class PlatformTrendPoint(BaseModel):
    date: str
    value: int


class PlatformPushTrendPoint(BaseModel):
    date: str
    success_count: int
    failure_count: int


class PlatformRankItem(BaseModel):
    label: str
    value: int


class PlatformDashboardRead(BaseModel):
    tenant_count: int
    shop_count: int
    integration_count: int
    source_product_count: int
    order_count: int
    pending_push_task_count: int
    retrying_push_task_count: int
    push_success_log_count: int
    push_failure_log_count: int
    today_order_count: int
    today_push_success_count: int
    today_push_failure_count: int
    unresolved_alert_count: int
    daily_order_trend: list[PlatformTrendPoint]
    daily_push_trend: list[PlatformPushTrendPoint]
    top_alert_shops: list[PlatformRankItem]
    top_failing_integrations: list[PlatformRankItem]


class PlatformAlertSummaryRead(BaseModel):
    total: int
    critical_count: int
    warning_count: int
    push_task_issue_count: int
    push_log_failure_count: int
    product_sync_issue_count: int


class PlatformIntegrationHealthRead(BaseModel):
    integration_id: int
    tenant_id: int
    tenant_name: str
    integration_name: str
    integration_type: str
    status: str
    connectivity_status: str
    health_status: str
    last_product_sync_at: datetime | None
    last_push_at: datetime | None
    push_success_rate: float
    open_alert_count: int


class PlatformLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=255)


class PlatformLoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    admin_id: int
    username: str
    display_name: str


class PlatformChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=255)
    new_password: str = Field(min_length=8, max_length=255)


class PlatformListQuery(BaseModel):
    q: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PlatformPage(BaseModel):
    items: list
    total: int
    page: int
    page_size: int


class PlatformTenantRead(BaseModel):
    id: int
    tenant_code: str
    name: str
    status: str
    contact_name: str | None
    mobile: str | None
    created_at: datetime
    updated_at: datetime
    shop_count: int
    integration_count: int


class PlatformShopRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    shop_code: str
    name: str
    status: str
    default_integration_id: int | None
    default_integration_name: str | None
    theme_json: dict | None = None
    created_at: datetime
    updated_at: datetime


class PlatformIntegrationRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    name: str
    integration_type: str
    status: str
    product_sync_enabled: bool
    order_push_enabled: bool
    api_base_url: str | None
    updated_at: datetime


class PlatformSourceProductRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    integration_id: int | None
    integration_name: str | None
    source_product_id: str
    source_type: str
    sku_mode: str
    name: str
    sync_status: str
    last_sync_at: datetime | None
    updated_at: datetime


class PlatformChannelProductRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    shop_id: int
    shop_name: str
    source_product_id: int | None
    source_product_name: str | None
    title: str
    subtitle: str | None
    status: str
    sort_no: int
    updated_at: datetime


class PlatformOrderRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    shop_id: int
    shop_name: str
    customer_id: int
    order_no: str
    status: str
    push_status: str
    total_amount: Decimal
    item_count: int
    created_at: datetime


class PlatformPushTaskRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    shop_id: int
    shop_name: str
    order_id: int
    order_no: str
    integration_id: int | None
    integration_name: str | None
    status: str
    retry_count: int
    next_retry_at: datetime | None
    last_error: str | None
    updated_at: datetime


class PlatformPushLogRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    shop_id: int
    shop_name: str
    order_id: int
    order_no: str
    task_id: int
    success: bool
    pushed_at: datetime | None
    created_at: datetime


class PlatformAuditLogRead(BaseModel):
    id: int
    admin_id: int
    admin_username: str
    action: str
    resource_type: str
    resource_id: str
    summary: str
    detail_json: dict | None
    created_at: datetime


class PlatformAlertRead(BaseModel):
    id: str
    category: str
    severity: str
    tenant_name: str | None
    shop_name: str | None
    title: str
    detail: str
    resource_type: str
    resource_id: str
    happened_at: datetime | None
    handling_status: str = "open"
    handling_note: str | None = None
    handled_by_username: str | None = None
    handled_at: datetime | None = None


class PlatformAlertHandleRequest(BaseModel):
    status: str = Field(pattern="^(resolved|ignored)$")
    note: str | None = Field(default=None, max_length=255)


class PlatformPublishSourceProductRequest(BaseModel):
    shop_id: int
    title: str | None = Field(default=None, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    status: str = Field(default="draft", min_length=1, max_length=32)


class PlatformTenantWrite(BaseModel):
    tenant_code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    status: str = Field(min_length=1, max_length=32)
    contact_name: str | None = Field(default=None, max_length=64)
    mobile: str | None = Field(default=None, max_length=32)


class PlatformShopWrite(BaseModel):
    tenant_id: int
    shop_code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    status: str = Field(min_length=1, max_length=32)
    logo: str | None = Field(default=None, max_length=1024)
    cover: str | None = Field(default=None, max_length=1024)
    intro: str | None = Field(default=None, max_length=2000)
    default_integration_id: int | None = None
    theme_preset_key: str | None = Field(default=None, max_length=32)
    theme_colors: StoreThemeColorsWrite | None = None


class PlatformIntegrationWrite(BaseModel):
    tenant_id: int
    name: str = Field(min_length=1, max_length=255)
    integration_type: str = Field(min_length=1, max_length=32)
    status: str = Field(min_length=1, max_length=32)
    product_sync_enabled: bool = False
    order_push_enabled: bool = True
    api_base_url: str | None = Field(default=None, max_length=1024)
    api_key: str | None = Field(default=None, max_length=255)
    api_secret: str | None = Field(default=None, max_length=255)
    config_json: dict | None = None
