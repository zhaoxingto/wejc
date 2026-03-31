const THEME_FIELDS = [
  "primary_color",
  "primary_text_color",
  "accent_color",
  "background_color",
  "surface_color",
  "surface_muted_color",
  "text_color",
  "text_muted_color",
  "notice_background_color",
];

const MENU_LABELS = {
  overview: "概览",
  store: "店铺设置",
  theme: "主题配色",
  products: "商品同步",
  "channel-products": "渠道商品管理",
  skus: "SKU 管理",
  integration: "接入配置",
  orders: "订单中心",
  "push-logs": "推送日志",
};

const state = {
  storeContextToken: "",
  shopCode: "",
  storeSummary: null,
  presets: [],
  selectedPresetKey: "amber",
  theme: null,
  products: [],
  channelProducts: [],
  channelProductDetail: null,
  selectedChannelProductId: null,
  skus: [],
  selectedSkuId: null,
  integration: null,
  orders: [],
  pushLogs: [],
};

const $ = (id) => document.getElementById(id);

const refs = {
  connectForm: $("connect-form"),
  shopCodeInput: $("shop-code"),
  connectionBadge: $("connection-badge"),
  currentMenuLabel: $("current-menu-label"),
  pageTitle: $("page-title"),
  refreshAllBtn: $("refresh-all-btn"),
  runPushBtn: $("run-push-btn"),
  refreshThemeBtn: $("refresh-theme-btn"),
  resetPresetBtn: $("reset-preset-btn"),
  saveThemeBtn: $("save-theme-btn"),
  syncProductsBtn: $("sync-products-btn"),
  refreshProductsBtn: $("refresh-products-btn"),
  refreshChannelProductsBtn: $("refresh-channel-products-btn"),
  saveChannelProductBtn: $("save-channel-product-btn"),
  openSkuEditorBtn: $("open-sku-editor-btn"),
  skuProductSelect: $("sku-product-select"),
  createSkuBtn: $("create-sku-btn"),
  saveSkuBtn: $("save-sku-btn"),
  deleteSkuBtn: $("delete-sku-btn"),
  refreshSkusBtn: $("refresh-skus-btn"),
  testIntegrationBtn: $("test-integration-btn"),
  refreshIntegrationBtn: $("refresh-integration-btn"),
  saveIntegrationBtn: $("save-integration-btn"),
  refreshOrdersBtn: $("refresh-orders-btn"),
  refreshLogsBtn: $("refresh-logs-btn"),
  overviewShopName: $("overview-shop-name"),
  overviewThemeName: $("overview-theme-name"),
  overviewProductCount: $("overview-product-count"),
  overviewChannelCount: $("overview-channel-count"),
  overviewSkuCount: $("overview-sku-count"),
  overviewOrderCount: $("overview-order-count"),
  overviewLogCount: $("overview-log-count"),
  overviewStoreSummary: $("overview-store-summary"),
  storeSettingsGrid: $("store-settings-grid"),
  presetList: $("preset-list"),
  previewPhone: $("preview-phone"),
  previewShopName: $("preview-shop-name"),
  previewDescription: $("preview-description"),
  syncSummary: $("sync-summary"),
  productsTable: $("products-table"),
  productsTableBody: $("products-table").querySelector("tbody"),
  productsEmpty: $("products-empty"),
  channelProductsTable: $("channel-products-table"),
  channelProductsTableBody: $("channel-products-table").querySelector("tbody"),
  channelProductsEmpty: $("channel-products-empty"),
  channelProductEditorEmpty: $("channel-product-editor-empty"),
  channelProductForm: $("channel-product-form"),
  channelProductTitle: $("channel-product-title"),
  channelProductSubtitle: $("channel-product-subtitle"),
  channelProductCover: $("channel-product-cover"),
  channelProductStatus: $("channel-product-status"),
  channelProductSortNo: $("channel-product-sort-no"),
  channelProductCategoryId: $("channel-product-category-id"),
  channelProductAlbum: $("channel-product-album"),
  channelProductSourceName: $("channel-product-source-name"),
  channelProductSourceDesc: $("channel-product-source-desc"),
  channelProductSpecs: $("channel-product-specs"),
  skusTable: $("skus-table"),
  skusTableBody: $("skus-table").querySelector("tbody"),
  skusEmpty: $("skus-empty"),
  skuEditorEmpty: $("sku-editor-empty"),
  skuForm: $("sku-form"),
  skuCode: $("sku-code"),
  skuPrice: $("sku-price"),
  skuMarketPrice: $("sku-market-price"),
  skuStock: $("sku-stock"),
  skuStatus: $("sku-status"),
  skuSpecOptions: $("sku-spec-options"),
  ordersTable: $("orders-table"),
  ordersTableBody: $("orders-table").querySelector("tbody"),
  ordersEmpty: $("orders-empty"),
  pushLogsTable: $("push-logs-table"),
  pushLogsTableBody: $("push-logs-table").querySelector("tbody"),
  pushLogsEmpty: $("push-logs-empty"),
  activityLog: $("activity-log"),
  toast: $("toast"),
  integrationNameInput: $("integration-name"),
  integrationTypeInput: $("integration-type"),
  integrationStatusInput: $("integration-status"),
  integrationApiBaseUrlInput: $("integration-api-base-url"),
  integrationApiKeyInput: $("integration-api-key"),
  integrationApiSecretInput: $("integration-api-secret"),
  integrationProductSyncEnabledInput: $("integration-product-sync-enabled"),
  integrationOrderPushEnabledInput: $("integration-order-push-enabled"),
  integrationTestResult: $("integration-test-result"),
};

const colorInputs = Object.fromEntries(
  THEME_FIELDS.map((field) => [field, { input: $(field), text: $(`${field}_text`) }]),
);

function pushLog(message) {
  const item = document.createElement("li");
  item.textContent = `${new Date().toLocaleString()}  ${message}`;
  refs.activityLog.prepend(item);
}

function showToast(message, type = "info") {
  refs.toast.hidden = false;
  refs.toast.className = type === "error" ? "toast error" : "toast";
  refs.toast.textContent = message;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    refs.toast.hidden = true;
  }, 2600);
}

function setConnected(connected) {
  refs.connectionBadge.textContent = connected ? "已连接" : "未连接";
  refs.connectionBadge.className = connected ? "badge badge-live" : "badge badge-muted";
  [
    refs.refreshAllBtn,
    refs.runPushBtn,
    refs.refreshThemeBtn,
    refs.resetPresetBtn,
    refs.saveThemeBtn,
    refs.syncProductsBtn,
    refs.refreshProductsBtn,
    refs.refreshChannelProductsBtn,
    refs.saveChannelProductBtn,
    refs.openSkuEditorBtn,
    refs.skuProductSelect,
    refs.createSkuBtn,
    refs.saveSkuBtn,
    refs.deleteSkuBtn,
    refs.refreshSkusBtn,
    refs.testIntegrationBtn,
    refs.refreshIntegrationBtn,
    refs.saveIntegrationBtn,
    refs.refreshOrdersBtn,
    refs.refreshLogsBtn,
  ].forEach((node) => {
    node.disabled = !connected;
  });
}

function switchMenu(key) {
  refs.currentMenuLabel.textContent = MENU_LABELS[key];
  refs.pageTitle.textContent = `商家中台${MENU_LABELS[key]}`;
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.toggle("menu-item-active", item.dataset.menu === key);
  });
  document.querySelectorAll(".page-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `panel-${key}`);
  });
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (state.storeContextToken) {
    headers.set("X-Store-Context-Token", state.storeContextToken);
  }
  const response = await fetch(path, { ...options, headers });
  const rawText = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(rawText);
  } catch (_error) {
    throw new Error(`服务端返回了非 JSON 响应，通常表示后端报错或数据库迁移未执行。HTTP ${response.status}`);
  }
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || "request failed");
  }
  return payload.data;
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function statusPill(status, success) {
  const normalized = String(status || "").toLowerCase();
  let klass = "status-pill neutral";
  let label = status ?? "-";
  if (typeof success === "boolean") {
    klass = success ? "status-pill success" : "status-pill danger";
    label = success ? "成功" : "失败";
  } else if (["success", "synced", "active", "created"].includes(normalized)) {
    klass = "status-pill success";
  } else if (["pending", "retrying", "draft"].includes(normalized)) {
    klass = "status-pill warning";
  } else if (["failed", "disabled"].includes(normalized)) {
    klass = "status-pill danger";
  }
  return `<span class="${klass}">${label}</span>`;
}

function renderOverview() {
  if (!state.storeSummary) {
    refs.overviewShopName.textContent = "-";
    refs.overviewThemeName.textContent = "-";
    refs.overviewProductCount.textContent = "0";
    refs.overviewChannelCount.textContent = "0";
    refs.overviewSkuCount.textContent = "0";
    refs.overviewOrderCount.textContent = "0";
    refs.overviewLogCount.textContent = "0";
    refs.overviewStoreSummary.className = "summary-grid empty-state";
    refs.overviewStoreSummary.textContent = "连接店铺后显示门店摘要。";
    refs.storeSettingsGrid.className = "summary-grid empty-state";
    refs.storeSettingsGrid.textContent = "连接店铺后显示店铺设置。";
    refs.previewShopName.textContent = "店铺首页";
    refs.previewDescription.textContent = "连接店铺后即可看到当前配色效果。";
    return;
  }

  refs.overviewShopName.textContent = state.storeSummary.shop_name;
  refs.overviewThemeName.textContent = state.theme ? state.theme.preset_name : "-";
  refs.overviewProductCount.textContent = String(state.products.length);
  refs.overviewChannelCount.textContent = String(state.channelProducts.length);
  refs.overviewSkuCount.textContent = String(state.channelProducts.reduce((sum, item) => sum + item.sku_count, 0));
  refs.overviewOrderCount.textContent = String(state.orders.length);
  refs.overviewLogCount.textContent = String(state.pushLogs.length);
  refs.overviewStoreSummary.className = "summary-grid";
  refs.overviewStoreSummary.innerHTML = `
    <article class="info-tile"><span>店铺码</span><strong>${state.storeSummary.shop_code}</strong></article>
    <article class="info-tile"><span>租户 ID</span><strong>${state.storeSummary.tenant_id}</strong></article>
    <article class="info-tile"><span>店铺 ID</span><strong>${state.storeSummary.shop_id}</strong></article>
    <article class="info-tile"><span>当前接入</span><strong>${state.integration ? state.integration.name : "未配置"}</strong></article>
  `;
  refs.storeSettingsGrid.className = "summary-grid";
  refs.storeSettingsGrid.innerHTML = `
    <article class="info-tile"><span>店铺名称</span><strong>${state.storeSummary.shop_name}</strong></article>
    <article class="info-tile"><span>封面</span><strong>${state.storeSummary.cover ? "已配置" : "未配置"}</strong></article>
    <article class="info-tile"><span>Logo</span><strong>${state.storeSummary.logo ? "已配置" : "未配置"}</strong></article>
    <article class="info-tile"><span>当前主题</span><strong>${state.theme ? state.theme.preset_name : "-"}</strong></article>
    <article class="info-tile full"><span>店铺介绍</span><strong>${state.storeSummary.intro || "暂无介绍"}</strong></article>
  `;
  refs.previewShopName.textContent = state.storeSummary.shop_name;
  refs.previewDescription.textContent = state.storeSummary.intro || "可在中台调整商品和主题风格。";
}

function applyPreview(theme) {
  if (!theme) {
    return;
  }
  const colors = theme.colors;
  refs.previewPhone.style.setProperty("--primary-color", colors.primary_color);
  refs.previewPhone.style.setProperty("--primary-text-color", colors.primary_text_color);
  refs.previewPhone.style.setProperty("--accent-color", colors.accent_color);
  refs.previewPhone.style.setProperty("--background-color", colors.background_color);
  refs.previewPhone.style.setProperty("--surface-color", colors.surface_color);
  refs.previewPhone.style.setProperty("--surface-muted-color", colors.surface_muted_color);
  refs.previewPhone.style.setProperty("--text-color", colors.text_color);
  refs.previewPhone.style.setProperty("--text-muted-color", colors.text_muted_color);
  refs.previewPhone.style.setProperty("--notice-background-color", colors.notice_background_color);
}

function syncColorInputs(theme) {
  if (!theme) {
    return;
  }
  for (const field of THEME_FIELDS) {
    colorInputs[field].input.value = theme.colors[field];
    colorInputs[field].text.textContent = theme.colors[field];
  }
  applyPreview(theme);
}

function getPresetByKey(key) {
  return state.presets.find((item) => item.key === key) || state.presets[0] || null;
}

function renderPresets() {
  refs.presetList.innerHTML = "";
  for (const preset of state.presets) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `preset-card ${state.selectedPresetKey === preset.key ? "preset-card-active" : ""}`;
    item.innerHTML = `
      <span class="preset-swatch" style="--swatch-primary:${preset.primary_color}; --swatch-accent:${preset.accent_color}; --swatch-bg:${preset.background_color};"></span>
      <strong>${preset.name}</strong>
      <span>${preset.description}</span>
    `;
    item.addEventListener("click", () => applyPreset(preset.key));
    refs.presetList.appendChild(item);
  }
}

function applyPreset(presetKey) {
  state.selectedPresetKey = presetKey;
  const preset = getPresetByKey(presetKey);
  if (!preset) {
    return;
  }
  renderPresets();
  const theme = { preset_key: preset.key, preset_name: preset.name, description: preset.description, colors: {} };
  for (const field of THEME_FIELDS) {
    theme.colors[field] = preset[field];
  }
  syncColorInputs(theme);
}

function bindColorInputs() {
  for (const field of THEME_FIELDS) {
    colorInputs[field].input.addEventListener("input", () => {
      const preset = getPresetByKey(state.selectedPresetKey);
      if (!preset) {
        return;
      }
      const previewTheme = { preset_key: preset.key, preset_name: preset.name, description: preset.description, colors: {} };
      for (const key of THEME_FIELDS) {
        previewTheme.colors[key] = colorInputs[key].input.value.toUpperCase();
        colorInputs[key].text.textContent = previewTheme.colors[key];
      }
      applyPreview(previewTheme);
    });
  }
}

function renderProducts() {
  refs.productsTableBody.innerHTML = "";
  refs.productsEmpty.hidden = state.products.length > 0;
  refs.productsTable.hidden = state.products.length === 0;
  for (const product of state.products) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.source_product_id}</td>
      <td>${product.name}</td>
      <td>${product.sku_mode}</td>
      <td>${statusPill(product.sync_status)}</td>
      <td>${formatTime(product.last_sync_at)}</td>
    `;
    refs.productsTableBody.appendChild(row);
  }
}

function renderChannelProducts() {
  refs.channelProductsTableBody.innerHTML = "";
  refs.channelProductsEmpty.hidden = state.channelProducts.length > 0;
  refs.channelProductsTable.hidden = state.channelProducts.length === 0;
  refs.skuProductSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.channelProducts.length > 0 ? "请选择渠道商品" : "暂无可选商品";
  refs.skuProductSelect.appendChild(placeholder);

  for (const product of state.channelProducts) {
    const option = document.createElement("option");
    option.value = String(product.id);
    option.textContent = product.title;
    option.selected = state.selectedChannelProductId === product.id;
    refs.skuProductSelect.appendChild(option);

    const row = document.createElement("tr");
    row.className = state.selectedChannelProductId === product.id ? "row-active" : "";
    const actionCell = document.createElement("td");
    actionCell.className = "inline-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "编辑";
    editBtn.className = "ghost small-btn";
    editBtn.addEventListener("click", () => openChannelProductEditor(product.id));
    const skuBtn = document.createElement("button");
    skuBtn.type = "button";
    skuBtn.textContent = "看 SKU";
    skuBtn.className = "ghost small-btn";
    skuBtn.addEventListener("click", async () => {
      await selectChannelProduct(product.id);
      switchMenu("skus");
    });
    actionCell.append(editBtn, skuBtn);

    row.innerHTML = `
      <td>${product.title}</td>
      <td>${product.source_product_name || "-"}</td>
      <td>${statusPill(product.status)}</td>
      <td>${product.sort_no}</td>
      <td>${product.sku_count}</td>
    `;
    row.appendChild(actionCell);
    refs.channelProductsTableBody.appendChild(row);
  }
}

function renderChannelProductEditor() {
  const detail = state.channelProductDetail;
  const hasDetail = Boolean(detail);
  refs.channelProductEditorEmpty.hidden = hasDetail;
  refs.channelProductForm.classList.toggle("hidden", !hasDetail);
  refs.saveChannelProductBtn.disabled = !state.storeContextToken || !hasDetail;
  refs.openSkuEditorBtn.disabled = !state.storeContextToken || !hasDetail;

  if (!detail) {
    refs.channelProductSourceName.textContent = "-";
    refs.channelProductSourceDesc.textContent = "-";
    refs.channelProductSpecs.innerHTML = "";
    return;
  }

  refs.channelProductTitle.value = detail.title || "";
  refs.channelProductSubtitle.value = detail.subtitle || "";
  refs.channelProductCover.value = detail.cover || "";
  refs.channelProductStatus.value = detail.status || "draft";
  refs.channelProductSortNo.value = String(detail.sort_no || 0);
  refs.channelProductCategoryId.value = detail.category_id == null ? "" : String(detail.category_id);
  refs.channelProductAlbum.value = Array.isArray(detail.album_json) ? detail.album_json.join("\n") : "";
  refs.channelProductSourceName.textContent = detail.source_product_name || "未关联来源商品";
  refs.channelProductSourceDesc.textContent = detail.source_product_description || "暂无来源商品说明";
  refs.channelProductSpecs.innerHTML = "";
  for (const spec of detail.specs) {
    const group = document.createElement("div");
    group.className = "tag-group";
    const title = document.createElement("strong");
    title.textContent = spec.name;
    group.appendChild(title);
    for (const value of spec.values) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = `${value.value} (#${value.id})`;
      group.appendChild(tag);
    }
    refs.channelProductSpecs.appendChild(group);
  }
}

function renderSkus() {
  refs.skusTableBody.innerHTML = "";
  refs.skusEmpty.hidden = state.skus.length > 0;
  refs.skusTable.hidden = state.skus.length === 0;
  refs.skusEmpty.textContent = state.selectedChannelProductId ? "当前商品暂无 SKU。" : "请选择一个渠道商品查看 SKU。";

  for (const sku of state.skus) {
    const row = document.createElement("tr");
    row.className = state.selectedSkuId === sku.id ? "row-active" : "";
    const actionCell = document.createElement("td");
    actionCell.className = "inline-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "编辑";
    editBtn.className = "ghost small-btn";
    editBtn.addEventListener("click", () => selectSku(sku.id));
    actionCell.appendChild(editBtn);
    row.innerHTML = `
      <td>${sku.sku_code}</td>
      <td>${sku.spec_text}</td>
      <td>${sku.price}</td>
      <td>${sku.market_price || "-"}</td>
      <td>${sku.stock}</td>
      <td>${statusPill(sku.status)}</td>
    `;
    row.appendChild(actionCell);
    refs.skusTableBody.appendChild(row);
  }
}

function renderSkuSpecOptions() {
  refs.skuSpecOptions.innerHTML = "";
  const specs = state.channelProductDetail ? state.channelProductDetail.specs : [];
  if (specs.length === 0) {
    refs.skuSpecOptions.innerHTML = '<div class="empty-state inline-empty">当前商品没有规格值，可直接保存单规格 SKU。</div>';
    return;
  }
  for (const spec of specs) {
    const group = document.createElement("section");
    group.className = "spec-option-group";
    group.innerHTML = `<strong>${spec.name}</strong>`;
    const list = document.createElement("div");
    list.className = "spec-option-list";
    for (const value of spec.values) {
      const label = document.createElement("label");
      label.className = "check-tag";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = String(value.id);
      input.dataset.specId = String(spec.id);
      const text = document.createElement("span");
      text.textContent = `${value.value} (#${value.id})`;
      label.append(input, text);
      list.appendChild(label);
    }
    group.appendChild(list);
    refs.skuSpecOptions.appendChild(group);
  }
}

function renderSkuEditor() {
  const hasProduct = Boolean(state.selectedChannelProductId);
  const editingSku = state.selectedSkuId ? state.skus.find((item) => item.id === state.selectedSkuId) : null;
  refs.skuEditorEmpty.hidden = hasProduct;
  refs.skuForm.classList.toggle("hidden", !hasProduct);
  refs.createSkuBtn.disabled = !state.storeContextToken || !hasProduct;
  refs.saveSkuBtn.disabled = !state.storeContextToken || !hasProduct;
  refs.deleteSkuBtn.disabled = !state.storeContextToken || !editingSku;

  if (!hasProduct) {
    refs.skuCode.value = "";
    refs.skuPrice.value = "";
    refs.skuMarketPrice.value = "";
    refs.skuStock.value = "";
    refs.skuStatus.value = "active";
    refs.skuSpecOptions.innerHTML = "";
    return;
  }

  renderSkuSpecOptions();
  refs.skuCode.value = editingSku ? editingSku.sku_code : "";
  refs.skuPrice.value = editingSku ? String(editingSku.price) : "";
  refs.skuMarketPrice.value = editingSku && editingSku.market_price != null ? String(editingSku.market_price) : "";
  refs.skuStock.value = editingSku ? String(editingSku.stock) : "0";
  refs.skuStatus.value = editingSku ? editingSku.status : "active";

  const selectedValueIds = new Set(editingSku ? editingSku.spec_value_ids_json : []);
  refs.skuSpecOptions.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selectedValueIds.has(Number(input.value));
  });
}

function renderIntegration() {
  if (!state.integration) {
    return;
  }
  refs.integrationNameInput.value = state.integration.name || "";
  refs.integrationTypeInput.value = state.integration.integration_type || "";
  refs.integrationStatusInput.value = state.integration.status || "";
  refs.integrationApiBaseUrlInput.value = state.integration.api_base_url || "";
  refs.integrationApiKeyInput.value = state.integration.api_key || "";
  refs.integrationApiSecretInput.value = "";
  refs.integrationProductSyncEnabledInput.checked = state.integration.product_sync_enabled;
  refs.integrationOrderPushEnabledInput.checked = state.integration.order_push_enabled;
}

function renderIntegrationTestResult(result, type = "empty") {
  refs.integrationTestResult.className = type === "result" ? "result-box" : "empty-state";
  refs.integrationTestResult.innerHTML = result;
}

function renderOrders() {
  refs.ordersTableBody.innerHTML = "";
  refs.ordersEmpty.hidden = state.orders.length > 0;
  refs.ordersTable.hidden = state.orders.length === 0;
  for (const order of state.orders) {
    const row = document.createElement("tr");
    const actionCell = document.createElement("td");
    actionCell.className = "inline-actions";
    const repushBtn = document.createElement("button");
    repushBtn.type = "button";
    repushBtn.textContent = "重推";
    repushBtn.className = "ghost small-btn";
    repushBtn.addEventListener("click", () => repushOrder(order.id));
    actionCell.appendChild(repushBtn);
    row.innerHTML = `
      <td>${order.order_no}</td>
      <td>${order.customer_id}</td>
      <td>${order.total_amount}</td>
      <td>${statusPill(order.status)}</td>
      <td>${statusPill(order.push_status)}</td>
      <td>${formatTime(order.created_at)}</td>
    `;
    row.appendChild(actionCell);
    refs.ordersTableBody.appendChild(row);
  }
}

function renderPushLogs() {
  refs.pushLogsTableBody.innerHTML = "";
  refs.pushLogsEmpty.hidden = state.pushLogs.length > 0;
  refs.pushLogsTable.hidden = state.pushLogs.length === 0;
  for (const log of state.pushLogs) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.id}</td>
      <td>${log.order_id}</td>
      <td>${log.task_id}</td>
      <td>${statusPill(null, log.success)}</td>
      <td>${formatTime(log.pushed_at)}</td>
      <td>${formatTime(log.created_at)}</td>
    `;
    refs.pushLogsTableBody.appendChild(row);
  }
}

async function loadStoreHome() {
  state.storeSummary = await request("/api/store/home");
}

async function loadThemePresets() {
  state.presets = await request("/api/merchant/storefront-theme/presets");
  renderPresets();
}

async function loadTheme() {
  state.theme = await request("/api/merchant/storefront-theme");
  state.selectedPresetKey = state.theme.preset_key;
  renderPresets();
  syncColorInputs(state.theme);
}

async function loadProducts() {
  state.products = await request("/api/merchant/source-products");
  renderProducts();
}

async function loadChannelProducts() {
  state.channelProducts = await request("/api/merchant/channel-products");
  if (state.channelProducts.length === 0) {
    state.selectedChannelProductId = null;
    state.channelProductDetail = null;
    state.selectedSkuId = null;
    state.skus = [];
  } else if (!state.selectedChannelProductId || !state.channelProducts.some((item) => item.id === state.selectedChannelProductId)) {
    state.selectedChannelProductId = state.channelProducts[0].id;
  }
  renderChannelProducts();
}

async function loadChannelProductDetail(productId = state.selectedChannelProductId) {
  if (!productId) {
    state.channelProductDetail = null;
    renderChannelProductEditor();
    return;
  }
  state.channelProductDetail = await request(`/api/merchant/channel-products/${productId}`);
  renderChannelProductEditor();
}

async function loadSkus() {
  if (!state.selectedChannelProductId) {
    state.skus = [];
    state.selectedSkuId = null;
    renderSkus();
    renderSkuEditor();
    return;
  }
  state.skus = await request(`/api/merchant/channel-products/${state.selectedChannelProductId}/skus`);
  if (state.selectedSkuId && !state.skus.some((item) => item.id === state.selectedSkuId)) {
    state.selectedSkuId = null;
  }
  renderSkus();
  renderSkuEditor();
}

async function loadIntegration() {
  state.integration = await request("/api/merchant/integration-config");
  renderIntegration();
}

async function loadOrders() {
  state.orders = await request("/api/merchant/orders");
  renderOrders();
}

async function loadPushLogs() {
  state.pushLogs = await request("/api/merchant/push-logs");
  renderPushLogs();
}

async function loadAllData() {
  await Promise.all([
    loadStoreHome(),
    loadThemePresets(),
    loadTheme(),
    loadProducts(),
    loadChannelProducts(),
    loadIntegration(),
    loadOrders(),
    loadPushLogs(),
  ]);
  if (state.selectedChannelProductId) {
    await loadChannelProductDetail();
  } else {
    renderChannelProductEditor();
  }
  await loadSkus();
  renderOverview();
}

async function connectStore(event) {
  event.preventDefault();
  const shopCode = refs.shopCodeInput.value.trim();
  if (!shopCode) {
    return;
  }
  try {
    const resolved = await request("/api/store/resolve", {
      method: "POST",
      body: JSON.stringify({ code: shopCode }),
    });
    state.shopCode = shopCode;
    state.storeContextToken = resolved.store_context_token;
    renderIntegrationTestResult("点击“连通性测试”后，这里会显示接口请求结果。");
    await loadAllData();
    setConnected(true);
    pushLog(`店铺 ${shopCode} 连接成功`);
    showToast("店铺已连接");
  } catch (error) {
    setConnected(false);
    showToast(`连接失败：${error.message}`, "error");
    pushLog(`连接失败：${error.message}`);
  }
}

async function refreshAll() {
  try {
    await loadAllData();
    pushLog("已刷新商家中台数据");
    showToast("数据已刷新");
  } catch (error) {
    showToast(`刷新失败：${error.message}`, "error");
  }
}

async function refreshTheme() {
  try {
    await Promise.all([loadStoreHome(), loadTheme()]);
    renderOverview();
    pushLog("已刷新主题配置");
    showToast("主题已刷新");
  } catch (error) {
    showToast(`刷新失败：${error.message}`, "error");
  }
}

function resetToPreset() {
  applyPreset(state.selectedPresetKey);
  showToast("已恢复模板原色");
}

async function saveTheme() {
  try {
    const colors = {};
    for (const field of THEME_FIELDS) {
      colors[field] = colorInputs[field].input.value.toUpperCase();
    }
    state.theme = await request("/api/merchant/storefront-theme", {
      method: "PUT",
      body: JSON.stringify({ preset_key: state.selectedPresetKey, colors }),
    });
    syncColorInputs(state.theme);
    renderOverview();
    pushLog(`已保存主题：${state.theme.preset_name}`);
    showToast("主题保存成功");
  } catch (error) {
    showToast(`保存失败：${error.message}`, "error");
  }
}

async function syncProducts() {
  try {
    const result = await request("/api/merchant/products/sync", { method: "POST" });
    state.products = result.source_products;
    renderProducts();
    refs.syncSummary.textContent = `本次拉取 ${result.pulled_count} 条，新增 ${result.created_count} 条，更新 ${result.updated_count} 条，跳过 ${result.skipped_count} 条。`;
    await loadChannelProducts();
    await loadChannelProductDetail();
    await loadSkus();
    renderOverview();
    pushLog(`商品同步完成：新增 ${result.created_count}，更新 ${result.updated_count}`);
    showToast("商品同步完成");
  } catch (error) {
    showToast(`同步失败：${error.message}`, "error");
  }
}

async function openChannelProductEditor(productId) {
  state.selectedChannelProductId = productId;
  state.selectedSkuId = null;
  renderChannelProducts();
  await loadChannelProductDetail(productId);
  await loadSkus();
  switchMenu("channel-products");
}

async function selectChannelProduct(productId) {
  state.selectedChannelProductId = productId;
  state.selectedSkuId = null;
  renderChannelProducts();
  await loadChannelProductDetail(productId);
  await loadSkus();
}

function collectChannelProductPayload() {
  return {
    title: refs.channelProductTitle.value.trim(),
    subtitle: refs.channelProductSubtitle.value.trim() || null,
    cover: refs.channelProductCover.value.trim() || null,
    status: refs.channelProductStatus.value,
    sort_no: Number(refs.channelProductSortNo.value || 0),
    category_id: refs.channelProductCategoryId.value ? Number(refs.channelProductCategoryId.value) : null,
    album_json: refs.channelProductAlbum.value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

async function saveChannelProduct() {
  if (!state.selectedChannelProductId) {
    return;
  }
  try {
    await request(`/api/merchant/channel-products/${state.selectedChannelProductId}`, {
      method: "PUT",
      body: JSON.stringify(collectChannelProductPayload()),
    });
    await loadChannelProducts();
    await loadChannelProductDetail(state.selectedChannelProductId);
    renderOverview();
    pushLog(`已更新渠道商品：${refs.channelProductTitle.value.trim()}`);
    showToast("渠道商品已更新");
  } catch (error) {
    showToast(`保存失败：${error.message}`, "error");
  }
}

function collectSkuPayload() {
  const specValueIds = Array.from(refs.skuSpecOptions.querySelectorAll('input[type="checkbox"]:checked')).map((input) => Number(input.value));
  return {
    sku_code: refs.skuCode.value.trim(),
    spec_value_ids_json: specValueIds,
    price: refs.skuPrice.value || "0",
    market_price: refs.skuMarketPrice.value || null,
    stock: Number(refs.skuStock.value || 0),
    status: refs.skuStatus.value,
  };
}

function startCreateSku() {
  state.selectedSkuId = null;
  renderSkus();
  renderSkuEditor();
}

function selectSku(skuId) {
  state.selectedSkuId = skuId;
  renderSkus();
  renderSkuEditor();
}

async function saveSku() {
  if (!state.selectedChannelProductId) {
    return;
  }
  try {
    const payload = collectSkuPayload();
    if (state.selectedSkuId) {
      await request(`/api/merchant/skus/${state.selectedSkuId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      pushLog(`已更新 SKU：${payload.sku_code}`);
      showToast("SKU 已更新");
    } else {
      const created = await request(`/api/merchant/channel-products/${state.selectedChannelProductId}/skus`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.selectedSkuId = created.id;
      pushLog(`已新增 SKU：${payload.sku_code}`);
      showToast("SKU 已新增");
    }
    await loadChannelProducts();
    await loadSkus();
    renderOverview();
  } catch (error) {
    showToast(`保存失败：${error.message}`, "error");
  }
}

async function deleteSku() {
  if (!state.selectedSkuId) {
    return;
  }
  if (!window.confirm("确定删除当前 SKU 吗？")) {
    return;
  }
  try {
    await request(`/api/merchant/skus/${state.selectedSkuId}`, { method: "DELETE" });
    pushLog(`已删除 SKU：${state.selectedSkuId}`);
    state.selectedSkuId = null;
    await loadChannelProducts();
    await loadSkus();
    renderOverview();
    showToast("SKU 已删除");
  } catch (error) {
    showToast(`删除失败：${error.message}`, "error");
  }
}

async function saveIntegration() {
  try {
    state.integration = await request("/api/merchant/integration-config", {
      method: "PUT",
      body: JSON.stringify({
        name: refs.integrationNameInput.value.trim(),
        integration_type: refs.integrationTypeInput.value.trim(),
        status: refs.integrationStatusInput.value.trim(),
        api_base_url: refs.integrationApiBaseUrlInput.value.trim(),
        api_key: refs.integrationApiKeyInput.value.trim() || null,
        api_secret: refs.integrationApiSecretInput.value.trim() || null,
        product_sync_enabled: refs.integrationProductSyncEnabledInput.checked,
        order_push_enabled: refs.integrationOrderPushEnabledInput.checked,
      }),
    });
    renderIntegration();
    pushLog(`已保存接入配置：${state.integration.name}`);
    showToast("接入配置已保存");
  } catch (error) {
    showToast(`保存失败：${error.message}`, "error");
  }
}

async function testIntegration() {
  try {
    const result = await request("/api/merchant/integration-config/test", { method: "POST" });
    renderIntegrationTestResult(
      `
        <article>
          <div class="result-head">
            ${statusPill(result.reachable ? "success" : "failed", result.reachable)}
            <strong>${result.message}</strong>
          </div>
          <p>请求地址：${result.request_url || "未配置真实接口地址"}</p>
          <p>返回样本数：${result.sample_count}</p>
        </article>
      `,
      "result",
    );
    pushLog(`已执行接入连通性测试：${result.message}`);
    showToast(result.reachable ? "接入连通性正常" : "接入连通性异常", result.reachable ? "info" : "error");
  } catch (error) {
    renderIntegrationTestResult(`<article><strong>测试失败</strong><p>${error.message}</p></article>`, "result");
    showToast(`测试失败：${error.message}`, "error");
  }
}

async function repushOrder(orderId) {
  try {
    await request(`/api/merchant/orders/${orderId}/repush`, { method: "POST" });
    await Promise.all([loadOrders(), loadPushLogs()]);
    renderOverview();
    pushLog(`订单 ${orderId} 已重推`);
    showToast(`订单 ${orderId} 已重推`);
  } catch (error) {
    showToast(`重推失败：${error.message}`, "error");
  }
}

async function runPushTasks() {
  try {
    const result = await request("/api/integration/orders/push", { method: "POST" });
    await Promise.all([loadOrders(), loadPushLogs()]);
    renderOverview();
    pushLog(`执行推送完成，本次处理 ${result.processed} 条任务`);
    showToast(`已执行推送，处理 ${result.processed} 条`);
  } catch (error) {
    showToast(`执行推送失败：${error.message}`, "error");
  }
}

document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", () => switchMenu(item.dataset.menu));
});

refs.skuProductSelect.addEventListener("change", async () => {
  const value = Number(refs.skuProductSelect.value || 0);
  state.selectedChannelProductId = value || null;
  state.selectedSkuId = null;
  renderChannelProducts();
  await loadChannelProductDetail();
  await loadSkus();
});

refs.connectForm.addEventListener("submit", connectStore);
refs.refreshAllBtn.addEventListener("click", refreshAll);
refs.runPushBtn.addEventListener("click", runPushTasks);
refs.refreshThemeBtn.addEventListener("click", refreshTheme);
refs.resetPresetBtn.addEventListener("click", resetToPreset);
refs.saveThemeBtn.addEventListener("click", saveTheme);
refs.syncProductsBtn.addEventListener("click", syncProducts);
refs.refreshProductsBtn.addEventListener("click", loadProducts);
refs.refreshChannelProductsBtn.addEventListener("click", async () => {
  await loadChannelProducts();
  await loadChannelProductDetail();
  await loadSkus();
  renderOverview();
});
refs.saveChannelProductBtn.addEventListener("click", saveChannelProduct);
refs.openSkuEditorBtn.addEventListener("click", () => switchMenu("skus"));
refs.createSkuBtn.addEventListener("click", startCreateSku);
refs.saveSkuBtn.addEventListener("click", saveSku);
refs.deleteSkuBtn.addEventListener("click", deleteSku);
refs.refreshSkusBtn.addEventListener("click", loadSkus);
refs.testIntegrationBtn.addEventListener("click", testIntegration);
refs.refreshIntegrationBtn.addEventListener("click", loadIntegration);
refs.saveIntegrationBtn.addEventListener("click", saveIntegration);
refs.refreshOrdersBtn.addEventListener("click", loadOrders);
refs.refreshLogsBtn.addEventListener("click", loadPushLogs);

bindColorInputs();
switchMenu("overview");
renderOverview();
renderChannelProductEditor();
renderSkuEditor();
renderIntegrationTestResult("点击“连通性测试”后，这里会显示接口请求结果。");
setConnected(false);
