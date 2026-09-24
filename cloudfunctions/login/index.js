const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    if (event.action === 'profile') {
      const user = await common.requireUser(db, openid)
      return common.ok(user)
    }

    const user = await common.getCurrentUser(db, openid)
    return common.ok(user)
  } catch (error) {
    return common.mapError(error)
  }
}
