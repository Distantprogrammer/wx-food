import { request } from './request'

export function getTipList(params = {}, options) {
  return request('tip', { action: 'list', ...params }, options)
}

export function getTipDetail(tipId, options) {
  return request('tip', { action: 'detail', tipId }, options)
}

export function getMyCreatedTips(params = {}, options) {
  return request('tip', { action: 'myCreated', ...params }, options)
}

export function deleteMyTip(tipId, options) {
  return request('admin', { action: 'tipDelete', tipId }, options)
}
