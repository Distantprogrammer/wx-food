import { request } from './request'

/** 管理员待办汇总：待审菜谱 + 待审技巧 + 未读反馈 */
export function adminPendingSummary(options) {
  return request('admin', { action: 'pendingSummary' }, options)
}

export function adminRecipeList(params = {}, options) {
  return request('admin', { action: 'recipeList', ...params }, options)
}

export function adminRecipeDetail(recipeId, options) {
  return request('admin', { action: 'recipeDetail', recipeId }, options)
}

export function adminRecipeSave(data, options) {
  return request('admin', { action: 'recipeSave', data }, options)
}

export function adminRecipeDelete(recipeId, options) {
  return request('admin', { action: 'recipeDelete', recipeId }, options)
}

export function adminTipList(params = {}, options) {
  return request('admin', { action: 'tipList', ...params }, options)
}

export function adminTipAuditList(params = {}, options) {
  return request('admin', { action: 'tipAuditList', ...params }, options)
}

export function adminTipSameTitleList(title, excludeId, options) {
  return request('admin', { action: 'tipSameTitleList', title, excludeId }, options)
}

export function adminTipDetail(tipId, options) {
  return request('admin', { action: 'tipDetail', tipId }, options)
}

export function adminTipSave(data, options) {
  return request('admin', { action: 'tipSave', data }, options)
}

export function adminTipDelete(tipId, options) {
  return request('admin', { action: 'tipDelete', tipId }, options)
}

export function adminTipUpdateAuditStatus(tipId, auditStatus, options) {
  return request('admin', { action: 'tipUpdateAuditStatus', tipId, auditStatus }, options)
}

export function adminCategoryList(options) {
  return request('admin', { action: 'categoryList' }, options)
}

export function adminCategorySave(data, options) {
  return request('admin', { action: 'categorySave', data }, options)
}

export function adminCategoryDelete(slug, options) {
  return request('admin', { action: 'categoryDelete', slug }, options)
}

export function adminRecipeAuditList(params = {}, options) {
  return request('admin', { action: 'recipeAuditList', ...params }, options)
}

export function adminRecipeSameTitleList(title, excludeId, options) {
  return request('admin', { action: 'recipeSameTitleList', title, excludeId }, options)
}

export function adminRecipeUpdateAuditStatus(recipeId, auditStatus, options) {
  return request('admin', { action: 'recipeUpdateAuditStatus', recipeId, auditStatus }, options)
}

export function adminUserList(params = {}, options) {
  return request('admin', { action: 'userList', ...params }, options)
}

export function adminUserUpdateNickname(id, nickname, options) {
  return request('admin', { action: 'userUpdateNickname', id, nickname }, options)
}

export function adminUserUpdateRole(id, role, options) {
  return request('admin', { action: 'userUpdateRole', id, role }, options)
}

export function adminUserDelete(id, options) {
  return request('admin', { action: 'userDelete', id }, options)
}
