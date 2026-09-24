/**
 * 云函数请求封装
 * - 统一 ApiResult 形状
 * - 默认展示全局 Loading（与模板 request.js 一致）
 * - silent=true 时由页面自行处理加载态（如下拉刷新续页、点赞等）
 */
import { callCloud } from '@/utils/cloud'

let loadingCount = 0

function showGlobalLoading() {
  if (loadingCount === 0) {
    uni.showLoading({ title: '加载中...', mask: true })
  }
  loadingCount += 1
}

function hideGlobalLoading() {
  loadingCount = Math.max(loadingCount - 1, 0)
  if (loadingCount === 0) {
    uni.hideLoading()
  }
}

/**
 * @param {string} name 云函数名
 * @param {object} [data]
 * @param {object} [options]
 * @param {boolean} [options.silent=false] 为 true 时不展示全局 Loading
 */
export async function request(name, data = {}, options = {}) {
  const { silent = false } = options

  if (!silent) showGlobalLoading()

  try {
    const res = await callCloud(name, data)
    return {
      code: res.code !== undefined && res.code !== null ? res.code : 200,
      message: res.message || 'success',
      data: res.data ?? null
    }
  } catch (error) {
    return {
      code: error.code || 500,
      message: error.message || '请求失败',
      data: null
    }
  } finally {
    if (!silent) hideGlobalLoading()
  }
}

export default request
