import { buildThemeStyle, getActiveTheme } from '../../utils/theme'
import { clearCartItems, createOrder, getCartItems, getDemoCustomerId } from '../../utils/storefront'

function calculateTotal(items: CartSkuItem[]) {
  return items
    .reduce((sum, item) => sum + Number(item.price) * item.qty, 0)
    .toFixed(2)
}

type CheckoutPageData = {
  items: CartSkuItem[]
  totalAmount: string
  remark: string
  submitting: boolean
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

Page<CheckoutPageData, WechatMiniprogram.IAnyObject>({
  data: {
    items: [],
    totalAmount: '0.00',
    remark: '',
    submitting: false,
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onShow() {
    const theme = getActiveTheme()
    const items = getCartItems()
    this.setData({
      items,
      totalAmount: calculateTotal(items),
      themeStyle: buildThemeStyle(theme),
      navBackgroundColor: theme.colors.backgroundColor,
      navFrontColor: theme.colors.textColor,
    })
  },

  handleRemarkInput(event: WechatMiniprogram.Input) {
    this.setData({ remark: event.detail.value })
  },

  async submitOrder() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const order = await createOrder({
        customer_id: getDemoCustomerId(),
        remark: this.data.remark,
        address_json: {
          name: '演示收货人',
          mobile: '13900000000',
          detail: '上海市测试路 88 号',
        },
        items: this.data.items.map((item) => ({
          product_id: item.productId,
          sku_id: item.skuId,
          qty: item.qty,
        })),
      })
      clearCartItems()
      wx.showToast({ title: '下单成功', icon: 'success' })
      wx.redirectTo({ url: `/pages/orders/index?highlight=${order.order_no}` })
    } catch (error) {
      wx.showToast({ title: (error as Error).message, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
