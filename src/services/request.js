import { callCloud } from '@/utils/cloud'

export async function request(name, data = {}) {
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
  }
}

export default request
