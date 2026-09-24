import { request } from './request'

export function getHome(limit = 6, options) {
  return request('recipe', { action: 'home', limit }, options)
}

export function getCategories(options) {
  return request('recipe', { action: 'categories' }, options)
}

export function getRecipeList(params = {}, options) {
  return request('recipe', { action: 'list', ...params }, options)
}

export function getRecipeDetail(recipeId, options) {
  return request('recipe', { action: 'detail', recipeId }, options)
}

export function getRandomRecipe(options) {
  return request('recipe', { action: 'random' }, options)
}
