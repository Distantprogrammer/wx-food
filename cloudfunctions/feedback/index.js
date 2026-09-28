const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const user = await common.requireUser(db, wxContext.OPENID)
    const action = event.action || 'submit'

    if (action === 'submit') {
      const content = String(event.content || '').trim()
      const contact = String(event.contact || '').trim()
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
          createTime: db.serverDate()
        }
      })
      return common.ok({ id: addRes._id })
    }

    return common.fail(`未知操作: ${action}`, 400)
  } catch (error) {
    return common.mapError(error)
  }
}
