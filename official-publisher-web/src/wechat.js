const https = require('https')

let cachedToken = ''
let tokenExpiry = 0

function post(path, body, contentType = 'application/json') {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body || {}), 'utf8')
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: 'api.weixin.qq.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': contentType, 'Content-Length': buffer.length },
      timeout: 20000
    }, (response) => {
      const chunks = []
      let size = 0
      response.on('error', reject)
      response.on('data', (chunk) => {
        size += chunk.length
        if (size > 2 * 1024 * 1024) {
          response.destroy(new Error('微信接口响应过大'))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`微信接口 HTTP ${response.statusCode}`))
          return
        }
        let data
        try {
          data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch (_) {
          reject(new Error('微信接口返回了无法解析的数据'))
          return
        }
        if (data.errcode && data.errcode !== 0) {
          const error = new Error(`微信接口 ${data.errcode}: ${data.errmsg || '请求失败'}`)
          error.wechatCode = data.errcode
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
    request.on('timeout', () => request.destroy(new Error('微信接口请求超时')))
    request.on('error', reject)
    request.end(buffer)
  })
}

async function token() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const appid = String(process.env.OFFICIAL_APP_ID || '').trim()
  const secret = String(process.env.OFFICIAL_APP_SECRET || '').trim()
  if (!appid || !secret) throw new Error('请先在网页应用的 .env 中配置 OFFICIAL_APP_ID 和 OFFICIAL_APP_SECRET')
  const result = await post('/cgi-bin/stable_token', {
    grant_type: 'client_credential', appid, secret, force_refresh: false
  })
  if (!result.access_token) throw new Error('微信公众号未返回 access_token，请核对账号权限和 IP 白名单')
  cachedToken = result.access_token
  tokenExpiry = Date.now() + Math.max(60, Number(result.expires_in || 7200) - 300) * 1000
  return cachedToken
}

async function call(path, body) {
  const accessToken = await token()
  return post(`${path}?access_token=${encodeURIComponent(accessToken)}`, body)
}

async function uploadImage(buffer, filename, permanent = false) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('图片内容为空')
  if (buffer.length > 2 * 1024 * 1024) throw new Error('封面图片超过 2 MB，请先压缩')
  const boundary = `----food${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
  const safeName = String(filename || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_')
  const mime = /\.png$/i.test(safeName) ? 'image/png' : 'image/jpeg'
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${safeName}"\r\nContent-Type: ${mime}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ])
  const accessToken = await token()
  const path = permanent
    ? `/cgi-bin/material/add_material?access_token=${encodeURIComponent(accessToken)}&type=image`
    : `/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(accessToken)}`
  return post(path, payload, `multipart/form-data; boundary=${boundary}`)
}

module.exports = {
  configured: () => Boolean(process.env.OFFICIAL_APP_ID && process.env.OFFICIAL_APP_SECRET),
  uploadCover: async (buffer, filename) => uploadImage(buffer, filename, true),
  uploadInlineImage: async (buffer, filename) => uploadImage(buffer, filename, false),
  addDraft: (article) => call('/cgi-bin/draft/add', { articles: [article] }),
  updateDraft: (mediaId, article) => call('/cgi-bin/draft/update', { media_id: mediaId, index: 0, articles: article }),
  deleteDraft: (mediaId) => call('/cgi-bin/draft/delete', { media_id: mediaId }),
  submit: (mediaId) => call('/cgi-bin/freepublish/submit', { media_id: mediaId }),
  getPublish: (publishId) => call('/cgi-bin/freepublish/get', { publish_id: publishId })
}
