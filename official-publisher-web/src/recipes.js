const fs = require('node:fs')
const path = require('node:path')

const recipeFile = process.env.RECIPE_FILE || path.resolve(__dirname, '../../data/recipes.json')
let cached = null
let cachedMtime = -1

function allRecipes() {
  const mtime = fs.statSync(recipeFile).mtimeMs
  if (cached && mtime === cachedMtime) return cached
  const raw = JSON.parse(fs.readFileSync(recipeFile, 'utf8'))
  cached = raw.filter((item) => item && Number.isInteger(Number(item.id)) &&
    Number(item.id) > 0 && item.category_slug !== 'template' && item.title !== '示例菜')
    .map((item) => ({
      recipeId: Number(item.id), title: String(item.title || ''),
      categorySlug: item.category_slug || '', categoryName: item.category_name || '',
      difficulty: Number(item.difficulty) || 3, calories: Number(item.calories) || 0,
      summary: item.summary || '', markdownHtml: item.markdown_html || '',
      notesHtml: item.notes_html || '', ingredients: item.ingredients || [],
      calculationItems: item.calculation_items || [], steps: item.steps || [],
      coverImage: item.cover_image || ''
    }))
    .sort((a, b) => a.recipeId - b.recipeId)
  cachedMtime = mtime
  return cached
}

function getRecipe(id) {
  const recipeId = Number(id)
  if (!Number.isSafeInteger(recipeId) || recipeId <= 0) return null
  return allRecipes().find((item) => item.recipeId === recipeId) || null
}

function nextRecipe(usedIds) {
  return allRecipes().find((item) => !usedIds.has(item.recipeId)) || null
}

module.exports = { allRecipes, getRecipe, nextRecipe }
