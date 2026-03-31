function getAuthToken() {
    return window.localStorage.getItem('platform_access_token') ?? '';
}
async function request(path, init, authenticated = true) {
    const headers = new Headers(init?.headers ?? {});
    if (init?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (authenticated) {
        const token = getAuthToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }
    const response = await fetch(path, { ...init, headers });
    const payload = (await response.json());
    if (!response.ok || payload.code !== 0 || payload.data === null) {
        throw new Error(payload.message || 'Request failed');
    }
    return payload.data;
}
function pageQuery(q, page, pageSize, filters) {
    const params = new URLSearchParams();
    if (q.trim()) {
        params.set('q', q.trim());
    }
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') {
                params.set(key, String(value));
            }
        });
    }
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    return params.toString();
}
export const adminApi = {
    login(username, password) {
        return request('/api/platform/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        }, false);
    },
    changePassword(payload) {
        return request('/api/platform/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    getPlatformDashboard() {
        return request('/api/platform/dashboard');
    },
    getPlatformTenants(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/tenants?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformShops(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/shops?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformIntegrations(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/integrations?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformIntegrationHealth(q = '', page = 1, pageSize = 20, filters) {
        return request(`/api/platform/integration-health?${pageQuery(q, page, pageSize, filters)}`);
    },
    getPlatformSourceProducts(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/source-products?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformChannelProducts(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/channel-products?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformOrders(q = '', page = 1, pageSize = 20, filters) {
        return request(`/api/platform/orders?${pageQuery(q, page, pageSize, filters)}`);
    },
    getPlatformPushTasks(q = '', page = 1, pageSize = 20, filters) {
        return request(`/api/platform/push-tasks?${pageQuery(q, page, pageSize, filters)}`);
    },
    getPlatformPushLogs(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/push-logs?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformAuditLogs(q = '', page = 1, pageSize = 20) {
        return request(`/api/platform/audit-logs?${pageQuery(q, page, pageSize)}`);
    },
    getPlatformAlerts(q = '', page = 1, pageSize = 20, filters) {
        return request(`/api/platform/alerts?${pageQuery(q, page, pageSize, filters)}`);
    },
    handlePlatformAlert(resourceType, resourceId, status, note) {
        return request(`/api/platform/alerts/${resourceType}/${resourceId}/handle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, note }),
        });
    },
    getPlatformAlertSummary() {
        return request('/api/platform/alerts/summary');
    },
    createTenant(payload) {
        return request('/api/platform/tenants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    updateTenant(id, payload) {
        return request(`/api/platform/tenants/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    createShop(payload) {
        return request('/api/platform/shops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    updateShop(id, payload) {
        return request(`/api/platform/shops/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    createIntegration(payload) {
        return request('/api/platform/integrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    updateIntegration(id, payload) {
        return request(`/api/platform/integrations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
    publishSourceProduct(sourceProductId, shopId, title, subtitle, status) {
        return request(`/api/platform/source-products/${sourceProductId}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop_id: shopId, title, subtitle, status }),
        });
    },
    retryPushTask(taskId) {
        return request(`/api/platform/push-tasks/${taskId}/retry`, { method: 'POST' });
    },
};
