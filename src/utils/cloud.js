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

/**
 * 上传本地文件到云存储
 * @param {string} filePath 本地临时路径
 * @param {object} [opts]
 * @param {string} [opts.dir='download/recipe-images'] 云端目录
 * @returns {Promise<{ fileID: string, cloudPath: string, coverImage: string }>}
 *   coverImage 形如 /download/recipe-images/xxx.jpeg，与种子数据一致
 */
export function uploadCloudFile(filePath, opts = {}) {
  const dir = String(opts.dir || 'download/recipe-images').replace(/^\/+|\/+$/g, '')
  const rawExt = (String(filePath).match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1]
  const ext = (rawExt || 'jpg').toLowerCase().replace(/jpeg/, 'jpeg')
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext === 'jpeg' ? 'jpeg' : ext}`
  const cloudPath = `${dir}/${name}`

  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    if (!cloudReady) initCloud()
    if (!wx.cloud) {
      reject(new Error('云能力未初始化'))
      return
    }
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        if (!res.fileID) {
          reject(new Error('上传失败：无 fileID'))
          return
        }
        resolve({
          fileID: res.fileID,
          cloudPath,
          coverImage: `/${cloudPath}`
        })
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败'))
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序云开发'))
    // #endif
  })
}
