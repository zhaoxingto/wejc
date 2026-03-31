import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { adminApi } from '@/api';
function createPagedState() {
    return { items: [], total: 0, page: 1, pageSize: 10, q: '' };
}
export const useAdminStore = defineStore('platform-admin', () => {
    const authenticated = ref(Boolean(window.localStorage.getItem('platform_access_token')));
    const dashboard = ref(null);
    const alertSummary = ref(null);
    const isLoading = ref(false);
    const activity = ref([]);
    const tenants = reactive(createPagedState());
    const shops = reactive(createPagedState());
    const integrations = reactive(createPagedState());
    const integrationHealth = reactive(createPagedState());
    const sourceProducts = reactive(createPagedState());
    const channelProducts = reactive(createPagedState());
    const orders = reactive(createPagedState());
    const pushTasks = reactive(createPagedState());
    const pushLogs = reactive(createPagedState());
    const alerts = reactive(createPagedState());
    const auditLogs = reactive(createPagedState());
    const ordersFilters = reactive({ tenant_id: '', shop_id: '', status: '', push_status: '' });
    const pushTaskFilters = reactive({ tenant_id: '', shop_id: '', integration_id: '', status: '' });
    const alertFilters = reactive({ category: '', severity: '', handling_status: '' });
    const integrationHealthFilters = reactive({
        tenant_id: '',
        status: '',
        connectivity_status: '',
        health_status: '',
    });
    function appendActivity(message) {
        activity.value.unshift(`${new Date().toLocaleString()}  ${message}`);
    }
    function applyPage(target, response) {
        target.items = response.items;
        target.total = response.total;
        target.page = response.page;
        target.pageSize = response.page_size;
    }
    async function login(username, password) {
        const result = await adminApi.login(username, password);
        window.localStorage.setItem('platform_access_token', result.access_token);
        authenticated.value = true;
        appendActivity(`平台管理员 ${result.username} 已登录`);
    }
    async function changePassword(currentPassword, newPassword) {
        await adminApi.changePassword({
            current_password: currentPassword,
            new_password: newPassword,
        });
        appendActivity('平台管理员已修改密码');
        await loadAuditLogs();
    }
    function logout() {
        window.localStorage.removeItem('platform_access_token');
        authenticated.value = false;
        dashboard.value = null;
    }
    async function loadOverview() {
        isLoading.value = true;
        try {
            dashboard.value = await adminApi.getPlatformDashboard();
            alertSummary.value = await adminApi.getPlatformAlertSummary();
            await Promise.all([
                loadTenants(),
                loadShops(),
                loadIntegrations(),
                loadIntegrationHealth(),
                loadSourceProducts(),
                loadChannelProducts(),
                loadOrders(),
                loadPushTasks(),
                loadPushLogs(),
                loadAlerts(),
                loadAuditLogs(),
            ]);
            appendActivity('平台概览已刷新');
        }
        finally {
            isLoading.value = false;
        }
    }
    async function loadTenants() {
        applyPage(tenants, await adminApi.getPlatformTenants(tenants.q, tenants.page, tenants.pageSize));
    }
    async function loadShops() {
        applyPage(shops, await adminApi.getPlatformShops(shops.q, shops.page, shops.pageSize));
    }
    async function loadIntegrations() {
        applyPage(integrations, await adminApi.getPlatformIntegrations(integrations.q, integrations.page, integrations.pageSize));
    }
    async function loadIntegrationHealth() {
        applyPage(integrationHealth, await adminApi.getPlatformIntegrationHealth(integrationHealth.q, integrationHealth.page, integrationHealth.pageSize, integrationHealthFilters));
    }
    async function loadSourceProducts() {
        applyPage(sourceProducts, await adminApi.getPlatformSourceProducts(sourceProducts.q, sourceProducts.page, sourceProducts.pageSize));
    }
    async function loadChannelProducts() {
        applyPage(channelProducts, await adminApi.getPlatformChannelProducts(channelProducts.q, channelProducts.page, channelProducts.pageSize));
    }
    async function loadOrders() {
        applyPage(orders, await adminApi.getPlatformOrders(orders.q, orders.page, orders.pageSize, ordersFilters));
    }
    async function loadPushTasks() {
        applyPage(pushTasks, await adminApi.getPlatformPushTasks(pushTasks.q, pushTasks.page, pushTasks.pageSize, pushTaskFilters));
    }
    async function loadPushLogs() {
        applyPage(pushLogs, await adminApi.getPlatformPushLogs(pushLogs.q, pushLogs.page, pushLogs.pageSize));
    }
    async function loadAlerts() {
        applyPage(alerts, await adminApi.getPlatformAlerts(alerts.q, alerts.page, alerts.pageSize, alertFilters));
    }
    async function loadAuditLogs() {
        applyPage(auditLogs, await adminApi.getPlatformAuditLogs(auditLogs.q, auditLogs.page, auditLogs.pageSize));
    }
    async function saveTenant(id, payload) {
        if (id === null) {
            await adminApi.createTenant(payload);
            appendActivity(`已新建租户：${payload.name}`);
        }
        else {
            await adminApi.updateTenant(id, payload);
            appendActivity(`已更新租户：${payload.name}`);
        }
        await loadOverview();
    }
    async function saveShop(id, payload) {
        if (id === null) {
            await adminApi.createShop(payload);
            appendActivity(`已新建店铺：${payload.name}`);
        }
        else {
            await adminApi.updateShop(id, payload);
            appendActivity(`已更新店铺：${payload.name}`);
        }
        await loadOverview();
    }
    async function saveIntegration(id, payload) {
        if (id === null) {
            await adminApi.createIntegration(payload);
            appendActivity(`已新建接入配置：${payload.name}`);
        }
        else {
            await adminApi.updateIntegration(id, payload);
            appendActivity(`已更新接入配置：${payload.name}`);
        }
        await loadOverview();
    }
    async function publishSourceProduct(sourceProductId, shopId, title, subtitle, status) {
        await adminApi.publishSourceProduct(sourceProductId, shopId, title, subtitle, status);
        appendActivity(`已发布源商品 ${sourceProductId} 到店铺 ${shopId}`);
        await Promise.all([loadSourceProducts(), loadChannelProducts(), loadAuditLogs()]);
    }
    async function retryPushTask(taskId) {
        await adminApi.retryPushTask(taskId);
        appendActivity(`已重试推送任务：${taskId}`);
        alertSummary.value = await adminApi.getPlatformAlertSummary();
        await Promise.all([loadPushTasks(), loadPushLogs(), loadOrders(), loadAlerts(), loadAuditLogs()]);
    }
    async function handleAlert(resourceType, resourceId, status, note) {
        await adminApi.handlePlatformAlert(resourceType, resourceId, status, note);
        appendActivity(`已处理告警：${resourceType}/${resourceId} -> ${status}`);
        alertSummary.value = await adminApi.getPlatformAlertSummary();
        await Promise.all([loadAlerts(), loadAuditLogs()]);
    }
    return {
        activity,
        alerts,
        alertFilters,
        alertSummary,
        auditLogs,
        authenticated,
        channelProducts,
        dashboard,
        integrations,
        integrationHealth,
        integrationHealthFilters,
        isLoading,
        orders,
        ordersFilters,
        pushLogs,
        pushTasks,
        pushTaskFilters,
        shops,
        sourceProducts,
        tenants,
        appendActivity,
        changePassword,
        handleAlert,
        loadAlerts,
        loadAuditLogs,
        loadChannelProducts,
        loadIntegrations,
        loadIntegrationHealth,
        loadOrders,
        loadOverview,
        loadPushLogs,
        loadPushTasks,
        loadShops,
        loadSourceProducts,
        loadTenants,
        login,
        logout,
        publishSourceProduct,
        retryPushTask,
        saveIntegration,
        saveShop,
        saveTenant,
    };
});
