function ok(data, message = 'success') {
  return { code: 200, message, data }
}

function fail(message, code = 500) {
  return { code, message, data: null }
}

function mapError(error) {
  const message = error?.message || '请求失败'
  if (message === '未登录') return fail(message, 401)
  if (message === '无权限') return fail(message, 403)
  return fail(message, 500)
}

async function getCurrentUser(db, openid) {
  if (!openid) throw new Error('未登录')
  const users = db.collection('users')
  const found = await users.where({ openid }).limit(1).get()
  if (found.data.length) return found.data[0]

  const now = db.serverDate()
  const nickname = `美食家${openid.slice(-4)}`
  try {
    const addRes = await users.add({
      data: {
        openid,
        nickname,
        avatar: '',
        role: 2,
        createTime: now,
        updateTime: now
      }
    })
    return {
      _id: addRes._id,
      openid,
      nickname,
      avatar: '',
      role: 2
    }
  } catch (error) {
    const retry = await users.where({ openid }).limit(1).get()
    if (retry.data.length) return retry.data[0]
    throw error
  }
}

async function requireUser(db, openid) {
  if (!openid) throw new Error('未登录')
  return getCurrentUser(db, openid)
}

async function requireAdmin(db, openid) {
  const user = await requireUser(db, openid)
  if (Number(user.role) !== 1) throw new Error('无权限')
  return user
}

function mapDifficulty(level) {
  const n = Number(level) || 3
  if (n <= 2) return { key: 'easy', text: '简单' }
  if (n === 3) return { key: 'medium', text: '中等' }
  return { key: 'hard', text: '困难' }
}

function toListRecipe(doc) {
  if (!doc) return null
  const diff = mapDifficulty(doc.difficulty)
  return {
    id: doc.recipeId,
    _id: doc._id,
    title: doc.title,
    categorySlug: doc.categorySlug,
    categoryName: doc.categoryName,
    difficulty: doc.difficulty,
    difficultyKey: diff.key,
    difficultyText: diff.text,
    calories: doc.calories,
    likes: doc.likes || 0,
    favorites: doc.favorites || 0,
    coverImage: doc.coverImage || '',
    summary: doc.summary || '',
    ingredientsCount: Array.isArray(doc.ingredients) ? doc.ingredients.length : 0,
    stepsCount: Array.isArray(doc.steps) ? doc.steps.length : 0
  }
}

function toDetailRecipe(doc) {
  if (!doc) return null
  return {
    ...toListRecipe(doc),
    ingredients: doc.ingredients || [],
    steps: doc.steps || [],
    calculation: doc.calculation || '',
    calculationItems: doc.calculationItems || [],
    ingredientsHtml: doc.ingredientsHtml || '',
    calculationHtml: doc.calculationHtml || '',
    stepsHtml: doc.stepsHtml || '',
    notesHtml: doc.notesHtml || '',
    markdownHtml: doc.markdownHtml || '',
    images: doc.images || [],
    lastUpdated: doc.lastUpdated || ''
  }
}

module.exports = {
  ok,
  fail,
  mapError,
  getCurrentUser,
  requireUser,
  requireAdmin,
  mapDifficulty,
  toListRecipe,
  toDetailRecipe
}
