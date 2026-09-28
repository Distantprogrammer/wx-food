import { request } from './request'

export function submitFeedback(data, options) {
  return request('feedback', { action: 'submit', ...data }, options)
}

export function adminFeedbackList(params = {}, options) {
  return request('admin', { action: 'feedbackList', ...params }, options)
}

export function adminFeedbackDelete(id, options) {
  return request('admin', { action: 'feedbackDelete', id }, options)
}
