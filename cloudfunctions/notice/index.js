const cloud = require('wx-server-sdk')
const common = require('./common')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const NOTICE_KEY = 'announcement'

const DEFAULT_NOTICE = {
  title: '关于 · 今天做什么菜',
  contentHtml: '<p>今天做什么菜，帮你轻松决定下一餐。</p><p>欢迎提出建议与反馈，我们会持续改进。</p>'
}

async function getNoticeDoc() {
  const found = await db.collection('settings').where({ key: NOTICE_KEY }).limit(1).get()
  return found.data[0] || null
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    await common.requireUser(db, wxContext.OPENID)
    const action = event.action || 'get'

    if (action === 'get') {
      const doc = await getNoticeDoc()
      return common.ok({
        title: doc?.title || DEFAULT_NOTICE.title,
        contentHtml: doc?.contentHtml || DEFAULT_NOTICE.contentHtml,
        updateTime: doc?.updateTime || null
      })
    }

    return common.fail(`未知操作: ${action}`, 400)
  } catch (error) {
    return common.mapError(error)
  }
}
