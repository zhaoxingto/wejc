export interface ResponseEnvelope<T> {
  code: number
  message: string
  data: T | null
}

export interface PlatformDashboard {
  tenant_count: number
  shop_count: number
  integration_count: number
  source_product_count: number
  order_count: number
  pending_push_task_count: number
  retrying_push_task_count: number
  push_success_log_count: number
  push_failure_log_count: number
  today_order_count: number
  today_push_success_count: number
  today_push_failure_count: number
  unresolved_alert_count: number
  daily_order_trend: PlatformTrendPoint[]
  daily_push_trend: PlatformPushTrendPoint[]
  top_alert_shops: PlatformRankItem[]
  top_failing_integrations: PlatformRankItem[]
}

export interface PlatformTrendPoint {
  date: string
  value: number
}

export interface PlatformPushTrendPoint {
  date: string
  success_count: number
  failure_count: number
}

export interface PlatformRankItem {
  label: string
  value: number
}

export interface PlatformAlertSummary {
  total: number
  critical_count: number
  warning_count: number
  push_task_issue_count: number
  push_log_failure_count: number
  product_sync_issue_count: number
}

export interface PlatformIntegrationHealth {
  integration_id: number
  tenant_id: number
  tenant_name: string
  integration_name: string
  integration_type: string
  status: string
  connectivity_status: string
  health_status: string
  last_product_sync_at: string | null
  last_push_at: string | null
  push_success_rate: number
  open_alert_count: number
}

export interface PlatformLoginResponse {
  access_token: string
  token_type: string
  admin_id: number
  username: string
  display_name: string
}

export interface PlatformChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface PlatformPageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface PlatformTenant {
  id: number
  tenant_code: string
  name: string
  status: string
  contact_name: string | null
  mobile: string | null
  created_at: string
  updated_at: string
  shop_count: number
  integration_count: number
}

export interface PlatformShop {
  id: number
  tenant_id: number
  tenant_name: string
  shop_code: string
  name: string
  status: string
  default_integration_id: number | null
  default_integration_name: string | null
  created_at: string
  updated_at: string
}

export interface PlatformIntegration {
  id: number
  tenant_id: number
  tenant_name: string
  name: string
  integration_type: string
  status: string
  product_sync_enabled: boolean
  order_push_enabled: boolean
  api_base_url: string | null
  updated_at: string
}

export interface PlatformSourceProduct {
  id: number
  tenant_id: number
  tenant_name: string
  integration_id: number | null
  integration_name: string | null
  source_product_id: string
  source_type: string
  sku_mode: string
  name: string
  sync_status: string
  last_sync_at: string | null
  updated_at: string
}

export interface PlatformChannelProductRead {
  id: number
  tenant_id: number
  tenant_name: string
  shop_id: number
  shop_name: string
  source_product_id: number | null
  source_product_name: string | null
  title: string
  subtitle: string | null
  status: string
  sort_no: number
  updated_at: string
}

export interface PlatformOrder {
  id: number
  tenant_id: number
  tenant_name: string
  shop_id: number
  shop_name: string
  customer_id: number
  order_no: string
  status: string
  push_status: string
  total_amount: string
  item_count: number
  created_at: string
}

export interface PlatformPushTask {
  id: number
  tenant_id: number
  tenant_name: string
  shop_id: number
  shop_name: string
  order_id: number
  order_no: string
  integration_id: number | null
  integration_name: string | null
  status: string
  retry_count: number
  next_retry_at: string | null
  last_error: string | null
  updated_at: string
}

export interface PlatformPushLog {
  id: number
  tenant_id: number
  tenant_name: string
  shop_id: number
  shop_name: string
  order_id: number
  order_no: string
  task_id: number
  success: boolean
  pushed_at: string | null
  created_at: string
}

export interface PlatformAuditLog {
  id: number
  admin_id: number
  admin_username: string
  action: string
  resource_type: string
  resource_id: string
  summary: string
  detail_json: Record<string, unknown> | null
  created_at: string
}

export interface PlatformAlert {
  id: string
  category: string
  severity: string
  tenant_name: string | null
  shop_name: string | null
  title: string
  detail: string
  resource_type: string
  resource_id: string
  happened_at: string | null
  handling_status: string
  handling_note: string | null
  handled_by_username: string | null
  handled_at: string | null
}

export interface PlatformTenantWrite {
  tenant_code: string
  name: string
  status: string
  contact_name: string | null
  mobile: string | null
}

export interface PlatformShopWrite {
  tenant_id: number
  shop_code: string
  name: string
  status: string
  logo: string | null
  cover: string | null
  intro: string | null
  default_integration_id: number | null
}

export interface PlatformIntegrationWrite {
  tenant_id: number
  name: string
  integration_type: string
  status: string
  product_sync_enabled: boolean
  order_push_enabled: boolean
  api_base_url: string | null
  api_key: string | null
  api_secret: string | null
  config_json: Record<string, unknown> | null
}
