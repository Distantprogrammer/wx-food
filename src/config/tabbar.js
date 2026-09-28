export const TAB_PERMISSION = {
  HOME: 'home',
  TIPS: 'tips',
  CATEGORY: 'category',
  ME: 'me'
}

export const FALLBACK_TAB_KEY = 'home'

export const TAB_BAR_LIST = [
  {
    key: 'home',
    text: '首页',
    pagePath: '/pages/index/index',
    icon: '/static/tab/home.png',
    activeIcon: '/static/tab/home-active.png'
  },
  {
    key: 'tips',
    text: '烹饪技巧',
    pagePath: '/pages/tips/index',
    icon: '/static/tab/cook.png',
    activeIcon: '/static/tab/cook-active.png'
  },
  {
    key: 'category',
    text: '分类',
    pagePath: '/pages/category/index',
    icon: '/static/tab/category.png',
    activeIcon: '/static/tab/category-active.png'
  },
  {
    key: 'me',
    text: '我的',
    pagePath: '/pages/me/index',
    icon: '/static/tab/mine.png',
    activeIcon: '/static/tab/mine-active.png'
  }
]

export const TAB_BAR_KEYS = TAB_BAR_LIST.map(item => item.key)
export const TAB_PAGE_PATHS = TAB_BAR_LIST.map(item => item.pagePath.replace(/^\//, ''))

export function getTabByKey(key) {
  return TAB_BAR_LIST.find(item => item.key === key)
}

export function getTabByPath(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return TAB_BAR_LIST.find(item => item.pagePath === normalized)
}

export function isTabVisible(tab, permissions = TAB_BAR_KEYS) {
  if (!tab.permission) return true
  return permissions.includes(tab.permission)
}

export function getTabPermissionsByUser() {
  return [TAB_PERMISSION.HOME, TAB_PERMISSION.TIPS, TAB_PERMISSION.CATEGORY, TAB_PERMISSION.ME]
}

export function getVisibleTabBarList(permissions = TAB_BAR_KEYS) {
  return TAB_BAR_LIST.filter(tab => isTabVisible(tab, permissions))
}

export function getDefaultTabKey() {
  return FALLBACK_TAB_KEY
}

export function getDefaultTabPath() {
  return getTabByKey(FALLBACK_TAB_KEY).pagePath
}
