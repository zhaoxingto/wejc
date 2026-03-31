import { buildThemeStyle, getActiveTheme, syncTabBarTheme } from '../../utils/theme'
import {
  fetchStoreHome,
  fetchStoreProducts,
  getCartItems,
  getDemoShopCode,
  getStoreContext,
  resolveAndLoadStore,
  type StoreProductListItem,
} from '../../utils/storefront'

type StorefrontData = {
  loading: boolean
  shopCode: string
  shopName: string
  intro: string
  cover: string
  logo: string
  notice: string
  products: StoreProductListItem[]
  recommendedProducts: StoreProductListItem[]
  cartCount: number
  errorMessage: string
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

Page<StorefrontData, WechatMiniprogram.IAnyObject>({
  data: {
    loading: false,
    shopCode: getDemoShopCode(),
    shopName: '正在加载店铺',
    intro: '连接店铺后即可浏览商品并完成下单。',
    cover: '',
    logo: '',
    notice: '欢迎进入演示店铺，当前为联调环境。',
    products: [],
    recommendedProducts: [],
    cartCount: 0,
    errorMessage: '',
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onShow() {
    this.syncTheme()
    this.syncTabBar()
    void this.loadPage()
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
    syncTabBarTheme(this, 'home')
  },

  async loadPage() {
    this.setData({ loading: true, cartCount: getCartItems().reduce((sum, item) => sum + item.qty, 0) })
    try {
      const currentContext = getStoreContext()
      if (!currentContext || currentContext.shopCode !== this.data.shopCode) {
        await resolveAndLoadStore(this.data.shopCode)
        this.syncTheme()
        this.syncTabBar()
      }
      const [home, products] = await Promise.all([fetchStoreHome(), fetchStoreProducts()])
      const theme = getActiveTheme()
      this.setData({
        loading: false,
        shopName: home.shop_name,
        intro: home.intro || '欢迎来到店铺，先看看推荐商品吧。',
        cover: home.cover || '',
        logo: home.logo || '',
        notice: `当前店铺码 ${this.data.shopCode} 已连接，可从推荐商品继续下单。`,
        products,
        recommendedProducts: products.slice(0, 3),
        errorMessage: '',
        themeStyle: buildThemeStyle(theme),
        navBackgroundColor: theme.colors.backgroundColor,
        navFrontColor: theme.colors.textColor,
      })
    } catch (error) {
      this.setData({
        loading: false,
        products: [],
        recommendedProducts: [],
        errorMessage: (error as Error).message,
      })
    }
  },

  handleShopCodeInput(event: WechatMiniprogram.Input) {
    this.setData({ shopCode: event.detail.value.trim() })
  },

  async connectShop() {
    if (!this.data.shopCode) {
      wx.showToast({ title: '请输入店铺码', icon: 'none' })
      return
    }
    wx.showLoading({ title: '连接中' })
    try {
      await resolveAndLoadStore(this.data.shopCode)
      this.syncTheme()
      this.syncTabBar()
      await this.loadPage()
      wx.showToast({ title: '店铺已连接', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: (error as Error).message, icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  openProductDetail(event: WechatMiniprogram.TouchEvent) {
    const { id } = event.currentTarget.dataset as { id: number }
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },

  openProductTab() {
    wx.switchTab({ url: '/pages/product/index' })
  },

  openCart() {
    wx.switchTab({ url: '/pages/cart/index' })
  },
})
