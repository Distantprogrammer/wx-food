import { request } from './request'

export function toggleLike(recipeId, options = { silent: true }) {
  return request('userRecipe', { action: 'toggleLike', recipeId }, options)
}

export function toggleFavorite(recipeId, options = { silent: true }) {
  return request('userRecipe', { action: 'toggleFavorite', recipeId }, options)
}

export function toggleCooked(recipeId, options = { silent: true }) {
  return request('userRecipe', { action: 'toggleCooked', recipeId }, options)
}

export function addHistory(recipeId, options = { silent: true }) {
  return request('userRecipe', { action: 'addHistory', recipeId }, options)
}

export function getRecipeStatus(recipeId, options = { silent: true }) {
  return request('userRecipe', { action: 'status', recipeId }, options)
}

export function getUserStats(options) {
  return request('userRecipe', { action: 'stats' }, options)
}

export function getUserRecipeList(type, page = 1, limit = 20, options) {
  return request('userRecipe', { action: 'list', type, page, limit }, options)
}

export function getUserPreview(options) {
  return request('userRecipe', { action: 'preview' }, options)
}

export function seedImport(data = {}, options) {
  return request('seedImport', data, options)
}
