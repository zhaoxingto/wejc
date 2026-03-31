import { buildThemeStyle, getActiveTheme } from '../../utils/theme'
import {
  fetchStoreProductDetail,
  getCartItems,
  getDemoCustomerId,
  syncAddCartItem,
  upsertCartItem,
  type StoreProductDetail,
  type StoreProductSku,
} from '../../utils/storefront'

function getSkuText(detail: StoreProductDetail, sku: StoreProductSku) {
  return sku.spec_value_ids_json
    .map((valueId) => {
      for (const spec of detail.specs) {
        const value = spec.values.find((item) => item.id === valueId)
        if (value) {
          return `${spec.name}: ${value.value}`
        }
      }
      return String(valueId)
    })
    .join(' / ')
}

type ProductDetailData = {
  productId: number
  loading: boolean
  detail: StoreProductDetail | null
  selectedSkuId: number
  qty: number
  cartCount: number
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

Page<ProductDetailData, WechatMiniprogram.IAnyObject>({
  data: {
    productId: 0,
    loading: false,
    detail: null,
    selectedSkuId: 0,
    qty: 1,
    cartCount: 0,
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onLoad(query) {
    const productId = Number(query.id || 0)
    this.setData({ productId })
  },

  onShow() {
    this.syncTheme()
    void this.loadDetail()
  },

  syncTheme() {
    const theme = getActiveTheme()
    this.setData({
      themeStyle: buildThemeStyle(theme),
      navBackgroundColor: theme.colors.backgroundColor,
      navFrontColor: theme.colors.textColor,
    })
  },

  async loadDetail() {
    if (!this.data.productId) {
      return
    }
    this.setData({ loading: true, cartCount: getCartItems().reduce((sum, item) => sum + item.qty, 0) })
    try {
      const detail = await fetchStoreProductDetail(this.data.productId)
      this.setData({
        loading: false,
        detail,
        selectedSkuId: detail.skus.length > 0 ? detail.skus[0].id : 0,
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({ title: (error as Error).message, icon: 'none' })
    }
  },

  selectSku(event: WechatMiniprogram.TouchEvent) {
    const { skuId } = event.currentTarget.dataset as { skuId: number }
    this.setData({ selectedSkuId: skuId })
  },

  increaseQty() {
    this.setData({ qty: this.data.qty + 1 })
  },

  decreaseQty() {
    if (this.data.qty <= 1) {
      return
    }
    this.setData({ qty: this.data.qty - 1 })
  },

  async addToCart() {
    const { detail, selectedSkuId, qty } = this.data
    if (!detail) {
      return false
    }
    const sku = detail.skus.find((item) => item.id === selectedSkuId)
    if (!sku) {
      wx.showToast({ title: '请选择规格', icon: 'none' })
      return false
    }

    try {
      await syncAddCartItem({
        customer_id: getDemoCustomerId(),
        product_id: detail.id,
        sku_id: sku.id,
        qty,
      })
      const items = upsertCartItem({
        productId: detail.id,
        productTitle: detail.title,
        productSubtitle: detail.subtitle,
        cover: detail.cover,
        skuId: sku.id,
        skuCode: sku.sku_code,
        skuText: getSkuText(detail, sku),
        price: sku.price,
        qty,
      })
      this.setData({ cartCount: items.reduce((sum, item) => sum + item.qty, 0) })
      wx.showToast({ title: '已加入购物车', icon: 'success' })
      return true
    } catch (error) {
      wx.showToast({ title: (error as Error).message, icon: 'none' })
      return false
    }
  },

  async buyNow() {
    const added = await this.addToCart()
    if (added) {
      wx.navigateTo({ url: '/pages/checkout/index' })
    }
  },

  openCart() {
    wx.navigateTo({ url: '/pages/cart/index' })
  },
})
