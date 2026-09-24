import { request } from './request'

export function getHome(limit = 6) {
  return request('recipe', { action: 'home', limit })
}

export function getCategories() {
  return request('recipe', { action: 'categories' })
}

export function getRecipeList(params = {}) {
  return request('recipe', { action: 'list', ...params })
}

export function getRecipeDetail(recipeId) {
  return request('recipe', { action: 'detail', recipeId })
}

export function getRandomRecipe() {
  return request('recipe', { action: 'random' })
}
