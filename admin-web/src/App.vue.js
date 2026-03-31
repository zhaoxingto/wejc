import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useAdminStore } from '@/stores/admin';
const store = useAdminStore();
const loginForm = reactive({
    username: 'admin',
    password: 'admin123456',
});
const activeMenu = ref('overview');
const tenantDialogVisible = ref(false);
const shopDialogVisible = ref(false);
const integrationDialogVisible = ref(false);
const publishDialogVisible = ref(false);
const changePasswordDialogVisible = ref(false);
const tenantEditingId = ref(null);
const shopEditingId = ref(null);
const integrationEditingId = ref(null);
const publishSourceProductId = ref(null);
const tenantForm = reactive({
    tenant_code: '',
    name: '',
    status: 'active',
    contact_name: null,
    mobile: null,
});
const shopForm = reactive({
    tenant_id: 0,
    shop_code: '',
    name: '',
    status: 'active',
    logo: null,
    cover: null,
    intro: null,
    default_integration_id: null,
});
const integrationForm = reactive({
    tenant_id: 0,
    name: '',
    integration_type: 'erp',
    status: 'active',
    product_sync_enabled: false,
    order_push_enabled: true,
    api_base_url: null,
    api_key: null,
    api_secret: null,
    config_json: null,
});
const publishForm = reactive({
    shop_id: 0,
    title: '',
    subtitle: '',
    status: 'draft',
});
const passwordForm = reactive({
    current_password: '',
    new_password: '',
    confirm_password: '',
});
function resetToFirstPageAndLoad(loader, pageRef) {
    pageRef.page = 1;
    void loader();
}
const menuItems = [
    { key: 'overview', label: '平台概览' },
    { key: 'tenants', label: '租户管理' },
    { key: 'shops', label: '店铺管理' },
    { key: 'integrations', label: '接入配置' },
    { key: 'integration-health', label: '接入健康检查' },
    { key: 'alerts', label: '告警中心' },
    { key: 'audit', label: '操作审计' },
    { key: 'source-products', label: '源商品中心' },
    { key: 'channel-products', label: '渠道商品视图' },
    { key: 'orders', label: '订单中心' },
    { key: 'push-tasks', label: '推送任务' },
    { key: 'push-logs', label: '推送日志' },
];
const currentMenuLabel = computed(() => menuItems.find((item) => item.key === activeMenu.value)?.label ?? '平台概览');
const dashboardCards = computed(() => {
    if (!store.dashboard) {
        return [];
    }
    return [
        { label: '租户总数', value: store.dashboard.tenant_count },
        { label: '店铺总数', value: store.dashboard.shop_count },
        { label: '接入配置', value: store.dashboard.integration_count },
        { label: '源商品数', value: store.dashboard.source_product_count },
        { label: '渠道商品数', value: store.channelProducts.total },
        { label: '待处理任务', value: store.dashboard.pending_push_task_count + store.dashboard.retrying_push_task_count },
    ];
});
const alertCards = computed(() => {
    if (!store.alertSummary) {
        return [];
    }
    return [
        { label: '告警总数', value: store.alertSummary.total },
        { label: '严重告警', value: store.alertSummary.critical_count },
        { label: '一般告警', value: store.alertSummary.warning_count },
        { label: '推送任务异常', value: store.alertSummary.push_task_issue_count },
        { label: '推送失败', value: store.alertSummary.push_log_failure_count },
        { label: '同步异常', value: store.alertSummary.product_sync_issue_count },
    ];
});
const operationCards = computed(() => {
    if (!store.dashboard) {
        return [];
    }
    return [
        { label: '今日订单', value: store.dashboard.today_order_count },
        { label: '今日推送成功', value: store.dashboard.today_push_success_count },
        { label: '今日推送失败', value: store.dashboard.today_push_failure_count },
        { label: '当前未闭环异常', value: store.dashboard.unresolved_alert_count },
    ];
});
const orderTrendMax = computed(() => {
    const values = store.dashboard?.daily_order_trend.map((item) => item.value) ?? [];
    return Math.max(...values, 1);
});
const pushTrendMax = computed(() => {
    const values = store.dashboard?.daily_push_trend.flatMap((item) => [item.success_count, item.failure_count]) ?? [];
    return Math.max(...values, 1);
});
function tagType(status) {
    if (status === true || ['active', 'success', 'synced', 'created'].includes(String(status))) {
        return 'success';
    }
    if (status === false || ['pending', 'retrying', 'disabled', 'draft'].includes(String(status))) {
        return 'warning';
    }
    return 'info';
}
function toChineseSeverity(severity) {
    if (severity === 'critical')
        return '严重';
    if (severity === 'warning')
        return '一般';
    return severity;
}
function toChineseCategory(category) {
    const mapping = {
        push_task: '推送任务',
        push_log: '推送日志',
        product_sync: '商品同步',
    };
    return mapping[category] ?? category;
}
function toChineseHealth(status) {
    const mapping = {
        healthy: '健康',
        warning: '预警',
        critical: '异常',
        disabled: '停用',
        reachable: '连通正常',
        missing_config: '配置缺失',
    };
    return mapping[status] ?? status;
}
async function handleLogin() {
    try {
        await store.login(loginForm.username, loginForm.password);
        await store.loadOverview();
        ElMessage.success('登录成功');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
function openCreateTenant() {
    tenantEditingId.value = null;
    Object.assign(tenantForm, {
        tenant_code: '',
        name: '',
        status: 'active',
        contact_name: null,
        mobile: null,
    });
    tenantDialogVisible.value = true;
}
function openEditTenant(row) {
    tenantEditingId.value = row.id;
    Object.assign(tenantForm, {
        tenant_code: row.tenant_code,
        name: row.name,
        status: row.status,
        contact_name: row.contact_name,
        mobile: row.mobile,
    });
    tenantDialogVisible.value = true;
}
async function submitTenant() {
    try {
        await store.saveTenant(tenantEditingId.value, { ...tenantForm });
        tenantDialogVisible.value = false;
        ElMessage.success('租户保存成功');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
function openCreateShop() {
    shopEditingId.value = null;
    Object.assign(shopForm, {
        tenant_id: store.tenants.items[0]?.id ?? 0,
        shop_code: '',
        name: '',
        status: 'active',
        logo: null,
        cover: null,
        intro: null,
        default_integration_id: null,
    });
    shopDialogVisible.value = true;
}
function openEditShop(row) {
    shopEditingId.value = row.id;
    Object.assign(shopForm, {
        tenant_id: row.tenant_id,
        shop_code: row.shop_code,
        name: row.name,
        status: row.status,
        logo: null,
        cover: null,
        intro: null,
        default_integration_id: row.default_integration_id,
    });
    shopDialogVisible.value = true;
}
async function submitShop() {
    try {
        await store.saveShop(shopEditingId.value, { ...shopForm });
        shopDialogVisible.value = false;
        ElMessage.success('店铺保存成功');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
function openCreateIntegration() {
    integrationEditingId.value = null;
    Object.assign(integrationForm, {
        tenant_id: store.tenants.items[0]?.id ?? 0,
        name: '',
        integration_type: 'erp',
        status: 'active',
        product_sync_enabled: false,
        order_push_enabled: true,
        api_base_url: null,
        api_key: null,
        api_secret: null,
        config_json: null,
    });
    integrationDialogVisible.value = true;
}
function openEditIntegration(row) {
    integrationEditingId.value = row.id;
    Object.assign(integrationForm, {
        tenant_id: row.tenant_id,
        name: row.name,
        integration_type: row.integration_type,
        status: row.status,
        product_sync_enabled: row.product_sync_enabled,
        order_push_enabled: row.order_push_enabled,
        api_base_url: row.api_base_url,
        api_key: null,
        api_secret: null,
        config_json: null,
    });
    integrationDialogVisible.value = true;
}
async function submitIntegration() {
    try {
        await store.saveIntegration(integrationEditingId.value, { ...integrationForm });
        integrationDialogVisible.value = false;
        ElMessage.success('接入配置保存成功');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
function openPublishDialog(sourceProductId) {
    publishSourceProductId.value = sourceProductId;
    Object.assign(publishForm, {
        shop_id: store.shops.items[0]?.id ?? 0,
        title: '',
        subtitle: '',
        status: 'draft',
    });
    publishDialogVisible.value = true;
}
async function submitPublish() {
    if (publishSourceProductId.value === null)
        return;
    try {
        await store.publishSourceProduct(publishSourceProductId.value, publishForm.shop_id, publishForm.title || null, publishForm.subtitle || null, publishForm.status);
        publishDialogVisible.value = false;
        ElMessage.success('源商品发布成功');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
async function handleRetryTask(taskId) {
    try {
        await store.retryPushTask(taskId);
        ElMessage.success('推送任务已重试');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
async function handleAlertAction(resourceType, resourceId, status) {
    const note = window.prompt(status === 'resolved' ? '请输入处理备注' : '请输入忽略备注', '') ?? '';
    try {
        await store.handleAlert(resourceType, resourceId, status, note || null);
        ElMessage.success(status === 'resolved' ? '告警已处理' : '告警已忽略');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
function openChangePasswordDialog() {
    Object.assign(passwordForm, {
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    changePasswordDialogVisible.value = true;
}
async function submitPasswordChange() {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
        ElMessage.error('两次输入的新密码不一致');
        return;
    }
    try {
        await store.changePassword(passwordForm.current_password, passwordForm.new_password);
        changePasswordDialogVisible.value = false;
        ElMessage.success('密码修改成功');
    }
    catch (error) {
        ElMessage.error(error.message);
    }
}
function applyIntegrationHealthFilters() {
    resetToFirstPageAndLoad(store.loadIntegrationHealth, store.integrationHealth);
}
function clearIntegrationHealthFilters() {
    Object.assign(store.integrationHealthFilters, {
        tenant_id: '',
        status: '',
        connectivity_status: '',
        health_status: '',
    });
    applyIntegrationHealthFilters();
}
function applyAlertFilters() {
    resetToFirstPageAndLoad(store.loadAlerts, store.alerts);
}
function clearAlertFilters() {
    Object.assign(store.alertFilters, {
        category: '',
        severity: '',
        handling_status: '',
    });
    applyAlertFilters();
}
function applyOrderFilters() {
    resetToFirstPageAndLoad(store.loadOrders, store.orders);
}
function clearOrderFilters() {
    Object.assign(store.ordersFilters, {
        tenant_id: '',
        shop_id: '',
        status: '',
        push_status: '',
    });
    applyOrderFilters();
}
function applyPushTaskFilters() {
    resetToFirstPageAndLoad(store.loadPushTasks, store.pushTasks);
}
function clearPushTaskFilters() {
    Object.assign(store.pushTaskFilters, {
        tenant_id: '',
        shop_id: '',
        integration_id: '',
        status: '',
    });
    applyPushTaskFilters();
}
onMounted(() => {
    if (store.authenticated) {
        void store.loadOverview();
    }
});
function handleMenuSelect(key) {
    activeMenu.value = key;
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (!__VLS_ctx.store.authenticated) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "login-shell" },
    });
    /** @type {__VLS_StyleScopedClasses['login-shell']} */ ;
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
    elCard;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ class: "login-card" },
        shadow: "hover",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "login-card" },
        shadow: "hover",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['login-card']} */ ;
    const { default: __VLS_5 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "login-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['login-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "login-title" },
    });
    /** @type {__VLS_StyleScopedClasses['login-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "login-copy" },
    });
    /** @type {__VLS_StyleScopedClasses['login-copy']} */ ;
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.elForm | typeof __VLS_components.ElForm | typeof __VLS_components.elForm | typeof __VLS_components.ElForm} */
    elForm;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ 'onSubmit': {} },
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onSubmit': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = ({ submit: {} },
        { onSubmit: (__VLS_ctx.handleLogin) });
    const { default: __VLS_13 } = __VLS_9.slots;
    let __VLS_14;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        label: "账号",
    }));
    const __VLS_16 = __VLS_15({
        label: "账号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    const { default: __VLS_19 } = __VLS_17.slots;
    let __VLS_20;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        modelValue: (__VLS_ctx.loginForm.username),
    }));
    const __VLS_22 = __VLS_21({
        modelValue: (__VLS_ctx.loginForm.username),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    // @ts-ignore
    [store, handleLogin, loginForm,];
    var __VLS_17;
    let __VLS_25;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        label: "密码",
    }));
    const __VLS_27 = __VLS_26({
        label: "密码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    const { default: __VLS_30 } = __VLS_28.slots;
    let __VLS_31;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        modelValue: (__VLS_ctx.loginForm.password),
        showPassword: true,
    }));
    const __VLS_33 = __VLS_32({
        modelValue: (__VLS_ctx.loginForm.password),
        showPassword: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    // @ts-ignore
    [loginForm,];
    var __VLS_28;
    let __VLS_36;
    /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
    elButton;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        ...{ 'onClick': {} },
        type: "primary",
        ...{ class: "login-button" },
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClick': {} },
        type: "primary",
        ...{ class: "login-button" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_41;
    const __VLS_42 = ({ click: {} },
        { onClick: (__VLS_ctx.handleLogin) });
    /** @type {__VLS_StyleScopedClasses['login-button']} */ ;
    const { default: __VLS_43 } = __VLS_39.slots;
    // @ts-ignore
    [handleLogin,];
    var __VLS_39;
    var __VLS_40;
    // @ts-ignore
    [];
    var __VLS_9;
    var __VLS_10;
    // @ts-ignore
    [];
    var __VLS_3;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "layout-shell" },
    });
    /** @type {__VLS_StyleScopedClasses['layout-shell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "layout-sidebar" },
    });
    /** @type {__VLS_StyleScopedClasses['layout-sidebar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "brand-block" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "brand-eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "brand-copy" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
    let __VLS_44;
    /** @ts-ignore @type {typeof __VLS_components.elMenu | typeof __VLS_components.ElMenu | typeof __VLS_components.elMenu | typeof __VLS_components.ElMenu} */
    elMenu;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        ...{ 'onSelect': {} },
        defaultActive: (__VLS_ctx.activeMenu),
        ...{ class: "side-menu" },
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onSelect': {} },
        defaultActive: (__VLS_ctx.activeMenu),
        ...{ class: "side-menu" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_49;
    const __VLS_50 = ({ select: {} },
        { onSelect: (__VLS_ctx.handleMenuSelect) });
    /** @type {__VLS_StyleScopedClasses['side-menu']} */ ;
    const { default: __VLS_51 } = __VLS_47.slots;
    for (const [item] of __VLS_vFor((__VLS_ctx.menuItems))) {
        let __VLS_52;
        /** @ts-ignore @type {typeof __VLS_components.elMenuItem | typeof __VLS_components.ElMenuItem | typeof __VLS_components.elMenuItem | typeof __VLS_components.ElMenuItem} */
        elMenuItem;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            key: (item.key),
            index: (item.key),
        }));
        const __VLS_54 = __VLS_53({
            key: (item.key),
            index: (item.key),
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        const { default: __VLS_57 } = __VLS_55.slots;
        (item.label);
        // @ts-ignore
        [activeMenu, handleMenuSelect, menuItems,];
        var __VLS_55;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_47;
    var __VLS_48;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "layout-main" },
    });
    /** @type {__VLS_StyleScopedClasses['layout-main']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "layout-header" },
    });
    /** @type {__VLS_StyleScopedClasses['layout-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "header-breadcrumb" },
    });
    /** @type {__VLS_StyleScopedClasses['header-breadcrumb']} */ ;
    (__VLS_ctx.currentMenuLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.currentMenuLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
    let __VLS_58;
    /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
    elButton;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.store.isLoading),
    }));
    const __VLS_60 = __VLS_59({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.store.isLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    let __VLS_63;
    const __VLS_64 = ({ click: {} },
        { onClick: (__VLS_ctx.store.loadOverview) });
    const { default: __VLS_65 } = __VLS_61.slots;
    // @ts-ignore
    [store, store, currentMenuLabel, currentMenuLabel,];
    var __VLS_61;
    var __VLS_62;
    let __VLS_66;
    /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
    elButton;
    // @ts-ignore
    const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        ...{ 'onClick': {} },
    }));
    const __VLS_68 = __VLS_67({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_67));
    let __VLS_71;
    const __VLS_72 = ({ click: {} },
        { onClick: (__VLS_ctx.openChangePasswordDialog) });
    const { default: __VLS_73 } = __VLS_69.slots;
    // @ts-ignore
    [openChangePasswordDialog,];
    var __VLS_69;
    var __VLS_70;
    let __VLS_74;
    /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
    elButton;
    // @ts-ignore
    const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
        ...{ 'onClick': {} },
        type: "danger",
        plain: true,
    }));
    const __VLS_76 = __VLS_75({
        ...{ 'onClick': {} },
        type: "danger",
        plain: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_75));
    let __VLS_79;
    const __VLS_80 = ({ click: {} },
        { onClick: (__VLS_ctx.store.logout) });
    const { default: __VLS_81 } = __VLS_77.slots;
    // @ts-ignore
    [store,];
    var __VLS_77;
    var __VLS_78;
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "workbench" },
    });
    /** @type {__VLS_StyleScopedClasses['workbench']} */ ;
    if (__VLS_ctx.activeMenu === 'overview') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-grid']} */ ;
        for (const [card] of __VLS_vFor((__VLS_ctx.dashboardCards))) {
            let __VLS_82;
            /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
            elCard;
            // @ts-ignore
            const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
                key: (card.label),
                ...{ class: "metric-card" },
                shadow: "hover",
            }));
            const __VLS_84 = __VLS_83({
                key: (card.label),
                ...{ class: "metric-card" },
                shadow: "hover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_83));
            /** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
            const { default: __VLS_87 } = __VLS_85.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (card.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (card.value);
            // @ts-ignore
            [activeMenu, dashboardCards,];
            var __VLS_85;
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-grid compact" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['compact']} */ ;
        for (const [card] of __VLS_vFor((__VLS_ctx.operationCards))) {
            let __VLS_88;
            /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
            elCard;
            // @ts-ignore
            const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
                key: (card.label),
                ...{ class: "metric-card subtle-card" },
                shadow: "never",
            }));
            const __VLS_90 = __VLS_89({
                key: (card.label),
                ...{ class: "metric-card subtle-card" },
                shadow: "never",
            }, ...__VLS_functionalComponentArgsRest(__VLS_89));
            /** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['subtle-card']} */ ;
            const { default: __VLS_93 } = __VLS_91.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (card.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (card.value);
            // @ts-ignore
            [operationCards,];
            var __VLS_91;
            // @ts-ignore
            [];
        }
        let __VLS_94;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_96 = __VLS_95({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_95));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_99 } = __VLS_97.slots;
        {
            const { header: __VLS_100 } = __VLS_97.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-grid compact" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['compact']} */ ;
        for (const [card] of __VLS_vFor((__VLS_ctx.alertCards))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (card.label),
                ...{ class: "metric-panel" },
            });
            /** @type {__VLS_StyleScopedClasses['metric-panel']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (card.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (card.value);
            // @ts-ignore
            [alertCards,];
        }
        // @ts-ignore
        [];
        var __VLS_97;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overview-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['overview-grid']} */ ;
        let __VLS_101;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_103 = __VLS_102({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_102));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_106 } = __VLS_104.slots;
        {
            const { header: __VLS_107 } = __VLS_104.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "trend-chart" },
        });
        /** @type {__VLS_StyleScopedClasses['trend-chart']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.store.dashboard?.daily_order_trend ?? []))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item.date),
                ...{ class: "trend-column" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-column']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "trend-value" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-value']} */ ;
            (item.value);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "trend-bar-shell" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-bar-shell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "trend-bar trend-bar-primary" },
                ...{ style: ({ height: `${Math.max((item.value / __VLS_ctx.orderTrendMax) * 140, item.value > 0 ? 16 : 8)}px` }) },
            });
            /** @type {__VLS_StyleScopedClasses['trend-bar']} */ ;
            /** @type {__VLS_StyleScopedClasses['trend-bar-primary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "trend-label" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-label']} */ ;
            (item.date.slice(5));
            // @ts-ignore
            [store, orderTrendMax,];
        }
        // @ts-ignore
        [];
        var __VLS_104;
        let __VLS_108;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_110 = __VLS_109({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_113 } = __VLS_111.slots;
        {
            const { header: __VLS_114 } = __VLS_111.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "trend-chart dual" },
        });
        /** @type {__VLS_StyleScopedClasses['trend-chart']} */ ;
        /** @type {__VLS_StyleScopedClasses['dual']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.store.dashboard?.daily_push_trend ?? []))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item.date),
                ...{ class: "trend-column" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-column']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "trend-value split" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-value']} */ ;
            /** @type {__VLS_StyleScopedClasses['split']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (item.success_count);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (item.failure_count);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "trend-bar-shell dual" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-bar-shell']} */ ;
            /** @type {__VLS_StyleScopedClasses['dual']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "trend-bar trend-bar-primary" },
                ...{ style: ({ height: `${Math.max((item.success_count / __VLS_ctx.pushTrendMax) * 120, item.success_count > 0 ? 12 : 6)}px` }) },
            });
            /** @type {__VLS_StyleScopedClasses['trend-bar']} */ ;
            /** @type {__VLS_StyleScopedClasses['trend-bar-primary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
                ...{ class: "trend-bar trend-bar-danger" },
                ...{ style: ({ height: `${Math.max((item.failure_count / __VLS_ctx.pushTrendMax) * 120, item.failure_count > 0 ? 12 : 6)}px` }) },
            });
            /** @type {__VLS_StyleScopedClasses['trend-bar']} */ ;
            /** @type {__VLS_StyleScopedClasses['trend-bar-danger']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "trend-label" },
            });
            /** @type {__VLS_StyleScopedClasses['trend-label']} */ ;
            (item.date.slice(5));
            // @ts-ignore
            [store, pushTrendMax, pushTrendMax,];
        }
        // @ts-ignore
        [];
        var __VLS_111;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overview-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['overview-grid']} */ ;
        let __VLS_115;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_117 = __VLS_116({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_116));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_120 } = __VLS_118.slots;
        {
            const { header: __VLS_121 } = __VLS_118.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rank-list" },
        });
        /** @type {__VLS_StyleScopedClasses['rank-list']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.store.dashboard?.top_alert_shops ?? []))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item.label),
                ...{ class: "rank-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rank-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (item.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (item.value);
            // @ts-ignore
            [store,];
        }
        if ((__VLS_ctx.store.dashboard?.top_alert_shops ?? []).length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "empty-tip" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-tip']} */ ;
        }
        // @ts-ignore
        [store,];
        var __VLS_118;
        let __VLS_122;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_124 = __VLS_123({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_123));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_127 } = __VLS_125.slots;
        {
            const { header: __VLS_128 } = __VLS_125.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rank-list" },
        });
        /** @type {__VLS_StyleScopedClasses['rank-list']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.store.dashboard?.top_failing_integrations ?? []))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item.label),
                ...{ class: "rank-item" },
            });
            /** @type {__VLS_StyleScopedClasses['rank-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (item.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (item.value);
            // @ts-ignore
            [store,];
        }
        if ((__VLS_ctx.store.dashboard?.top_failing_integrations ?? []).length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "empty-tip" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-tip']} */ ;
        }
        // @ts-ignore
        [store,];
        var __VLS_125;
        let __VLS_129;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_131 = __VLS_130({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_130));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_134 } = __VLS_132.slots;
        {
            const { header: __VLS_135 } = __VLS_132.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-list" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-list']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.store.activity.slice(0, 8)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item),
                ...{ class: "activity-item" },
            });
            /** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
            (item);
            // @ts-ignore
            [store,];
        }
        // @ts-ignore
        [];
        var __VLS_132;
    }
    else if (__VLS_ctx.activeMenu === 'tenants') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_136;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_138 = __VLS_137({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_137));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_141 } = __VLS_139.slots;
        {
            const { header: __VLS_142 } = __VLS_139.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            let __VLS_143;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
                ...{ 'onClick': {} },
                type: "primary",
            }));
            const __VLS_145 = __VLS_144({
                ...{ 'onClick': {} },
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_144));
            let __VLS_148;
            const __VLS_149 = ({ click: {} },
                { onClick: (__VLS_ctx.openCreateTenant) });
            const { default: __VLS_150 } = __VLS_146.slots;
            // @ts-ignore
            [activeMenu, openCreateTenant,];
            var __VLS_146;
            var __VLS_147;
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_151;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.tenants.q),
            placeholder: "按租户编码、名称、联系人搜索",
        }));
        const __VLS_153 = __VLS_152({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.tenants.q),
            placeholder: "按租户编码、名称、联系人搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_152));
        let __VLS_156;
        const __VLS_157 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadTenants) });
        var __VLS_154;
        var __VLS_155;
        let __VLS_158;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
            data: (__VLS_ctx.store.tenants.items),
            stripe: true,
        }));
        const __VLS_160 = __VLS_159({
            data: (__VLS_ctx.store.tenants.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_159));
        const { default: __VLS_163 } = __VLS_161.slots;
        let __VLS_164;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164({
            prop: "tenant_code",
            label: "租户编码",
            minWidth: "140",
        }));
        const __VLS_166 = __VLS_165({
            prop: "tenant_code",
            label: "租户编码",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_165));
        let __VLS_169;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({
            prop: "name",
            label: "租户名称",
            minWidth: "160",
        }));
        const __VLS_171 = __VLS_170({
            prop: "name",
            label: "租户名称",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_170));
        let __VLS_174;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
            prop: "contact_name",
            label: "联系人",
            minWidth: "100",
        }));
        const __VLS_176 = __VLS_175({
            prop: "contact_name",
            label: "联系人",
            minWidth: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_175));
        let __VLS_179;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179({
            prop: "mobile",
            label: "手机号",
            minWidth: "120",
        }));
        const __VLS_181 = __VLS_180({
            prop: "mobile",
            label: "手机号",
            minWidth: "120",
        }, ...__VLS_functionalComponentArgsRest(__VLS_180));
        let __VLS_184;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184({
            label: "状态",
            width: "90",
        }));
        const __VLS_186 = __VLS_185({
            label: "状态",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_185));
        const { default: __VLS_189 } = __VLS_187.slots;
        {
            const { default: __VLS_190 } = __VLS_187.slots;
            const [{ row }] = __VLS_vSlot(__VLS_190);
            let __VLS_191;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191({
                type: (__VLS_ctx.tagType(row.status)),
            }));
            const __VLS_193 = __VLS_192({
                type: (__VLS_ctx.tagType(row.status)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_192));
            const { default: __VLS_196 } = __VLS_194.slots;
            (row.status);
            // @ts-ignore
            [store, store, store, tagType,];
            var __VLS_194;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_187;
        let __VLS_197;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({
            prop: "shop_count",
            label: "店铺数",
            width: "90",
        }));
        const __VLS_199 = __VLS_198({
            prop: "shop_count",
            label: "店铺数",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_198));
        let __VLS_202;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
            prop: "integration_count",
            label: "接入数",
            width: "90",
        }));
        const __VLS_204 = __VLS_203({
            prop: "integration_count",
            label: "接入数",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_203));
        let __VLS_207;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207({
            label: "操作",
            width: "90",
        }));
        const __VLS_209 = __VLS_208({
            label: "操作",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_208));
        const { default: __VLS_212 } = __VLS_210.slots;
        {
            const { default: __VLS_213 } = __VLS_210.slots;
            const [{ row }] = __VLS_vSlot(__VLS_213);
            let __VLS_214;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_216 = __VLS_215({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_215));
            let __VLS_219;
            const __VLS_220 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        __VLS_ctx.openEditTenant(row);
                        // @ts-ignore
                        [openEditTenant,];
                    } });
            const { default: __VLS_221 } = __VLS_217.slots;
            // @ts-ignore
            [];
            var __VLS_217;
            var __VLS_218;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_210;
        // @ts-ignore
        [];
        var __VLS_161;
        let __VLS_222;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_223 = __VLS_asFunctionalComponent1(__VLS_222, new __VLS_222({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.tenants.total),
            pageSize: (__VLS_ctx.store.tenants.pageSize),
            currentPage: (__VLS_ctx.store.tenants.page),
        }));
        const __VLS_224 = __VLS_223({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.tenants.total),
            pageSize: (__VLS_ctx.store.tenants.pageSize),
            currentPage: (__VLS_ctx.store.tenants.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_223));
        let __VLS_227;
        const __VLS_228 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadTenants) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_225;
        var __VLS_226;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_139;
    }
    else if (__VLS_ctx.activeMenu === 'shops') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_229;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_230 = __VLS_asFunctionalComponent1(__VLS_229, new __VLS_229({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_231 = __VLS_230({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_230));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_234 } = __VLS_232.slots;
        {
            const { header: __VLS_235 } = __VLS_232.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            let __VLS_236;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_237 = __VLS_asFunctionalComponent1(__VLS_236, new __VLS_236({
                ...{ 'onClick': {} },
                type: "primary",
            }));
            const __VLS_238 = __VLS_237({
                ...{ 'onClick': {} },
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_237));
            let __VLS_241;
            const __VLS_242 = ({ click: {} },
                { onClick: (__VLS_ctx.openCreateShop) });
            const { default: __VLS_243 } = __VLS_239.slots;
            // @ts-ignore
            [activeMenu, openCreateShop,];
            var __VLS_239;
            var __VLS_240;
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_244;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.shops.q),
            placeholder: "按租户、店铺编码、店铺名称搜索",
        }));
        const __VLS_246 = __VLS_245({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.shops.q),
            placeholder: "按租户、店铺编码、店铺名称搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_245));
        let __VLS_249;
        const __VLS_250 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadShops) });
        var __VLS_247;
        var __VLS_248;
        let __VLS_251;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251({
            data: (__VLS_ctx.store.shops.items),
            stripe: true,
        }));
        const __VLS_253 = __VLS_252({
            data: (__VLS_ctx.store.shops.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_252));
        const { default: __VLS_256 } = __VLS_254.slots;
        let __VLS_257;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_258 = __VLS_asFunctionalComponent1(__VLS_257, new __VLS_257({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_259 = __VLS_258({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_258));
        let __VLS_262;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262({
            prop: "shop_code",
            label: "店铺编码",
            minWidth: "140",
        }));
        const __VLS_264 = __VLS_263({
            prop: "shop_code",
            label: "店铺编码",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_263));
        let __VLS_267;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_268 = __VLS_asFunctionalComponent1(__VLS_267, new __VLS_267({
            prop: "name",
            label: "店铺名称",
            minWidth: "160",
        }));
        const __VLS_269 = __VLS_268({
            prop: "name",
            label: "店铺名称",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_268));
        let __VLS_272;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_273 = __VLS_asFunctionalComponent1(__VLS_272, new __VLS_272({
            prop: "default_integration_name",
            label: "默认接入",
            minWidth: "140",
        }));
        const __VLS_274 = __VLS_273({
            prop: "default_integration_name",
            label: "默认接入",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_273));
        let __VLS_277;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_278 = __VLS_asFunctionalComponent1(__VLS_277, new __VLS_277({
            label: "状态",
            width: "90",
        }));
        const __VLS_279 = __VLS_278({
            label: "状态",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_278));
        const { default: __VLS_282 } = __VLS_280.slots;
        {
            const { default: __VLS_283 } = __VLS_280.slots;
            const [{ row }] = __VLS_vSlot(__VLS_283);
            let __VLS_284;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_285 = __VLS_asFunctionalComponent1(__VLS_284, new __VLS_284({
                type: (__VLS_ctx.tagType(row.status)),
            }));
            const __VLS_286 = __VLS_285({
                type: (__VLS_ctx.tagType(row.status)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_285));
            const { default: __VLS_289 } = __VLS_287.slots;
            (row.status);
            // @ts-ignore
            [store, store, store, tagType,];
            var __VLS_287;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_280;
        let __VLS_290;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_291 = __VLS_asFunctionalComponent1(__VLS_290, new __VLS_290({
            label: "操作",
            width: "90",
        }));
        const __VLS_292 = __VLS_291({
            label: "操作",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_291));
        const { default: __VLS_295 } = __VLS_293.slots;
        {
            const { default: __VLS_296 } = __VLS_293.slots;
            const [{ row }] = __VLS_vSlot(__VLS_296);
            let __VLS_297;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_299 = __VLS_298({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_298));
            let __VLS_302;
            const __VLS_303 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'shops'))
                            return;
                        __VLS_ctx.openEditShop(row);
                        // @ts-ignore
                        [openEditShop,];
                    } });
            const { default: __VLS_304 } = __VLS_300.slots;
            // @ts-ignore
            [];
            var __VLS_300;
            var __VLS_301;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_293;
        // @ts-ignore
        [];
        var __VLS_254;
        let __VLS_305;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_306 = __VLS_asFunctionalComponent1(__VLS_305, new __VLS_305({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.shops.total),
            pageSize: (__VLS_ctx.store.shops.pageSize),
            currentPage: (__VLS_ctx.store.shops.page),
        }));
        const __VLS_307 = __VLS_306({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.shops.total),
            pageSize: (__VLS_ctx.store.shops.pageSize),
            currentPage: (__VLS_ctx.store.shops.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_306));
        let __VLS_310;
        const __VLS_311 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadShops) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_308;
        var __VLS_309;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_232;
    }
    else if (__VLS_ctx.activeMenu === 'integrations') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_312;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_313 = __VLS_asFunctionalComponent1(__VLS_312, new __VLS_312({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_314 = __VLS_313({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_313));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_317 } = __VLS_315.slots;
        {
            const { header: __VLS_318 } = __VLS_315.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            let __VLS_319;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_320 = __VLS_asFunctionalComponent1(__VLS_319, new __VLS_319({
                ...{ 'onClick': {} },
                type: "primary",
            }));
            const __VLS_321 = __VLS_320({
                ...{ 'onClick': {} },
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_320));
            let __VLS_324;
            const __VLS_325 = ({ click: {} },
                { onClick: (__VLS_ctx.openCreateIntegration) });
            const { default: __VLS_326 } = __VLS_322.slots;
            // @ts-ignore
            [activeMenu, openCreateIntegration,];
            var __VLS_322;
            var __VLS_323;
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_327;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_328 = __VLS_asFunctionalComponent1(__VLS_327, new __VLS_327({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.integrations.q),
            placeholder: "按租户、接入名称、类型搜索",
        }));
        const __VLS_329 = __VLS_328({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.integrations.q),
            placeholder: "按租户、接入名称、类型搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_328));
        let __VLS_332;
        const __VLS_333 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadIntegrations) });
        var __VLS_330;
        var __VLS_331;
        let __VLS_334;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_335 = __VLS_asFunctionalComponent1(__VLS_334, new __VLS_334({
            data: (__VLS_ctx.store.integrations.items),
            stripe: true,
        }));
        const __VLS_336 = __VLS_335({
            data: (__VLS_ctx.store.integrations.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_335));
        const { default: __VLS_339 } = __VLS_337.slots;
        let __VLS_340;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_341 = __VLS_asFunctionalComponent1(__VLS_340, new __VLS_340({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_342 = __VLS_341({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_341));
        let __VLS_345;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_346 = __VLS_asFunctionalComponent1(__VLS_345, new __VLS_345({
            prop: "name",
            label: "接入名称",
            minWidth: "160",
        }));
        const __VLS_347 = __VLS_346({
            prop: "name",
            label: "接入名称",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_346));
        let __VLS_350;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_351 = __VLS_asFunctionalComponent1(__VLS_350, new __VLS_350({
            prop: "integration_type",
            label: "接入类型",
            width: "100",
        }));
        const __VLS_352 = __VLS_351({
            prop: "integration_type",
            label: "接入类型",
            width: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_351));
        let __VLS_355;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_356 = __VLS_asFunctionalComponent1(__VLS_355, new __VLS_355({
            prop: "api_base_url",
            label: "接口地址",
            minWidth: "180",
        }));
        const __VLS_357 = __VLS_356({
            prop: "api_base_url",
            label: "接口地址",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_356));
        let __VLS_360;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_361 = __VLS_asFunctionalComponent1(__VLS_360, new __VLS_360({
            label: "状态",
            width: "90",
        }));
        const __VLS_362 = __VLS_361({
            label: "状态",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_361));
        const { default: __VLS_365 } = __VLS_363.slots;
        {
            const { default: __VLS_366 } = __VLS_363.slots;
            const [{ row }] = __VLS_vSlot(__VLS_366);
            let __VLS_367;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_368 = __VLS_asFunctionalComponent1(__VLS_367, new __VLS_367({
                type: (__VLS_ctx.tagType(row.status)),
            }));
            const __VLS_369 = __VLS_368({
                type: (__VLS_ctx.tagType(row.status)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_368));
            const { default: __VLS_372 } = __VLS_370.slots;
            (row.status);
            // @ts-ignore
            [store, store, store, tagType,];
            var __VLS_370;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_363;
        let __VLS_373;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_374 = __VLS_asFunctionalComponent1(__VLS_373, new __VLS_373({
            label: "操作",
            width: "90",
        }));
        const __VLS_375 = __VLS_374({
            label: "操作",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_374));
        const { default: __VLS_378 } = __VLS_376.slots;
        {
            const { default: __VLS_379 } = __VLS_376.slots;
            const [{ row }] = __VLS_vSlot(__VLS_379);
            let __VLS_380;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_381 = __VLS_asFunctionalComponent1(__VLS_380, new __VLS_380({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_382 = __VLS_381({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_381));
            let __VLS_385;
            const __VLS_386 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'shops'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'integrations'))
                            return;
                        __VLS_ctx.openEditIntegration(row);
                        // @ts-ignore
                        [openEditIntegration,];
                    } });
            const { default: __VLS_387 } = __VLS_383.slots;
            // @ts-ignore
            [];
            var __VLS_383;
            var __VLS_384;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_376;
        // @ts-ignore
        [];
        var __VLS_337;
        let __VLS_388;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_389 = __VLS_asFunctionalComponent1(__VLS_388, new __VLS_388({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.integrations.total),
            pageSize: (__VLS_ctx.store.integrations.pageSize),
            currentPage: (__VLS_ctx.store.integrations.page),
        }));
        const __VLS_390 = __VLS_389({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.integrations.total),
            pageSize: (__VLS_ctx.store.integrations.pageSize),
            currentPage: (__VLS_ctx.store.integrations.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_389));
        let __VLS_393;
        const __VLS_394 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadIntegrations) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_391;
        var __VLS_392;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_315;
    }
    else if (__VLS_ctx.activeMenu === 'integration-health') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_395;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_396 = __VLS_asFunctionalComponent1(__VLS_395, new __VLS_395({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_397 = __VLS_396({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_396));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_400 } = __VLS_398.slots;
        {
            const { header: __VLS_401 } = __VLS_398.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_402;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_403 = __VLS_asFunctionalComponent1(__VLS_402, new __VLS_402({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.integrationHealth.q),
            placeholder: "按租户、接入名称、健康状态搜索",
        }));
        const __VLS_404 = __VLS_403({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.integrationHealth.q),
            placeholder: "按租户、接入名称、健康状态搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_403));
        let __VLS_407;
        const __VLS_408 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadIntegrationHealth) });
        var __VLS_405;
        var __VLS_406;
        let __VLS_409;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_410 = __VLS_asFunctionalComponent1(__VLS_409, new __VLS_409({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.tenant_id),
            placeholder: "租户ID",
            clearable: true,
        }));
        const __VLS_411 = __VLS_410({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.tenant_id),
            placeholder: "租户ID",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_410));
        let __VLS_414;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_415 = __VLS_asFunctionalComponent1(__VLS_414, new __VLS_414({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.status),
            placeholder: "接入状态",
            clearable: true,
        }));
        const __VLS_416 = __VLS_415({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.status),
            placeholder: "接入状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_415));
        const { default: __VLS_419 } = __VLS_417.slots;
        let __VLS_420;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_421 = __VLS_asFunctionalComponent1(__VLS_420, new __VLS_420({
            label: "active",
            value: "active",
        }));
        const __VLS_422 = __VLS_421({
            label: "active",
            value: "active",
        }, ...__VLS_functionalComponentArgsRest(__VLS_421));
        let __VLS_425;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_426 = __VLS_asFunctionalComponent1(__VLS_425, new __VLS_425({
            label: "disabled",
            value: "disabled",
        }));
        const __VLS_427 = __VLS_426({
            label: "disabled",
            value: "disabled",
        }, ...__VLS_functionalComponentArgsRest(__VLS_426));
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_417;
        let __VLS_430;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_431 = __VLS_asFunctionalComponent1(__VLS_430, new __VLS_430({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.connectivity_status),
            placeholder: "连接状态",
            clearable: true,
        }));
        const __VLS_432 = __VLS_431({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.connectivity_status),
            placeholder: "连接状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_431));
        const { default: __VLS_435 } = __VLS_433.slots;
        let __VLS_436;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_437 = __VLS_asFunctionalComponent1(__VLS_436, new __VLS_436({
            label: "reachable",
            value: "reachable",
        }));
        const __VLS_438 = __VLS_437({
            label: "reachable",
            value: "reachable",
        }, ...__VLS_functionalComponentArgsRest(__VLS_437));
        let __VLS_441;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_442 = __VLS_asFunctionalComponent1(__VLS_441, new __VLS_441({
            label: "missing_config",
            value: "missing_config",
        }));
        const __VLS_443 = __VLS_442({
            label: "missing_config",
            value: "missing_config",
        }, ...__VLS_functionalComponentArgsRest(__VLS_442));
        let __VLS_446;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_447 = __VLS_asFunctionalComponent1(__VLS_446, new __VLS_446({
            label: "disabled",
            value: "disabled",
        }));
        const __VLS_448 = __VLS_447({
            label: "disabled",
            value: "disabled",
        }, ...__VLS_functionalComponentArgsRest(__VLS_447));
        // @ts-ignore
        [store,];
        var __VLS_433;
        let __VLS_451;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_452 = __VLS_asFunctionalComponent1(__VLS_451, new __VLS_451({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.health_status),
            placeholder: "健康状态",
            clearable: true,
        }));
        const __VLS_453 = __VLS_452({
            modelValue: (__VLS_ctx.store.integrationHealthFilters.health_status),
            placeholder: "健康状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_452));
        const { default: __VLS_456 } = __VLS_454.slots;
        let __VLS_457;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_458 = __VLS_asFunctionalComponent1(__VLS_457, new __VLS_457({
            label: "healthy",
            value: "healthy",
        }));
        const __VLS_459 = __VLS_458({
            label: "healthy",
            value: "healthy",
        }, ...__VLS_functionalComponentArgsRest(__VLS_458));
        let __VLS_462;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_463 = __VLS_asFunctionalComponent1(__VLS_462, new __VLS_462({
            label: "warning",
            value: "warning",
        }));
        const __VLS_464 = __VLS_463({
            label: "warning",
            value: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_463));
        let __VLS_467;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_468 = __VLS_asFunctionalComponent1(__VLS_467, new __VLS_467({
            label: "critical",
            value: "critical",
        }));
        const __VLS_469 = __VLS_468({
            label: "critical",
            value: "critical",
        }, ...__VLS_functionalComponentArgsRest(__VLS_468));
        let __VLS_472;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_473 = __VLS_asFunctionalComponent1(__VLS_472, new __VLS_472({
            label: "disabled",
            value: "disabled",
        }));
        const __VLS_474 = __VLS_473({
            label: "disabled",
            value: "disabled",
        }, ...__VLS_functionalComponentArgsRest(__VLS_473));
        // @ts-ignore
        [store,];
        var __VLS_454;
        let __VLS_477;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_478 = __VLS_asFunctionalComponent1(__VLS_477, new __VLS_477({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_479 = __VLS_478({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_478));
        let __VLS_482;
        const __VLS_483 = ({ click: {} },
            { onClick: (__VLS_ctx.applyIntegrationHealthFilters) });
        const { default: __VLS_484 } = __VLS_480.slots;
        // @ts-ignore
        [applyIntegrationHealthFilters,];
        var __VLS_480;
        var __VLS_481;
        let __VLS_485;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_486 = __VLS_asFunctionalComponent1(__VLS_485, new __VLS_485({
            ...{ 'onClick': {} },
        }));
        const __VLS_487 = __VLS_486({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_486));
        let __VLS_490;
        const __VLS_491 = ({ click: {} },
            { onClick: (__VLS_ctx.clearIntegrationHealthFilters) });
        const { default: __VLS_492 } = __VLS_488.slots;
        // @ts-ignore
        [clearIntegrationHealthFilters,];
        var __VLS_488;
        var __VLS_489;
        let __VLS_493;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_494 = __VLS_asFunctionalComponent1(__VLS_493, new __VLS_493({
            data: (__VLS_ctx.store.integrationHealth.items),
            stripe: true,
        }));
        const __VLS_495 = __VLS_494({
            data: (__VLS_ctx.store.integrationHealth.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_494));
        const { default: __VLS_498 } = __VLS_496.slots;
        let __VLS_499;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_500 = __VLS_asFunctionalComponent1(__VLS_499, new __VLS_499({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_501 = __VLS_500({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_500));
        let __VLS_504;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_505 = __VLS_asFunctionalComponent1(__VLS_504, new __VLS_504({
            prop: "integration_name",
            label: "接入名称",
            minWidth: "160",
        }));
        const __VLS_506 = __VLS_505({
            prop: "integration_name",
            label: "接入名称",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_505));
        let __VLS_509;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_510 = __VLS_asFunctionalComponent1(__VLS_509, new __VLS_509({
            prop: "integration_type",
            label: "接入类型",
            width: "100",
        }));
        const __VLS_511 = __VLS_510({
            prop: "integration_type",
            label: "接入类型",
            width: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_510));
        let __VLS_514;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_515 = __VLS_asFunctionalComponent1(__VLS_514, new __VLS_514({
            label: "连接状态",
            width: "110",
        }));
        const __VLS_516 = __VLS_515({
            label: "连接状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_515));
        const { default: __VLS_519 } = __VLS_517.slots;
        {
            const { default: __VLS_520 } = __VLS_517.slots;
            const [{ row }] = __VLS_vSlot(__VLS_520);
            let __VLS_521;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_522 = __VLS_asFunctionalComponent1(__VLS_521, new __VLS_521({
                type: (row.connectivity_status === 'reachable' ? 'success' : row.connectivity_status === 'missing_config' ? 'warning' : 'info'),
            }));
            const __VLS_523 = __VLS_522({
                type: (row.connectivity_status === 'reachable' ? 'success' : row.connectivity_status === 'missing_config' ? 'warning' : 'info'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_522));
            const { default: __VLS_526 } = __VLS_524.slots;
            (__VLS_ctx.toChineseHealth(row.connectivity_status));
            // @ts-ignore
            [store, toChineseHealth,];
            var __VLS_524;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_517;
        let __VLS_527;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_528 = __VLS_asFunctionalComponent1(__VLS_527, new __VLS_527({
            label: "健康状态",
            width: "110",
        }));
        const __VLS_529 = __VLS_528({
            label: "健康状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_528));
        const { default: __VLS_532 } = __VLS_530.slots;
        {
            const { default: __VLS_533 } = __VLS_530.slots;
            const [{ row }] = __VLS_vSlot(__VLS_533);
            let __VLS_534;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_535 = __VLS_asFunctionalComponent1(__VLS_534, new __VLS_534({
                type: (row.health_status === 'healthy' ? 'success' : row.health_status === 'warning' ? 'warning' : row.health_status === 'critical' ? 'danger' : 'info'),
            }));
            const __VLS_536 = __VLS_535({
                type: (row.health_status === 'healthy' ? 'success' : row.health_status === 'warning' ? 'warning' : row.health_status === 'critical' ? 'danger' : 'info'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_535));
            const { default: __VLS_539 } = __VLS_537.slots;
            (__VLS_ctx.toChineseHealth(row.health_status));
            // @ts-ignore
            [toChineseHealth,];
            var __VLS_537;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_530;
        let __VLS_540;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_541 = __VLS_asFunctionalComponent1(__VLS_540, new __VLS_540({
            prop: "last_product_sync_at",
            label: "最近同步时间",
            minWidth: "180",
        }));
        const __VLS_542 = __VLS_541({
            prop: "last_product_sync_at",
            label: "最近同步时间",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_541));
        let __VLS_545;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_546 = __VLS_asFunctionalComponent1(__VLS_545, new __VLS_545({
            prop: "last_push_at",
            label: "最近推送时间",
            minWidth: "180",
        }));
        const __VLS_547 = __VLS_546({
            prop: "last_push_at",
            label: "最近推送时间",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_546));
        let __VLS_550;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_551 = __VLS_asFunctionalComponent1(__VLS_550, new __VLS_550({
            prop: "push_success_rate",
            label: "推送成功率(%)",
            width: "130",
        }));
        const __VLS_552 = __VLS_551({
            prop: "push_success_rate",
            label: "推送成功率(%)",
            width: "130",
        }, ...__VLS_functionalComponentArgsRest(__VLS_551));
        let __VLS_555;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_556 = __VLS_asFunctionalComponent1(__VLS_555, new __VLS_555({
            prop: "open_alert_count",
            label: "未处理告警",
            width: "110",
        }));
        const __VLS_557 = __VLS_556({
            prop: "open_alert_count",
            label: "未处理告警",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_556));
        // @ts-ignore
        [];
        var __VLS_496;
        let __VLS_560;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_561 = __VLS_asFunctionalComponent1(__VLS_560, new __VLS_560({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.integrationHealth.total),
            pageSize: (__VLS_ctx.store.integrationHealth.pageSize),
            currentPage: (__VLS_ctx.store.integrationHealth.page),
        }));
        const __VLS_562 = __VLS_561({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.integrationHealth.total),
            pageSize: (__VLS_ctx.store.integrationHealth.pageSize),
            currentPage: (__VLS_ctx.store.integrationHealth.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_561));
        let __VLS_565;
        const __VLS_566 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadIntegrationHealth) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_563;
        var __VLS_564;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_398;
    }
    else if (__VLS_ctx.activeMenu === 'alerts') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_567;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_568 = __VLS_asFunctionalComponent1(__VLS_567, new __VLS_567({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_569 = __VLS_568({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_568));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_572 } = __VLS_570.slots;
        {
            const { header: __VLS_573 } = __VLS_570.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_574;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_575 = __VLS_asFunctionalComponent1(__VLS_574, new __VLS_574({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.alerts.q),
            placeholder: "按分类、租户、店铺、详情搜索",
        }));
        const __VLS_576 = __VLS_575({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.alerts.q),
            placeholder: "按分类、租户、店铺、详情搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_575));
        let __VLS_579;
        const __VLS_580 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadAlerts) });
        var __VLS_577;
        var __VLS_578;
        let __VLS_581;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_582 = __VLS_asFunctionalComponent1(__VLS_581, new __VLS_581({
            modelValue: (__VLS_ctx.store.alertFilters.category),
            placeholder: "告警分类",
            clearable: true,
        }));
        const __VLS_583 = __VLS_582({
            modelValue: (__VLS_ctx.store.alertFilters.category),
            placeholder: "告警分类",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_582));
        const { default: __VLS_586 } = __VLS_584.slots;
        let __VLS_587;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_588 = __VLS_asFunctionalComponent1(__VLS_587, new __VLS_587({
            label: "push_task",
            value: "push_task",
        }));
        const __VLS_589 = __VLS_588({
            label: "push_task",
            value: "push_task",
        }, ...__VLS_functionalComponentArgsRest(__VLS_588));
        let __VLS_592;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_593 = __VLS_asFunctionalComponent1(__VLS_592, new __VLS_592({
            label: "push_log",
            value: "push_log",
        }));
        const __VLS_594 = __VLS_593({
            label: "push_log",
            value: "push_log",
        }, ...__VLS_functionalComponentArgsRest(__VLS_593));
        let __VLS_597;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_598 = __VLS_asFunctionalComponent1(__VLS_597, new __VLS_597({
            label: "product_sync",
            value: "product_sync",
        }));
        const __VLS_599 = __VLS_598({
            label: "product_sync",
            value: "product_sync",
        }, ...__VLS_functionalComponentArgsRest(__VLS_598));
        // @ts-ignore
        [store, store, store,];
        var __VLS_584;
        let __VLS_602;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_603 = __VLS_asFunctionalComponent1(__VLS_602, new __VLS_602({
            modelValue: (__VLS_ctx.store.alertFilters.severity),
            placeholder: "告警级别",
            clearable: true,
        }));
        const __VLS_604 = __VLS_603({
            modelValue: (__VLS_ctx.store.alertFilters.severity),
            placeholder: "告警级别",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_603));
        const { default: __VLS_607 } = __VLS_605.slots;
        let __VLS_608;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_609 = __VLS_asFunctionalComponent1(__VLS_608, new __VLS_608({
            label: "critical",
            value: "critical",
        }));
        const __VLS_610 = __VLS_609({
            label: "critical",
            value: "critical",
        }, ...__VLS_functionalComponentArgsRest(__VLS_609));
        let __VLS_613;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_614 = __VLS_asFunctionalComponent1(__VLS_613, new __VLS_613({
            label: "warning",
            value: "warning",
        }));
        const __VLS_615 = __VLS_614({
            label: "warning",
            value: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_614));
        // @ts-ignore
        [store,];
        var __VLS_605;
        let __VLS_618;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_619 = __VLS_asFunctionalComponent1(__VLS_618, new __VLS_618({
            modelValue: (__VLS_ctx.store.alertFilters.handling_status),
            placeholder: "处理状态",
            clearable: true,
        }));
        const __VLS_620 = __VLS_619({
            modelValue: (__VLS_ctx.store.alertFilters.handling_status),
            placeholder: "处理状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_619));
        const { default: __VLS_623 } = __VLS_621.slots;
        let __VLS_624;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_625 = __VLS_asFunctionalComponent1(__VLS_624, new __VLS_624({
            label: "open",
            value: "open",
        }));
        const __VLS_626 = __VLS_625({
            label: "open",
            value: "open",
        }, ...__VLS_functionalComponentArgsRest(__VLS_625));
        let __VLS_629;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_630 = __VLS_asFunctionalComponent1(__VLS_629, new __VLS_629({
            label: "resolved",
            value: "resolved",
        }));
        const __VLS_631 = __VLS_630({
            label: "resolved",
            value: "resolved",
        }, ...__VLS_functionalComponentArgsRest(__VLS_630));
        let __VLS_634;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_635 = __VLS_asFunctionalComponent1(__VLS_634, new __VLS_634({
            label: "ignored",
            value: "ignored",
        }));
        const __VLS_636 = __VLS_635({
            label: "ignored",
            value: "ignored",
        }, ...__VLS_functionalComponentArgsRest(__VLS_635));
        // @ts-ignore
        [store,];
        var __VLS_621;
        let __VLS_639;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_640 = __VLS_asFunctionalComponent1(__VLS_639, new __VLS_639({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_641 = __VLS_640({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_640));
        let __VLS_644;
        const __VLS_645 = ({ click: {} },
            { onClick: (__VLS_ctx.applyAlertFilters) });
        const { default: __VLS_646 } = __VLS_642.slots;
        // @ts-ignore
        [applyAlertFilters,];
        var __VLS_642;
        var __VLS_643;
        let __VLS_647;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_648 = __VLS_asFunctionalComponent1(__VLS_647, new __VLS_647({
            ...{ 'onClick': {} },
        }));
        const __VLS_649 = __VLS_648({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_648));
        let __VLS_652;
        const __VLS_653 = ({ click: {} },
            { onClick: (__VLS_ctx.clearAlertFilters) });
        const { default: __VLS_654 } = __VLS_650.slots;
        // @ts-ignore
        [clearAlertFilters,];
        var __VLS_650;
        var __VLS_651;
        let __VLS_655;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_656 = __VLS_asFunctionalComponent1(__VLS_655, new __VLS_655({
            data: (__VLS_ctx.store.alerts.items),
            stripe: true,
        }));
        const __VLS_657 = __VLS_656({
            data: (__VLS_ctx.store.alerts.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_656));
        const { default: __VLS_660 } = __VLS_658.slots;
        let __VLS_661;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_662 = __VLS_asFunctionalComponent1(__VLS_661, new __VLS_661({
            prop: "title",
            label: "告警标题",
            minWidth: "180",
        }));
        const __VLS_663 = __VLS_662({
            prop: "title",
            label: "告警标题",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_662));
        let __VLS_666;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_667 = __VLS_asFunctionalComponent1(__VLS_666, new __VLS_666({
            label: "级别",
            width: "90",
        }));
        const __VLS_668 = __VLS_667({
            label: "级别",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_667));
        const { default: __VLS_671 } = __VLS_669.slots;
        {
            const { default: __VLS_672 } = __VLS_669.slots;
            const [{ row }] = __VLS_vSlot(__VLS_672);
            let __VLS_673;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_674 = __VLS_asFunctionalComponent1(__VLS_673, new __VLS_673({
                type: (row.severity === 'critical' ? 'danger' : 'warning'),
            }));
            const __VLS_675 = __VLS_674({
                type: (row.severity === 'critical' ? 'danger' : 'warning'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_674));
            const { default: __VLS_678 } = __VLS_676.slots;
            (__VLS_ctx.toChineseSeverity(row.severity));
            // @ts-ignore
            [store, toChineseSeverity,];
            var __VLS_676;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_669;
        let __VLS_679;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_680 = __VLS_asFunctionalComponent1(__VLS_679, new __VLS_679({
            label: "分类",
            width: "110",
        }));
        const __VLS_681 = __VLS_680({
            label: "分类",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_680));
        const { default: __VLS_684 } = __VLS_682.slots;
        {
            const { default: __VLS_685 } = __VLS_682.slots;
            const [{ row }] = __VLS_vSlot(__VLS_685);
            (__VLS_ctx.toChineseCategory(row.category));
            // @ts-ignore
            [toChineseCategory,];
        }
        // @ts-ignore
        [];
        var __VLS_682;
        let __VLS_686;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_687 = __VLS_asFunctionalComponent1(__VLS_686, new __VLS_686({
            prop: "tenant_name",
            label: "租户",
            minWidth: "120",
        }));
        const __VLS_688 = __VLS_687({
            prop: "tenant_name",
            label: "租户",
            minWidth: "120",
        }, ...__VLS_functionalComponentArgsRest(__VLS_687));
        let __VLS_691;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_692 = __VLS_asFunctionalComponent1(__VLS_691, new __VLS_691({
            prop: "shop_name",
            label: "店铺",
            minWidth: "120",
        }));
        const __VLS_693 = __VLS_692({
            prop: "shop_name",
            label: "店铺",
            minWidth: "120",
        }, ...__VLS_functionalComponentArgsRest(__VLS_692));
        let __VLS_696;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_697 = __VLS_asFunctionalComponent1(__VLS_696, new __VLS_696({
            prop: "detail",
            label: "详情",
            minWidth: "260",
        }));
        const __VLS_698 = __VLS_697({
            prop: "detail",
            label: "详情",
            minWidth: "260",
        }, ...__VLS_functionalComponentArgsRest(__VLS_697));
        let __VLS_701;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_702 = __VLS_asFunctionalComponent1(__VLS_701, new __VLS_701({
            label: "处理状态",
            width: "110",
        }));
        const __VLS_703 = __VLS_702({
            label: "处理状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_702));
        const { default: __VLS_706 } = __VLS_704.slots;
        {
            const { default: __VLS_707 } = __VLS_704.slots;
            const [{ row }] = __VLS_vSlot(__VLS_707);
            let __VLS_708;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_709 = __VLS_asFunctionalComponent1(__VLS_708, new __VLS_708({
                type: (row.handling_status === 'open' ? 'danger' : 'info'),
            }));
            const __VLS_710 = __VLS_709({
                type: (row.handling_status === 'open' ? 'danger' : 'info'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_709));
            const { default: __VLS_713 } = __VLS_711.slots;
            (row.handling_status);
            // @ts-ignore
            [];
            var __VLS_711;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_704;
        let __VLS_714;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_715 = __VLS_asFunctionalComponent1(__VLS_714, new __VLS_714({
            prop: "handled_by_username",
            label: "处理人",
            width: "100",
        }));
        const __VLS_716 = __VLS_715({
            prop: "handled_by_username",
            label: "处理人",
            width: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_715));
        let __VLS_719;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_720 = __VLS_asFunctionalComponent1(__VLS_719, new __VLS_719({
            label: "操作",
            width: "160",
        }));
        const __VLS_721 = __VLS_720({
            label: "操作",
            width: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_720));
        const { default: __VLS_724 } = __VLS_722.slots;
        {
            const { default: __VLS_725 } = __VLS_722.slots;
            const [{ row }] = __VLS_vSlot(__VLS_725);
            let __VLS_726;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_727 = __VLS_asFunctionalComponent1(__VLS_726, new __VLS_726({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
                disabled: (row.handling_status !== 'open'),
            }));
            const __VLS_728 = __VLS_727({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
                disabled: (row.handling_status !== 'open'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_727));
            let __VLS_731;
            const __VLS_732 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'shops'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integrations'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integration-health'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'alerts'))
                            return;
                        __VLS_ctx.handleAlertAction(row.resource_type, row.resource_id, 'resolved');
                        // @ts-ignore
                        [handleAlertAction,];
                    } });
            const { default: __VLS_733 } = __VLS_729.slots;
            // @ts-ignore
            [];
            var __VLS_729;
            var __VLS_730;
            let __VLS_734;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_735 = __VLS_asFunctionalComponent1(__VLS_734, new __VLS_734({
                ...{ 'onClick': {} },
                link: true,
                disabled: (row.handling_status !== 'open'),
            }));
            const __VLS_736 = __VLS_735({
                ...{ 'onClick': {} },
                link: true,
                disabled: (row.handling_status !== 'open'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_735));
            let __VLS_739;
            const __VLS_740 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'shops'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integrations'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integration-health'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'alerts'))
                            return;
                        __VLS_ctx.handleAlertAction(row.resource_type, row.resource_id, 'ignored');
                        // @ts-ignore
                        [handleAlertAction,];
                    } });
            const { default: __VLS_741 } = __VLS_737.slots;
            // @ts-ignore
            [];
            var __VLS_737;
            var __VLS_738;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_722;
        // @ts-ignore
        [];
        var __VLS_658;
        let __VLS_742;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_743 = __VLS_asFunctionalComponent1(__VLS_742, new __VLS_742({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.alerts.total),
            pageSize: (__VLS_ctx.store.alerts.pageSize),
            currentPage: (__VLS_ctx.store.alerts.page),
        }));
        const __VLS_744 = __VLS_743({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.alerts.total),
            pageSize: (__VLS_ctx.store.alerts.pageSize),
            currentPage: (__VLS_ctx.store.alerts.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_743));
        let __VLS_747;
        const __VLS_748 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadAlerts) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_745;
        var __VLS_746;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_570;
    }
    else if (__VLS_ctx.activeMenu === 'audit') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_749;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_750 = __VLS_asFunctionalComponent1(__VLS_749, new __VLS_749({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_751 = __VLS_750({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_750));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_754 } = __VLS_752.slots;
        {
            const { header: __VLS_755 } = __VLS_752.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_756;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_757 = __VLS_asFunctionalComponent1(__VLS_756, new __VLS_756({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.auditLogs.q),
            placeholder: "按管理员、动作、资源或摘要搜索",
        }));
        const __VLS_758 = __VLS_757({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.auditLogs.q),
            placeholder: "按管理员、动作、资源或摘要搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_757));
        let __VLS_761;
        const __VLS_762 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadAuditLogs) });
        var __VLS_759;
        var __VLS_760;
        let __VLS_763;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_764 = __VLS_asFunctionalComponent1(__VLS_763, new __VLS_763({
            data: (__VLS_ctx.store.auditLogs.items),
            stripe: true,
        }));
        const __VLS_765 = __VLS_764({
            data: (__VLS_ctx.store.auditLogs.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_764));
        const { default: __VLS_768 } = __VLS_766.slots;
        let __VLS_769;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_770 = __VLS_asFunctionalComponent1(__VLS_769, new __VLS_769({
            prop: "admin_username",
            label: "管理员",
            width: "120",
        }));
        const __VLS_771 = __VLS_770({
            prop: "admin_username",
            label: "管理员",
            width: "120",
        }, ...__VLS_functionalComponentArgsRest(__VLS_770));
        let __VLS_774;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_775 = __VLS_asFunctionalComponent1(__VLS_774, new __VLS_774({
            prop: "action",
            label: "动作编码",
            minWidth: "160",
        }));
        const __VLS_776 = __VLS_775({
            prop: "action",
            label: "动作编码",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_775));
        let __VLS_779;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_780 = __VLS_asFunctionalComponent1(__VLS_779, new __VLS_779({
            prop: "resource_type",
            label: "资源类型",
            width: "140",
        }));
        const __VLS_781 = __VLS_780({
            prop: "resource_type",
            label: "资源类型",
            width: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_780));
        let __VLS_784;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_785 = __VLS_asFunctionalComponent1(__VLS_784, new __VLS_784({
            prop: "summary",
            label: "操作摘要",
            minWidth: "280",
        }));
        const __VLS_786 = __VLS_785({
            prop: "summary",
            label: "操作摘要",
            minWidth: "280",
        }, ...__VLS_functionalComponentArgsRest(__VLS_785));
        let __VLS_789;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_790 = __VLS_asFunctionalComponent1(__VLS_789, new __VLS_789({
            prop: "created_at",
            label: "操作时间",
            minWidth: "180",
        }));
        const __VLS_791 = __VLS_790({
            prop: "created_at",
            label: "操作时间",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_790));
        // @ts-ignore
        [store, store, store,];
        var __VLS_766;
        let __VLS_794;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_795 = __VLS_asFunctionalComponent1(__VLS_794, new __VLS_794({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.auditLogs.total),
            pageSize: (__VLS_ctx.store.auditLogs.pageSize),
            currentPage: (__VLS_ctx.store.auditLogs.page),
        }));
        const __VLS_796 = __VLS_795({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.auditLogs.total),
            pageSize: (__VLS_ctx.store.auditLogs.pageSize),
            currentPage: (__VLS_ctx.store.auditLogs.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_795));
        let __VLS_799;
        const __VLS_800 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadAuditLogs) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_797;
        var __VLS_798;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_752;
    }
    else if (__VLS_ctx.activeMenu === 'source-products') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_801;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_802 = __VLS_asFunctionalComponent1(__VLS_801, new __VLS_801({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_803 = __VLS_802({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_802));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_806 } = __VLS_804.slots;
        {
            const { header: __VLS_807 } = __VLS_804.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_808;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_809 = __VLS_asFunctionalComponent1(__VLS_808, new __VLS_808({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.sourceProducts.q),
            placeholder: "按租户、来源商品ID、名称搜索",
        }));
        const __VLS_810 = __VLS_809({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.sourceProducts.q),
            placeholder: "按租户、来源商品ID、名称搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_809));
        let __VLS_813;
        const __VLS_814 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadSourceProducts) });
        var __VLS_811;
        var __VLS_812;
        let __VLS_815;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_816 = __VLS_asFunctionalComponent1(__VLS_815, new __VLS_815({
            data: (__VLS_ctx.store.sourceProducts.items),
            stripe: true,
        }));
        const __VLS_817 = __VLS_816({
            data: (__VLS_ctx.store.sourceProducts.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_816));
        const { default: __VLS_820 } = __VLS_818.slots;
        let __VLS_821;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_822 = __VLS_asFunctionalComponent1(__VLS_821, new __VLS_821({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_823 = __VLS_822({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_822));
        let __VLS_826;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_827 = __VLS_asFunctionalComponent1(__VLS_826, new __VLS_826({
            prop: "integration_name",
            label: "来源接入",
            minWidth: "140",
        }));
        const __VLS_828 = __VLS_827({
            prop: "integration_name",
            label: "来源接入",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_827));
        let __VLS_831;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_832 = __VLS_asFunctionalComponent1(__VLS_831, new __VLS_831({
            prop: "source_product_id",
            label: "来源商品ID",
            minWidth: "140",
        }));
        const __VLS_833 = __VLS_832({
            prop: "source_product_id",
            label: "来源商品ID",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_832));
        let __VLS_836;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_837 = __VLS_asFunctionalComponent1(__VLS_836, new __VLS_836({
            prop: "name",
            label: "商品名称",
            minWidth: "180",
        }));
        const __VLS_838 = __VLS_837({
            prop: "name",
            label: "商品名称",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_837));
        let __VLS_841;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_842 = __VLS_asFunctionalComponent1(__VLS_841, new __VLS_841({
            prop: "sync_status",
            label: "同步状态",
            width: "110",
        }));
        const __VLS_843 = __VLS_842({
            prop: "sync_status",
            label: "同步状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_842));
        let __VLS_846;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_847 = __VLS_asFunctionalComponent1(__VLS_846, new __VLS_846({
            label: "操作",
            width: "90",
        }));
        const __VLS_848 = __VLS_847({
            label: "操作",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_847));
        const { default: __VLS_851 } = __VLS_849.slots;
        {
            const { default: __VLS_852 } = __VLS_849.slots;
            const [{ row }] = __VLS_vSlot(__VLS_852);
            let __VLS_853;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_854 = __VLS_asFunctionalComponent1(__VLS_853, new __VLS_853({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_855 = __VLS_854({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_854));
            let __VLS_858;
            const __VLS_859 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'shops'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integrations'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integration-health'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'alerts'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'audit'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'source-products'))
                            return;
                        __VLS_ctx.openPublishDialog(row.id);
                        // @ts-ignore
                        [store, store, store, openPublishDialog,];
                    } });
            const { default: __VLS_860 } = __VLS_856.slots;
            // @ts-ignore
            [];
            var __VLS_856;
            var __VLS_857;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_849;
        // @ts-ignore
        [];
        var __VLS_818;
        let __VLS_861;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_862 = __VLS_asFunctionalComponent1(__VLS_861, new __VLS_861({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.sourceProducts.total),
            pageSize: (__VLS_ctx.store.sourceProducts.pageSize),
            currentPage: (__VLS_ctx.store.sourceProducts.page),
        }));
        const __VLS_863 = __VLS_862({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.sourceProducts.total),
            pageSize: (__VLS_ctx.store.sourceProducts.pageSize),
            currentPage: (__VLS_ctx.store.sourceProducts.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_862));
        let __VLS_866;
        const __VLS_867 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadSourceProducts) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_864;
        var __VLS_865;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_804;
    }
    else if (__VLS_ctx.activeMenu === 'channel-products') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_868;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_869 = __VLS_asFunctionalComponent1(__VLS_868, new __VLS_868({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_870 = __VLS_869({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_869));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_873 } = __VLS_871.slots;
        {
            const { header: __VLS_874 } = __VLS_871.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_875;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_876 = __VLS_asFunctionalComponent1(__VLS_875, new __VLS_875({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.channelProducts.q),
            placeholder: "按租户、店铺、商品标题搜索",
        }));
        const __VLS_877 = __VLS_876({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.channelProducts.q),
            placeholder: "按租户、店铺、商品标题搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_876));
        let __VLS_880;
        const __VLS_881 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadChannelProducts) });
        var __VLS_878;
        var __VLS_879;
        let __VLS_882;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_883 = __VLS_asFunctionalComponent1(__VLS_882, new __VLS_882({
            data: (__VLS_ctx.store.channelProducts.items),
            stripe: true,
        }));
        const __VLS_884 = __VLS_883({
            data: (__VLS_ctx.store.channelProducts.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_883));
        const { default: __VLS_887 } = __VLS_885.slots;
        let __VLS_888;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_889 = __VLS_asFunctionalComponent1(__VLS_888, new __VLS_888({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_890 = __VLS_889({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_889));
        let __VLS_893;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_894 = __VLS_asFunctionalComponent1(__VLS_893, new __VLS_893({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }));
        const __VLS_895 = __VLS_894({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_894));
        let __VLS_898;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_899 = __VLS_asFunctionalComponent1(__VLS_898, new __VLS_898({
            prop: "source_product_name",
            label: "源商品",
            minWidth: "160",
        }));
        const __VLS_900 = __VLS_899({
            prop: "source_product_name",
            label: "源商品",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_899));
        let __VLS_903;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_904 = __VLS_asFunctionalComponent1(__VLS_903, new __VLS_903({
            prop: "title",
            label: "渠道商品标题",
            minWidth: "180",
        }));
        const __VLS_905 = __VLS_904({
            prop: "title",
            label: "渠道商品标题",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_904));
        let __VLS_908;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_909 = __VLS_asFunctionalComponent1(__VLS_908, new __VLS_908({
            label: "状态",
            width: "90",
        }));
        const __VLS_910 = __VLS_909({
            label: "状态",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_909));
        const { default: __VLS_913 } = __VLS_911.slots;
        {
            const { default: __VLS_914 } = __VLS_911.slots;
            const [{ row }] = __VLS_vSlot(__VLS_914);
            let __VLS_915;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_916 = __VLS_asFunctionalComponent1(__VLS_915, new __VLS_915({
                type: (__VLS_ctx.tagType(row.status)),
            }));
            const __VLS_917 = __VLS_916({
                type: (__VLS_ctx.tagType(row.status)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_916));
            const { default: __VLS_920 } = __VLS_918.slots;
            (row.status);
            // @ts-ignore
            [store, store, store, tagType,];
            var __VLS_918;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_911;
        // @ts-ignore
        [];
        var __VLS_885;
        let __VLS_921;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_922 = __VLS_asFunctionalComponent1(__VLS_921, new __VLS_921({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.channelProducts.total),
            pageSize: (__VLS_ctx.store.channelProducts.pageSize),
            currentPage: (__VLS_ctx.store.channelProducts.page),
        }));
        const __VLS_923 = __VLS_922({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.channelProducts.total),
            pageSize: (__VLS_ctx.store.channelProducts.pageSize),
            currentPage: (__VLS_ctx.store.channelProducts.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_922));
        let __VLS_926;
        const __VLS_927 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadChannelProducts) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_924;
        var __VLS_925;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_871;
    }
    else if (__VLS_ctx.activeMenu === 'orders') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_928;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_929 = __VLS_asFunctionalComponent1(__VLS_928, new __VLS_928({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_930 = __VLS_929({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_929));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_933 } = __VLS_931.slots;
        {
            const { header: __VLS_934 } = __VLS_931.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_935;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_936 = __VLS_asFunctionalComponent1(__VLS_935, new __VLS_935({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.orders.q),
            placeholder: "按租户、店铺、订单号搜索",
        }));
        const __VLS_937 = __VLS_936({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.orders.q),
            placeholder: "按租户、店铺、订单号搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_936));
        let __VLS_940;
        const __VLS_941 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadOrders) });
        var __VLS_938;
        var __VLS_939;
        let __VLS_942;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_943 = __VLS_asFunctionalComponent1(__VLS_942, new __VLS_942({
            modelValue: (__VLS_ctx.store.ordersFilters.tenant_id),
            placeholder: "租户ID",
            clearable: true,
        }));
        const __VLS_944 = __VLS_943({
            modelValue: (__VLS_ctx.store.ordersFilters.tenant_id),
            placeholder: "租户ID",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_943));
        let __VLS_947;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_948 = __VLS_asFunctionalComponent1(__VLS_947, new __VLS_947({
            modelValue: (__VLS_ctx.store.ordersFilters.shop_id),
            placeholder: "店铺ID",
            clearable: true,
        }));
        const __VLS_949 = __VLS_948({
            modelValue: (__VLS_ctx.store.ordersFilters.shop_id),
            placeholder: "店铺ID",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_948));
        let __VLS_952;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_953 = __VLS_asFunctionalComponent1(__VLS_952, new __VLS_952({
            modelValue: (__VLS_ctx.store.ordersFilters.status),
            placeholder: "订单状态",
            clearable: true,
        }));
        const __VLS_954 = __VLS_953({
            modelValue: (__VLS_ctx.store.ordersFilters.status),
            placeholder: "订单状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_953));
        const { default: __VLS_957 } = __VLS_955.slots;
        let __VLS_958;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_959 = __VLS_asFunctionalComponent1(__VLS_958, new __VLS_958({
            label: "created",
            value: "created",
        }));
        const __VLS_960 = __VLS_959({
            label: "created",
            value: "created",
        }, ...__VLS_functionalComponentArgsRest(__VLS_959));
        let __VLS_963;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_964 = __VLS_asFunctionalComponent1(__VLS_963, new __VLS_963({
            label: "cancelled",
            value: "cancelled",
        }));
        const __VLS_965 = __VLS_964({
            label: "cancelled",
            value: "cancelled",
        }, ...__VLS_functionalComponentArgsRest(__VLS_964));
        // @ts-ignore
        [store, store, store, store, store,];
        var __VLS_955;
        let __VLS_968;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_969 = __VLS_asFunctionalComponent1(__VLS_968, new __VLS_968({
            modelValue: (__VLS_ctx.store.ordersFilters.push_status),
            placeholder: "推送状态",
            clearable: true,
        }));
        const __VLS_970 = __VLS_969({
            modelValue: (__VLS_ctx.store.ordersFilters.push_status),
            placeholder: "推送状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_969));
        const { default: __VLS_973 } = __VLS_971.slots;
        let __VLS_974;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_975 = __VLS_asFunctionalComponent1(__VLS_974, new __VLS_974({
            label: "pending",
            value: "pending",
        }));
        const __VLS_976 = __VLS_975({
            label: "pending",
            value: "pending",
        }, ...__VLS_functionalComponentArgsRest(__VLS_975));
        let __VLS_979;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_980 = __VLS_asFunctionalComponent1(__VLS_979, new __VLS_979({
            label: "success",
            value: "success",
        }));
        const __VLS_981 = __VLS_980({
            label: "success",
            value: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_980));
        let __VLS_984;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_985 = __VLS_asFunctionalComponent1(__VLS_984, new __VLS_984({
            label: "retrying",
            value: "retrying",
        }));
        const __VLS_986 = __VLS_985({
            label: "retrying",
            value: "retrying",
        }, ...__VLS_functionalComponentArgsRest(__VLS_985));
        let __VLS_989;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_990 = __VLS_asFunctionalComponent1(__VLS_989, new __VLS_989({
            label: "failed",
            value: "failed",
        }));
        const __VLS_991 = __VLS_990({
            label: "failed",
            value: "failed",
        }, ...__VLS_functionalComponentArgsRest(__VLS_990));
        // @ts-ignore
        [store,];
        var __VLS_971;
        let __VLS_994;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_995 = __VLS_asFunctionalComponent1(__VLS_994, new __VLS_994({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_996 = __VLS_995({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_995));
        let __VLS_999;
        const __VLS_1000 = ({ click: {} },
            { onClick: (__VLS_ctx.applyOrderFilters) });
        const { default: __VLS_1001 } = __VLS_997.slots;
        // @ts-ignore
        [applyOrderFilters,];
        var __VLS_997;
        var __VLS_998;
        let __VLS_1002;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1003 = __VLS_asFunctionalComponent1(__VLS_1002, new __VLS_1002({
            ...{ 'onClick': {} },
        }));
        const __VLS_1004 = __VLS_1003({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1003));
        let __VLS_1007;
        const __VLS_1008 = ({ click: {} },
            { onClick: (__VLS_ctx.clearOrderFilters) });
        const { default: __VLS_1009 } = __VLS_1005.slots;
        // @ts-ignore
        [clearOrderFilters,];
        var __VLS_1005;
        var __VLS_1006;
        let __VLS_1010;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_1011 = __VLS_asFunctionalComponent1(__VLS_1010, new __VLS_1010({
            data: (__VLS_ctx.store.orders.items),
            stripe: true,
        }));
        const __VLS_1012 = __VLS_1011({
            data: (__VLS_ctx.store.orders.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1011));
        const { default: __VLS_1015 } = __VLS_1013.slots;
        let __VLS_1016;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1017 = __VLS_asFunctionalComponent1(__VLS_1016, new __VLS_1016({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_1018 = __VLS_1017({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1017));
        let __VLS_1021;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1022 = __VLS_asFunctionalComponent1(__VLS_1021, new __VLS_1021({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }));
        const __VLS_1023 = __VLS_1022({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1022));
        let __VLS_1026;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1027 = __VLS_asFunctionalComponent1(__VLS_1026, new __VLS_1026({
            prop: "order_no",
            label: "订单号",
            minWidth: "160",
        }));
        const __VLS_1028 = __VLS_1027({
            prop: "order_no",
            label: "订单号",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1027));
        let __VLS_1031;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1032 = __VLS_asFunctionalComponent1(__VLS_1031, new __VLS_1031({
            prop: "status",
            label: "订单状态",
            width: "110",
        }));
        const __VLS_1033 = __VLS_1032({
            prop: "status",
            label: "订单状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1032));
        let __VLS_1036;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1037 = __VLS_asFunctionalComponent1(__VLS_1036, new __VLS_1036({
            prop: "push_status",
            label: "推送状态",
            width: "110",
        }));
        const __VLS_1038 = __VLS_1037({
            prop: "push_status",
            label: "推送状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1037));
        let __VLS_1041;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1042 = __VLS_asFunctionalComponent1(__VLS_1041, new __VLS_1041({
            prop: "total_amount",
            label: "订单金额",
            width: "100",
        }));
        const __VLS_1043 = __VLS_1042({
            prop: "total_amount",
            label: "订单金额",
            width: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1042));
        // @ts-ignore
        [store,];
        var __VLS_1013;
        let __VLS_1046;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_1047 = __VLS_asFunctionalComponent1(__VLS_1046, new __VLS_1046({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.orders.total),
            pageSize: (__VLS_ctx.store.orders.pageSize),
            currentPage: (__VLS_ctx.store.orders.page),
        }));
        const __VLS_1048 = __VLS_1047({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.orders.total),
            pageSize: (__VLS_ctx.store.orders.pageSize),
            currentPage: (__VLS_ctx.store.orders.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1047));
        let __VLS_1051;
        const __VLS_1052 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadOrders) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_1049;
        var __VLS_1050;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_931;
    }
    else if (__VLS_ctx.activeMenu === 'push-tasks') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_1053;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_1054 = __VLS_asFunctionalComponent1(__VLS_1053, new __VLS_1053({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_1055 = __VLS_1054({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1054));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_1058 } = __VLS_1056.slots;
        {
            const { header: __VLS_1059 } = __VLS_1056.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_1060;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_1061 = __VLS_asFunctionalComponent1(__VLS_1060, new __VLS_1060({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.pushTasks.q),
            placeholder: "按租户、订单号、错误信息搜索",
        }));
        const __VLS_1062 = __VLS_1061({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.pushTasks.q),
            placeholder: "按租户、订单号、错误信息搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1061));
        let __VLS_1065;
        const __VLS_1066 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadPushTasks) });
        var __VLS_1063;
        var __VLS_1064;
        let __VLS_1067;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_1068 = __VLS_asFunctionalComponent1(__VLS_1067, new __VLS_1067({
            modelValue: (__VLS_ctx.store.pushTaskFilters.tenant_id),
            placeholder: "租户ID",
            clearable: true,
        }));
        const __VLS_1069 = __VLS_1068({
            modelValue: (__VLS_ctx.store.pushTaskFilters.tenant_id),
            placeholder: "租户ID",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1068));
        let __VLS_1072;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_1073 = __VLS_asFunctionalComponent1(__VLS_1072, new __VLS_1072({
            modelValue: (__VLS_ctx.store.pushTaskFilters.shop_id),
            placeholder: "店铺ID",
            clearable: true,
        }));
        const __VLS_1074 = __VLS_1073({
            modelValue: (__VLS_ctx.store.pushTaskFilters.shop_id),
            placeholder: "店铺ID",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1073));
        let __VLS_1077;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_1078 = __VLS_asFunctionalComponent1(__VLS_1077, new __VLS_1077({
            modelValue: (__VLS_ctx.store.pushTaskFilters.integration_id),
            placeholder: "接入ID",
            clearable: true,
        }));
        const __VLS_1079 = __VLS_1078({
            modelValue: (__VLS_ctx.store.pushTaskFilters.integration_id),
            placeholder: "接入ID",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1078));
        let __VLS_1082;
        /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
        elSelect;
        // @ts-ignore
        const __VLS_1083 = __VLS_asFunctionalComponent1(__VLS_1082, new __VLS_1082({
            modelValue: (__VLS_ctx.store.pushTaskFilters.status),
            placeholder: "任务状态",
            clearable: true,
        }));
        const __VLS_1084 = __VLS_1083({
            modelValue: (__VLS_ctx.store.pushTaskFilters.status),
            placeholder: "任务状态",
            clearable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1083));
        const { default: __VLS_1087 } = __VLS_1085.slots;
        let __VLS_1088;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1089 = __VLS_asFunctionalComponent1(__VLS_1088, new __VLS_1088({
            label: "pending",
            value: "pending",
        }));
        const __VLS_1090 = __VLS_1089({
            label: "pending",
            value: "pending",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1089));
        let __VLS_1093;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1094 = __VLS_asFunctionalComponent1(__VLS_1093, new __VLS_1093({
            label: "success",
            value: "success",
        }));
        const __VLS_1095 = __VLS_1094({
            label: "success",
            value: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1094));
        let __VLS_1098;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1099 = __VLS_asFunctionalComponent1(__VLS_1098, new __VLS_1098({
            label: "retrying",
            value: "retrying",
        }));
        const __VLS_1100 = __VLS_1099({
            label: "retrying",
            value: "retrying",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1099));
        let __VLS_1103;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1104 = __VLS_asFunctionalComponent1(__VLS_1103, new __VLS_1103({
            label: "failed",
            value: "failed",
        }));
        const __VLS_1105 = __VLS_1104({
            label: "failed",
            value: "failed",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1104));
        // @ts-ignore
        [store, store, store, store, store, store,];
        var __VLS_1085;
        let __VLS_1108;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1109 = __VLS_asFunctionalComponent1(__VLS_1108, new __VLS_1108({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_1110 = __VLS_1109({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1109));
        let __VLS_1113;
        const __VLS_1114 = ({ click: {} },
            { onClick: (__VLS_ctx.applyPushTaskFilters) });
        const { default: __VLS_1115 } = __VLS_1111.slots;
        // @ts-ignore
        [applyPushTaskFilters,];
        var __VLS_1111;
        var __VLS_1112;
        let __VLS_1116;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1117 = __VLS_asFunctionalComponent1(__VLS_1116, new __VLS_1116({
            ...{ 'onClick': {} },
        }));
        const __VLS_1118 = __VLS_1117({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1117));
        let __VLS_1121;
        const __VLS_1122 = ({ click: {} },
            { onClick: (__VLS_ctx.clearPushTaskFilters) });
        const { default: __VLS_1123 } = __VLS_1119.slots;
        // @ts-ignore
        [clearPushTaskFilters,];
        var __VLS_1119;
        var __VLS_1120;
        let __VLS_1124;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_1125 = __VLS_asFunctionalComponent1(__VLS_1124, new __VLS_1124({
            data: (__VLS_ctx.store.pushTasks.items),
            stripe: true,
        }));
        const __VLS_1126 = __VLS_1125({
            data: (__VLS_ctx.store.pushTasks.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1125));
        const { default: __VLS_1129 } = __VLS_1127.slots;
        let __VLS_1130;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1131 = __VLS_asFunctionalComponent1(__VLS_1130, new __VLS_1130({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_1132 = __VLS_1131({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1131));
        let __VLS_1135;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1136 = __VLS_asFunctionalComponent1(__VLS_1135, new __VLS_1135({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }));
        const __VLS_1137 = __VLS_1136({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1136));
        let __VLS_1140;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1141 = __VLS_asFunctionalComponent1(__VLS_1140, new __VLS_1140({
            prop: "order_no",
            label: "订单号",
            minWidth: "160",
        }));
        const __VLS_1142 = __VLS_1141({
            prop: "order_no",
            label: "订单号",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1141));
        let __VLS_1145;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1146 = __VLS_asFunctionalComponent1(__VLS_1145, new __VLS_1145({
            prop: "integration_name",
            label: "接入配置",
            minWidth: "140",
        }));
        const __VLS_1147 = __VLS_1146({
            prop: "integration_name",
            label: "接入配置",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1146));
        let __VLS_1150;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1151 = __VLS_asFunctionalComponent1(__VLS_1150, new __VLS_1150({
            prop: "status",
            label: "任务状态",
            width: "110",
        }));
        const __VLS_1152 = __VLS_1151({
            prop: "status",
            label: "任务状态",
            width: "110",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1151));
        let __VLS_1155;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1156 = __VLS_asFunctionalComponent1(__VLS_1155, new __VLS_1155({
            prop: "last_error",
            label: "最近错误",
            minWidth: "200",
        }));
        const __VLS_1157 = __VLS_1156({
            prop: "last_error",
            label: "最近错误",
            minWidth: "200",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1156));
        let __VLS_1160;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1161 = __VLS_asFunctionalComponent1(__VLS_1160, new __VLS_1160({
            label: "操作",
            width: "90",
        }));
        const __VLS_1162 = __VLS_1161({
            label: "操作",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1161));
        const { default: __VLS_1165 } = __VLS_1163.slots;
        {
            const { default: __VLS_1166 } = __VLS_1163.slots;
            const [{ row }] = __VLS_vSlot(__VLS_1166);
            let __VLS_1167;
            /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
            elButton;
            // @ts-ignore
            const __VLS_1168 = __VLS_asFunctionalComponent1(__VLS_1167, new __VLS_1167({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }));
            const __VLS_1169 = __VLS_1168({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1168));
            let __VLS_1172;
            const __VLS_1173 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.store.authenticated))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'overview'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'tenants'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'shops'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integrations'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'integration-health'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'alerts'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'audit'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'source-products'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'channel-products'))
                            return;
                        if (!!(__VLS_ctx.activeMenu === 'orders'))
                            return;
                        if (!(__VLS_ctx.activeMenu === 'push-tasks'))
                            return;
                        __VLS_ctx.handleRetryTask(row.id);
                        // @ts-ignore
                        [store, handleRetryTask,];
                    } });
            const { default: __VLS_1174 } = __VLS_1170.slots;
            // @ts-ignore
            [];
            var __VLS_1170;
            var __VLS_1171;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_1163;
        // @ts-ignore
        [];
        var __VLS_1127;
        let __VLS_1175;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_1176 = __VLS_asFunctionalComponent1(__VLS_1175, new __VLS_1175({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.pushTasks.total),
            pageSize: (__VLS_ctx.store.pushTasks.pageSize),
            currentPage: (__VLS_ctx.store.pushTasks.page),
        }));
        const __VLS_1177 = __VLS_1176({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.pushTasks.total),
            pageSize: (__VLS_ctx.store.pushTasks.pageSize),
            currentPage: (__VLS_ctx.store.pushTasks.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1176));
        let __VLS_1180;
        const __VLS_1181 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadPushTasks) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_1178;
        var __VLS_1179;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_1056;
    }
    else if (__VLS_ctx.activeMenu === 'push-logs') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "page-section" },
        });
        /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
        let __VLS_1182;
        /** @ts-ignore @type {typeof __VLS_components.elCard | typeof __VLS_components.ElCard | typeof __VLS_components.elCard | typeof __VLS_components.ElCard} */
        elCard;
        // @ts-ignore
        const __VLS_1183 = __VLS_asFunctionalComponent1(__VLS_1182, new __VLS_1182({
            ...{ class: "content-card" },
            shadow: "hover",
        }));
        const __VLS_1184 = __VLS_1183({
            ...{ class: "content-card" },
            shadow: "hover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1183));
        /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
        const { default: __VLS_1187 } = __VLS_1185.slots;
        {
            const { header: __VLS_1188 } = __VLS_1185.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-header" },
            });
            /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            // @ts-ignore
            [activeMenu,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-row" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-row']} */ ;
        let __VLS_1189;
        /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
        elInput;
        // @ts-ignore
        const __VLS_1190 = __VLS_asFunctionalComponent1(__VLS_1189, new __VLS_1189({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.pushLogs.q),
            placeholder: "按租户、店铺、订单号搜索",
        }));
        const __VLS_1191 = __VLS_1190({
            ...{ 'onChange': {} },
            modelValue: (__VLS_ctx.store.pushLogs.q),
            placeholder: "按租户、店铺、订单号搜索",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1190));
        let __VLS_1194;
        const __VLS_1195 = ({ change: {} },
            { onChange: (__VLS_ctx.store.loadPushLogs) });
        var __VLS_1192;
        var __VLS_1193;
        let __VLS_1196;
        /** @ts-ignore @type {typeof __VLS_components.elTable | typeof __VLS_components.ElTable | typeof __VLS_components.elTable | typeof __VLS_components.ElTable} */
        elTable;
        // @ts-ignore
        const __VLS_1197 = __VLS_asFunctionalComponent1(__VLS_1196, new __VLS_1196({
            data: (__VLS_ctx.store.pushLogs.items),
            stripe: true,
        }));
        const __VLS_1198 = __VLS_1197({
            data: (__VLS_ctx.store.pushLogs.items),
            stripe: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_1197));
        const { default: __VLS_1201 } = __VLS_1199.slots;
        let __VLS_1202;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1203 = __VLS_asFunctionalComponent1(__VLS_1202, new __VLS_1202({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }));
        const __VLS_1204 = __VLS_1203({
            prop: "tenant_name",
            label: "所属租户",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1203));
        let __VLS_1207;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1208 = __VLS_asFunctionalComponent1(__VLS_1207, new __VLS_1207({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }));
        const __VLS_1209 = __VLS_1208({
            prop: "shop_name",
            label: "店铺名称",
            minWidth: "140",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1208));
        let __VLS_1212;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1213 = __VLS_asFunctionalComponent1(__VLS_1212, new __VLS_1212({
            prop: "order_no",
            label: "订单号",
            minWidth: "160",
        }));
        const __VLS_1214 = __VLS_1213({
            prop: "order_no",
            label: "订单号",
            minWidth: "160",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1213));
        let __VLS_1217;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn | typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1218 = __VLS_asFunctionalComponent1(__VLS_1217, new __VLS_1217({
            label: "结果",
            width: "90",
        }));
        const __VLS_1219 = __VLS_1218({
            label: "结果",
            width: "90",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1218));
        const { default: __VLS_1222 } = __VLS_1220.slots;
        {
            const { default: __VLS_1223 } = __VLS_1220.slots;
            const [{ row }] = __VLS_vSlot(__VLS_1223);
            let __VLS_1224;
            /** @ts-ignore @type {typeof __VLS_components.elTag | typeof __VLS_components.ElTag | typeof __VLS_components.elTag | typeof __VLS_components.ElTag} */
            elTag;
            // @ts-ignore
            const __VLS_1225 = __VLS_asFunctionalComponent1(__VLS_1224, new __VLS_1224({
                type: (__VLS_ctx.tagType(row.success)),
            }));
            const __VLS_1226 = __VLS_1225({
                type: (__VLS_ctx.tagType(row.success)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1225));
            const { default: __VLS_1229 } = __VLS_1227.slots;
            (row.success ? '成功' : '失败');
            // @ts-ignore
            [store, store, store, tagType,];
            var __VLS_1227;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_1220;
        let __VLS_1230;
        /** @ts-ignore @type {typeof __VLS_components.elTableColumn | typeof __VLS_components.ElTableColumn} */
        elTableColumn;
        // @ts-ignore
        const __VLS_1231 = __VLS_asFunctionalComponent1(__VLS_1230, new __VLS_1230({
            prop: "pushed_at",
            label: "推送时间",
            minWidth: "180",
        }));
        const __VLS_1232 = __VLS_1231({
            prop: "pushed_at",
            label: "推送时间",
            minWidth: "180",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1231));
        // @ts-ignore
        [];
        var __VLS_1199;
        let __VLS_1235;
        /** @ts-ignore @type {typeof __VLS_components.elPagination | typeof __VLS_components.ElPagination} */
        elPagination;
        // @ts-ignore
        const __VLS_1236 = __VLS_asFunctionalComponent1(__VLS_1235, new __VLS_1235({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.pushLogs.total),
            pageSize: (__VLS_ctx.store.pushLogs.pageSize),
            currentPage: (__VLS_ctx.store.pushLogs.page),
        }));
        const __VLS_1237 = __VLS_1236({
            ...{ 'onCurrentChange': {} },
            ...{ class: "pager" },
            background: true,
            layout: "prev, pager, next",
            total: (__VLS_ctx.store.pushLogs.total),
            pageSize: (__VLS_ctx.store.pushLogs.pageSize),
            currentPage: (__VLS_ctx.store.pushLogs.page),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1236));
        let __VLS_1240;
        const __VLS_1241 = ({ currentChange: {} },
            { onCurrentChange: (__VLS_ctx.store.loadPushLogs) });
        /** @type {__VLS_StyleScopedClasses['pager']} */ ;
        var __VLS_1238;
        var __VLS_1239;
        // @ts-ignore
        [store, store, store, store,];
        var __VLS_1185;
    }
    let __VLS_1242;
    /** @ts-ignore @type {typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog} */
    elDialog;
    // @ts-ignore
    const __VLS_1243 = __VLS_asFunctionalComponent1(__VLS_1242, new __VLS_1242({
        modelValue: (__VLS_ctx.tenantDialogVisible),
        title: (__VLS_ctx.tenantEditingId === null ? '新建租户' : '编辑租户'),
        width: "520px",
    }));
    const __VLS_1244 = __VLS_1243({
        modelValue: (__VLS_ctx.tenantDialogVisible),
        title: (__VLS_ctx.tenantEditingId === null ? '新建租户' : '编辑租户'),
        width: "520px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1243));
    const { default: __VLS_1247 } = __VLS_1245.slots;
    let __VLS_1248;
    /** @ts-ignore @type {typeof __VLS_components.elForm | typeof __VLS_components.ElForm | typeof __VLS_components.elForm | typeof __VLS_components.ElForm} */
    elForm;
    // @ts-ignore
    const __VLS_1249 = __VLS_asFunctionalComponent1(__VLS_1248, new __VLS_1248({
        labelWidth: "100px",
    }));
    const __VLS_1250 = __VLS_1249({
        labelWidth: "100px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1249));
    const { default: __VLS_1253 } = __VLS_1251.slots;
    let __VLS_1254;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1255 = __VLS_asFunctionalComponent1(__VLS_1254, new __VLS_1254({
        label: "租户编码",
    }));
    const __VLS_1256 = __VLS_1255({
        label: "租户编码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1255));
    const { default: __VLS_1259 } = __VLS_1257.slots;
    let __VLS_1260;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1261 = __VLS_asFunctionalComponent1(__VLS_1260, new __VLS_1260({
        modelValue: (__VLS_ctx.tenantForm.tenant_code),
    }));
    const __VLS_1262 = __VLS_1261({
        modelValue: (__VLS_ctx.tenantForm.tenant_code),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1261));
    // @ts-ignore
    [tenantDialogVisible, tenantEditingId, tenantForm,];
    var __VLS_1257;
    let __VLS_1265;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1266 = __VLS_asFunctionalComponent1(__VLS_1265, new __VLS_1265({
        label: "租户名称",
    }));
    const __VLS_1267 = __VLS_1266({
        label: "租户名称",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1266));
    const { default: __VLS_1270 } = __VLS_1268.slots;
    let __VLS_1271;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1272 = __VLS_asFunctionalComponent1(__VLS_1271, new __VLS_1271({
        modelValue: (__VLS_ctx.tenantForm.name),
    }));
    const __VLS_1273 = __VLS_1272({
        modelValue: (__VLS_ctx.tenantForm.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1272));
    // @ts-ignore
    [tenantForm,];
    var __VLS_1268;
    let __VLS_1276;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1277 = __VLS_asFunctionalComponent1(__VLS_1276, new __VLS_1276({
        label: "状态",
    }));
    const __VLS_1278 = __VLS_1277({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1277));
    const { default: __VLS_1281 } = __VLS_1279.slots;
    let __VLS_1282;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1283 = __VLS_asFunctionalComponent1(__VLS_1282, new __VLS_1282({
        modelValue: (__VLS_ctx.tenantForm.status),
    }));
    const __VLS_1284 = __VLS_1283({
        modelValue: (__VLS_ctx.tenantForm.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1283));
    const { default: __VLS_1287 } = __VLS_1285.slots;
    let __VLS_1288;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1289 = __VLS_asFunctionalComponent1(__VLS_1288, new __VLS_1288({
        label: "active",
        value: "active",
    }));
    const __VLS_1290 = __VLS_1289({
        label: "active",
        value: "active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1289));
    let __VLS_1293;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1294 = __VLS_asFunctionalComponent1(__VLS_1293, new __VLS_1293({
        label: "disabled",
        value: "disabled",
    }));
    const __VLS_1295 = __VLS_1294({
        label: "disabled",
        value: "disabled",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1294));
    // @ts-ignore
    [tenantForm,];
    var __VLS_1285;
    // @ts-ignore
    [];
    var __VLS_1279;
    let __VLS_1298;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1299 = __VLS_asFunctionalComponent1(__VLS_1298, new __VLS_1298({
        label: "联系人",
    }));
    const __VLS_1300 = __VLS_1299({
        label: "联系人",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1299));
    const { default: __VLS_1303 } = __VLS_1301.slots;
    let __VLS_1304;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1305 = __VLS_asFunctionalComponent1(__VLS_1304, new __VLS_1304({
        modelValue: (__VLS_ctx.tenantForm.contact_name),
    }));
    const __VLS_1306 = __VLS_1305({
        modelValue: (__VLS_ctx.tenantForm.contact_name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1305));
    // @ts-ignore
    [tenantForm,];
    var __VLS_1301;
    let __VLS_1309;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1310 = __VLS_asFunctionalComponent1(__VLS_1309, new __VLS_1309({
        label: "手机号",
    }));
    const __VLS_1311 = __VLS_1310({
        label: "手机号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1310));
    const { default: __VLS_1314 } = __VLS_1312.slots;
    let __VLS_1315;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1316 = __VLS_asFunctionalComponent1(__VLS_1315, new __VLS_1315({
        modelValue: (__VLS_ctx.tenantForm.mobile),
    }));
    const __VLS_1317 = __VLS_1316({
        modelValue: (__VLS_ctx.tenantForm.mobile),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1316));
    // @ts-ignore
    [tenantForm,];
    var __VLS_1312;
    // @ts-ignore
    [];
    var __VLS_1251;
    {
        const { footer: __VLS_1320 } = __VLS_1245.slots;
        let __VLS_1321;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1322 = __VLS_asFunctionalComponent1(__VLS_1321, new __VLS_1321({
            ...{ 'onClick': {} },
        }));
        const __VLS_1323 = __VLS_1322({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1322));
        let __VLS_1326;
        const __VLS_1327 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.authenticated))
                        return;
                    __VLS_ctx.tenantDialogVisible = false;
                    // @ts-ignore
                    [tenantDialogVisible,];
                } });
        const { default: __VLS_1328 } = __VLS_1324.slots;
        // @ts-ignore
        [];
        var __VLS_1324;
        var __VLS_1325;
        let __VLS_1329;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1330 = __VLS_asFunctionalComponent1(__VLS_1329, new __VLS_1329({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_1331 = __VLS_1330({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1330));
        let __VLS_1334;
        const __VLS_1335 = ({ click: {} },
            { onClick: (__VLS_ctx.submitTenant) });
        const { default: __VLS_1336 } = __VLS_1332.slots;
        // @ts-ignore
        [submitTenant,];
        var __VLS_1332;
        var __VLS_1333;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_1245;
    let __VLS_1337;
    /** @ts-ignore @type {typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog} */
    elDialog;
    // @ts-ignore
    const __VLS_1338 = __VLS_asFunctionalComponent1(__VLS_1337, new __VLS_1337({
        modelValue: (__VLS_ctx.shopDialogVisible),
        title: (__VLS_ctx.shopEditingId === null ? '新建店铺' : '编辑店铺'),
        width: "560px",
    }));
    const __VLS_1339 = __VLS_1338({
        modelValue: (__VLS_ctx.shopDialogVisible),
        title: (__VLS_ctx.shopEditingId === null ? '新建店铺' : '编辑店铺'),
        width: "560px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1338));
    const { default: __VLS_1342 } = __VLS_1340.slots;
    let __VLS_1343;
    /** @ts-ignore @type {typeof __VLS_components.elForm | typeof __VLS_components.ElForm | typeof __VLS_components.elForm | typeof __VLS_components.ElForm} */
    elForm;
    // @ts-ignore
    const __VLS_1344 = __VLS_asFunctionalComponent1(__VLS_1343, new __VLS_1343({
        labelWidth: "110px",
    }));
    const __VLS_1345 = __VLS_1344({
        labelWidth: "110px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1344));
    const { default: __VLS_1348 } = __VLS_1346.slots;
    let __VLS_1349;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1350 = __VLS_asFunctionalComponent1(__VLS_1349, new __VLS_1349({
        label: "所属租户",
    }));
    const __VLS_1351 = __VLS_1350({
        label: "所属租户",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1350));
    const { default: __VLS_1354 } = __VLS_1352.slots;
    let __VLS_1355;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1356 = __VLS_asFunctionalComponent1(__VLS_1355, new __VLS_1355({
        modelValue: (__VLS_ctx.shopForm.tenant_id),
    }));
    const __VLS_1357 = __VLS_1356({
        modelValue: (__VLS_ctx.shopForm.tenant_id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1356));
    const { default: __VLS_1360 } = __VLS_1358.slots;
    for (const [tenant] of __VLS_vFor((__VLS_ctx.store.tenants.items))) {
        let __VLS_1361;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1362 = __VLS_asFunctionalComponent1(__VLS_1361, new __VLS_1361({
            key: (tenant.id),
            label: (tenant.name),
            value: (tenant.id),
        }));
        const __VLS_1363 = __VLS_1362({
            key: (tenant.id),
            label: (tenant.name),
            value: (tenant.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1362));
        // @ts-ignore
        [store, shopDialogVisible, shopEditingId, shopForm,];
    }
    // @ts-ignore
    [];
    var __VLS_1358;
    // @ts-ignore
    [];
    var __VLS_1352;
    let __VLS_1366;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1367 = __VLS_asFunctionalComponent1(__VLS_1366, new __VLS_1366({
        label: "店铺编码",
    }));
    const __VLS_1368 = __VLS_1367({
        label: "店铺编码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1367));
    const { default: __VLS_1371 } = __VLS_1369.slots;
    let __VLS_1372;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1373 = __VLS_asFunctionalComponent1(__VLS_1372, new __VLS_1372({
        modelValue: (__VLS_ctx.shopForm.shop_code),
    }));
    const __VLS_1374 = __VLS_1373({
        modelValue: (__VLS_ctx.shopForm.shop_code),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1373));
    // @ts-ignore
    [shopForm,];
    var __VLS_1369;
    let __VLS_1377;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1378 = __VLS_asFunctionalComponent1(__VLS_1377, new __VLS_1377({
        label: "店铺名称",
    }));
    const __VLS_1379 = __VLS_1378({
        label: "店铺名称",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1378));
    const { default: __VLS_1382 } = __VLS_1380.slots;
    let __VLS_1383;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1384 = __VLS_asFunctionalComponent1(__VLS_1383, new __VLS_1383({
        modelValue: (__VLS_ctx.shopForm.name),
    }));
    const __VLS_1385 = __VLS_1384({
        modelValue: (__VLS_ctx.shopForm.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1384));
    // @ts-ignore
    [shopForm,];
    var __VLS_1380;
    let __VLS_1388;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1389 = __VLS_asFunctionalComponent1(__VLS_1388, new __VLS_1388({
        label: "状态",
    }));
    const __VLS_1390 = __VLS_1389({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1389));
    const { default: __VLS_1393 } = __VLS_1391.slots;
    let __VLS_1394;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1395 = __VLS_asFunctionalComponent1(__VLS_1394, new __VLS_1394({
        modelValue: (__VLS_ctx.shopForm.status),
    }));
    const __VLS_1396 = __VLS_1395({
        modelValue: (__VLS_ctx.shopForm.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1395));
    const { default: __VLS_1399 } = __VLS_1397.slots;
    let __VLS_1400;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1401 = __VLS_asFunctionalComponent1(__VLS_1400, new __VLS_1400({
        label: "active",
        value: "active",
    }));
    const __VLS_1402 = __VLS_1401({
        label: "active",
        value: "active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1401));
    let __VLS_1405;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1406 = __VLS_asFunctionalComponent1(__VLS_1405, new __VLS_1405({
        label: "disabled",
        value: "disabled",
    }));
    const __VLS_1407 = __VLS_1406({
        label: "disabled",
        value: "disabled",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1406));
    // @ts-ignore
    [shopForm,];
    var __VLS_1397;
    // @ts-ignore
    [];
    var __VLS_1391;
    let __VLS_1410;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1411 = __VLS_asFunctionalComponent1(__VLS_1410, new __VLS_1410({
        label: "默认接入",
    }));
    const __VLS_1412 = __VLS_1411({
        label: "默认接入",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1411));
    const { default: __VLS_1415 } = __VLS_1413.slots;
    let __VLS_1416;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1417 = __VLS_asFunctionalComponent1(__VLS_1416, new __VLS_1416({
        modelValue: (__VLS_ctx.shopForm.default_integration_id),
        clearable: true,
    }));
    const __VLS_1418 = __VLS_1417({
        modelValue: (__VLS_ctx.shopForm.default_integration_id),
        clearable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1417));
    const { default: __VLS_1421 } = __VLS_1419.slots;
    for (const [integration] of __VLS_vFor((__VLS_ctx.store.integrations.items.filter((item) => item.tenant_id === __VLS_ctx.shopForm.tenant_id)))) {
        let __VLS_1422;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1423 = __VLS_asFunctionalComponent1(__VLS_1422, new __VLS_1422({
            key: (integration.id),
            label: (integration.name),
            value: (integration.id),
        }));
        const __VLS_1424 = __VLS_1423({
            key: (integration.id),
            label: (integration.name),
            value: (integration.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1423));
        // @ts-ignore
        [store, shopForm, shopForm,];
    }
    // @ts-ignore
    [];
    var __VLS_1419;
    // @ts-ignore
    [];
    var __VLS_1413;
    // @ts-ignore
    [];
    var __VLS_1346;
    {
        const { footer: __VLS_1427 } = __VLS_1340.slots;
        let __VLS_1428;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1429 = __VLS_asFunctionalComponent1(__VLS_1428, new __VLS_1428({
            ...{ 'onClick': {} },
        }));
        const __VLS_1430 = __VLS_1429({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1429));
        let __VLS_1433;
        const __VLS_1434 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.authenticated))
                        return;
                    __VLS_ctx.shopDialogVisible = false;
                    // @ts-ignore
                    [shopDialogVisible,];
                } });
        const { default: __VLS_1435 } = __VLS_1431.slots;
        // @ts-ignore
        [];
        var __VLS_1431;
        var __VLS_1432;
        let __VLS_1436;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1437 = __VLS_asFunctionalComponent1(__VLS_1436, new __VLS_1436({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_1438 = __VLS_1437({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1437));
        let __VLS_1441;
        const __VLS_1442 = ({ click: {} },
            { onClick: (__VLS_ctx.submitShop) });
        const { default: __VLS_1443 } = __VLS_1439.slots;
        // @ts-ignore
        [submitShop,];
        var __VLS_1439;
        var __VLS_1440;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_1340;
    let __VLS_1444;
    /** @ts-ignore @type {typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog} */
    elDialog;
    // @ts-ignore
    const __VLS_1445 = __VLS_asFunctionalComponent1(__VLS_1444, new __VLS_1444({
        modelValue: (__VLS_ctx.integrationDialogVisible),
        title: (__VLS_ctx.integrationEditingId === null ? '新建接入配置' : '编辑接入配置'),
        width: "620px",
    }));
    const __VLS_1446 = __VLS_1445({
        modelValue: (__VLS_ctx.integrationDialogVisible),
        title: (__VLS_ctx.integrationEditingId === null ? '新建接入配置' : '编辑接入配置'),
        width: "620px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1445));
    const { default: __VLS_1449 } = __VLS_1447.slots;
    let __VLS_1450;
    /** @ts-ignore @type {typeof __VLS_components.elForm | typeof __VLS_components.ElForm | typeof __VLS_components.elForm | typeof __VLS_components.ElForm} */
    elForm;
    // @ts-ignore
    const __VLS_1451 = __VLS_asFunctionalComponent1(__VLS_1450, new __VLS_1450({
        labelWidth: "120px",
    }));
    const __VLS_1452 = __VLS_1451({
        labelWidth: "120px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1451));
    const { default: __VLS_1455 } = __VLS_1453.slots;
    let __VLS_1456;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1457 = __VLS_asFunctionalComponent1(__VLS_1456, new __VLS_1456({
        label: "所属租户",
    }));
    const __VLS_1458 = __VLS_1457({
        label: "所属租户",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1457));
    const { default: __VLS_1461 } = __VLS_1459.slots;
    let __VLS_1462;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1463 = __VLS_asFunctionalComponent1(__VLS_1462, new __VLS_1462({
        modelValue: (__VLS_ctx.integrationForm.tenant_id),
    }));
    const __VLS_1464 = __VLS_1463({
        modelValue: (__VLS_ctx.integrationForm.tenant_id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1463));
    const { default: __VLS_1467 } = __VLS_1465.slots;
    for (const [tenant] of __VLS_vFor((__VLS_ctx.store.tenants.items))) {
        let __VLS_1468;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1469 = __VLS_asFunctionalComponent1(__VLS_1468, new __VLS_1468({
            key: (tenant.id),
            label: (tenant.name),
            value: (tenant.id),
        }));
        const __VLS_1470 = __VLS_1469({
            key: (tenant.id),
            label: (tenant.name),
            value: (tenant.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1469));
        // @ts-ignore
        [store, integrationDialogVisible, integrationEditingId, integrationForm,];
    }
    // @ts-ignore
    [];
    var __VLS_1465;
    // @ts-ignore
    [];
    var __VLS_1459;
    let __VLS_1473;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1474 = __VLS_asFunctionalComponent1(__VLS_1473, new __VLS_1473({
        label: "接入名称",
    }));
    const __VLS_1475 = __VLS_1474({
        label: "接入名称",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1474));
    const { default: __VLS_1478 } = __VLS_1476.slots;
    let __VLS_1479;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1480 = __VLS_asFunctionalComponent1(__VLS_1479, new __VLS_1479({
        modelValue: (__VLS_ctx.integrationForm.name),
    }));
    const __VLS_1481 = __VLS_1480({
        modelValue: (__VLS_ctx.integrationForm.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1480));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1476;
    let __VLS_1484;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1485 = __VLS_asFunctionalComponent1(__VLS_1484, new __VLS_1484({
        label: "接入类型",
    }));
    const __VLS_1486 = __VLS_1485({
        label: "接入类型",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1485));
    const { default: __VLS_1489 } = __VLS_1487.slots;
    let __VLS_1490;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1491 = __VLS_asFunctionalComponent1(__VLS_1490, new __VLS_1490({
        modelValue: (__VLS_ctx.integrationForm.integration_type),
    }));
    const __VLS_1492 = __VLS_1491({
        modelValue: (__VLS_ctx.integrationForm.integration_type),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1491));
    const { default: __VLS_1495 } = __VLS_1493.slots;
    let __VLS_1496;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1497 = __VLS_asFunctionalComponent1(__VLS_1496, new __VLS_1496({
        label: "erp",
        value: "erp",
    }));
    const __VLS_1498 = __VLS_1497({
        label: "erp",
        value: "erp",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1497));
    let __VLS_1501;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1502 = __VLS_asFunctionalComponent1(__VLS_1501, new __VLS_1501({
        label: "third",
        value: "third",
    }));
    const __VLS_1503 = __VLS_1502({
        label: "third",
        value: "third",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1502));
    let __VLS_1506;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1507 = __VLS_asFunctionalComponent1(__VLS_1506, new __VLS_1506({
        label: "none",
        value: "none",
    }));
    const __VLS_1508 = __VLS_1507({
        label: "none",
        value: "none",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1507));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1493;
    // @ts-ignore
    [];
    var __VLS_1487;
    let __VLS_1511;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1512 = __VLS_asFunctionalComponent1(__VLS_1511, new __VLS_1511({
        label: "状态",
    }));
    const __VLS_1513 = __VLS_1512({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1512));
    const { default: __VLS_1516 } = __VLS_1514.slots;
    let __VLS_1517;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1518 = __VLS_asFunctionalComponent1(__VLS_1517, new __VLS_1517({
        modelValue: (__VLS_ctx.integrationForm.status),
    }));
    const __VLS_1519 = __VLS_1518({
        modelValue: (__VLS_ctx.integrationForm.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1518));
    const { default: __VLS_1522 } = __VLS_1520.slots;
    let __VLS_1523;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1524 = __VLS_asFunctionalComponent1(__VLS_1523, new __VLS_1523({
        label: "active",
        value: "active",
    }));
    const __VLS_1525 = __VLS_1524({
        label: "active",
        value: "active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1524));
    let __VLS_1528;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1529 = __VLS_asFunctionalComponent1(__VLS_1528, new __VLS_1528({
        label: "disabled",
        value: "disabled",
    }));
    const __VLS_1530 = __VLS_1529({
        label: "disabled",
        value: "disabled",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1529));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1520;
    // @ts-ignore
    [];
    var __VLS_1514;
    let __VLS_1533;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1534 = __VLS_asFunctionalComponent1(__VLS_1533, new __VLS_1533({
        label: "接口地址",
    }));
    const __VLS_1535 = __VLS_1534({
        label: "接口地址",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1534));
    const { default: __VLS_1538 } = __VLS_1536.slots;
    let __VLS_1539;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1540 = __VLS_asFunctionalComponent1(__VLS_1539, new __VLS_1539({
        modelValue: (__VLS_ctx.integrationForm.api_base_url),
    }));
    const __VLS_1541 = __VLS_1540({
        modelValue: (__VLS_ctx.integrationForm.api_base_url),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1540));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1536;
    let __VLS_1544;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1545 = __VLS_asFunctionalComponent1(__VLS_1544, new __VLS_1544({
        label: "API Key",
    }));
    const __VLS_1546 = __VLS_1545({
        label: "API Key",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1545));
    const { default: __VLS_1549 } = __VLS_1547.slots;
    let __VLS_1550;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1551 = __VLS_asFunctionalComponent1(__VLS_1550, new __VLS_1550({
        modelValue: (__VLS_ctx.integrationForm.api_key),
    }));
    const __VLS_1552 = __VLS_1551({
        modelValue: (__VLS_ctx.integrationForm.api_key),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1551));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1547;
    let __VLS_1555;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1556 = __VLS_asFunctionalComponent1(__VLS_1555, new __VLS_1555({
        label: "API Secret",
    }));
    const __VLS_1557 = __VLS_1556({
        label: "API Secret",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1556));
    const { default: __VLS_1560 } = __VLS_1558.slots;
    let __VLS_1561;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1562 = __VLS_asFunctionalComponent1(__VLS_1561, new __VLS_1561({
        modelValue: (__VLS_ctx.integrationForm.api_secret),
        showPassword: true,
    }));
    const __VLS_1563 = __VLS_1562({
        modelValue: (__VLS_ctx.integrationForm.api_secret),
        showPassword: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1562));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1558;
    let __VLS_1566;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1567 = __VLS_asFunctionalComponent1(__VLS_1566, new __VLS_1566({
        label: "开启商品同步",
    }));
    const __VLS_1568 = __VLS_1567({
        label: "开启商品同步",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1567));
    const { default: __VLS_1571 } = __VLS_1569.slots;
    let __VLS_1572;
    /** @ts-ignore @type {typeof __VLS_components.elSwitch | typeof __VLS_components.ElSwitch} */
    elSwitch;
    // @ts-ignore
    const __VLS_1573 = __VLS_asFunctionalComponent1(__VLS_1572, new __VLS_1572({
        modelValue: (__VLS_ctx.integrationForm.product_sync_enabled),
    }));
    const __VLS_1574 = __VLS_1573({
        modelValue: (__VLS_ctx.integrationForm.product_sync_enabled),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1573));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1569;
    let __VLS_1577;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1578 = __VLS_asFunctionalComponent1(__VLS_1577, new __VLS_1577({
        label: "开启订单推送",
    }));
    const __VLS_1579 = __VLS_1578({
        label: "开启订单推送",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1578));
    const { default: __VLS_1582 } = __VLS_1580.slots;
    let __VLS_1583;
    /** @ts-ignore @type {typeof __VLS_components.elSwitch | typeof __VLS_components.ElSwitch} */
    elSwitch;
    // @ts-ignore
    const __VLS_1584 = __VLS_asFunctionalComponent1(__VLS_1583, new __VLS_1583({
        modelValue: (__VLS_ctx.integrationForm.order_push_enabled),
    }));
    const __VLS_1585 = __VLS_1584({
        modelValue: (__VLS_ctx.integrationForm.order_push_enabled),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1584));
    // @ts-ignore
    [integrationForm,];
    var __VLS_1580;
    // @ts-ignore
    [];
    var __VLS_1453;
    {
        const { footer: __VLS_1588 } = __VLS_1447.slots;
        let __VLS_1589;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1590 = __VLS_asFunctionalComponent1(__VLS_1589, new __VLS_1589({
            ...{ 'onClick': {} },
        }));
        const __VLS_1591 = __VLS_1590({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1590));
        let __VLS_1594;
        const __VLS_1595 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.authenticated))
                        return;
                    __VLS_ctx.integrationDialogVisible = false;
                    // @ts-ignore
                    [integrationDialogVisible,];
                } });
        const { default: __VLS_1596 } = __VLS_1592.slots;
        // @ts-ignore
        [];
        var __VLS_1592;
        var __VLS_1593;
        let __VLS_1597;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1598 = __VLS_asFunctionalComponent1(__VLS_1597, new __VLS_1597({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_1599 = __VLS_1598({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1598));
        let __VLS_1602;
        const __VLS_1603 = ({ click: {} },
            { onClick: (__VLS_ctx.submitIntegration) });
        const { default: __VLS_1604 } = __VLS_1600.slots;
        // @ts-ignore
        [submitIntegration,];
        var __VLS_1600;
        var __VLS_1601;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_1447;
    let __VLS_1605;
    /** @ts-ignore @type {typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog} */
    elDialog;
    // @ts-ignore
    const __VLS_1606 = __VLS_asFunctionalComponent1(__VLS_1605, new __VLS_1605({
        modelValue: (__VLS_ctx.publishDialogVisible),
        title: "发布源商品",
        width: "520px",
    }));
    const __VLS_1607 = __VLS_1606({
        modelValue: (__VLS_ctx.publishDialogVisible),
        title: "发布源商品",
        width: "520px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1606));
    const { default: __VLS_1610 } = __VLS_1608.slots;
    let __VLS_1611;
    /** @ts-ignore @type {typeof __VLS_components.elForm | typeof __VLS_components.ElForm | typeof __VLS_components.elForm | typeof __VLS_components.ElForm} */
    elForm;
    // @ts-ignore
    const __VLS_1612 = __VLS_asFunctionalComponent1(__VLS_1611, new __VLS_1611({
        labelWidth: "100px",
    }));
    const __VLS_1613 = __VLS_1612({
        labelWidth: "100px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1612));
    const { default: __VLS_1616 } = __VLS_1614.slots;
    let __VLS_1617;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1618 = __VLS_asFunctionalComponent1(__VLS_1617, new __VLS_1617({
        label: "目标店铺",
    }));
    const __VLS_1619 = __VLS_1618({
        label: "目标店铺",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1618));
    const { default: __VLS_1622 } = __VLS_1620.slots;
    let __VLS_1623;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1624 = __VLS_asFunctionalComponent1(__VLS_1623, new __VLS_1623({
        modelValue: (__VLS_ctx.publishForm.shop_id),
    }));
    const __VLS_1625 = __VLS_1624({
        modelValue: (__VLS_ctx.publishForm.shop_id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1624));
    const { default: __VLS_1628 } = __VLS_1626.slots;
    for (const [shop] of __VLS_vFor((__VLS_ctx.store.shops.items))) {
        let __VLS_1629;
        /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
        elOption;
        // @ts-ignore
        const __VLS_1630 = __VLS_asFunctionalComponent1(__VLS_1629, new __VLS_1629({
            key: (shop.id),
            label: (shop.name),
            value: (shop.id),
        }));
        const __VLS_1631 = __VLS_1630({
            key: (shop.id),
            label: (shop.name),
            value: (shop.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1630));
        // @ts-ignore
        [store, publishDialogVisible, publishForm,];
    }
    // @ts-ignore
    [];
    var __VLS_1626;
    // @ts-ignore
    [];
    var __VLS_1620;
    let __VLS_1634;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1635 = __VLS_asFunctionalComponent1(__VLS_1634, new __VLS_1634({
        label: "商品标题",
    }));
    const __VLS_1636 = __VLS_1635({
        label: "商品标题",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1635));
    const { default: __VLS_1639 } = __VLS_1637.slots;
    let __VLS_1640;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1641 = __VLS_asFunctionalComponent1(__VLS_1640, new __VLS_1640({
        modelValue: (__VLS_ctx.publishForm.title),
    }));
    const __VLS_1642 = __VLS_1641({
        modelValue: (__VLS_ctx.publishForm.title),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1641));
    // @ts-ignore
    [publishForm,];
    var __VLS_1637;
    let __VLS_1645;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1646 = __VLS_asFunctionalComponent1(__VLS_1645, new __VLS_1645({
        label: "副标题",
    }));
    const __VLS_1647 = __VLS_1646({
        label: "副标题",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1646));
    const { default: __VLS_1650 } = __VLS_1648.slots;
    let __VLS_1651;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1652 = __VLS_asFunctionalComponent1(__VLS_1651, new __VLS_1651({
        modelValue: (__VLS_ctx.publishForm.subtitle),
    }));
    const __VLS_1653 = __VLS_1652({
        modelValue: (__VLS_ctx.publishForm.subtitle),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1652));
    // @ts-ignore
    [publishForm,];
    var __VLS_1648;
    let __VLS_1656;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1657 = __VLS_asFunctionalComponent1(__VLS_1656, new __VLS_1656({
        label: "状态",
    }));
    const __VLS_1658 = __VLS_1657({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1657));
    const { default: __VLS_1661 } = __VLS_1659.slots;
    let __VLS_1662;
    /** @ts-ignore @type {typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect | typeof __VLS_components.elSelect | typeof __VLS_components.ElSelect} */
    elSelect;
    // @ts-ignore
    const __VLS_1663 = __VLS_asFunctionalComponent1(__VLS_1662, new __VLS_1662({
        modelValue: (__VLS_ctx.publishForm.status),
    }));
    const __VLS_1664 = __VLS_1663({
        modelValue: (__VLS_ctx.publishForm.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1663));
    const { default: __VLS_1667 } = __VLS_1665.slots;
    let __VLS_1668;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1669 = __VLS_asFunctionalComponent1(__VLS_1668, new __VLS_1668({
        label: "draft",
        value: "draft",
    }));
    const __VLS_1670 = __VLS_1669({
        label: "draft",
        value: "draft",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1669));
    let __VLS_1673;
    /** @ts-ignore @type {typeof __VLS_components.elOption | typeof __VLS_components.ElOption} */
    elOption;
    // @ts-ignore
    const __VLS_1674 = __VLS_asFunctionalComponent1(__VLS_1673, new __VLS_1673({
        label: "active",
        value: "active",
    }));
    const __VLS_1675 = __VLS_1674({
        label: "active",
        value: "active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1674));
    // @ts-ignore
    [publishForm,];
    var __VLS_1665;
    // @ts-ignore
    [];
    var __VLS_1659;
    // @ts-ignore
    [];
    var __VLS_1614;
    {
        const { footer: __VLS_1678 } = __VLS_1608.slots;
        let __VLS_1679;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1680 = __VLS_asFunctionalComponent1(__VLS_1679, new __VLS_1679({
            ...{ 'onClick': {} },
        }));
        const __VLS_1681 = __VLS_1680({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1680));
        let __VLS_1684;
        const __VLS_1685 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.authenticated))
                        return;
                    __VLS_ctx.publishDialogVisible = false;
                    // @ts-ignore
                    [publishDialogVisible,];
                } });
        const { default: __VLS_1686 } = __VLS_1682.slots;
        // @ts-ignore
        [];
        var __VLS_1682;
        var __VLS_1683;
        let __VLS_1687;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1688 = __VLS_asFunctionalComponent1(__VLS_1687, new __VLS_1687({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_1689 = __VLS_1688({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1688));
        let __VLS_1692;
        const __VLS_1693 = ({ click: {} },
            { onClick: (__VLS_ctx.submitPublish) });
        const { default: __VLS_1694 } = __VLS_1690.slots;
        // @ts-ignore
        [submitPublish,];
        var __VLS_1690;
        var __VLS_1691;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_1608;
    let __VLS_1695;
    /** @ts-ignore @type {typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog} */
    elDialog;
    // @ts-ignore
    const __VLS_1696 = __VLS_asFunctionalComponent1(__VLS_1695, new __VLS_1695({
        modelValue: (__VLS_ctx.changePasswordDialogVisible),
        title: "修改密码",
        width: "520px",
    }));
    const __VLS_1697 = __VLS_1696({
        modelValue: (__VLS_ctx.changePasswordDialogVisible),
        title: "修改密码",
        width: "520px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1696));
    const { default: __VLS_1700 } = __VLS_1698.slots;
    let __VLS_1701;
    /** @ts-ignore @type {typeof __VLS_components.elForm | typeof __VLS_components.ElForm | typeof __VLS_components.elForm | typeof __VLS_components.ElForm} */
    elForm;
    // @ts-ignore
    const __VLS_1702 = __VLS_asFunctionalComponent1(__VLS_1701, new __VLS_1701({
        labelWidth: "140px",
    }));
    const __VLS_1703 = __VLS_1702({
        labelWidth: "140px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1702));
    const { default: __VLS_1706 } = __VLS_1704.slots;
    let __VLS_1707;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1708 = __VLS_asFunctionalComponent1(__VLS_1707, new __VLS_1707({
        label: "当前密码",
    }));
    const __VLS_1709 = __VLS_1708({
        label: "当前密码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1708));
    const { default: __VLS_1712 } = __VLS_1710.slots;
    let __VLS_1713;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1714 = __VLS_asFunctionalComponent1(__VLS_1713, new __VLS_1713({
        modelValue: (__VLS_ctx.passwordForm.current_password),
        showPassword: true,
    }));
    const __VLS_1715 = __VLS_1714({
        modelValue: (__VLS_ctx.passwordForm.current_password),
        showPassword: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1714));
    // @ts-ignore
    [changePasswordDialogVisible, passwordForm,];
    var __VLS_1710;
    let __VLS_1718;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1719 = __VLS_asFunctionalComponent1(__VLS_1718, new __VLS_1718({
        label: "新密码",
    }));
    const __VLS_1720 = __VLS_1719({
        label: "新密码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1719));
    const { default: __VLS_1723 } = __VLS_1721.slots;
    let __VLS_1724;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1725 = __VLS_asFunctionalComponent1(__VLS_1724, new __VLS_1724({
        modelValue: (__VLS_ctx.passwordForm.new_password),
        showPassword: true,
    }));
    const __VLS_1726 = __VLS_1725({
        modelValue: (__VLS_ctx.passwordForm.new_password),
        showPassword: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1725));
    // @ts-ignore
    [passwordForm,];
    var __VLS_1721;
    let __VLS_1729;
    /** @ts-ignore @type {typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem | typeof __VLS_components.elFormItem | typeof __VLS_components.ElFormItem} */
    elFormItem;
    // @ts-ignore
    const __VLS_1730 = __VLS_asFunctionalComponent1(__VLS_1729, new __VLS_1729({
        label: "确认新密码",
    }));
    const __VLS_1731 = __VLS_1730({
        label: "确认新密码",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1730));
    const { default: __VLS_1734 } = __VLS_1732.slots;
    let __VLS_1735;
    /** @ts-ignore @type {typeof __VLS_components.elInput | typeof __VLS_components.ElInput} */
    elInput;
    // @ts-ignore
    const __VLS_1736 = __VLS_asFunctionalComponent1(__VLS_1735, new __VLS_1735({
        modelValue: (__VLS_ctx.passwordForm.confirm_password),
        showPassword: true,
    }));
    const __VLS_1737 = __VLS_1736({
        modelValue: (__VLS_ctx.passwordForm.confirm_password),
        showPassword: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1736));
    // @ts-ignore
    [passwordForm,];
    var __VLS_1732;
    // @ts-ignore
    [];
    var __VLS_1704;
    {
        const { footer: __VLS_1740 } = __VLS_1698.slots;
        let __VLS_1741;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1742 = __VLS_asFunctionalComponent1(__VLS_1741, new __VLS_1741({
            ...{ 'onClick': {} },
        }));
        const __VLS_1743 = __VLS_1742({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1742));
        let __VLS_1746;
        const __VLS_1747 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.authenticated))
                        return;
                    __VLS_ctx.changePasswordDialogVisible = false;
                    // @ts-ignore
                    [changePasswordDialogVisible,];
                } });
        const { default: __VLS_1748 } = __VLS_1744.slots;
        // @ts-ignore
        [];
        var __VLS_1744;
        var __VLS_1745;
        let __VLS_1749;
        /** @ts-ignore @type {typeof __VLS_components.elButton | typeof __VLS_components.ElButton | typeof __VLS_components.elButton | typeof __VLS_components.ElButton} */
        elButton;
        // @ts-ignore
        const __VLS_1750 = __VLS_asFunctionalComponent1(__VLS_1749, new __VLS_1749({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_1751 = __VLS_1750({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1750));
        let __VLS_1754;
        const __VLS_1755 = ({ click: {} },
            { onClick: (__VLS_ctx.submitPasswordChange) });
        const { default: __VLS_1756 } = __VLS_1752.slots;
        // @ts-ignore
        [submitPasswordChange,];
        var __VLS_1752;
        var __VLS_1753;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_1698;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
