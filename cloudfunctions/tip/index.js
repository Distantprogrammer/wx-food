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
    icon: doc.icon || '',
    markdown: doc.markdown || '',
    markdownHtml: doc.markdownHtml || '',
    updatedAt: doc.updatedAt || doc.updateTime || doc.createTime || null,
    images: doc.images || [],
    auditStatus: common.normalizeAuditStatus(doc.auditStatus)
  }
}

async function findTip(raw) {
  if (raw == null || raw === '') return null
  const text = String(raw).trim()
  if (/^\d+$/.test(text)) {
    const res = await db.collection('tips').where({ tipId: Number(text) }).limit(1).get()
    return res.data[0] || null
  }
  try {
    const res = await db.collection('tips').doc(text).get()
    return res.data || null
  } catch (error) {
    return null
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
      const raw = event.tipId != null && event.tipId !== '' ? event.tipId : event.id
      if (raw == null || raw === '') return common.fail('缺少 tipId', 400)
      const doc = await findTip(raw)
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
        auditTime: doc.auditTime || null,
        rejectReason: doc.rejectReason || ''
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
