import { request } from './request'

export function getTipList(params = {}, options) {
  return request('tip', { action: 'list', ...params }, options)
}

export function getTipDetail(tipId, options) {
  return request('tip', { action: 'detail', tipId }, options)
}
