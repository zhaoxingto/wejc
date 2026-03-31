const DEFAULT_THEME: StoreTheme = {
  presetKey: 'amber',
  presetName: '琥珀暖棕',
  description: '偏咖啡馆气质的暖色模板，适合食品、礼盒和生活方式门店。',
  colors: {
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
}

function readTheme() {
  const app = getApp<IAppOption>()
  return app.globalData.storeContext && app.globalData.storeContext.theme
    ? app.globalData.storeContext.theme
    : DEFAULT_THEME
}

export function getActiveTheme() {
  return readTheme()
}

export function buildThemeStyle(theme = readTheme()) {
  const colors = theme.colors
  return [
    `--primary-color:${colors.primaryColor}`,
    `--primary-text-color:${colors.primaryTextColor}`,
    `--accent-color:${colors.accentColor}`,
    `--background-color:${colors.backgroundColor}`,
    `--surface-color:${colors.surfaceColor}`,
    `--surface-muted-color:${colors.surfaceMutedColor}`,
    `--text-color:${colors.textColor}`,
    `--text-muted-color:${colors.textMutedColor}`,
    `--notice-background-color:${colors.noticeBackgroundColor}`,
  ].join(';')
}

export function syncTabBarTheme(page: WechatMiniprogram.Page.TrivialInstance, selected: string) {
  if (typeof page.getTabBar !== 'function') {
    return
  }
  const tabBar = page.getTabBar() as WechatMiniprogram.Component.TrivialInstance | null
  const theme = readTheme()
  if (!tabBar) {
    return
  }
  tabBar.setData({
    selected,
    themeColors: theme.colors,
  })
}
