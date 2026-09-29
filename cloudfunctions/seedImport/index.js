const cloud = require('wx-server-sdk')
const common = require('./common')
const fs = require('fs')
const path = require('path')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const CATEGORY_ICONS = {
  soup: '🍲',
  dessert: '🍰',
  condiment: '🧂',
  vegetable_dish: '🥬',
  drink: '🥤',
  aquatic: '🐟',
  breakfast: '🌅',
  'semi-finished': '📦',
  staple: '🍚',
  meat_dish: '🥩'
}

/** 不展示/不导入：模板分类与示例菜 */
const HIDDEN_CATEGORY_SLUGS = new Set(['template'])

function isHiddenRecipe(r) {
  if (!r) return true
  const slug = r.category_slug || r.categorySlug || ''
  if (HIDDEN_CATEGORY_SLUGS.has(slug)) return true
  const title = String(r.title || '').trim()
  return title === '示例菜'
}

function loadRecipes() {
  return loadJson('recipes.json').filter((r) => !isHiddenRecipe(r))
}

function loadJson(name) {
  const file = path.join(__dirname, 'data', name)
  if (!fs.existsSync(file)) {
    throw new Error(`缺少种子文件 data/${name}，请先执行 pnpm prepare:seed`)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

async function upsertByField(collection, field, value, data, { skipLookup = false } = {}) {
  if (!skipLookup) {
    const found = await db.collection(collection).where({ [field]: value }).limit(1).get()
    if (found.data.length) {
      await db.collection(collection).doc(found.data[0]._id).update({
        data: { ...data, updateTime: db.serverDate() }
      })
      return 'updated'
    }
  }
  await db.collection(collection).add({
    data: { ...data, createTime: db.serverDate(), updateTime: db.serverDate() }
  })
  return 'created'
}

/**
 * 种子内容 upsert：
 * - 始终按 ID 查找，避免空库并发/重复导入产生双份
 * - 已存在且非 source=seed 的用户稿：跳过，防止覆盖
 * - 更新时不改写 createdBy*；缺 createTime 时补齐
 */
async function upsertSeedContent(collection, field, value, data, actor = {}) {
  const found = await db.collection(collection).where({ [field]: value }).limit(1).get()
  if (found.data.length) {
    const existing = found.data[0]
    // 仅覆盖种子或无 source 的历史数据；用户稿 (source=user 等) 一律跳过
    if (existing.source && existing.source !== 'seed') {
      return 'skipped'
    }
    const patch = { ...data, source: 'seed', updateTime: db.serverDate() }
    delete patch.createdByOpenid
    delete patch.createdByNickname
    delete patch.createTime
    if (!existing.createTime) {
      patch.createTime = db.serverDate()
    }
    if (!existing.createdByOpenid && actor.openid) {
      patch.createdByOpenid = actor.openid
      patch.createdByNickname = actor.nickname || ''
    }
    await db.collection(collection).doc(existing._id).update({ data: patch })
    return 'updated'
  }
  await db.collection(collection).add({
    data: {
      ...data,
      source: 'seed',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
  return 'created'
}

function toRecipeDoc(r, actor = {}) {
  return {
    recipeId: Number(r.id),
    title: r.title,
    categorySlug: r.category_slug,
    categoryName: r.category_name,
    difficulty: Number(r.difficulty) || 3,
    calories: r.calories || 0,
    likes: Number(r.likes) || 0,
    favorites: Number(r.favorites) || 0,
    coverImage: r.cover_image || '',
    summary: r.summary || '',
    ingredients: r.ingredients || [],
    steps: r.steps || [],
    calculation: r.calculation || '',
    calculationItems: Array.isArray(r.calculation_items) ? r.calculation_items : [],
    ingredientsHtml: r.ingredients_html || '',
    calculationHtml: r.calculation_html || '',
    stepsHtml: r.steps_html || '',
    notesHtml: r.notes_html || '',
    markdownHtml: r.markdown_html || '',
    images: r.images || [],
    lastUpdated: r.last_updated || '',
    auditStatus: 'approved',
    source: 'seed',
    createdByOpenid: actor.openid || '',
    createdByNickname: actor.nickname || ''
  }
}

function toTipDoc(t, actor = {}) {
  return {
    tipId: Number(t.id),
    title: t.title,
    summary: t.summary || '',
    markdownHtml: t.markdown_html || '',
    images: t.images || [],
    auditStatus: 'approved',
    source: 'seed',
    createdByOpenid: actor.openid || '',
    createdByNickname: actor.nickname || ''
  }
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const user = await common.requireUser(db, openid)
    const actor = {
      openid: user.openid || openid || '',
      nickname: user.nickname || ''
    }
    let isEmpty = true
    try {
      const recipeCount = await db.collection('recipes').count()
      isEmpty = !recipeCount.total
    } catch (e) {
      isEmpty = true
    }
    if (Number(user.role) !== 1 && !isEmpty) {
      throw new Error('无权限')
    }

    const action = event.action || 'recipes'
    const result = { categories: 0, recipes: 0, tips: 0, skipped: 0 }

    // 分类：仅单独调用或菜谱批次 start=0 时写入，避免每批重复
    if (action === 'categories' || (action === 'recipes' && (Number(event.start) || 0) === 0)) {
      // 清理已入库的模板分类 / 示例菜
      try {
        const hiddenCats = await db.collection('categories').where({ slug: db.command.in([...HIDDEN_CATEGORY_SLUGS]) }).limit(20).get()
        for (const doc of hiddenCats.data || []) {
          await db.collection('categories').doc(doc._id).remove()
        }
        const hiddenRecipes = await db.collection('recipes').where({
          categorySlug: db.command.in([...HIDDEN_CATEGORY_SLUGS])
        }).limit(50).get()
        for (const doc of hiddenRecipes.data || []) {
          await db.collection('recipes').doc(doc._id).remove()
        }
        const sample = await db.collection('recipes').where({ title: '示例菜' }).limit(10).get()
        for (const doc of sample.data || []) {
          await db.collection('recipes').doc(doc._id).remove()
        }
      } catch (e) {
        // 集合不存在时忽略
      }

      const recipes = loadRecipes()
      const catMap = {}
      recipes.forEach((r) => {
        if (r.category_slug && !HIDDEN_CATEGORY_SLUGS.has(r.category_slug) && !catMap[r.category_slug]) {
          catMap[r.category_slug] = r.category_name || r.category_slug
        }
      })
      let sort = 0
      for (const slug of Object.keys(catMap)) {
        // 分类始终 lookup，避免 categories + recipes(start=0) 双写产生重复
        await upsertByField('categories', 'slug', slug, {
          slug,
          name: catMap[slug],
          icon: CATEGORY_ICONS[slug] || '🍽️',
          sort: sort++
        }, { skipLookup: false })
        result.categories++
      }
    }

    if (action === 'recipes') {
      const recipes = loadRecipes()
      const start = Number(event.start) || 0
      // 默认每批 10 条，避免超时；单次最多 20
      const limit = Math.min(Math.max(Number(event.limit) || 10, 1), 20)
      const slice = recipes.slice(start, start + limit)
      for (const r of slice) {
        const status = await upsertSeedContent(
          'recipes',
          'recipeId',
          Number(r.id),
          toRecipeDoc(r, actor),
          actor
        )
        if (status === 'skipped') result.skipped++
        else result.recipes++
      }
      result.recipesTotal = recipes.length
      result.recipesNext = start + slice.length < recipes.length ? start + slice.length : null
      result.progress = `${Math.min(start + slice.length, recipes.length)}/${recipes.length}`
    }

    if (action === 'tips') {
      const tips = loadJson('tips.json')
      const start = Number(event.start) || 0
      const limit = Math.min(Math.max(Number(event.limit) || 10, 1), 20)
      const slice = tips.slice(start, start + limit)
      for (const t of slice) {
        const status = await upsertSeedContent(
          'tips',
          'tipId',
          Number(t.id),
          toTipDoc(t, actor),
          actor
        )
        if (status === 'skipped') result.skipped++
        else result.tips++
      }
      result.tipsTotal = tips.length
      result.tipsNext = start + slice.length < tips.length ? start + slice.length : null
    }

    return common.ok(result)
  } catch (error) {
    return common.mapError(error)
  }
}
