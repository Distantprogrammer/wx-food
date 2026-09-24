import { DIFFICULTY_MAP, CLOUD_IMAGE_PREFIX } from '@/config/env'

export function getDifficulty(level) {
  return DIFFICULTY_MAP[Number(level)] || DIFFICULTY_MAP[3]
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return { text: '早上好', meal: '早餐', icon: '🌅' }
  if (hour >= 12 && hour < 14) return { text: '中午好', meal: '午餐', icon: '☀️' }
  if (hour >= 14 && hour < 18) return { text: '下午好', meal: '下午茶', icon: '🌤️' }
  return { text: '晚上好', meal: '晚餐', icon: '🌙' }
}

/** 拼出 cloud fileID（不要直接给 image，需再转临时链接） */
export function toCloudFileId(url) {
  if (!url || /no-image/i.test(String(url))) return ''
  const raw = String(url).trim()
  if (/^https?:\/\//i.test(raw) || /^wxfile:/i.test(raw)) return raw
  if (/^cloud:\/\//i.test(raw)) return raw

  const fileName = raw.split(/[/\\]/).pop()
  if (!fileName || !/\.(jpe?g|png|webp|gif)$/i.test(fileName)) return ''

  const prefix = String(CLOUD_IMAGE_PREFIX || '').trim().replace(/\/$/, '')
  if (prefix) return `${prefix}/${fileName}`
  return `/static/recipe-images/${fileName}`
}

/** @deprecated 用 getCoverTempUrl，避免 cloud:// 被当成相对路径 */
export function coverOrPlaceholder(url) {
  const id = toCloudFileId(url)
  // https / static 可直接用；cloud:// 不能直接当 src
  if (/^https?:\/\//i.test(id) || id.startsWith('/static/')) return id
  return ''
}

const tempUrlCache = new Map()

/**
 * cloud fileID → 临时 https
 * 解决开发者工具里 cloud:// 被解析成 __pageframe__/xxx/cloud:// 导致 500
 */
export function getCoverTempUrl(url) {
  const id = toCloudFileId(url)
  if (!id) return Promise.resolve('')
  if (/^https?:\/\//i.test(id) || id.startsWith('/static/')) return Promise.resolve(id)

  if (tempUrlCache.has(id)) return Promise.resolve(tempUrlCache.get(id))

  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    if (!wx.cloud) {
      console.warn('[cover] wx.cloud 未初始化')
      resolve('')
      return
    }
    wx.cloud.getTempFileURL({
      fileList: [id],
      success: (res) => {
        const item = res.fileList?.[0]
        const temp = item?.tempFileURL || ''
        const status = item?.status
        if (temp) {
          tempUrlCache.set(id, temp)
          resolve(temp)
        } else {
          console.warn('[cover] 无临时链接', id, status, item?.errMsg)
          resolve('')
        }
      },
      fail: (err) => {
        console.warn('[cover] getTempFileURL fail', id, err)
        resolve('')
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve('')
    // #endif
  })
}

/** 批量换链（最多 50） */
export async function getCoverTempUrlBatch(urls) {
  const ids = [...new Set((urls || []).map(toCloudFileId).filter((id) => id && id.startsWith('cloud://')))]
  const need = ids.filter((id) => !tempUrlCache.has(id))
  if (need.length) {
    await new Promise((resolve) => {
      // #ifdef MP-WEIXIN
      wx.cloud.getTempFileURL({
        fileList: need.slice(0, 50),
        success: (res) => {
          ;(res.fileList || []).forEach((item) => {
            if (item.fileID && item.tempFileURL) {
              tempUrlCache.set(item.fileID, item.tempFileURL)
            }
          })
          resolve()
        },
        fail: () => resolve()
      })
      // #endif
      // #ifndef MP-WEIXIN
      resolve()
      // #endif
    })
  }
  const map = {}
  for (const url of urls || []) {
    const id = toCloudFileId(url)
    if (!id) continue
    if (/^https?:\/\//i.test(id) || id.startsWith('/static/')) map[url] = id
    else if (tempUrlCache.has(id)) map[url] = tempUrlCache.get(id)
  }
  return map
}

let currentTab = ''

export function setCurrentTab(path) {
  currentTab = path
}

export function getCurrentTab() {
  return currentTab
}
