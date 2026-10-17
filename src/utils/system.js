/** 设计稿基准：iPhone X (375 × 812) */
export const DESIGN_BASE = {
  width: 375,
  height: 812,
  statusBarHeight: 44,
  navContentHeight: 44,
  safeAreaBottom: 34,
  /** TabBar 距屏幕底部偏移（设计稿 px）；贴底栏为 0 */
  tabBarBottomOffset: 0,
  /** 内容区与 TabBar 之间的间距（设计稿 px） */
  tabBarContentGap: 8
}

/** 不同设备的边界值，防止极端机型计算出异常高度 */
export const DEVICE_BOUNDS = {
  statusBarHeight: { min: 20, max: 59 },
  safeAreaBottom: { min: 0, max: 50 },
  screenWidth: { min: 320, max: 480 },
  screenHeight: { min: 568, max: 1200 },
  windowHeight: { min: 568, max: 1200 }
}

/** CustomTabBar 内容区高度（rpx，与组件 .tabbar-content、--tab-h 保持一致） */
export const TAB_BAR_HEIGHT_RPX = 152

const DESIGN_WIDTH = 750

/** 冷启动缓存不可靠，允许强制刷新 */
let systemInfo = null
let menuButtonRect = null

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function readSystemInfo() {
  try {
    if (typeof uni.getWindowInfo === 'function') {
      const win = uni.getWindowInfo()
      const device = typeof uni.getDeviceInfo === 'function' ? uni.getDeviceInfo() : {}
      const app = typeof uni.getAppBaseInfo === 'function' ? uni.getAppBaseInfo() : {}
      return { ...device, ...app, ...win }
    }
  } catch (e) {
    // fallback below
  }
  return uni.getSystemInfoSync()
}

/**
 * @param {boolean} [force=false] 强制重新读取，避免启动瞬间错误值被永久缓存
 */
export function getSystemInfo(force = false) {
  if (force || !systemInfo) {
    systemInfo = readSystemInfo()
  }
  return systemInfo
}

/** 重置缓存（页面 onShow / 旋转 / 视口变化时调用） */
export function resetSystemInfo() {
  systemInfo = null
  menuButtonRect = null
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

export function getScreenWidth() {
  const width = getSystemInfo().screenWidth || DESIGN_BASE.width
  return clamp(width, DEVICE_BOUNDS.screenWidth.min, DEVICE_BOUNDS.screenWidth.max)
}

export function getScreenHeight() {
  const height = getSystemInfo().screenHeight || DESIGN_BASE.height
  return clamp(height, DEVICE_BOUNDS.screenHeight.min, DEVICE_BOUNDS.screenHeight.max)
}

/**
 * 可用视口高度
 * 冷启动偶发 windowHeight 偏小；悬浮 CustomTabBar 按屏幕定位，内容区应按接近全屏高度计算后再扣 Tab 占位。
 */
export function getWindowHeight() {
  const info = getSystemInfo(true)
  const screenHeight = info.screenHeight || DESIGN_BASE.height
  let height = info.windowHeight || screenHeight

  const windowBottom = Number(info.windowBottom) || 0
  if (windowBottom > 0) {
    height = Math.max(height, screenHeight)
  }

  if (height < screenHeight * 0.85) {
    height = screenHeight
  }

  return clamp(height, DEVICE_BOUNDS.windowHeight.min, DEVICE_BOUNDS.windowHeight.max)
}

export function getStatusBarHeight() {
  const height = getSystemInfo().statusBarHeight ?? DESIGN_BASE.statusBarHeight
  return clamp(height, DEVICE_BOUNDS.statusBarHeight.min, DEVICE_BOUNDS.statusBarHeight.max)
}

/** 自定义导航栏内容区高度（不含状态栏），优先按胶囊对齐 */
export function getNavContentHeight() {
  const rect = getMenuButtonRect()
  const statusBar = getStatusBarHeight()
  if (rect?.height && rect?.top != null) {
    return (rect.top - statusBar) * 2 + rect.height
  }
  return DESIGN_BASE.navContentHeight
}

/** 自定义导航栏总高度（含 header-content 扩展区） */
export function getNavBarHeight(headerContentHeight = 0) {
  return getStatusBarHeight() + getNavContentHeight() + rpx2px(headerContentHeight)
}

export function getSafeAreaBottom() {
  const info = getSystemInfo()
  if (info.safeAreaInsets?.bottom != null) {
    return info.safeAreaInsets.bottom
  }
  if (info.safeArea) {
    return info.screenHeight - info.safeArea.bottom
  }
  return 0
}

/** 带边界约束的安全区底部高度 */
export function getBoundedSafeAreaBottom() {
  const bottom = getSafeAreaBottom()
  return clamp(bottom, DEVICE_BOUNDS.safeAreaBottom.min, DEVICE_BOUNDS.safeAreaBottom.max)
}

export function px2rpx(px) {
  return (px / getScreenWidth()) * DESIGN_WIDTH
}

export function rpx2px(rpx) {
  return (rpx / DESIGN_WIDTH) * getScreenWidth()
}

/** TabBar 距底部偏移（设计稿偏移 + 安全区） */
export function getTabBarBottomOffset() {
  return DESIGN_BASE.tabBarBottomOffset + getBoundedSafeAreaBottom()
}

/** CustomTabBar 组件视觉高度（px，不含安全区） */
export function getTabBarVisualHeight() {
  return rpx2px(TAB_BAR_HEIGHT_RPX)
}

/**
 * TabBar 占据的总高度（含底部安全区与内容间距）
 * = Tab 内容高度 + 距底偏移(含安全区) + 内容间距
 */
export function getTabBarOccupiedHeight() {
  return getTabBarVisualHeight() + getTabBarBottomOffset() + DESIGN_BASE.tabBarContentGap
}

/** 解析 scroll-view 顶部偏移对应的头部总高度 */
export function resolveHeaderHeight({ showHeader = true, headerContentHeight = 0 } = {}) {
  if (!showHeader) return 0
  return getNavBarHeight(headerContentHeight)
}

/**
 * 计算 scroll-view 可用高度
 * @param {Object} options
 * @param {boolean} [options.showHeader=true]
 * @param {boolean} [options.showTabBar=false]
 * @param {number} [options.extraBottomPadding=0] rpx —— 仅在高度中扣减；内容区勿再重复传
 * @param {number} [options.headerContentHeight=0] header-content 区域高度 rpx
 * @param {number} [options.footerHeight=0] 固定底栏高度 rpx
 * @param {number} [options.windowHeight] 外部已刷新的视口高度（优先）
 */
export function getScrollViewHeight({
  showHeader = true,
  showTabBar = false,
  extraBottomPadding = 0,
  headerContentHeight = 0,
  footerHeight = 0,
  windowHeight
} = {}) {
  const vh = windowHeight ?? getWindowHeight()
  const resolvedHeaderHeight = resolveHeaderHeight({ showHeader, headerContentHeight })
  const tabOrPad = showTabBar
    ? getTabBarOccupiedHeight() + rpx2px(extraBottomPadding)
    : rpx2px(extraBottomPadding)
  const footer = rpx2px(footerHeight)

  return Math.max(vh - resolvedHeaderHeight - tabOrPad - footer, 0)
}

/**
 * scroll-view / body 定位样式（固定头部下方）
 * @param {Object} options 同 getScrollViewHeight
 */
export function getScrollViewStyle(options = {}) {
  const resolvedHeaderHeight = resolveHeaderHeight(options)
  const height = getScrollViewHeight({ ...options, headerContentHeight: options.headerContentHeight ?? 0 })

  return {
    height: `${height}px`,
    marginTop: `${resolvedHeaderHeight}px`
  }
}
