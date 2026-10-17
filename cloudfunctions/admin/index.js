const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const HIDDEN_CATEGORY_SLUGS = ['template']
const PAGE_SIZE = 20
const FEEDBACK_STATUSES = ['pending', 'read', 'processed', 'rejected']

function normalizeFeedbackStatus(doc) {
  const s = String(doc?.status || '').trim()
  if (FEEDBACK_STATUSES.includes(s)) return s
  return doc?.isRead ? 'read' : 'pending'
}

function collectFeedbackIds(event) {
  const raw = Array.isArray(event.ids) ? event.ids : []
  const single = event.id != null ? [event.id] : []
  return [...new Set([...raw, ...single].map((id) => String(id || '').trim()).filter(Boolean))]
}

/** 按字段批量删除关联数据（每次最多 20 条，循环清理） */
async function removeByField(collection, field, value) {
  let guard = 0
  while (guard < 50) {
    guard += 1
    const res = await db.collection(collection).where({ [field]: value }).limit(20).get()
    const rows = res.data || []
    if (!rows.length) break
    await Promise.all(rows.map((row) => db.collection(collection).doc(row._id).remove()))
    if (rows.length < 20) break
  }
}

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
    images: doc.images || [],
    auditStatus: common.normalizeAuditStatus(doc.auditStatus),
    createTime: doc.createTime || null,
    auditTime: doc.auditTime || null,
    createdByOpenid: doc.createdByOpenid || '',
    createdByNickname: doc.createdByNickname || ''
  }
}

function isUserPendingCreate(action, event) {
  const payload = event.data || event
  if (action === 'recipeSave') {
    const id = payload.recipeId
    const hasId = id != null && id !== ''
    return !hasId && String(payload.auditStatus || '').trim() === 'pending'
  }
  if (action === 'tipSave') {
    const id = payload.tipId
    const hasId = id != null && id !== ''
    return !hasId && String(payload.auditStatus || '').trim() === 'pending'
  }
  return false
}

function isOwnUnapproved(doc, openid) {
  if (!doc || !openid) return false
  if (String(doc.createdByOpenid || '') !== String(openid)) return false
  return common.normalizeAuditStatus(doc.auditStatus) !== 'approved'
}

/** 保存只认 payload 内 ID，避免 event.*Id 与 data.*Id 拆分越权 */
function resolveManageId(action, event) {
  const payload = event.data || event
  if (action === 'recipeSave') {
    const id = payload.recipeId
    return id != null && id !== '' ? Number(id) : 0
  }
  if (action === 'tipSave') {
    const id = payload.tipId
    return id != null && id !== '' ? Number(id) : 0
  }
  if (action === 'recipeDetail' || action === 'recipeDelete') {
    return Number(event.recipeId || event.id || payload.recipeId || 0)
  }
  if (action === 'tipDetail' || action === 'tipDelete') {
    return Number(event.tipId || event.id || payload.tipId || 0)
  }
  return 0
}

async function canUserManageOwnUnapproved(user, action, event) {
  if (action === 'recipeDetail' || action === 'recipeDelete' || action === 'recipeSave') {
    const recipeId = resolveManageId(action, event)
    if (!recipeId) return false
    const found = await db.collection('recipes').where({ recipeId }).limit(1).get()
    return isOwnUnapproved(found.data[0], user.openid)
  }
  if (action === 'tipDetail' || action === 'tipDelete' || action === 'tipSave') {
    const tipId = resolveManageId(action, event)
    if (!tipId) return false
    const found = await db.collection('tips').where({ tipId }).limit(1).get()
    return isOwnUnapproved(found.data[0], user.openid)
  }
  return false
}

async function resolveActor(action, event) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 分类列表：登录用户即可（用户新增菜谱需选分类）
  if (action === 'categoryList') {
    return common.requireUser(db, openid)
  }

  // 用户新建待审内容
  if (isUserPendingCreate(action, event)) {
    return common.requireUser(db, openid)
  }

  // 用户管理本人未通过审核的菜谱/技巧
  const ownerActions = ['recipeDetail', 'recipeSave', 'recipeDelete', 'tipDetail', 'tipSave', 'tipDelete']
  if (ownerActions.includes(action)) {
    const user = await common.requireUser(db, openid)
    if (Number(user.role) === 1) return user
    if (await canUserManageOwnUnapproved(user, action, event)) return user
    throw new Error('无权限')
  }

  return common.requireAdmin(db, openid)
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
    const action = event.action || ''
    const admin = await resolveActor(action, event)

    // ---------- 待办汇总（我的页角标） ----------
    if (action === 'pendingSummary') {
      const [recipeRes, tipRes, feedbackRes] = await Promise.all([
        db.collection('recipes').where({
          auditStatus: 'pending',
          categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS)
        }).count(),
        db.collection('tips').where({ auditStatus: 'pending' }).count(),
        db.collection('feedbacks').where({ status: 'pending' }).count()
      ])
      const recipes = recipeRes.total || 0
      const tips = tipRes.total || 0
      const feedbacks = feedbackRes.total || 0
      let weekNew = 0
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const [recipeWeek, tipWeek] = await Promise.all([
          db.collection('recipes').where({ createTime: _.gte(weekAgo) }).count(),
          db.collection('tips').where({ createTime: _.gte(weekAgo) }).count()
        ])
        weekNew = (recipeWeek.total || 0) + (tipWeek.total || 0)
      } catch (error) {
        weekNew = 0
      }
      return common.ok({
        recipes,
        tips,
        feedbacks,
        weekNew,
        total: recipes + tips + feedbacks
      })
    }

    // ---------- recipes ----------
    if (action === 'recipeList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const where = {
        categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS),
        auditStatus: 'approved'
      }
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
      const auditStatus = ['pending', 'approved', 'rejected'].includes(String(payload.auditStatus || '').trim())
        ? String(payload.auditStatus).trim()
        : 'approved'
      // 普通用户新建/修改均强制 pending
      const finalAudit = Number(admin.role) !== 1 ? 'pending' : auditStatus
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
        auditStatus: finalAudit,
        updateTime: db.serverDate()
      }
      if (Number(admin.role) !== 1) {
        docData.auditTime = null
      }

      if (recipeId) {
        const found = await db.collection('recipes').where({ recipeId }).limit(1).get()
        if (!found.data[0]) return common.fail('菜谱不存在', 404)
        // 非管理员更新前再次校验本人未通过，防止鉴权与写入 ID 不一致
        if (Number(admin.role) !== 1 && !isOwnUnapproved(found.data[0], admin.openid)) {
          return common.fail('无权限', 403)
        }
        // 保留原创建人，避免编辑时被覆盖
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
          source: 'user',
          createdByOpenid: admin.openid || '',
          createdByNickname: admin.nickname || '',
          createTime: db.serverDate()
        }
      })
      return common.ok({ recipeId: newId })
    }

    if (action === 'recipeAuditList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const tab = String(event.tab || 'pending').trim() // pending | duplicates | all
      const keyword = String(event.keyword || '').trim()
      const where = { categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS) }
      if (keyword) {
        where.title = db.RegExp({ regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: 'i' })
      }
      if (tab === 'pending') where.auditStatus = 'pending'
      else if (tab === 'rejected') where.auditStatus = 'rejected'

      const col = db.collection('recipes').where(where)
      const countRes = await col.count()
      const listRes = await col.orderBy('recipeId', 'desc').skip(skip).limit(limit).get()
      let rows = listRes.data || []

      // 同名页：筛出标题重复的菜谱（当前页范围内再补全计数）
      const titles = [...new Set(rows.map((d) => String(d.title || '').trim()).filter(Boolean))]
      const titleCountMap = {}
      for (const title of titles) {
        const c = await db.collection('recipes').where({
          title,
          categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS)
        }).count()
        titleCountMap[title] = c.total || 0
      }

      if (tab === 'duplicates') {
        // 拉取更多后过滤同名；简单策略：按 recipeId 倒序分页，只返回 count>1
        rows = rows.filter((d) => (titleCountMap[String(d.title || '').trim()] || 0) > 1)
        // 若本页不足且还有数据，可接受；前端可继续上拉
      }

      const list = rows.map((doc) => {
        const item = common.toListRecipe(doc)
        const title = String(doc.title || '').trim()
        return {
          ...item,
          sameTitleCount: titleCountMap[title] || 1
        }
      })

      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + (listRes.data || []).length < (countRes.total || 0)
      })
    }

    if (action === 'recipeSameTitleList') {
      const title = String(event.title || '').trim()
      if (!title) return common.fail('缺少标题', 400)
      const excludeId = event.excludeId != null && event.excludeId !== '' ? Number(event.excludeId) : null
      const res = await db.collection('recipes').where({
        title,
        categorySlug: _.nin(HIDDEN_CATEGORY_SLUGS)
      }).orderBy('recipeId', 'desc').limit(50).get()
      let list = (res.data || []).map(common.toDetailRecipe)
      if (excludeId) list = list.filter((item) => item.id !== excludeId)
      return common.ok({ list, total: list.length, title })
    }

    if (action === 'recipeUpdateAuditStatus') {
      const recipeId = Number(event.recipeId || event.id)
      const auditStatus = String(event.auditStatus || '').trim()
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      if (!['pending', 'approved', 'rejected'].includes(auditStatus)) {
        return common.fail('无效审核状态', 400)
      }
      const found = await db.collection('recipes').where({ recipeId }).limit(1).get()
      if (!found.data[0]) return common.fail('菜谱不存在', 404)
      const rejectReason = String(event.rejectReason || event.reason || '').trim()
      await db.collection('recipes').doc(found.data[0]._id).update({
        data: {
          auditStatus,
          rejectReason: auditStatus === 'rejected' ? rejectReason : '',
          auditTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      return common.ok({ recipeId, auditStatus })
    }

    if (action === 'recipeDelete') {
      const recipeId = Number(event.recipeId || event.id)
      if (!recipeId) return common.fail('缺少 recipeId', 400)
      const found = await db.collection('recipes').where({ recipeId }).limit(1).get()
      if (!found.data[0]) return common.fail('菜谱不存在', 404)
      await db.collection('recipes').doc(found.data[0]._id).remove()
      await removeByField('likes', 'recipeId', recipeId)
      await removeByField('favorites', 'recipeId', recipeId)
      await removeByField('cooked', 'recipeId', recipeId)
      await removeByField('history', 'recipeId', recipeId)
      return common.ok(true)
    }

    // ---------- tips ----------
    if (action === 'tipList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const where = {
        auditStatus: 'approved'
      }
      if (event.keyword) {
        where.title = db.RegExp({ regexp: String(event.keyword).trim(), options: 'i' })
      }
      const col = db.collection('tips').where(where)
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

    if (action === 'tipAuditList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const tab = String(event.tab || 'pending').trim() // pending | duplicates | rejected | all
      const keyword = String(event.keyword || '').trim()
      const where = {}
      if (keyword) {
        where.title = db.RegExp({ regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: 'i' })
      }
      if (tab === 'pending') where.auditStatus = 'pending'
      else if (tab === 'rejected') where.auditStatus = 'rejected'

      const col = Object.keys(where).length ? db.collection('tips').where(where) : db.collection('tips')
      const countRes = await col.count()
      const listRes = await col.orderBy('tipId', 'desc').skip(skip).limit(limit).get()
      let rows = listRes.data || []

      const titles = [...new Set(rows.map((d) => String(d.title || '').trim()).filter(Boolean))]
      const titleCountMap = {}
      for (const title of titles) {
        const c = await db.collection('tips').where({ title }).count()
        titleCountMap[title] = c.total || 0
      }

      if (tab === 'duplicates') {
        rows = rows.filter((d) => (titleCountMap[String(d.title || '').trim()] || 0) > 1)
      }

      const list = rows.map((doc) => {
        const item = toAdminTip(doc)
        const title = String(doc.title || '').trim()
        return {
          ...item,
          sameTitleCount: titleCountMap[title] || 1
        }
      })

      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + (listRes.data || []).length < (countRes.total || 0)
      })
    }

    if (action === 'tipSameTitleList') {
      const title = String(event.title || '').trim()
      if (!title) return common.fail('缺少标题', 400)
      const excludeId = event.excludeId != null && event.excludeId !== '' ? Number(event.excludeId) : null
      const res = await db.collection('tips').where({ title }).orderBy('tipId', 'desc').limit(50).get()
      let list = (res.data || []).map(toAdminTip)
      if (excludeId) list = list.filter((item) => item.id !== excludeId)
      return common.ok({ list, total: list.length, title })
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
      const auditStatus = ['pending', 'approved', 'rejected'].includes(String(payload.auditStatus || '').trim())
        ? String(payload.auditStatus).trim()
        : 'approved'
      // 普通用户新建/修改均强制 pending
      const finalAudit = Number(admin.role) !== 1 ? 'pending' : auditStatus
      const docData = {
        title,
        summary: String(payload.summary || '').trim(),
        markdownHtml: String(payload.markdownHtml || ''),
        images: Array.isArray(payload.images) ? payload.images : [],
        auditStatus: finalAudit,
        updateTime: db.serverDate()
      }
      if (Number(admin.role) !== 1) {
        docData.auditTime = null
      }
      if (tipId) {
        const found = await db.collection('tips').where({ tipId }).limit(1).get()
        if (!found.data[0]) return common.fail('技巧不存在', 404)
        if (Number(admin.role) !== 1 && !isOwnUnapproved(found.data[0], admin.openid)) {
          return common.fail('无权限', 403)
        }
        await db.collection('tips').doc(found.data[0]._id).update({ data: docData })
        return common.ok({ tipId })
      }
      const newId = await nextId('tips', 'tipId')
      await db.collection('tips').add({
        data: {
          ...docData,
          tipId: newId,
          source: 'user',
          createdByOpenid: admin.openid || '',
          createdByNickname: admin.nickname || '',
          createTime: db.serverDate()
        }
      })
      return common.ok({ tipId: newId })
    }

    if (action === 'tipUpdateAuditStatus') {
      const tipId = Number(event.tipId || event.id)
      const auditStatus = String(event.auditStatus || '').trim()
      if (!tipId) return common.fail('缺少 tipId', 400)
      if (!['pending', 'approved', 'rejected'].includes(auditStatus)) {
        return common.fail('无效审核状态', 400)
      }
      const found = await db.collection('tips').where({ tipId }).limit(1).get()
      if (!found.data[0]) return common.fail('技巧不存在', 404)
      const rejectReason = String(event.rejectReason || event.reason || '').trim()
      await db.collection('tips').doc(found.data[0]._id).update({
        data: {
          auditStatus,
          rejectReason: auditStatus === 'rejected' ? rejectReason : '',
          auditTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      return common.ok({ tipId, auditStatus })
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
      const list = (listRes.data || []).map((doc) => {
        const status = normalizeFeedbackStatus(doc)
        return {
          id: doc._id,
          nickname: doc.nickname || '',
          contact: doc.contact || '',
          content: doc.content || '',
          status,
          isRead: status !== 'pending',
          readTime: doc.readTime || null,
          handleTime: doc.handleTime || null,
          createTime: doc.createTime || null
        }
      })
      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + list.length < (countRes.total || 0)
      })
    }

    if (action === 'feedbackUpdateStatus' || action === 'feedbackMarkRead') {
      const status = action === 'feedbackMarkRead'
        ? 'read'
        : String(event.status || '').trim()
      if (!FEEDBACK_STATUSES.includes(status) || status === 'pending') {
        return common.fail('无效状态', 400)
      }
      const ids = collectFeedbackIds(event)
      if (!ids.length) return common.fail('缺少 id', 400)
      if (ids.length > 50) return common.fail('单次最多处理50条', 400)

      const now = db.serverDate()
      let count = 0
      for (const id of ids) {
        const patch = {
          status,
          isRead: true,
          updateTime: now
        }
        if (status === 'read') patch.readTime = now
        if (status === 'processed' || status === 'rejected') patch.handleTime = now
        try {
          await db.collection('feedbacks').doc(id).update({ data: patch })
          count += 1
        } catch (e) {
          // 单条失败跳过
        }
      }
      return common.ok({ count, status, ids })
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

    // ---------- users ----------
    if (action === 'userList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const keyword = String(event.keyword || '').trim()
      const where = {}
      if (keyword) {
        where.nickname = db.RegExp({ regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: 'i' })
      }
      const col = Object.keys(where).length
        ? db.collection('users').where(where)
        : db.collection('users')
      const countRes = await col.count()
      const listRes = await col.orderBy('createTime', 'desc').skip(skip).limit(limit).get()
      const list = (listRes.data || []).map((doc) => ({
        id: doc._id,
        openid: doc.openid || '',
        nickname: doc.nickname || '',
        avatar: doc.avatar || '',
        role: Number(doc.role) === 1 ? 1 : 2,
        createTime: doc.createTime || null,
        updateTime: doc.updateTime || null,
        isSelf: doc._id === admin._id || doc.openid === admin.openid
      }))
      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + list.length < (countRes.total || 0)
      })
    }

    if (action === 'userUpdateNickname') {
      const id = String(event.id || '').trim()
      const nickname = String(event.nickname || '').trim().slice(0, 32)
      if (!id) return common.fail('缺少用户 id', 400)
      if (!nickname) return common.fail('请填写名称', 400)
      const found = await db.collection('users').doc(id).get()
      if (!found.data) return common.fail('用户不存在', 404)
      await db.collection('users').doc(id).update({
        data: {
          nickname,
          updateTime: db.serverDate()
        }
      })
      return common.ok({ id, nickname })
    }

    if (action === 'userUpdateRole') {
      const id = String(event.id || '').trim()
      const role = Number(event.role)
      if (!id) return common.fail('缺少用户 id', 400)
      if (role !== 1 && role !== 2) return common.fail('无效角色', 400)
      const found = await db.collection('users').doc(id).get()
      const doc = found.data
      if (!doc) return common.fail('用户不存在', 404)
      if (doc._id === admin._id || doc.openid === admin.openid) {
        return common.fail('不能修改自己的角色', 400)
      }
      if (Number(doc.role) === 1 && role === 2) {
        const adminCount = await db.collection('users').where({ role: 1 }).count()
        if ((adminCount.total || 0) <= 1) {
          return common.fail('至少保留一名管理员', 400)
        }
      }
      await db.collection('users').doc(id).update({
        data: {
          role,
          updateTime: db.serverDate()
        }
      })
      return common.ok({ id, role })
    }

    if (action === 'userDelete') {
      const id = String(event.id || '').trim()
      if (!id) return common.fail('缺少用户 id', 400)
      const found = await db.collection('users').doc(id).get()
      const doc = found.data
      if (!doc) return common.fail('用户不存在', 404)
      if (doc._id === admin._id || doc.openid === admin.openid) {
        return common.fail('不能删除自己', 400)
      }
      if (Number(doc.role) === 1) {
        const adminCount = await db.collection('users').where({ role: 1 }).count()
        if ((adminCount.total || 0) <= 1) {
          return common.fail('至少保留一名管理员', 400)
        }
      }
      const openid = doc.openid
      if (openid) {
        await removeByField('likes', 'userId', openid)
        await removeByField('favorites', 'userId', openid)
        await removeByField('cooked', 'userId', openid)
        await removeByField('history', 'userId', openid)
        await removeByField('feedbacks', 'openid', openid)
      }
      await db.collection('users').doc(id).remove()
      return common.ok(true)
    }

    return common.fail(`未知操作: ${action}`, 400)
  } catch (error) {
    return common.mapError(error)
  }
}
