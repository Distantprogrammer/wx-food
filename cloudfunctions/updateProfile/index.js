const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const user = await common.requireUser(db, openid)

    const nickname = String(event.nickname || '').trim()
    const avatar = String(event.avatar || '').trim()
    const data = { updateTime: db.serverDate() }
    if (nickname) data.nickname = nickname.slice(0, 32)
    if (avatar) data.avatar = avatar

    await db.collection('users').doc(user._id).update({ data })
    const latest = await db.collection('users').doc(user._id).get()
    return common.ok(latest.data)
  } catch (error) {
    return common.mapError(error)
  }
}
