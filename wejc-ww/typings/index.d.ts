/// <reference path="./types/index.d.ts" />

interface StoreThemeColors {
  primaryColor: string
  primaryTextColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  surfaceMutedColor: string
  textColor: string
  textMutedColor: string
  noticeBackgroundColor: string
}

interface StoreTheme {
  presetKey: string
  presetName: string
  description: string
  colors: StoreThemeColors
}

interface StoreContext {
  tenantId: number
  shopId: number
  shopName: string
  shopCode: string
  logo?: string | null
  cover?: string | null
  intro?: string | null
  theme?: StoreTheme
  storeContextToken: string
}

interface CartSkuItem {
  productId: number
  productTitle: string
  productSubtitle?: string | null
  cover?: string | null
  skuId: number
  skuCode: string
  skuText: string
  price: string
  qty: number
}

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    apiBaseUrl: string,
    demoShopCode: string,
    demoCustomerId: number,
    storeContext?: StoreContext,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
