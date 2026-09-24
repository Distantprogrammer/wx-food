import { request } from './request'

export function toggleLike(recipeId) {
  return request('userRecipe', { action: 'toggleLike', recipeId })
}

export function toggleFavorite(recipeId) {
  return request('userRecipe', { action: 'toggleFavorite', recipeId })
}

export function toggleCooked(recipeId) {
  return request('userRecipe', { action: 'toggleCooked', recipeId })
}

export function addHistory(recipeId) {
  return request('userRecipe', { action: 'addHistory', recipeId })
}

export function getRecipeStatus(recipeId) {
  return request('userRecipe', { action: 'status', recipeId })
}

export function getUserStats() {
  return request('userRecipe', { action: 'stats' })
}

export function getUserRecipeList(type, page = 1, limit = 20) {
  return request('userRecipe', { action: 'list', type, page, limit })
}

export function getUserPreview() {
  return request('userRecipe', { action: 'preview' })
}

export function seedImport(data = {}) {
  return request('seedImport', data)
}
