import { API_BASE_URL } from './config'

const STORE_CONTEXT_KEY = 'wejc_store_context'

App<IAppOption>({
  globalData: {
    apiBaseUrl: API_BASE_URL,
    demoShopCode: 'SHP8A92KD',
    demoCustomerId: 8001,
  },
  onLaunch() {
    const cachedContext = wx.getStorageSync(STORE_CONTEXT_KEY) as StoreContext | undefined
    if (cachedContext && cachedContext.storeContextToken) {
      this.globalData.storeContext = cachedContext
    }
  },
})
