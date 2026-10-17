const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/** pending | read | processed | rejected */
function normalizeStatus(doc) {
  const s = String(doc?.status || '').trim()
  if (s === 'pending' || s === 'read' || s === 'processed' || s === 'rejected') return s
  return doc?.isRead ? 'read' : 'pending'
}

function toFeedbackItem(doc) {
  const status = normalizeStatus(doc)
  return {
    id: doc._id,
    contact: doc.contact || '',
    content: doc.content || '',
    type: doc.type || 'other',
    images: Array.isArray(doc.images) ? doc.images : [],
    reply: doc.reply || '',
    status,
    isRead: status !== 'pending',
    readTime: doc.readTime || null,
    handleTime: doc.handleTime || null,
    createTime: doc.createTime || null
  }
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const user = await common.requireUser(db, wxContext.OPENID)
    const action = event.action || 'submit'

    if (action === 'submit') {
      const content = String(event.content || '').trim()
      const contact = String(event.contact || '').trim()
      const type = ['idea', 'bug', 'fix', 'other'].includes(event.type) ? event.type : 'other'
      const images = (Array.isArray(event.images) ? event.images : []).map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
      if (!content) return common.fail('请填写反馈内容', 400)
      if (content.length > 1000) return common.fail('反馈内容不能超过1000字', 400)
      if (contact.length > 40) return common.fail('联系方式不能超过40字', 400)

      const addRes = await db.collection('feedbacks').add({
        data: {
          openid: user.openid,
          userId: user._id,
          nickname: user.nickname || '',
          contact,
          content,
          type,
          images,
          reply: '',
          status: 'pending',
          isRead: false,
          readTime: null,
          handleTime: null,
          createTime: db.serverDate()
        }
      })
      return common.ok({ id: addRes._id })
    }

    if (action === 'myList') {
      const page = Math.max(Number(event.page) || 1, 1)
      const limit = Math.min(Number(event.limit) || 20, 50)
      const skip = (page - 1) * limit
      const col = db.collection('feedbacks').where({ openid: user.openid })
      const countRes = await col.count()
      const listRes = await col.orderBy('createTime', 'desc').skip(skip).limit(limit).get()
      const list = (listRes.data || []).map(toFeedbackItem)
      return common.ok({
        list,
        page,
        limit,
        total: countRes.total || 0,
        hasMore: skip + list.length < (countRes.total || 0)
      })
    }

    if (action === 'update') {
      const id = String(event.id || '').trim()
      if (!id) return common.fail('缺少反馈 id', 400)
      const content = String(event.content || '').trim()
      const contact = String(event.contact || '').trim()
      if (!content) return common.fail('请填写反馈内容', 400)
      if (content.length > 1000) return common.fail('反馈内容不能超过1000字', 400)
      if (contact.length > 40) return common.fail('联系方式不能超过40字', 400)

      const found = await db.collection('feedbacks').doc(id).get()
      const doc = found.data
      if (!doc || doc.openid !== user.openid) return common.fail('反馈不存在', 404)
      const status = normalizeStatus(doc)
      if (status !== 'pending' && status !== 'rejected') {
        return common.fail('当前状态不可编辑', 400)
      }

      await db.collection('feedbacks').doc(id).update({
        data: {
          contact,
          content,
          status: 'pending',
          isRead: false,
          readTime: null,
          handleTime: null,
          updateTime: db.serverDate()
        }
      })
      return common.ok({ id })
    }

    if (action === 'delete') {
      const id = String(event.id || '').trim()
      if (!id) return common.fail('缺少反馈 id', 400)
      const found = await db.collection('feedbacks').doc(id).get()
      const doc = found.data
      if (!doc || doc.openid !== user.openid) return common.fail('反馈不存在', 404)
      await db.collection('feedbacks').doc(id).remove()
      return common.ok(true)
    }

    return common.fail(`未知操作: ${action}`, 400)
  } catch (error) {
    return common.mapError(error)
  }
}
