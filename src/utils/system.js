export const DESIGN_BASE = {
  width: 375,
  height: 812,
  statusBarHeight: 44,
  navContentHeight: 44,
  tabBarBottomOffset: 0,
  tabBarContentGap: 8
}

export const TAB_BAR_HEIGHT_RPX = 176
const DESIGN_WIDTH = 750

let systemInfo = null
let menuButtonRect = null

export function getSystemInfo() {
  if (!systemInfo) {
    systemInfo = uni.getSystemInfoSync()
  }
  return systemInfo
}

export function getMenuButtonRect() {
  if (menuButtonRect) return menuButtonRect

  let rect = null
  // #ifdef MP-WEIXIN
  try {
    rect = uni.getMenuButtonBoundingClientRect()
  } catch (e) {
    rect = null
  }
  // #endif

  const screenWidth = getScreenWidth()
  const statusBar = getStatusBarHeight()
  if (!rect || !rect.width) {
    const width = 87
    const height = 32
    const top = statusBar + 4
    rect = {
      width,
      height,
      top,
      left: screenWidth - width - 10,
      right: screenWidth - 10,
      bottom: top + height
    }
  }

  menuButtonRect = rect
  return menuButtonRect
}

/** 右侧需预留宽度（px），避免内容与胶囊重叠 */
export function getCapsuleReservedWidth(gap = 8) {
  const rect = getMenuButtonRect()
  const screenWidth = getScreenWidth()
  return Math.max(screenWidth - rect.left + gap, gap)
}

/** 导航栏内容区顶部内边距，与胶囊垂直对齐 */
export function getNavBarVerticalPadding() {
  const rect = getMenuButtonRect()
  const statusBar = getStatusBarHeight()
  if (rect?.top != null) {
    return Math.max(rect.top - statusBar, 0)
  }
  return 4
}

export function getStatusBarHeight() {
  return getSystemInfo().statusBarHeight ?? DESIGN_BASE.statusBarHeight
}

export function getNavContentHeight() {
  const rect = getMenuButtonRect()
  const statusBar = getStatusBarHeight()
  if (rect?.height && rect?.top != null) {
    return (rect.top - statusBar) * 2 + rect.height
  }
  return DESIGN_BASE.navContentHeight
}

export function getNavBarHeight(headerContentHeight = 0) {
  return getStatusBarHeight() + getNavContentHeight() + rpx2px(headerContentHeight)
}

export function getSafeAreaBottom() {
  const info = getSystemInfo()
  if (info.safeAreaInsets?.bottom != null) return info.safeAreaInsets.bottom
  if (info.safeArea) return info.screenHeight - info.safeArea.bottom
  return 0
}

export function getScreenWidth() {
  return getSystemInfo().screenWidth || DESIGN_BASE.width
}

export function getWindowHeight() {
  const info = getSystemInfo()
  return info.windowHeight || info.screenHeight || DESIGN_BASE.height
}

export function rpx2px(rpx) {
  return (rpx / DESIGN_WIDTH) * getScreenWidth()
}

export function getTabBarVisualHeight() {
  return rpx2px(TAB_BAR_HEIGHT_RPX) + getSafeAreaBottom()
}

export function getTabBarOccupiedHeight() {
  return getTabBarVisualHeight() + DESIGN_BASE.tabBarContentGap
}

export function getScrollViewHeight({
  showHeader = true,
  showTabBar = false,
  extraBottomPadding = 0,
  headerContentHeight = 0,
  footerHeight = 0
} = {}) {
  const windowHeight = getWindowHeight()
  const headerHeight = showHeader ? getNavBarHeight(headerContentHeight) : 0
  const bottomHeight = showTabBar
    ? getTabBarOccupiedHeight() + rpx2px(extraBottomPadding)
    : rpx2px(extraBottomPadding)
  const footer = rpx2px(footerHeight)
  return Math.max(windowHeight - headerHeight - bottomHeight - footer, 0)
}

export function getScrollViewStyle(options = {}) {
  const headerHeight = options.showHeader === false ? 0 : getNavBarHeight(options.headerContentHeight ?? 0)
  const height = getScrollViewHeight(options)
  return {
    height: `${height}px`,
    marginTop: `${headerHeight}px`
  }
}
