const STORE_CONTEXT_KEY = 'wejc_store_context'
const CART_ITEMS_KEY = 'wejc_cart_items'

type ResponseEnvelope<T> = {
  code: number
  message: string
  data: T | null
}

type StoreThemePayload = {
  preset_key: string
  preset_name: string
  description: string
  colors: {
    primary_color: string
    primary_text_color: string
    accent_color: string
    background_color: string
    surface_color: string
    surface_muted_color: string
    text_color: string
    text_muted_color: string
    notice_background_color: string
  }
}

type StoreResolveResponse = {
  tenant_id: number
  shop_id: number
  shop_name: string
  logo?: string | null
  store_context_token: string
}

type StoreHomeResponse = {
  tenant_id: number
  shop_id: number
  shop_code: string
  shop_name: string
  logo?: string | null
  cover?: string | null
  intro?: string | null
  theme: StoreThemePayload
}

export type StoreProductListItem = {
  id: number
  title: string
  subtitle?: string | null
  cover?: string | null
  status: string
  sort_no: number
}

export type StoreProductSku = {
  id: number
  sku_code: string
  spec_value_ids_json: number[]
  price: string
  market_price?: string | null
  stock: number
  status: string
}

export type StoreProductSpecValue = {
  id: number
  value: string
  sort_no: number
}

export type StoreProductSpec = {
  id: number
  name: string
  sort_no: number
  values: StoreProductSpecValue[]
}

export type StoreProductDetail = {
  id: number
  tenant_id: number
  shop_id: number
  title: string
  subtitle?: string | null
  cover?: string | null
  album_json?: string[] | null
  status: string
  sort_no: number
  specs: StoreProductSpec[]
  skus: StoreProductSku[]
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: number
  product_id: number
  sku_id: number
  product_title: string
  sku_text: string
  price: string
  qty: number
  amount: string
  created_at: string
}

export type OrderRead = {
  id: number
  customer_id: number
  order_no: string
  status: string
  push_status: string
  total_amount: string
  remark?: string | null
  address_json?: Record<string, unknown> | null
  created_at: string
  items: OrderItem[]
}

function getAppConfig() {
  const app = getApp<IAppOption>()
  return app.globalData
}

function mapTheme(payload: StoreThemePayload): StoreTheme {
  return {
    presetKey: payload.preset_key,
    presetName: payload.preset_name,
    description: payload.description,
    colors: {
      primaryColor: payload.colors.primary_color,
      primaryTextColor: payload.colors.primary_text_color,
      accentColor: payload.colors.accent_color,
      backgroundColor: payload.colors.background_color,
      surfaceColor: payload.colors.surface_color,
      surfaceMutedColor: payload.colors.surface_muted_color,
      textColor: payload.colors.text_color,
      textMutedColor: payload.colors.text_muted_color,
      noticeBackgroundColor: payload.colors.notice_background_color,
    },
  }
}

function request<T>(path: string, method: 'GET' | 'POST' | 'PUT', data?: Record<string, unknown>, withStoreContext = false) {
  const { apiBaseUrl, storeContext } = getAppConfig()
  const header: Record<string, string> = {}
  if (withStoreContext && storeContext && storeContext.storeContextToken) {
    header['X-Store-Context-Token'] = storeContext.storeContextToken
  }

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method,
      data,
      header,
      success: (res) => {
        const payload = res.data as ResponseEnvelope<T>
        if (res.statusCode >= 200 && res.statusCode < 300 && payload.code === 0 && payload.data !== null) {
          resolve(payload.data)
          return
        }
        reject(new Error(payload.message || '请求失败'))
      },
      fail: () => reject(new Error('网络请求失败，请确认后端服务已启动')),
    })
  })
}

export function getStoreContext() {
  return getAppConfig().storeContext
}

export function setStoreContext(context: StoreContext) {
  const app = getApp<IAppOption>()
  app.globalData.storeContext = context
  wx.setStorageSync(STORE_CONTEXT_KEY, context)
}

export async function resolveAndLoadStore(shopCode: string) {
  const resolved = await request<StoreResolveResponse>('/api/store/resolve', 'POST', { code: shopCode })
  setStoreContext({
    tenantId: resolved.tenant_id,
    shopId: resolved.shop_id,
    shopName: resolved.shop_name,
    shopCode,
    logo: resolved.logo,
    storeContextToken: resolved.store_context_token,
  })

  const home = await request<StoreHomeResponse>('/api/store/home', 'GET', undefined, true)
  const context: StoreContext = {
    tenantId: resolved.tenant_id,
    shopId: resolved.shop_id,
    shopName: home.shop_name,
    shopCode: home.shop_code,
    logo: home.logo,
    cover: home.cover,
    intro: home.intro,
    theme: mapTheme(home.theme),
    storeContextToken: resolved.store_context_token,
  }
  setStoreContext(context)
  return context
}

export function ensureStoreContext() {
  const context = getStoreContext()
  if (!context || !context.storeContextToken) {
    throw new Error('请先连接店铺')
  }
  return context
}

export function getDemoCustomerId() {
  return getAppConfig().demoCustomerId
}

export function getDemoShopCode() {
  return getAppConfig().demoShopCode
}

export function fetchStoreHome() {
  ensureStoreContext()
  return request<StoreHomeResponse>('/api/store/home', 'GET', undefined, true)
}

export function fetchStoreProducts() {
  ensureStoreContext()
  return request<StoreProductListItem[]>('/api/store/products', 'GET', undefined, true)
}

export function fetchStoreProductDetail(productId: number) {
  ensureStoreContext()
  return request<StoreProductDetail>(`/api/store/products/${productId}`, 'GET', undefined, true)
}

export function syncAddCartItem(payload: { customer_id: number; product_id: number; sku_id: number; qty: number }) {
  ensureStoreContext()
  return request('/api/customer/cart/add', 'POST', payload, true)
}

export function createOrder(payload: {
  customer_id: number
  remark?: string
  address_json?: Record<string, unknown>
  items: Array<{ product_id: number; sku_id: number; qty: number }>
}) {
  ensureStoreContext()
  return request<OrderRead>('/api/customer/orders', 'POST', payload, true)
}

export function fetchCustomerOrders(customerId: number) {
  ensureStoreContext()
  return request<OrderRead[]>(`/api/customer/orders?customer_id=${customerId}`, 'GET', undefined, true)
}

export function getCartItems() {
  const items = wx.getStorageSync(CART_ITEMS_KEY) as CartSkuItem[] | undefined
  return items || []
}

export function saveCartItems(items: CartSkuItem[]) {
  wx.setStorageSync(CART_ITEMS_KEY, items)
}

export function clearCartItems() {
  wx.removeStorageSync(CART_ITEMS_KEY)
}

export function upsertCartItem(item: CartSkuItem) {
  const items = getCartItems()
  const index = items.findIndex((cartItem) => cartItem.productId === item.productId && cartItem.skuId === item.skuId)
  if (index >= 0) {
    items[index].qty += item.qty
  } else {
    items.push(item)
  }
  saveCartItems(items)
  return items
}

export function updateCartQty(productId: number, skuId: number, qty: number) {
  const nextItems = getCartItems()
    .map((item) => {
      if (item.productId === productId && item.skuId === skuId) {
        return { ...item, qty }
      }
      return item
    })
    .filter((item) => item.qty > 0)
  saveCartItems(nextItems)
  return nextItems
}

export function removeCartItem(productId: number, skuId: number) {
  const nextItems = getCartItems().filter((item) => !(item.productId === productId && item.skuId === skuId))
  saveCartItems(nextItems)
  return nextItems
}
