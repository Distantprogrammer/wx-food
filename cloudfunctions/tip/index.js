const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const PAGE_SIZE = 20

function isHiddenTip(doc) {
  if (!doc) return true
  return common.normalizeAuditStatus(doc.auditStatus) !== 'approved'
}

function toPublicTip(doc) {
  if (!doc) return null
  return {
    id: doc.tipId,
    _id: doc._id,
    title: doc.title,
    summary: doc.summary || '点击查看详情',
    auditStatus: common.normalizeAuditStatus(doc.auditStatus)
  }
}

function toDetailTip(doc) {
  if (!doc) return null
  return {
    id: doc.tipId,
    _id: doc._id,
    title: doc.title,
    summary: doc.summary || '',
    markdownHtml: doc.markdownHtml || '',
    images: doc.images || [],
    auditStatus: common.normalizeAuditStatus(doc.auditStatus)
  }
}

function visibleWhere(extra = {}) {
  return {
    ...extra,
    auditStatus: 'approved'
  }
}

exports.main = async (event) => {
  try {
    const action = event.action || 'list'

    if (action === 'detail') {
      const tipId = Number(event.tipId || event.id)
      if (!tipId) return common.fail('缺少 tipId', 400)
      const res = await db.collection('tips').where({ tipId }).limit(1).get()
      const doc = res.data[0]
      if (isHiddenTip(doc)) return common.fail('技巧不存在', 404)
      return common.ok(toDetailTip(doc))
    }

    if (action === 'myCreated') {
      const wxContext = cloud.getWXContext()
      const user = await common.requireUser(db, wxContext.OPENID)
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || PAGE_SIZE, 50)
      const skip = (page - 1) * limit
      const where = { createdByOpenid: user.openid }
      const col = db.collection('tips').where(where)
      const countRes = await col.count()
      const listRes = await col.orderBy('createTime', 'desc').skip(skip).limit(limit).get()
      const list = (listRes.data || []).map((doc) => ({
        id: doc.tipId,
        _id: doc._id,
        title: doc.title || '',
        summary: doc.summary || '',
        auditStatus: common.normalizeAuditStatus(doc.auditStatus),
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

    const page = Math.max(Number(event.page) || 1, 1)
    const limit = Math.min(Number(event.limit) || 50, 100)
    const skip = (page - 1) * limit
    const keyword = String(event.keyword || '').trim()
    const where = visibleWhere()
    if (keyword) {
      where.title = db.RegExp({
        regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        options: 'i'
      })
    }
    const col = db.collection('tips').where(where)
    const raw = await col.orderBy('tipId', 'asc').skip(skip).limit(limit).get()
    const visible = (raw.data || []).filter((doc) => !isHiddenTip(doc))
    const countRes = await col.count()

    return common.ok({
      list: visible.map(toPublicTip),
      total: countRes.total || 0,
      page,
      limit
    })
  } catch (error) {
    return common.mapError(error)
  }
}
