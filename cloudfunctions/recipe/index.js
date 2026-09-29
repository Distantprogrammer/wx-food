const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const PAGE_SIZE = 20
const HIDDEN_CATEGORY_SLUGS = ['template']

function isHiddenDoc(doc) {
  if (!doc) return true
  if (HIDDEN_CATEGORY_SLUGS.indexOf(doc.categorySlug) >= 0) return true
  if (String(doc.title || '').trim() === '示例菜') return true
  // 缺省视为已通过；待审/驳回不对 C 端展示
  if (common.normalizeAuditStatus(doc.auditStatus) !== 'approved') return true
  return false
}

function visibleWhere(extra = {}) {
  return {
    ...extra,
    categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS),
    auditStatus: 'approved'
  }
}

function filterVisible(list) {
  return (list || []).filter((doc) => !isHiddenDoc(doc))
}

async function getByRecipeId(recipeId) {
  const res = await db.collection('recipes').where({ recipeId: Number(recipeId) }).limit(1).get()
  const doc = res.data[0] || null
  if (isHiddenDoc(doc)) return null
  return doc
}

exports.main = async (event) => {
  try {
    const action = event.action || 'list'

    if (action === 'categories') {
      const res = await db.collection('categories').orderBy('sort', 'asc').limit(50).get()
      const list = (res.data || []).filter((c) => HIDDEN_CATEGORY_SLUGS.indexOf(c.slug) < 0)
      return common.ok(list)
    }

    if (action === 'home') {
      const limit = Math.min(Number(event.limit) || 6, 20)
      const where = visibleWhere()
      const hotRes = await db.collection('recipes').where(where).orderBy('likes', 'desc').limit(limit).get()
      const latestRes = await db.collection('recipes').where(where).orderBy('recipeId', 'asc').limit(limit).get()
      const countRes = await db.collection('recipes').where(where).count()
      const total = countRes.total || 0
      let recipeTotal = total
      try {
        const allRes = await db.collection('recipes').count()
        recipeTotal = allRes.total || 0
      } catch (e) {
        recipeTotal = total
      }
      let random = []
      if (total > 0) {
        const skip = Math.floor(Math.random() * Math.max(total - 20, 1))
        const randRes = await db.collection('recipes').where(where).skip(skip).limit(20).get()
        random = filterVisible(randRes.data)
      }
      return common.ok({
        hot: filterVisible(hotRes.data).map(common.toListRecipe),
        recommend: filterVisible(latestRes.data).map(common.toListRecipe),
        slot: random.map(common.toListRecipe),
        approvedTotal: total,
        recipeTotal,
        // 仅真正空库时提示导入；有待审/旧数据时不应误导去 seed
        needSeed: recipeTotal === 0
      })
    }

    if (action === 'detail') {
      const recipeId = Number(event.recipeId || event.id)
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const doc = await getByRecipeId(recipeId)
      if (!doc) return common.fail('菜谱不存在', 404)
      return common.ok(common.toDetailRecipe(doc))
    }

    if (action === 'random') {
      const where = visibleWhere()
      const countRes = await db.collection('recipes').where(where).count()
      const total = countRes.total || 0
      if (!total) return common.ok(null)
      const skip = Math.floor(Math.random() * total)
      const res = await db.collection('recipes').where(where).skip(skip).limit(1).get()
      const doc = filterVisible(res.data)[0]
      return common.ok(common.toListRecipe(doc || null))
    }

    // 当前用户新增的菜谱历史（含待审/驳回/已通过）
    if (action === 'myCreated') {
      const wxContext = cloud.getWXContext()
      const user = await common.requireUser(db, wxContext.OPENID)
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const where = {
        createdByOpenid: user.openid,
        categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS)
      }
      const col = db.collection('recipes').where(where)
      const countRes = await col.count()
      const listRes = await col.orderBy('createTime', 'desc').skip(skip).limit(limit).get()
      const list = (listRes.data || []).map((doc) => ({
        ...common.toListRecipe(doc),
        createTime: doc.createTime || null,
        auditTime: doc.auditTime || null
      }))
      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + list.length < (countRes.total || 0)
      })
    }

    // list
    if (event.categorySlug && HIDDEN_CATEGORY_SLUGS.indexOf(event.categorySlug) >= 0) {
      return common.ok({ list: [], page: 1, limit: PAGE_SIZE, total: 0, hasMore: false })
    }

    const page = Math.max(Number(event.page) || 1, 1)
    const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
    const skip = (page - 1) * limit
    const where = visibleWhere()
    if (event.categorySlug) where.categorySlug = event.categorySlug
    if (event.keyword) {
      where.title = db.RegExp({ regexp: String(event.keyword).trim(), options: 'i' })
    }
    if (event.difficulty) {
      const d = Number(event.difficulty)
      if (d === 1) where.difficulty = _.lte(2)
      else if (d === 2) where.difficulty = 3
      else if (d === 3) where.difficulty = _.gte(4)
    }

    const col = db.collection('recipes').where(where)
    const countRes = await col.count()
    let query = db.collection('recipes').where(where)
    if (event.sort === 'likes') query = query.orderBy('likes', 'desc')
    else if (event.sort === 'calories') query = query.orderBy('calories', 'asc')
    else if (event.sort === 'favorites') query = query.orderBy('favorites', 'desc')
    else query = query.orderBy('recipeId', 'asc')
    const listRes = await query.skip(skip).limit(limit).get()
    const list = filterVisible(listRes.data)

    return common.ok({
      list: list.map(common.toListRecipe),
      page,
      limit,
      total: countRes.total || 0,
      hasMore: skip + (listRes.data || []).length < (countRes.total || 0)
    })
  } catch (error) {
    return common.mapError(error)
  }
}
