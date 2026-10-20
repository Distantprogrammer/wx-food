const crypto = require('node:crypto')

function createAuth(password, secret) {
  if (!password || password.length < 12) throw new Error('ADMIN_PASSWORD 至少需要 12 个字符')
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET 至少需要 32 个字符')
  const secretKey = Buffer.from(secret, 'utf8')
  const passwordHash = crypto.createHash('sha256').update(password).digest()

  function signature(payload) {
    return crypto.createHmac('sha256', secretKey).update(payload).digest('base64url')
  }
  function compare(a, b) {
    const x = Buffer.from(String(a || ''))
    const y = Buffer.from(String(b || ''))
    return x.length === y.length && crypto.timingSafeEqual(x, y)
  }
  function validPassword(value) {
    const hash = crypto.createHash('sha256').update(String(value || '')).digest()
    return crypto.timingSafeEqual(passwordHash, hash)
  }
  function issueCookie(secure = false) {
    const payload = Buffer.from(JSON.stringify({
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      nonce: crypto.randomBytes(16).toString('hex')
    })).toString('base64url')
    const value = `${payload}.${signature(payload)}`
    return `publisher_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure ? '; Secure' : ''}`
  }
  function session(req) {
    const cookie = String(req.headers.cookie || '').split(';').map((part) => part.trim())
      .find((part) => part.startsWith('publisher_session='))
    const value = cookie?.slice('publisher_session='.length) || ''
    const [payload, mac] = value.split('.')
    if (!payload || !mac || !compare(mac, signature(payload))) return null
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
      if (!Number.isFinite(data.exp) || data.exp <= Date.now() || !data.nonce) return null
      return { token: value, ...data }
    } catch (_) { return null }
  }
  function csrf(sessionData) {
    return signature(`csrf:${sessionData.token}`)
  }
  function validCsrf(sessionData, token) {
    return sessionData && compare(csrf(sessionData), token)
  }
  return { validPassword, issueCookie, session, csrf, validCsrf }
}

module.exports = { createAuth }
