import { request } from './request'

export function submitFeedback(data, options) {
  return request('feedback', { action: 'submit', ...data }, options)
}

export function updateMyFeedback(data, options) {
  return request('feedback', { action: 'update', ...data }, options)
}

export function deleteMyFeedback(id, options) {
  return request('feedback', { action: 'delete', id }, options)
}

export function getMyFeedbackList(params = {}, options) {
  return request('feedback', { action: 'myList', ...params }, options)
}

export function adminFeedbackList(params = {}, options) {
  return request('admin', { action: 'feedbackList', ...params }, options)
}

/** status: read | processed | rejected；支持 id 或 ids */
export function adminFeedbackUpdateStatus({ id, ids, status }, options) {
  return request('admin', { action: 'feedbackUpdateStatus', id, ids, status }, options)
}

export function adminFeedbackMarkRead(id, options) {
  return adminFeedbackUpdateStatus({ id, status: 'read' }, options)
}

export function adminFeedbackDelete(id, options) {
  return request('admin', { action: 'feedbackDelete', id }, options)
}
