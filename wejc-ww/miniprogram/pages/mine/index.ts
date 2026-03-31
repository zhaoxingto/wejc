import { buildThemeStyle, getActiveTheme, syncTabBarTheme } from '../../utils/theme'
import { getDemoCustomerId, getStoreContext } from '../../utils/storefront'

type OrderShortcut = {
  key: string
  label: string
}

type MenuItem = {
  key: string
  label: string
}

type MinePageData = {
  userName: string
  shopName: string
  customerId: number
  orderShortcuts: OrderShortcut[]
  menuItems: MenuItem[]
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

Page<MinePageData, WechatMiniprogram.IAnyObject>({
  data: {
    userName: '演示用户',
    shopName: '演示店铺',
    customerId: getDemoCustomerId(),
    orderShortcuts: [
      { key: 'pending-pay', label: '待付款' },
      { key: 'pending-send', label: '待发货' },
      { key: 'pending-receive', label: '待收货' },
      { key: 'completed', label: '已收货' },
      { key: 'after-sale', label: '售后' },
    ],
    menuItems: [
      { key: 'coupon', label: '我的优惠券' },
      { key: 'address', label: '我的地址' },
      { key: 'about', label: '关于' },
    ],
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onShow() {
    this.syncTheme()
    this.syncTabBar()
    const context = getStoreContext()
    this.setData({
      shopName: context ? context.shopName : '演示店铺',
      customerId: getDemoCustomerId(),
    })
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
    syncTabBarTheme(this, 'mine')
  },

  openOrders() {
    wx.navigateTo({ url: '/pages/orders/index' })
  },

  handleShortcutTap() {
    this.openOrders()
  },

  handleMenuTap(event: WechatMiniprogram.TouchEvent) {
    const { key } = event.currentTarget.dataset as { key: string }
    if (key === 'about') {
      wx.showModal({
        title: '关于',
        content: 'WEJC 小程序演示版，用于联调首页、产品、购物车和订单流程。',
        showCancel: false,
      })
      return
    }
    wx.showToast({ title: '功能下一步接入', icon: 'none' })
  },
})
