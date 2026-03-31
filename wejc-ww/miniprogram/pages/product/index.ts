import { buildThemeStyle, getActiveTheme, syncTabBarTheme } from '../../utils/theme'
import {
  fetchStoreProducts,
  getDemoShopCode,
  getStoreContext,
  resolveAndLoadStore,
  type StoreProductListItem,
} from '../../utils/storefront'

type ProductBrand = {
  id: string
  name: string
  logoText: string
  items: StoreProductListItem[]
}

type ProductCategory = {
  id: string
  name: string
  items: StoreProductListItem[]
}

type ProductPageData = {
  loading: boolean
  brands: ProductBrand[]
  activeBrandId: string
  categories: ProductCategory[]
  activeCategoryId: string
  displayProducts: StoreProductListItem[]
  themeStyle: string
  navBackgroundColor: string
  navFrontColor: string
}

function classifyBrand(item: StoreProductListItem) {
  const text = `${item.title}${item.subtitle || ''}`
  if (text.includes('礼') || text.includes('盒')) {
    return 'gift'
  }
  if (text.includes('咖') || text.includes('豆')) {
    return 'coffee'
  }
  return 'select'
}

function buildBrands(products: StoreProductListItem[]): ProductBrand[] {
  const groups: Record<string, ProductBrand> = {
    all: { id: 'all', name: '全部品牌', logoText: '全', items: products },
    coffee: { id: 'coffee', name: '咖啡品牌', logoText: '咖', items: [] },
    gift: { id: 'gift', name: '礼盒品牌', logoText: '礼', items: [] },
    select: { id: 'select', name: '精选品牌', logoText: '选', items: [] },
  }

  products.forEach((item) => {
    groups[classifyBrand(item)].items.push(item)
  })

  return Object.values(groups).filter((group) => group.id === 'all' || group.items.length > 0)
}

function buildCategories(products: StoreProductListItem[]): ProductCategory[] {
  const groups: Record<string, ProductCategory> = {
    all: { id: 'all', name: '全部', items: products },
    featured: { id: 'featured', name: '推荐', items: [] },
    coffee: { id: 'coffee', name: '咖啡', items: [] },
    gift: { id: 'gift', name: '礼盒', items: [] },
    other: { id: 'other', name: '其他', items: [] },
  }

  products.forEach((item, index) => {
    if (index < 2) {
      groups.featured.items.push(item)
    }

    const text = `${item.title}${item.subtitle || ''}`
    if (text.includes('礼') || text.includes('盒')) {
      groups.gift.items.push(item)
    } else if (text.includes('咖') || text.includes('豆')) {
      groups.coffee.items.push(item)
    } else {
      groups.other.items.push(item)
    }
  })

  return Object.values(groups).filter((group) => group.id === 'all' || group.items.length > 0)
}

function syncDisplay(page: WechatMiniprogram.Page.TrivialInstance & ProductPageData, brandId: string, categoryId?: string) {
  const activeBrand = page.data.brands.find((item: ProductBrand) => item.id === brandId)
  const categories = buildCategories(activeBrand ? activeBrand.items : [])
  const nextCategoryId =
    categoryId && categories.find((item: ProductCategory) => item.id === categoryId)
      ? categoryId
      : categories[0]
        ? categories[0].id
        : 'all'
  const activeCategory = categories.find((item: ProductCategory) => item.id === nextCategoryId)

  page.setData({
    activeBrandId: brandId,
    categories,
    activeCategoryId: nextCategoryId,
    displayProducts: activeCategory ? activeCategory.items : [],
  })
}

Page<ProductPageData, WechatMiniprogram.IAnyObject>({
  data: {
    loading: false,
    brands: [],
    activeBrandId: 'all',
    categories: [],
    activeCategoryId: 'all',
    displayProducts: [],
    themeStyle: buildThemeStyle(),
    navBackgroundColor: getActiveTheme().colors.backgroundColor,
    navFrontColor: getActiveTheme().colors.textColor,
  },

  onShow() {
    this.syncTheme()
    this.syncTabBar()
    void this.loadProducts()
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
    syncTabBarTheme(this, 'product')
  },

  async loadProducts() {
    this.setData({ loading: true })
    try {
      const context = getStoreContext()
      if (!context) {
        await resolveAndLoadStore(getDemoShopCode())
        this.syncTheme()
        this.syncTabBar()
      }
      const products = await fetchStoreProducts()
      const brands = buildBrands(products)
      this.setData({
        loading: false,
        brands,
      })
      syncDisplay(this as unknown as WechatMiniprogram.Page.TrivialInstance & ProductPageData, brands[0] ? brands[0].id : 'all')
    } catch (error) {
      this.setData({
        loading: false,
        brands: [],
        categories: [],
        displayProducts: [],
      })
      wx.showToast({ title: (error as Error).message, icon: 'none' })
    }
  },

  switchBrand(event: WechatMiniprogram.TouchEvent) {
    const { id } = event.currentTarget.dataset as { id: string }
    syncDisplay(this as unknown as WechatMiniprogram.Page.TrivialInstance & ProductPageData, id)
  },

  switchCategory(event: WechatMiniprogram.TouchEvent) {
    const { id } = event.currentTarget.dataset as { id: string }
    syncDisplay(this as unknown as WechatMiniprogram.Page.TrivialInstance & ProductPageData, this.data.activeBrandId, id)
  },

  openProductDetail(event: WechatMiniprogram.TouchEvent) {
    const { id } = event.currentTarget.dataset as { id: number }
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },
})
