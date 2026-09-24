import { request } from './request'

export function getTipList(params = {}) {
  return request('tip', { action: 'list', ...params })
}

export function getTipDetail(tipId) {
  return request('tip', { action: 'detail', tipId })
}
