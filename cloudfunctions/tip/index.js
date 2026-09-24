const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const action = event.action || 'list'

    if (action === 'detail') {
      const tipId = Number(event.tipId || event.id)
      if (!tipId) return common.fail('缺少 tipId', 400)
      const res = await db.collection('tips').where({ tipId }).limit(1).get()
      const doc = res.data[0]
      if (!doc) return common.fail('技巧不存在', 404)
      return common.ok({
        id: doc.tipId,
        _id: doc._id,
        title: doc.title,
        summary: doc.summary || '',
        markdownHtml: doc.markdownHtml || '',
        images: doc.images || []
      })
    }

    const page = Math.max(Number(event.page) || 1, 1)
    const limit = Math.min(Number(event.limit) || 50, 100)
    const skip = (page - 1) * limit
    const countRes = await db.collection('tips').count()
    const listRes = await db.collection('tips').orderBy('tipId', 'asc').skip(skip).limit(limit).get()

    return common.ok({
      list: (listRes.data || []).map((doc) => ({
        id: doc.tipId,
        _id: doc._id,
        title: doc.title,
        summary: doc.summary || '点击查看详情'
      })),
      total: countRes.total || 0
    })
  } catch (error) {
    return common.mapError(error)
  }
}
