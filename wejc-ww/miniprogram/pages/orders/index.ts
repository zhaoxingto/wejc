import { buildThemeStyle, getActiveTheme } from '../../utils/theme'
import { fetchCustomerOrders, getDemoCustomerId, type OrderRead } from '../../utils/storefront'
import { formatTime } from '../../utils/util'

type OrderPageData = {
  loading: boolean
  orders: Array<OrderRead & { displayTime: string; highlighted: boolean }>
  highlightOrderNo: string
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

Page<OrderPageData, WechatMiniprogram.IAnyObject>({
  data: {
    loading: false,
    orders: [],
    highlightOrderNo: '',
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onLoad(query) {
    this.setData({ highlightOrderNo: String(query.highlight || '') })
  },

  onShow() {
    const theme = getActiveTheme()
    this.setData({
      themeStyle: buildThemeStyle(theme),
      navBackgroundColor: theme.colors.backgroundColor,
      navFrontColor: theme.colors.textColor,
    })
    void this.loadOrders()
  },

  async loadOrders() {
    this.setData({ loading: true })
    try {
      const orders = await fetchCustomerOrders(getDemoCustomerId())
      this.setData({
        loading: false,
        orders: orders.map((item) => ({
          ...item,
          displayTime: formatTime(new Date(item.created_at)),
          highlighted: item.order_no === this.data.highlightOrderNo,
        })),
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({ title: (error as Error).message, icon: 'none' })
    }
  },
})
