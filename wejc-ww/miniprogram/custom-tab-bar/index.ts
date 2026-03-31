type TabItem = {
  key: string
  text: string
  pagePath: string
}

Component({
  data: {
    selected: 'home',
    tabs: [
      { key: 'home', text: '首页', pagePath: '/pages/index/index' },
      { key: 'product', text: '产品', pagePath: '/pages/product/index' },
      { key: 'cart', text: '购物车', pagePath: '/pages/cart/index' },
      { key: 'mine', text: '我的', pagePath: '/pages/mine/index' },
    ] as TabItem[],
    themeColors: {
      primaryColor: '#8F5A2A',
      primaryTextColor: '#FFF8F0',
      accentColor: '#D9B58B',
      backgroundColor: '#F5EFE5',
      surfaceColor: '#FFFAF2',
      surfaceMutedColor: '#EFE4D2',
      textColor: '#2F241B',
      textMutedColor: '#7A6551',
      noticeBackgroundColor: '#F4E8D8',
    },
  },

  methods: {
    switchTab(event: WechatMiniprogram.TouchEvent) {
      const { key, path } = event.currentTarget.dataset as { key: string; path: string }
      if (key === this.data.selected) {
        return
      }
      this.setData({ selected: key })
      wx.switchTab({ url: path })
    },
  },
})
