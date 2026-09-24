import { CLOUD_ENV_ID } from '@/config/env'

let cloudReady = false

export function initCloud() {
  // #ifdef MP-WEIXIN
  if (cloudReady) return
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上基础库以使用云能力')
    return
  }
  wx.cloud.init({
    env: CLOUD_ENV_ID,
    traceUser: true
  })
  cloudReady = true
  // #endif
}

export function callCloud(name, data = {}) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    if (!cloudReady) initCloud()
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        const result = res.result || {}
        if (result.code >= 200 && result.code < 300) {
          resolve(result)
        } else {
          const err = new Error(result.message || '请求失败')
          err.code = result.code
          reject(err)
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '云函数调用失败'))
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序云开发'))
    // #endif
  })
}
