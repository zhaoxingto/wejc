import type {
  PlatformAlert,
  PlatformAlertSummary,
  PlatformAuditLog,
  PlatformChannelProductRead,
  PlatformChangePasswordRequest,
  PlatformDashboard,
  PlatformIntegrationHealth,
  PlatformIntegration,
  PlatformIntegrationWrite,
  PlatformLoginResponse,
  PlatformOrder,
  PlatformPageResult,
  PlatformPushLog,
  PlatformPushTask,
  PlatformShop,
  PlatformShopWrite,
  PlatformSourceProduct,
  PlatformTenant,
  PlatformTenantWrite,
  ResponseEnvelope,
} from './types'

function getAuthToken() {
  return window.localStorage.getItem('platform_access_token') ?? ''
}

async function request<T>(path: string, init?: RequestInit, authenticated = true): Promise<T> {
  const headers = new Headers(init?.headers ?? {})
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (authenticated) {
    const token = getAuthToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(path, { ...init, headers })
  const payload = (await response.json()) as ResponseEnvelope<T>
  if (!response.ok || payload.code !== 0 || payload.data === null) {
    throw new Error(payload.message || 'Request failed')
  }
  return payload.data
}

function pageQuery(q: string, page: number, pageSize: number, filters?: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams()
  if (q.trim()) {
    params.set('q', q.trim())
  }
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params.set(key, String(value))
      }
    })
  }
  params.set('page', String(page))
  params.set('page_size', String(pageSize))
  return params.toString()
}

export const adminApi = {
  login(username: string, password: string) {
    return request<PlatformLoginResponse>(
      '/api/platform/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      },
      false,
    )
  },
  changePassword(payload: PlatformChangePasswordRequest) {
    return request<boolean>('/api/platform/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  getPlatformDashboard() {
    return request<PlatformDashboard>('/api/platform/dashboard')
  },
  getPlatformTenants(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformTenant>>(`/api/platform/tenants?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformShops(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformShop>>(`/api/platform/shops?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformIntegrations(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformIntegration>>(`/api/platform/integrations?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformIntegrationHealth(
    q = '',
    page = 1,
    pageSize = 20,
    filters?: { tenant_id?: number | string | null; status?: string | null; connectivity_status?: string | null; health_status?: string | null },
  ) {
    return request<PlatformPageResult<PlatformIntegrationHealth>>(`/api/platform/integration-health?${pageQuery(q, page, pageSize, filters)}`)
  },
  getPlatformSourceProducts(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformSourceProduct>>(`/api/platform/source-products?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformChannelProducts(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformChannelProductRead>>(`/api/platform/channel-products?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformOrders(
    q = '',
    page = 1,
    pageSize = 20,
    filters?: { tenant_id?: number | string | null; shop_id?: number | string | null; status?: string | null; push_status?: string | null },
  ) {
    return request<PlatformPageResult<PlatformOrder>>(`/api/platform/orders?${pageQuery(q, page, pageSize, filters)}`)
  },
  getPlatformPushTasks(
    q = '',
    page = 1,
    pageSize = 20,
    filters?: { tenant_id?: number | string | null; shop_id?: number | string | null; integration_id?: number | string | null; status?: string | null },
  ) {
    return request<PlatformPageResult<PlatformPushTask>>(`/api/platform/push-tasks?${pageQuery(q, page, pageSize, filters)}`)
  },
  getPlatformPushLogs(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformPushLog>>(`/api/platform/push-logs?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformAuditLogs(q = '', page = 1, pageSize = 20) {
    return request<PlatformPageResult<PlatformAuditLog>>(`/api/platform/audit-logs?${pageQuery(q, page, pageSize)}`)
  },
  getPlatformAlerts(
    q = '',
    page = 1,
    pageSize = 20,
    filters?: { category?: string | null; severity?: string | null; handling_status?: string | null },
  ) {
    return request<PlatformPageResult<PlatformAlert>>(`/api/platform/alerts?${pageQuery(q, page, pageSize, filters)}`)
  },
  handlePlatformAlert(resourceType: string, resourceId: string, status: string, note: string | null) {
    return request<PlatformAlert>(`/api/platform/alerts/${resourceType}/${resourceId}/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    })
  },
  getPlatformAlertSummary() {
    return request<PlatformAlertSummary>('/api/platform/alerts/summary')
  },
  createTenant(payload: PlatformTenantWrite) {
    return request<PlatformTenant>('/api/platform/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  updateTenant(id: number, payload: PlatformTenantWrite) {
    return request<PlatformTenant>(`/api/platform/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  createShop(payload: PlatformShopWrite) {
    return request<PlatformShop>('/api/platform/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  updateShop(id: number, payload: PlatformShopWrite) {
    return request<PlatformShop>(`/api/platform/shops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  createIntegration(payload: PlatformIntegrationWrite) {
    return request<PlatformIntegration>('/api/platform/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  updateIntegration(id: number, payload: PlatformIntegrationWrite) {
    return request<PlatformIntegration>(`/api/platform/integrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  publishSourceProduct(sourceProductId: number, shopId: number, title: string | null, subtitle: string | null, status: string) {
    return request<PlatformChannelProductRead>(`/api/platform/source-products/${sourceProductId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId, title, subtitle, status }),
    })
  },
  retryPushTask(taskId: number) {
    return request<PlatformPushTask>(`/api/platform/push-tasks/${taskId}/retry`, { method: 'POST' })
  },
}
