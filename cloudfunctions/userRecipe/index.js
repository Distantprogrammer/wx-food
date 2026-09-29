const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const COLLECTIONS = {
  like: 'likes',
  favorite: 'favorites',
  cooked: 'cooked'
}

async function toggle(collectionName, openid, recipeId) {
  const countField = collectionName === 'likes' ? 'likes' : collectionName === 'favorites' ? 'favorites' : null
  const col = db.collection(collectionName)
  const found = await col.where({ userId: openid, recipeId }).limit(1).get()
  if (found.data.length) {
    await col.doc(found.data[0]._id).remove()
    if (countField) {
      const recipe = await db.collection('recipes').where({ recipeId }).limit(1).get()
      if (recipe.data[0]) {
        const next = Math.max((recipe.data[0][countField] || 0) - 1, 0)
        await db.collection('recipes').doc(recipe.data[0]._id).update({
          data: { [countField]: next, updateTime: db.serverDate() }
        })
      }
    }
    return { active: false }
  }

  await col.add({
    data: {
      userId: openid,
      recipeId,
      createTime: db.serverDate()
    }
  })
  if (countField) {
    const recipe = await db.collection('recipes').where({ recipeId }).limit(1).get()
    if (recipe.data[0]) {
      await db.collection('recipes').doc(recipe.data[0]._id).update({
        data: { [countField]: (recipe.data[0][countField] || 0) + 1, updateTime: db.serverDate() }
      })
    }
  }
  return { active: true }
}

async function fetchRecipesByIds(ids) {
  if (!ids.length) return []
  const chunks = []
  for (let i = 0; i < ids.length; i += 20) {
    chunks.push(ids.slice(i, i + 20))
  }
  const all = []
  for (const chunk of chunks) {
    const res = await db.collection('recipes').where({
      recipeId: db.command.in(chunk)
    }).limit(20).get()
    all.push(...(res.data || []))
  }
  const map = {}
  all.forEach((d) => {
    if (!d || d.categorySlug === 'template' || String(d.title || '').trim() === '示例菜') return
    // 未通过审核的不出现在收藏/浏览等 C 端列表
    if (common.normalizeAuditStatus(d.auditStatus) !== 'approved') return
    map[d.recipeId] = d
  })
  return ids.map((id) => map[id]).filter(Boolean).map(common.toListRecipe)
}

async function assertApprovedRecipe(recipeId) {
  const res = await db.collection('recipes').where({ recipeId: Number(recipeId) }).limit(1).get()
  const doc = res.data[0]
  if (!doc) return null
  if (doc.categorySlug === 'template' || String(doc.title || '').trim() === '示例菜') return null
  if (common.normalizeAuditStatus(doc.auditStatus) !== 'approved') return null
  return doc
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    await common.requireUser(db, openid)

    const action = event.action
    const recipeId = Number(event.recipeId || event.id)

    if (action === 'toggleLike' || action === 'toggleFavorite' || action === 'toggleCooked') {
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const approved = await assertApprovedRecipe(recipeId)
      if (!approved) return common.fail('菜谱不可用', 404)
      const key = action.replace('toggle', '').toLowerCase()
      const col = COLLECTIONS[key === 'like' ? 'like' : key === 'favorite' ? 'favorite' : 'cooked']
      const result = await toggle(col, openid, recipeId)
      return common.ok(result)
    }

    if (action === 'addHistory') {
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const approved = await assertApprovedRecipe(recipeId)
      if (!approved) return common.ok(false)
      const col = db.collection('history')
      const found = await col.where({ userId: openid, recipeId }).limit(1).get()
      const now = db.serverDate()
      if (found.data.length) {
        await col.doc(found.data[0]._id).update({ data: { updateTime: now } })
      } else {
        await col.add({
          data: { userId: openid, recipeId, createTime: now, updateTime: now }
        })
      }
      return common.ok(true)
    }

    if (action === 'status') {
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const [liked, favorited, cooked] = await Promise.all([
        db.collection('likes').where({ userId: openid, recipeId }).limit(1).get(),
        db.collection('favorites').where({ userId: openid, recipeId }).limit(1).get(),
        db.collection('cooked').where({ userId: openid, recipeId }).limit(1).get()
      ])
      return common.ok({
        liked: liked.data.length > 0,
        favorited: favorited.data.length > 0,
        cooked: cooked.data.length > 0
      })
    }

    if (action === 'stats') {
      const [history, liked, favorite, cooked] = await Promise.all([
        db.collection('history').where({ userId: openid }).count(),
        db.collection('likes').where({ userId: openid }).count(),
        db.collection('favorites').where({ userId: openid }).count(),
        db.collection('cooked').where({ userId: openid }).count()
      ])
      return common.ok({
        history: history.total || 0,
        liked: liked.total || 0,
        favorite: favorite.total || 0,
        cooked: cooked.total || 0
      })
    }

    if (action === 'list') {
      const type = event.type || 'favorites'
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || 20, 50)
      const skip = (page - 1) * limit
      const map = {
        likes: 'likes',
        favorites: 'favorites',
        cooked: 'cooked',
        history: 'history'
      }
      const colName = map[type]
      if (!colName) return common.fail('无效类型', 400)

      const col = db.collection(colName).where({ userId: openid })
      const countRes = await col.count()
      let query = db.collection(colName).where({ userId: openid })
      if (type === 'history') query = query.orderBy('updateTime', 'desc')
      else query = query.orderBy('createTime', 'desc')
      const listRes = await query.skip(skip).limit(limit).get()
      const ids = (listRes.data || []).map((i) => i.recipeId)
      const recipes = await fetchRecipesByIds(ids)
      return common.ok({
        list: recipes,
        total: countRes.total || 0,
        hasMore: skip + ids.length < (countRes.total || 0)
      })
    }

    if (action === 'preview') {
      const [fav, his] = await Promise.all([
        db.collection('favorites').where({ userId: openid }).orderBy('createTime', 'desc').limit(4).get(),
        db.collection('history').where({ userId: openid }).orderBy('updateTime', 'desc').limit(4).get()
      ])
      const favIds = (fav.data || []).map((i) => i.recipeId)
      const hisIds = (his.data || []).map((i) => i.recipeId)
      const [favorites, history] = await Promise.all([
        fetchRecipesByIds(favIds),
        fetchRecipesByIds(hisIds)
      ])
      return common.ok({ favorites, history })
    }

    return common.fail('未知操作', 400)
  } catch (error) {
    return common.mapError(error)
  }
}
