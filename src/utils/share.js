/**
 * 分享工具：微信小程序通过 onShareAppMessage / onShareTimeline 触发
 */
import { ref } from 'vue'

const APP_NAME = '今天做什么菜'
const HOME_PATH = '/pages/index/index'

const defaultShare = {
  title: APP_NAME,
  path: HOME_PATH,
  imageUrl: '',
  _custom: false
}

const pendingShare = ref({ ...defaultShare })

function buildCurrentPagePath() {
  try {
    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    if (!cur?.route) return defaultShare.path
    const route = `/${cur.route}`
    const opts = cur.options || {}
    const qs = Object.keys(opts)
      .filter(k => opts[k] != null && opts[k] !== '')
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(opts[k])}`)
      .join('&')
    return qs ? `${route}?${qs}` : route
  } catch (e) {
    return defaultShare.path
  }
}

export function buildShareConfig({
  title = APP_NAME,
  path = HOME_PATH,
  imageUrl = ''
} = {}) {
  return { title, path, imageUrl }
}

/** 业务侧分享前设置自定义内容（如菜品分享） */
export function setPendingShare(config = {}) {
  pendingShare.value = {
    ...defaultShare,
    ...config,
    _custom: true
  }
}

export function getPendingShare() {
  return pendingShare.value
}

/** 右上角菜单 / open-type=share 实际使用的分享配置 */
export function getActiveShareConfig() {
  const pending = pendingShare.value
  if (pending._custom) {
    return {
      title: pending.title || defaultShare.title,
      path: pending.path || buildCurrentPagePath(),
      imageUrl: pending.imageUrl || ''
    }
  }
  return {
    title: pending.title || defaultShare.title,
    path: buildCurrentPagePath(),
    imageUrl: pending.imageUrl || ''
  }
}

export function resetPendingShare() {
  pendingShare.value = { ...defaultShare }
}

/** 开启当前页微信原生分享菜单 */
export function enableNativeShareMenu() {
  // #ifdef MP-WEIXIN
  try {
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  } catch (e) {
    // ignore
  }
  // #endif
}

export default {
  buildShareConfig,
  setPendingShare,
  getPendingShare,
  getActiveShareConfig,
  resetPendingShare,
  enableNativeShareMenu
}
