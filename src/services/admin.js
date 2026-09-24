import { request } from './request'

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

export function adminTipDetail(tipId, options) {
  return request('admin', { action: 'tipDetail', tipId }, options)
}

export function adminTipSave(data, options) {
  return request('admin', { action: 'tipSave', data }, options)
}

export function adminTipDelete(tipId, options) {
  return request('admin', { action: 'tipDelete', tipId }, options)
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
