const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

process.env.RECIPE_FILE = path.join(__dirname, 'recipes.fixture.json')
const { openDatabase } = require('../src/db')
const { createPublisher } = require('../src/publisher')
const { createAuth } = require('../src/auth')
const { createApp } = require('../server')

test('web pages require login, render previews, and reject missing CSRF', async () => {
  const db = openDatabase(':memory:')
  const app = createApp({ db, publisher: createPublisher(db),
    auth: createAuth('long-test-password', 'a-test-secret-that-is-at-least-thirty-two-characters') })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const unauth = await fetch(base, { redirect: 'manual' })
    assert.equal(unauth.status, 302)
    assert.equal(unauth.headers.get('location'), '/login')
    const login = await fetch(`${base}/login`, { method: 'POST', redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'long-test-password' }) })
    assert.equal(login.status, 302)
    const cookie = login.headers.get('set-cookie').split(';')[0]
    process.env.OFFICIAL_APP_ID = process.env.OFFICIAL_APP_ID || 'test-app'
    process.env.OFFICIAL_APP_SECRET = process.env.OFFICIAL_APP_SECRET || 'test-secret'
    const published = db.reserve({ recipeId: 1, title: '黄瓜皮蛋汤' }, '2020-01-01', 'admin')
    db.transition(published.id, 'preparing', 'published', {})
    const dashboard = await fetch(base, { headers: { Cookie: cookie } })
    assert.equal(dashboard.status, 200)
    const html = await dashboard.text()
    assert.match(html, /今天发哪道菜/)
    assert.match(html, /选择菜品/)
    assert.match(html, /自动发表模板/)
    assert.match(html, /name="templateId"/)
    assert.match(html, /输入 ID 或菜名筛选/)
    assert.doesNotMatch(html, /name="q"|type="number"|recipe-group/)
    assert.match(html, /recipe-option" href="\/recipes\/1"[\s\S]*?已发表/)
    const preview = await fetch(`${base}/recipes/1`, { headers: { Cookie: cookie } })
    assert.equal(preview.status, 200)
    const previewHtml = await preview.text()
    assert.match(previewHtml, /黄瓜皮蛋汤/)
    assert.match(previewHtml, /这道菜已经发表过，确定要再发一篇吗/)
    const quickPreview = await fetch(`${base}/recipes/1?template=quick`, { headers: { Cookie: cookie } })
    assert.equal(quickPreview.status, 200)
    const quickHtml = await quickPreview.text()
    assert.match(quickHtml, /今日速做/)
    assert.match(quickHtml, /name="templateId" value="quick"/)
    const csrf = html.match(/name="_csrf" value="([^"]+)"/)[1]
    const settingsResponse = await fetch(`${base}/settings`, { method: 'POST', redirect: 'manual', headers: {
      Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded'
    }, body: new URLSearchParams({ _csrf: csrf, publishHour: '18', templateId: 'fresh' }) })
    assert.equal(settingsResponse.status, 302)
    assert.equal(db.settings().template_id, 'fresh')
    const freshPreview = await fetch(`${base}/recipes/2`, { headers: { Cookie: cookie } })
    assert.match(await freshPreview.text(), /STEP 01/)
    const invalid = await fetch(`${base}/settings`, { method: 'POST', headers: {
      Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded'
    }, body: new URLSearchParams({ publishHour: '18' }) })
    assert.equal(invalid.status, 403)
  } finally {
    await new Promise((resolve) => server.close(resolve))
    db.close()
  }
})
