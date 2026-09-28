import { request } from './request'

export function getNotice(options) {
  return request('notice', { action: 'get' }, options)
}

export function adminNoticeGet(options) {
  return request('admin', { action: 'noticeGet' }, options)
}

export function adminNoticeSave(data, options) {
  return request('admin', { action: 'noticeSave', data }, options)
}
