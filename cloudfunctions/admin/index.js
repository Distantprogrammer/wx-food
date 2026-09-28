const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const HIDDEN_CATEGORY_SLUGS = ['template']
const PAGE_SIZE = 20

async function nextId(collection, idField) {
  const res = await db.collection(collection).orderBy(idField, 'desc').limit(1).get()
  const max = res.data[0] ? Number(res.data[0][idField]) || 0 : 0
  return max + 1
}

function toAdminRecipe(doc) {
  if (!doc) return null
  return {
    ...common.toDetailRecipe(doc),
    _id: doc._id
  }
}

function toAdminTip(doc) {
  if (!doc) return null
  return {
    id: doc.tipId,
    _id: doc._id,
    title: doc.title || '',
    summary: doc.summary || '',
    markdownHtml: doc.markdownHtml || '',
    images: doc.images || []
  }
}

function toAdminCategory(doc) {
  if (!doc) return null
  return {
    _id: doc._id,
    slug: doc.slug || '',
    name: doc.name || '',
    icon: doc.icon || '🍽️',
    sort: Number(doc.sort) || 0
  }
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    await common.requireAdmin(db, wxContext.OPENID)
    const action = event.action || ''

    // ---------- recipes ----------
    if (action === 'recipeList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const where = { categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS) }
      if (event.keyword) {
        where.title = db.RegExp({ regexp: String(event.keyword).trim(), options: 'i' })
      }
      if (event.categorySlug) where.categorySlug = event.categorySlug
      const col = db.collection('recipes').where(where)
      const countRes = await col.count()
      const listRes = await col.orderBy('recipeId', 'desc').skip(skip).limit(limit).get()
      return common.ok({
        list: (listRes.data || []).map(common.toListRecipe),
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + (listRes.data || []).length < (countRes.total || 0)
      })
    }

    if (action === 'recipeDetail') {
      const recipeId = Number(event.recipeId || event.id)
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const res = await db.collection('recipes').where({ recipeId }).limit(1).get()
      const doc = res.data[0]
      if (!doc) return common.fail('菜谱不存在', 404)
      return common.ok(toAdminRecipe(doc))
    }

    if (action === 'recipeSave') {
      const payload = event.data || event
      const title = String(payload.title || '').trim()
      if (!title) return common.fail('请填写标题', 400)
      const recipeId = payload.recipeId != null && payload.recipeId !== '' ? Number(payload.recipeId) : null
      const docData = {
        title,
        categorySlug: String(payload.categorySlug || '').trim() || 'staple',
        categoryName: String(payload.categoryName || '').trim() || '',
        difficulty: Number(payload.difficulty) || 3,
        calories: Number(payload.calories) || 0,
        coverImage: String(payload.coverImage || '').trim(),
        summary: String(payload.summary || '').trim(),
        ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
        steps: Array.isArray(payload.steps) ? payload.steps : [],
        calculation: String(payload.calculation || ''),
        calculationItems: Array.isArray(payload.calculationItems) ? payload.calculationItems : [],
        ingredientsHtml: String(payload.ingredientsHtml || ''),
        calculationHtml: String(payload.calculationHtml || ''),
        stepsHtml: String(payload.stepsHtml || ''),
        notesHtml: String(payload.notesHtml || ''),
        markdownHtml: String(payload.markdownHtml || ''),
        images: Array.isArray(payload.images) ? payload.images : [],
        lastUpdated: payload.lastUpdated || '',
        updateTime: db.serverDate()
      }

      if (recipeId) {
        const found = await db.collection('recipes').where({ recipeId }).limit(1).get()
        if (!found.data[0]) return common.fail('菜谱不存在', 404)
        await db.collection('recipes').doc(found.data[0]._id).update({ data: docData })
        return common.ok({ recipeId })
      }

      const newId = await nextId('recipes', 'recipeId')
      await db.collection('recipes').add({
        data: {
          ...docData,
          recipeId: newId,
          likes: 0,
          favorites: 0,
          createTime: db.serverDate()
        }
      })
      return common.ok({ recipeId: newId })
    }

    if (action === 'recipeDelete') {
      const recipeId = Number(event.recipeId || event.id)
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const found = await db.collection('recipes').where({ recipeId }).limit(1).get()
      if (!found.data[0]) return common.fail('菜谱不存在', 404)
      await db.collection('recipes').doc(found.data[0]._id).remove()
      return common.ok(true)
    }

    // ---------- tips ----------
    if (action === 'tipList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const where = {}
      if (event.keyword) {
        where.title = db.RegExp({ regexp: String(event.keyword).trim(), options: 'i' })
      }
      const col = Object.keys(where).length ? db.collection('tips').where(where) : db.collection('tips')
      const countRes = await col.count()
      const listRes = await col.orderBy('tipId', 'desc').skip(skip).limit(limit).get()
      return common.ok({
        list: (listRes.data || []).map(toAdminTip),
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + (listRes.data || []).length < (countRes.total || 0)
      })
    }

    if (action === 'tipDetail') {
      const tipId = Number(event.tipId || event.id)
      if (!tipId) return common.fail('缺少 tipId', 400)
      const res = await db.collection('tips').where({ tipId }).limit(1).get()
      if (!res.data[0]) return common.fail('技巧不存在', 404)
      return common.ok(toAdminTip(res.data[0]))
    }

    if (action === 'tipSave') {
      const payload = event.data || event
      const title = String(payload.title || '').trim()
      if (!title) return common.fail('请填写标题', 400)
      const tipId = payload.tipId != null && payload.tipId !== '' ? Number(payload.tipId) : null
      const docData = {
        title,
        summary: String(payload.summary || '').trim(),
        markdownHtml: String(payload.markdownHtml || ''),
        images: Array.isArray(payload.images) ? payload.images : [],
        updateTime: db.serverDate()
      }
      if (tipId) {
        const found = await db.collection('tips').where({ tipId }).limit(1).get()
        if (!found.data[0]) return common.fail('技巧不存在', 404)
        await db.collection('tips').doc(found.data[0]._id).update({ data: docData })
        return common.ok({ tipId })
      }
      const newId = await nextId('tips', 'tipId')
      await db.collection('tips').add({
        data: { ...docData, tipId: newId, createTime: db.serverDate() }
      })
      return common.ok({ tipId: newId })
    }

    if (action === 'tipDelete') {
      const tipId = Number(event.tipId || event.id)
      if (!tipId) return common.fail('缺少 tipId', 400)
      const found = await db.collection('tips').where({ tipId }).limit(1).get()
      if (!found.data[0]) return common.fail('技巧不存在', 404)
      await db.collection('tips').doc(found.data[0]._id).remove()
      return common.ok(true)
    }

    // ---------- categories ----------
    if (action === 'categoryList') {
      const res = await db.collection('categories').orderBy('sort', 'asc').limit(100).get()
      const list = (res.data || [])
        .filter((c) => HIDDEN_CATEGORY_SLUGS.indexOf(c.slug) < 0)
        .map(toAdminCategory)
      return common.ok(list)
    }

    if (action === 'categorySave') {
      const payload = event.data || event
      const slug = String(payload.slug || '').trim()
      const name = String(payload.name || '').trim()
      if (!slug) return common.fail('请填写 slug', 400)
      if (!name) return common.fail('请填写名称', 400)
      if (HIDDEN_CATEGORY_SLUGS.indexOf(slug) >= 0) return common.fail('该分类不可用', 400)
      const docData = {
        slug,
        name,
        icon: String(payload.icon || '🍽️').trim() || '🍽️',
        sort: Number(payload.sort) || 0,
        updateTime: db.serverDate()
      }
      const found = await db.collection('categories').where({ slug }).limit(1).get()
      if (found.data[0]) {
        await db.collection('categories').doc(found.data[0]._id).update({ data: docData })
        return common.ok({ slug })
      }
      await db.collection('categories').add({
        data: { ...docData, createTime: db.serverDate() }
      })
      return common.ok({ slug })
    }

    if (action === 'categoryDelete') {
      const slug = String(event.slug || '').trim()
      if (!slug) return common.fail('缺少 slug', 400)
      const countRes = await db.collection('recipes').where({ categorySlug: slug }).count()
      if (countRes.total > 0) return common.fail(`该分类下还有 ${countRes.total} 道菜，无法删除`, 400)
      const found = await db.collection('categories').where({ slug }).limit(1).get()
      if (!found.data[0]) return common.fail('分类不存在', 404)
      await db.collection('categories').doc(found.data[0]._id).remove()
      return common.ok(true)
    }

    // ---------- feedbacks ----------
    if (action === 'feedbackList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const col = db.collection('feedbacks')
      const countRes = await col.count()
      const listRes = await col.orderBy('createTime', 'desc').skip(skip).limit(limit).get()
      const list = (listRes.data || []).map((doc) => ({
        id: doc._id,
        nickname: doc.nickname || '',
        contact: doc.contact || '',
        content: doc.content || '',
        createTime: doc.createTime || null
      }))
      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + list.length < (countRes.total || 0)
      })
    }

    if (action === 'feedbackDelete') {
      const id = String(event.id || '').trim()
      if (!id) return common.fail('缺少 id', 400)
      await db.collection('feedbacks').doc(id).remove()
      return common.ok(true)
    }

    // ---------- notice / announcement ----------
    if (action === 'noticeGet') {
      const NOTICE_KEY = 'announcement'
      const found = await db.collection('settings').where({ key: NOTICE_KEY }).limit(1).get()
      const doc = found.data[0]
      return common.ok({
        title: doc?.title || '关于 · 今天做什么菜',
        contentHtml: doc?.contentHtml || '',
        updateTime: doc?.updateTime || null
      })
    }

    if (action === 'noticeSave') {
      const NOTICE_KEY = 'announcement'
      const payload = event.data || event
      const title = String(payload.title || '').trim() || '关于 · 今天做什么菜'
      const contentHtml = String(payload.contentHtml || '')
      const docData = {
        key: NOTICE_KEY,
        title,
        contentHtml,
        updateTime: db.serverDate()
      }
      const found = await db.collection('settings').where({ key: NOTICE_KEY }).limit(1).get()
      if (found.data[0]) {
        await db.collection('settings').doc(found.data[0]._id).update({ data: docData })
      } else {
        await db.collection('settings').add({
          data: { ...docData, createTime: db.serverDate() }
        })
      }
      return common.ok({ title })
    }

    return common.fail(`未知操作: ${action}`, 400)
  } catch (error) {
    return common.mapError(error)
  }
}
