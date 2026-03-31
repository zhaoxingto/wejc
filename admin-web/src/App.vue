<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useAdminStore } from '@/stores/admin'
import type { PlatformIntegration, PlatformShop, PlatformTenant } from '@/types'

const store = useAdminStore()

const loginForm = reactive({
  username: 'admin',
  password: 'admin123456',
})

const activeMenu = ref('overview')

const tenantDialogVisible = ref(false)
const shopDialogVisible = ref(false)
const integrationDialogVisible = ref(false)
const publishDialogVisible = ref(false)
const changePasswordDialogVisible = ref(false)

const tenantEditingId = ref<number | null>(null)
const shopEditingId = ref<number | null>(null)
const integrationEditingId = ref<number | null>(null)
const publishSourceProductId = ref<number | null>(null)

const tenantForm = reactive({
  tenant_code: '',
  name: '',
  status: 'active',
  contact_name: null as string | null,
  mobile: null as string | null,
})

const shopForm = reactive({
  tenant_id: 0,
  shop_code: '',
  name: '',
  status: 'active',
  logo: null as string | null,
  cover: null as string | null,
  intro: null as string | null,
  default_integration_id: null as number | null,
})

const integrationForm = reactive({
  tenant_id: 0,
  name: '',
  integration_type: 'erp',
  status: 'active',
  product_sync_enabled: false,
  order_push_enabled: true,
  api_base_url: null as string | null,
  api_key: null as string | null,
  api_secret: null as string | null,
  config_json: null as Record<string, unknown> | null,
})

const publishForm = reactive({
  shop_id: 0,
  title: '',
  subtitle: '',
  status: 'draft',
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

function resetToFirstPageAndLoad(loader: () => Promise<void>, pageRef: { page: number }) {
  pageRef.page = 1
  void loader()
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
]

const currentMenuLabel = computed(() => menuItems.find((item) => item.key === activeMenu.value)?.label ?? '平台概览')

const dashboardCards = computed(() => {
  if (!store.dashboard) {
    return []
  }
  return [
    { label: '租户总数', value: store.dashboard.tenant_count },
    { label: '店铺总数', value: store.dashboard.shop_count },
    { label: '接入配置', value: store.dashboard.integration_count },
    { label: '源商品数', value: store.dashboard.source_product_count },
    { label: '渠道商品数', value: store.channelProducts.total },
    { label: '待处理任务', value: store.dashboard.pending_push_task_count + store.dashboard.retrying_push_task_count },
  ]
})

const alertCards = computed(() => {
  if (!store.alertSummary) {
    return []
  }
  return [
    { label: '告警总数', value: store.alertSummary.total },
    { label: '严重告警', value: store.alertSummary.critical_count },
    { label: '一般告警', value: store.alertSummary.warning_count },
    { label: '推送任务异常', value: store.alertSummary.push_task_issue_count },
    { label: '推送失败', value: store.alertSummary.push_log_failure_count },
    { label: '同步异常', value: store.alertSummary.product_sync_issue_count },
  ]
})

const operationCards = computed(() => {
  if (!store.dashboard) {
    return []
  }
  return [
    { label: '今日订单', value: store.dashboard.today_order_count },
    { label: '今日推送成功', value: store.dashboard.today_push_success_count },
    { label: '今日推送失败', value: store.dashboard.today_push_failure_count },
    { label: '当前未闭环异常', value: store.dashboard.unresolved_alert_count },
  ]
})

const orderTrendMax = computed(() => {
  const values = store.dashboard?.daily_order_trend.map((item) => item.value) ?? []
  return Math.max(...values, 1)
})

const pushTrendMax = computed(() => {
  const values =
    store.dashboard?.daily_push_trend.flatMap((item) => [item.success_count, item.failure_count]) ?? []
  return Math.max(...values, 1)
})

function tagType(status: string | boolean) {
  if (status === true || ['active', 'success', 'synced', 'created'].includes(String(status))) {
    return 'success'
  }
  if (status === false || ['pending', 'retrying', 'disabled', 'draft'].includes(String(status))) {
    return 'warning'
  }
  return 'info'
}

function toChineseSeverity(severity: string) {
  if (severity === 'critical') return '严重'
  if (severity === 'warning') return '一般'
  return severity
}

function toChineseCategory(category: string) {
  const mapping: Record<string, string> = {
    push_task: '推送任务',
    push_log: '推送日志',
    product_sync: '商品同步',
  }
  return mapping[category] ?? category
}

function toChineseHealth(status: string) {
  const mapping: Record<string, string> = {
    healthy: '健康',
    warning: '预警',
    critical: '异常',
    disabled: '停用',
    reachable: '连通正常',
    missing_config: '配置缺失',
  }
  return mapping[status] ?? status
}

async function handleLogin() {
  try {
    await store.login(loginForm.username, loginForm.password)
    await store.loadOverview()
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

function openCreateTenant() {
  tenantEditingId.value = null
  Object.assign(tenantForm, {
    tenant_code: '',
    name: '',
    status: 'active',
    contact_name: null,
    mobile: null,
  })
  tenantDialogVisible.value = true
}

function openEditTenant(row: PlatformTenant) {
  tenantEditingId.value = row.id
  Object.assign(tenantForm, {
    tenant_code: row.tenant_code,
    name: row.name,
    status: row.status,
    contact_name: row.contact_name,
    mobile: row.mobile,
  })
  tenantDialogVisible.value = true
}

async function submitTenant() {
  try {
    await store.saveTenant(tenantEditingId.value, { ...tenantForm })
    tenantDialogVisible.value = false
    ElMessage.success('租户保存成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

function openCreateShop() {
  shopEditingId.value = null
  Object.assign(shopForm, {
    tenant_id: store.tenants.items[0]?.id ?? 0,
    shop_code: '',
    name: '',
    status: 'active',
    logo: null,
    cover: null,
    intro: null,
    default_integration_id: null,
  })
  shopDialogVisible.value = true
}

function openEditShop(row: PlatformShop) {
  shopEditingId.value = row.id
  Object.assign(shopForm, {
    tenant_id: row.tenant_id,
    shop_code: row.shop_code,
    name: row.name,
    status: row.status,
    logo: null,
    cover: null,
    intro: null,
    default_integration_id: row.default_integration_id,
  })
  shopDialogVisible.value = true
}

async function submitShop() {
  try {
    await store.saveShop(shopEditingId.value, { ...shopForm })
    shopDialogVisible.value = false
    ElMessage.success('店铺保存成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

function openCreateIntegration() {
  integrationEditingId.value = null
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
  })
  integrationDialogVisible.value = true
}

function openEditIntegration(row: PlatformIntegration) {
  integrationEditingId.value = row.id
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
  })
  integrationDialogVisible.value = true
}

async function submitIntegration() {
  try {
    await store.saveIntegration(integrationEditingId.value, { ...integrationForm })
    integrationDialogVisible.value = false
    ElMessage.success('接入配置保存成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

function openPublishDialog(sourceProductId: number) {
  publishSourceProductId.value = sourceProductId
  Object.assign(publishForm, {
    shop_id: store.shops.items[0]?.id ?? 0,
    title: '',
    subtitle: '',
    status: 'draft',
  })
  publishDialogVisible.value = true
}

async function submitPublish() {
  if (publishSourceProductId.value === null) return
  try {
    await store.publishSourceProduct(
      publishSourceProductId.value,
      publishForm.shop_id,
      publishForm.title || null,
      publishForm.subtitle || null,
      publishForm.status,
    )
    publishDialogVisible.value = false
    ElMessage.success('源商品发布成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

async function handleRetryTask(taskId: number) {
  try {
    await store.retryPushTask(taskId)
    ElMessage.success('推送任务已重试')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

async function handleAlertAction(resourceType: string, resourceId: string, status: 'resolved' | 'ignored') {
  const note = window.prompt(status === 'resolved' ? '请输入处理备注' : '请输入忽略备注', '') ?? ''
  try {
    await store.handleAlert(resourceType, resourceId, status, note || null)
    ElMessage.success(status === 'resolved' ? '告警已处理' : '告警已忽略')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

function openChangePasswordDialog() {
  Object.assign(passwordForm, {
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  changePasswordDialogVisible.value = true
}

async function submitPasswordChange() {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }
  try {
    await store.changePassword(passwordForm.current_password, passwordForm.new_password)
    changePasswordDialogVisible.value = false
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

function applyIntegrationHealthFilters() {
  resetToFirstPageAndLoad(store.loadIntegrationHealth, store.integrationHealth)
}

function clearIntegrationHealthFilters() {
  Object.assign(store.integrationHealthFilters, {
    tenant_id: '',
    status: '',
    connectivity_status: '',
    health_status: '',
  })
  applyIntegrationHealthFilters()
}

function applyAlertFilters() {
  resetToFirstPageAndLoad(store.loadAlerts, store.alerts)
}

function clearAlertFilters() {
  Object.assign(store.alertFilters, {
    category: '',
    severity: '',
    handling_status: '',
  })
  applyAlertFilters()
}

function applyOrderFilters() {
  resetToFirstPageAndLoad(store.loadOrders, store.orders)
}

function clearOrderFilters() {
  Object.assign(store.ordersFilters, {
    tenant_id: '',
    shop_id: '',
    status: '',
    push_status: '',
  })
  applyOrderFilters()
}

function applyPushTaskFilters() {
  resetToFirstPageAndLoad(store.loadPushTasks, store.pushTasks)
}

function clearPushTaskFilters() {
  Object.assign(store.pushTaskFilters, {
    tenant_id: '',
    shop_id: '',
    integration_id: '',
    status: '',
  })
  applyPushTaskFilters()
}

onMounted(() => {
  if (store.authenticated) {
    void store.loadOverview()
  }
})

function handleMenuSelect(key: string) {
  activeMenu.value = key
}
</script>

<template>
  <div v-if="!store.authenticated" class="login-shell">
    <el-card class="login-card" shadow="hover">
      <p class="login-eyebrow">WEJC 平台管理后台</p>
      <h1 class="login-title">平台管理员登录</h1>
      <p class="login-copy">请输入平台管理员账号和密码，进入平台运营与监管后台。</p>
      <el-form @submit.prevent="handleLogin">
        <el-form-item label="账号">
          <el-input v-model="loginForm.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" show-password />
        </el-form-item>
        <el-button type="primary" class="login-button" @click="handleLogin">登录系统</el-button>
      </el-form>
    </el-card>
  </div>

  <div v-else class="layout-shell">
    <aside class="layout-sidebar">
      <div class="brand-block">
        <p class="brand-eyebrow">WEJC</p>
        <h1>平台管理后台</h1>
        <p class="brand-copy">统一查看租户、店铺、接入、订单、告警与平台操作记录。</p>
      </div>

      <el-menu :default-active="activeMenu" class="side-menu" @select="handleMenuSelect">
        <el-menu-item v-for="item in menuItems" :key="item.key" :index="item.key">
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="layout-main">
      <header class="layout-header">
        <div>
          <p class="header-breadcrumb">平台端 / {{ currentMenuLabel }}</p>
          <h2>{{ currentMenuLabel }}</h2>
        </div>
        <div class="header-actions">
          <el-button :loading="store.isLoading" @click="store.loadOverview">刷新数据</el-button>
          <el-button @click="openChangePasswordDialog">修改密码</el-button>
          <el-button type="danger" plain @click="store.logout">退出登录</el-button>
        </div>
      </header>

      <main class="workbench">
        <section v-if="activeMenu === 'overview'" class="page-section">
          <div class="stat-grid">
            <el-card v-for="card in dashboardCards" :key="card.label" class="metric-card" shadow="hover">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
            </el-card>
          </div>
          <div class="stat-grid compact">
            <el-card v-for="card in operationCards" :key="card.label" class="metric-card subtle-card" shadow="never">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
            </el-card>
          </div>
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>异常概览</span></div></template>
            <div class="stat-grid compact">
              <div v-for="card in alertCards" :key="card.label" class="metric-panel">
                <span>{{ card.label }}</span>
                <strong>{{ card.value }}</strong>
              </div>
            </div>
          </el-card>
          <div class="overview-grid">
            <el-card class="content-card" shadow="hover">
              <template #header><div class="card-header"><span>近7日订单趋势</span></div></template>
              <div class="trend-chart">
                <div v-for="item in store.dashboard?.daily_order_trend ?? []" :key="item.date" class="trend-column">
                  <div class="trend-value">{{ item.value }}</div>
                  <div class="trend-bar-shell">
                    <div
                      class="trend-bar trend-bar-primary"
                      :style="{ height: `${Math.max((item.value / orderTrendMax) * 140, item.value > 0 ? 16 : 8)}px` }"
                    />
                  </div>
                  <div class="trend-label">{{ item.date.slice(5) }}</div>
                </div>
              </div>
            </el-card>
            <el-card class="content-card" shadow="hover">
              <template #header><div class="card-header"><span>近7日推送趋势</span></div></template>
              <div class="trend-chart dual">
                <div v-for="item in store.dashboard?.daily_push_trend ?? []" :key="item.date" class="trend-column">
                  <div class="trend-value split">
                    <span>成 {{ item.success_count }}</span>
                    <span>败 {{ item.failure_count }}</span>
                  </div>
                  <div class="trend-bar-shell dual">
                    <div
                      class="trend-bar trend-bar-primary"
                      :style="{ height: `${Math.max((item.success_count / pushTrendMax) * 120, item.success_count > 0 ? 12 : 6)}px` }"
                    />
                    <div
                      class="trend-bar trend-bar-danger"
                      :style="{ height: `${Math.max((item.failure_count / pushTrendMax) * 120, item.failure_count > 0 ? 12 : 6)}px` }"
                    />
                  </div>
                  <div class="trend-label">{{ item.date.slice(5) }}</div>
                </div>
              </div>
            </el-card>
          </div>
          <div class="overview-grid">
            <el-card class="content-card" shadow="hover">
              <template #header><div class="card-header"><span>异常店铺排行</span></div></template>
              <div class="rank-list">
                <div v-for="item in store.dashboard?.top_alert_shops ?? []" :key="item.label" class="rank-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
                <div v-if="(store.dashboard?.top_alert_shops ?? []).length === 0" class="empty-tip">当前没有异常店铺排行数据</div>
              </div>
            </el-card>
            <el-card class="content-card" shadow="hover">
              <template #header><div class="card-header"><span>失败接入排行</span></div></template>
              <div class="rank-list">
                <div v-for="item in store.dashboard?.top_failing_integrations ?? []" :key="item.label" class="rank-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
                <div v-if="(store.dashboard?.top_failing_integrations ?? []).length === 0" class="empty-tip">当前没有失败接入排行数据</div>
              </div>
            </el-card>
          </div>
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>最近操作</span></div></template>
            <div class="activity-list">
              <div v-for="item in store.activity.slice(0, 8)" :key="item" class="activity-item">{{ item }}</div>
            </div>
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'tenants'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>租户管理</span>
                <el-button type="primary" @click="openCreateTenant">新建租户</el-button>
              </div>
            </template>
            <div class="toolbar-row">
              <el-input v-model="store.tenants.q" placeholder="按租户编码、名称、联系人搜索" @change="store.loadTenants" />
            </div>
            <el-table :data="store.tenants.items" stripe>
              <el-table-column prop="tenant_code" label="租户编码" min-width="140" />
              <el-table-column prop="name" label="租户名称" min-width="160" />
              <el-table-column prop="contact_name" label="联系人" min-width="100" />
              <el-table-column prop="mobile" label="手机号" min-width="120" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="shop_count" label="店铺数" width="90" />
              <el-table-column prop="integration_count" label="接入数" width="90" />
              <el-table-column label="操作" width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEditTenant(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.tenants.total" :page-size="store.tenants.pageSize" v-model:current-page="store.tenants.page" @current-change="store.loadTenants" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'shops'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>店铺管理</span>
                <el-button type="primary" @click="openCreateShop">新建店铺</el-button>
              </div>
            </template>
            <div class="toolbar-row">
              <el-input v-model="store.shops.q" placeholder="按租户、店铺编码、店铺名称搜索" @change="store.loadShops" />
            </div>
            <el-table :data="store.shops.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="shop_code" label="店铺编码" min-width="140" />
              <el-table-column prop="name" label="店铺名称" min-width="160" />
              <el-table-column prop="default_integration_name" label="默认接入" min-width="140" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEditShop(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.shops.total" :page-size="store.shops.pageSize" v-model:current-page="store.shops.page" @current-change="store.loadShops" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'integrations'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>接入配置</span>
                <el-button type="primary" @click="openCreateIntegration">新建接入</el-button>
              </div>
            </template>
            <div class="toolbar-row">
              <el-input v-model="store.integrations.q" placeholder="按租户、接入名称、类型搜索" @change="store.loadIntegrations" />
            </div>
            <el-table :data="store.integrations.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="name" label="接入名称" min-width="160" />
              <el-table-column prop="integration_type" label="接入类型" width="100" />
              <el-table-column prop="api_base_url" label="接口地址" min-width="180" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEditIntegration(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.integrations.total" :page-size="store.integrations.pageSize" v-model:current-page="store.integrations.page" @current-change="store.loadIntegrations" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'integration-health'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>接入健康检查</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.integrationHealth.q" placeholder="按租户、接入名称、健康状态搜索" @change="store.loadIntegrationHealth" />
              <el-input v-model="store.integrationHealthFilters.tenant_id" placeholder="租户ID" clearable />
              <el-select v-model="store.integrationHealthFilters.status" placeholder="接入状态" clearable>
                <el-option label="active" value="active" />
                <el-option label="disabled" value="disabled" />
              </el-select>
              <el-select v-model="store.integrationHealthFilters.connectivity_status" placeholder="连接状态" clearable>
                <el-option label="reachable" value="reachable" />
                <el-option label="missing_config" value="missing_config" />
                <el-option label="disabled" value="disabled" />
              </el-select>
              <el-select v-model="store.integrationHealthFilters.health_status" placeholder="健康状态" clearable>
                <el-option label="healthy" value="healthy" />
                <el-option label="warning" value="warning" />
                <el-option label="critical" value="critical" />
                <el-option label="disabled" value="disabled" />
              </el-select>
              <el-button type="primary" @click="applyIntegrationHealthFilters">筛选</el-button>
              <el-button @click="clearIntegrationHealthFilters">重置</el-button>
            </div>
            <el-table :data="store.integrationHealth.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="integration_name" label="接入名称" min-width="160" />
              <el-table-column prop="integration_type" label="接入类型" width="100" />
              <el-table-column label="连接状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.connectivity_status === 'reachable' ? 'success' : row.connectivity_status === 'missing_config' ? 'warning' : 'info'">
                    {{ toChineseHealth(row.connectivity_status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="健康状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.health_status === 'healthy' ? 'success' : row.health_status === 'warning' ? 'warning' : row.health_status === 'critical' ? 'danger' : 'info'">
                    {{ toChineseHealth(row.health_status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="last_product_sync_at" label="最近同步时间" min-width="180" />
              <el-table-column prop="last_push_at" label="最近推送时间" min-width="180" />
              <el-table-column prop="push_success_rate" label="推送成功率(%)" width="130" />
              <el-table-column prop="open_alert_count" label="未处理告警" width="110" />
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.integrationHealth.total" :page-size="store.integrationHealth.pageSize" v-model:current-page="store.integrationHealth.page" @current-change="store.loadIntegrationHealth" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'alerts'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>告警中心</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.alerts.q" placeholder="按分类、租户、店铺、详情搜索" @change="store.loadAlerts" />
              <el-select v-model="store.alertFilters.category" placeholder="告警分类" clearable>
                <el-option label="push_task" value="push_task" />
                <el-option label="push_log" value="push_log" />
                <el-option label="product_sync" value="product_sync" />
              </el-select>
              <el-select v-model="store.alertFilters.severity" placeholder="告警级别" clearable>
                <el-option label="critical" value="critical" />
                <el-option label="warning" value="warning" />
              </el-select>
              <el-select v-model="store.alertFilters.handling_status" placeholder="处理状态" clearable>
                <el-option label="open" value="open" />
                <el-option label="resolved" value="resolved" />
                <el-option label="ignored" value="ignored" />
              </el-select>
              <el-button type="primary" @click="applyAlertFilters">筛选</el-button>
              <el-button @click="clearAlertFilters">重置</el-button>
            </div>
            <el-table :data="store.alerts.items" stripe>
              <el-table-column prop="title" label="告警标题" min-width="180" />
              <el-table-column label="级别" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.severity === 'critical' ? 'danger' : 'warning'">{{ toChineseSeverity(row.severity) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="分类" width="110">
                <template #default="{ row }">{{ toChineseCategory(row.category) }}</template>
              </el-table-column>
              <el-table-column prop="tenant_name" label="租户" min-width="120" />
              <el-table-column prop="shop_name" label="店铺" min-width="120" />
              <el-table-column prop="detail" label="详情" min-width="260" />
              <el-table-column label="处理状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.handling_status === 'open' ? 'danger' : 'info'">{{ row.handling_status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="handled_by_username" label="处理人" width="100" />
              <el-table-column label="操作" width="160">
                <template #default="{ row }">
                  <el-button link type="primary" :disabled="row.handling_status !== 'open'" @click="handleAlertAction(row.resource_type, row.resource_id, 'resolved')">处理</el-button>
                  <el-button link :disabled="row.handling_status !== 'open'" @click="handleAlertAction(row.resource_type, row.resource_id, 'ignored')">忽略</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.alerts.total" :page-size="store.alerts.pageSize" v-model:current-page="store.alerts.page" @current-change="store.loadAlerts" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'audit'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>操作审计</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.auditLogs.q" placeholder="按管理员、动作、资源或摘要搜索" @change="store.loadAuditLogs" />
            </div>
            <el-table :data="store.auditLogs.items" stripe>
              <el-table-column prop="admin_username" label="管理员" width="120" />
              <el-table-column prop="action" label="动作编码" min-width="160" />
              <el-table-column prop="resource_type" label="资源类型" width="140" />
              <el-table-column prop="summary" label="操作摘要" min-width="280" />
              <el-table-column prop="created_at" label="操作时间" min-width="180" />
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.auditLogs.total" :page-size="store.auditLogs.pageSize" v-model:current-page="store.auditLogs.page" @current-change="store.loadAuditLogs" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'source-products'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>源商品中心</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.sourceProducts.q" placeholder="按租户、来源商品ID、名称搜索" @change="store.loadSourceProducts" />
            </div>
            <el-table :data="store.sourceProducts.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="integration_name" label="来源接入" min-width="140" />
              <el-table-column prop="source_product_id" label="来源商品ID" min-width="140" />
              <el-table-column prop="name" label="商品名称" min-width="180" />
              <el-table-column prop="sync_status" label="同步状态" width="110" />
              <el-table-column label="操作" width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openPublishDialog(row.id)">发布</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.sourceProducts.total" :page-size="store.sourceProducts.pageSize" v-model:current-page="store.sourceProducts.page" @current-change="store.loadSourceProducts" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'channel-products'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>渠道商品视图</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.channelProducts.q" placeholder="按租户、店铺、商品标题搜索" @change="store.loadChannelProducts" />
            </div>
            <el-table :data="store.channelProducts.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="shop_name" label="店铺名称" min-width="140" />
              <el-table-column prop="source_product_name" label="源商品" min-width="160" />
              <el-table-column prop="title" label="渠道商品标题" min-width="180" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.channelProducts.total" :page-size="store.channelProducts.pageSize" v-model:current-page="store.channelProducts.page" @current-change="store.loadChannelProducts" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'orders'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>订单中心</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.orders.q" placeholder="按租户、店铺、订单号搜索" @change="store.loadOrders" />
              <el-input v-model="store.ordersFilters.tenant_id" placeholder="租户ID" clearable />
              <el-input v-model="store.ordersFilters.shop_id" placeholder="店铺ID" clearable />
              <el-select v-model="store.ordersFilters.status" placeholder="订单状态" clearable>
                <el-option label="created" value="created" />
                <el-option label="cancelled" value="cancelled" />
              </el-select>
              <el-select v-model="store.ordersFilters.push_status" placeholder="推送状态" clearable>
                <el-option label="pending" value="pending" />
                <el-option label="success" value="success" />
                <el-option label="retrying" value="retrying" />
                <el-option label="failed" value="failed" />
              </el-select>
              <el-button type="primary" @click="applyOrderFilters">筛选</el-button>
              <el-button @click="clearOrderFilters">重置</el-button>
            </div>
            <el-table :data="store.orders.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="shop_name" label="店铺名称" min-width="140" />
              <el-table-column prop="order_no" label="订单号" min-width="160" />
              <el-table-column prop="status" label="订单状态" width="110" />
              <el-table-column prop="push_status" label="推送状态" width="110" />
              <el-table-column prop="total_amount" label="订单金额" width="100" />
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.orders.total" :page-size="store.orders.pageSize" v-model:current-page="store.orders.page" @current-change="store.loadOrders" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'push-tasks'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>推送任务</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.pushTasks.q" placeholder="按租户、订单号、错误信息搜索" @change="store.loadPushTasks" />
              <el-input v-model="store.pushTaskFilters.tenant_id" placeholder="租户ID" clearable />
              <el-input v-model="store.pushTaskFilters.shop_id" placeholder="店铺ID" clearable />
              <el-input v-model="store.pushTaskFilters.integration_id" placeholder="接入ID" clearable />
              <el-select v-model="store.pushTaskFilters.status" placeholder="任务状态" clearable>
                <el-option label="pending" value="pending" />
                <el-option label="success" value="success" />
                <el-option label="retrying" value="retrying" />
                <el-option label="failed" value="failed" />
              </el-select>
              <el-button type="primary" @click="applyPushTaskFilters">筛选</el-button>
              <el-button @click="clearPushTaskFilters">重置</el-button>
            </div>
            <el-table :data="store.pushTasks.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="shop_name" label="店铺名称" min-width="140" />
              <el-table-column prop="order_no" label="订单号" min-width="160" />
              <el-table-column prop="integration_name" label="接入配置" min-width="140" />
              <el-table-column prop="status" label="任务状态" width="110" />
              <el-table-column prop="last_error" label="最近错误" min-width="200" />
              <el-table-column label="操作" width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleRetryTask(row.id)">重试</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.pushTasks.total" :page-size="store.pushTasks.pageSize" v-model:current-page="store.pushTasks.page" @current-change="store.loadPushTasks" />
          </el-card>
        </section>

        <section v-else-if="activeMenu === 'push-logs'" class="page-section">
          <el-card class="content-card" shadow="hover">
            <template #header><div class="card-header"><span>推送日志</span></div></template>
            <div class="toolbar-row">
              <el-input v-model="store.pushLogs.q" placeholder="按租户、店铺、订单号搜索" @change="store.loadPushLogs" />
            </div>
            <el-table :data="store.pushLogs.items" stripe>
              <el-table-column prop="tenant_name" label="所属租户" min-width="140" />
              <el-table-column prop="shop_name" label="店铺名称" min-width="140" />
              <el-table-column prop="order_no" label="订单号" min-width="160" />
              <el-table-column label="结果" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.success)">{{ row.success ? '成功' : '失败' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="pushed_at" label="推送时间" min-width="180" />
            </el-table>
            <el-pagination class="pager" background layout="prev, pager, next" :total="store.pushLogs.total" :page-size="store.pushLogs.pageSize" v-model:current-page="store.pushLogs.page" @current-change="store.loadPushLogs" />
          </el-card>
        </section>
      </main>
    </section>

    <el-dialog v-model="tenantDialogVisible" :title="tenantEditingId === null ? '新建租户' : '编辑租户'" width="520px">
      <el-form label-width="100px">
        <el-form-item label="租户编码"><el-input v-model="tenantForm.tenant_code" /></el-form-item>
        <el-form-item label="租户名称"><el-input v-model="tenantForm.name" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="tenantForm.status"><el-option label="active" value="active" /><el-option label="disabled" value="disabled" /></el-select></el-form-item>
        <el-form-item label="联系人"><el-input v-model="tenantForm.contact_name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="tenantForm.mobile" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="tenantDialogVisible = false">取消</el-button><el-button type="primary" @click="submitTenant">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="shopDialogVisible" :title="shopEditingId === null ? '新建店铺' : '编辑店铺'" width="560px">
      <el-form label-width="110px">
        <el-form-item label="所属租户">
          <el-select v-model="shopForm.tenant_id">
            <el-option v-for="tenant in store.tenants.items" :key="tenant.id" :label="tenant.name" :value="tenant.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺编码"><el-input v-model="shopForm.shop_code" /></el-form-item>
        <el-form-item label="店铺名称"><el-input v-model="shopForm.name" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="shopForm.status"><el-option label="active" value="active" /><el-option label="disabled" value="disabled" /></el-select></el-form-item>
        <el-form-item label="默认接入">
          <el-select v-model="shopForm.default_integration_id" clearable>
            <el-option v-for="integration in store.integrations.items.filter((item) => item.tenant_id === shopForm.tenant_id)" :key="integration.id" :label="integration.name" :value="integration.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="shopDialogVisible = false">取消</el-button><el-button type="primary" @click="submitShop">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="integrationDialogVisible" :title="integrationEditingId === null ? '新建接入配置' : '编辑接入配置'" width="620px">
      <el-form label-width="120px">
        <el-form-item label="所属租户">
          <el-select v-model="integrationForm.tenant_id">
            <el-option v-for="tenant in store.tenants.items" :key="tenant.id" :label="tenant.name" :value="tenant.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="接入名称"><el-input v-model="integrationForm.name" /></el-form-item>
        <el-form-item label="接入类型"><el-select v-model="integrationForm.integration_type"><el-option label="erp" value="erp" /><el-option label="third" value="third" /><el-option label="none" value="none" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="integrationForm.status"><el-option label="active" value="active" /><el-option label="disabled" value="disabled" /></el-select></el-form-item>
        <el-form-item label="接口地址"><el-input v-model="integrationForm.api_base_url" /></el-form-item>
        <el-form-item label="API Key"><el-input v-model="integrationForm.api_key" /></el-form-item>
        <el-form-item label="API Secret"><el-input v-model="integrationForm.api_secret" show-password /></el-form-item>
        <el-form-item label="开启商品同步"><el-switch v-model="integrationForm.product_sync_enabled" /></el-form-item>
        <el-form-item label="开启订单推送"><el-switch v-model="integrationForm.order_push_enabled" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="integrationDialogVisible = false">取消</el-button><el-button type="primary" @click="submitIntegration">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="publishDialogVisible" title="发布源商品" width="520px">
      <el-form label-width="100px">
        <el-form-item label="目标店铺">
          <el-select v-model="publishForm.shop_id">
            <el-option v-for="shop in store.shops.items" :key="shop.id" :label="shop.name" :value="shop.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品标题"><el-input v-model="publishForm.title" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="publishForm.subtitle" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="publishForm.status"><el-option label="draft" value="draft" /><el-option label="active" value="active" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="publishDialogVisible = false">取消</el-button><el-button type="primary" @click="submitPublish">确认发布</el-button></template>
    </el-dialog>

    <el-dialog v-model="changePasswordDialogVisible" title="修改密码" width="520px">
      <el-form label-width="140px">
        <el-form-item label="当前密码"><el-input v-model="passwordForm.current_password" show-password /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="passwordForm.new_password" show-password /></el-form-item>
        <el-form-item label="确认新密码"><el-input v-model="passwordForm.confirm_password" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="changePasswordDialogVisible = false">取消</el-button><el-button type="primary" @click="submitPasswordChange">确认修改</el-button></template>
    </el-dialog>
  </div>
</template>
