import { request } from './request'

export function adminRecipeList(params = {}) {
  return request('admin', { action: 'recipeList', ...params })
}

export function adminRecipeDetail(recipeId) {
  return request('admin', { action: 'recipeDetail', recipeId })
}

export function adminRecipeSave(data) {
  return request('admin', { action: 'recipeSave', data })
}

export function adminRecipeDelete(recipeId) {
  return request('admin', { action: 'recipeDelete', recipeId })
}

export function adminTipList(params = {}) {
  return request('admin', { action: 'tipList', ...params })
}

export function adminTipDetail(tipId) {
  return request('admin', { action: 'tipDetail', tipId })
}

export function adminTipSave(data) {
  return request('admin', { action: 'tipSave', data })
}

export function adminTipDelete(tipId) {
  return request('admin', { action: 'tipDelete', tipId })
}

export function adminCategoryList() {
  return request('admin', { action: 'categoryList' })
}

export function adminCategorySave(data) {
  return request('admin', { action: 'categorySave', data })
}

export function adminCategoryDelete(slug) {
  return request('admin', { action: 'categoryDelete', slug })
}
