import { buildThemeStyle, getActiveTheme, syncTabBarTheme } from '../../utils/theme'
import { getCartItems, removeCartItem, updateCartQty } from '../../utils/storefront'

function calculateTotal(items: CartSkuItem[]) {
  return items
    .reduce((sum, item) => sum + Number(item.price) * item.qty, 0)
    .toFixed(2)
}

type CartPageData = {
  items: CartSkuItem[]
  totalAmount: string
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

Page<CartPageData, WechatMiniprogram.IAnyObject>({
  data: {
    items: [],
    totalAmount: '0.00',
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onShow() {
    this.syncTheme()
    this.syncTabBar()
    this.refreshCart()
  },

  syncTheme() {
    const theme = getActiveTheme()
    this.setData({
      themeStyle: buildThemeStyle(theme),
      navBackgroundColor: theme.colors.backgroundColor,
      navFrontColor: theme.colors.textColor,
    })
  },

  syncTabBar() {
    syncTabBarTheme(this, 'cart')
  },

  refreshCart() {
    const items = getCartItems()
    this.setData({
      items,
      totalAmount: calculateTotal(items),
    })
  },

  increaseQty(event: WechatMiniprogram.TouchEvent) {
    const { productId, skuId, qty } = event.currentTarget.dataset as { productId: number; skuId: number; qty: number }
    updateCartQty(productId, skuId, Number(qty) + 1)
    this.refreshCart()
  },

  decreaseQty(event: WechatMiniprogram.TouchEvent) {
    const { productId, skuId, qty } = event.currentTarget.dataset as { productId: number; skuId: number; qty: number }
    updateCartQty(productId, skuId, Math.max(Number(qty) - 1, 0))
    this.refreshCart()
  },

  removeItem(event: WechatMiniprogram.TouchEvent) {
    const { productId, skuId } = event.currentTarget.dataset as { productId: number; skuId: number }
    removeCartItem(productId, skuId)
    this.refreshCart()
  },

  goCheckout() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/checkout/index' })
  },
})
