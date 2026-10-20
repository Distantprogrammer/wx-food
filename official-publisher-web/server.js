require('dotenv').config()
const path = require('node:path')
const express = require('express')
const { openDatabase } = require('./src/db')
const { createPublisher } = require('./src/publisher')
const { createAuth } = require('./src/auth')
const { beijingNow } = require('./src/time')
const wechat = require('./src/wechat')
const { TEMPLATES } = require('./src/templates')

function createApp({ db, publisher, auth }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, 'views'))
  app.locals.statusLabel = (status) => ({ preparing: '准备中', draft: '已存草稿',
    submitting: '提交中，需核对', publishing: '发表处理中', published: '已发表',
    needs_review: '需人工核对' })[status] || status || '未知'
  app.locals.templateName = (id) => TEMPLATES.find((item) => item.id === id)?.name || '家常经典'
  app.use(express.urlencoded({ extended: false, limit: '400kb' }))
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'same-origin')
    next()
  })
  app.use('/assets', express.static(path.join(__dirname, 'public'), { index: false }))

  const failures = new Map()
  app.get('/login', (req, res) => {
    if (auth.session(req)) return res.redirect('/')
    res.render('login', { error: String(req.query.error || '') })
  })
  app.post('/login', (req, res) => {
    const key = req.ip || 'local'
    const entry = failures.get(key) || { count: 0, until: 0 }
    if (entry.until > Date.now()) return res.status(429).render('login', { error: '尝试次数过多，请 15 分钟后再试' })
    if (!auth.validPassword(req.body.password)) {
      entry.count += 1
      if (entry.count >= 5) { entry.count = 0; entry.until = Date.now() + 15 * 60 * 1000 }
      failures.set(key, entry)
      return res.status(401).render('login', { error: '密码不正确' })
    }
    failures.delete(key)
    res.setHeader('Set-Cookie', auth.issueCookie(req.secure))
    res.redirect('/')
  })

  app.use((req, res, next) => {
    const session = auth.session(req)
    if (!session) return res.redirect('/login')
    req.sessionData = session
    res.locals.csrf = auth.csrf(session)
    res.locals.clock = beijingNow()
    res.locals.configured = wechat.configured()
    res.locals.notice = String(req.query.notice || '')
    res.locals.error = String(req.query.error || '')
    if (req.method === 'POST' && !auth.validCsrf(session, req.body?._csrf)) {
      return res.status(403).render('error', { title: '请求已过期', message: '请刷新页面后重试。' })
    }
    next()
  })

  function action(handler, fallback = '/') {
    return async (req, res) => {
      const fallbackUrl = typeof fallback === 'function' ? fallback(req) : fallback
      try {
        const target = await handler(req)
        res.redirect(typeof target === 'string' ? target : fallbackUrl)
      } catch (error) {
        res.redirect(`${fallbackUrl}${fallbackUrl.includes('?') ? '&' : '?'}error=${encodeURIComponent(error.message || '操作失败')}`)
      }
    }
  }

  app.get('/', (req, res) => {
    const clock = beijingNow()
    const settings = db.settings()
    const next = publisher.selectedToday(clock.date)
    res.render('dashboard', {
      settings, templates: publisher.templates, next, recent: db.recentRecords(10),
      recipes: publisher.allRecipes().map(({ recipeId, title }) => ({ recipeId, title })),
      todayRecords: db.recordsByDate(clock.date), timerToday: db.timerRecord(clock.date),
      total: publisher.allRecipes().length, used: db.usedIds().size,
      publishedCount: db.publishedIds().size, publishedIds: db.publishedIds(),
      overrideActive: Boolean(next && settings.override_date === clock.date &&
        Number(settings.override_recipe_id) === next.recipeId)
    })
  })
  app.get('/recipes/:id', (req, res) => {
    try { res.render('preview', publisher.preview(req.params.id, req.query.template)) }
    catch (error) { res.status(404).render('error', { title: '找不到菜品', message: error.message }) }
  })
  app.get('/covers/:id', (req, res) => {
    try { res.sendFile(publisher.preview(req.params.id).cover.path) }
    catch (_) { res.status(404).end() }
  })
  app.get('/history', (req, res) => {
    const validStatuses = new Set(['preparing', 'draft', 'submitting', 'publishing', 'published', 'needs_review'])
    const status = validStatuses.has(req.query.status) ? req.query.status : ''
    const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1))
    const limit = 20
    res.render('history', { rows: db.history(status, limit, (page - 1) * limit),
      total: db.historyCount(status), status, page, limit, publishedIds: db.publishedIds() })
  })
  app.post('/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'publisher_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    res.redirect('/login')
  })
  app.post('/settings', action((req) => {
    publisher.saveSettings(req.body.enabled === 'on', req.body.publishHour, req.body.templateId)
    return '/?notice=' + encodeURIComponent('自动发表设置已保存')
  }))
  app.post('/today', action((req) => {
    const recipe = publisher.setToday(req.body.recipeId)
    return '/?notice=' + encodeURIComponent(`今天已指定 #${recipe.recipeId} ${recipe.title}`)
  }))
  function articleOverride(req) {
    const title = String(req.body.articleTitle || '').trim()
    const digest = String(req.body.articleDigest || '').trim()
    const content = String(req.body.articleContent || '').trim()
    if (!title && !digest && !content) return null
    return { title, digest, content }
  }

  app.get('/drafts/:id/update', (req, res) => {
    const record = db.byId(req.params.id)
    if (!record) return res.status(404).render('error', { title: '找不到草稿', message: '请从菜品预览页重新进入。' })
    res.redirect(`/recipes/${record.recipe_id}?template=${encodeURIComponent(record.template_id || '')}&notice=` +
      encodeURIComponent('请在预览页编辑文章后，点击「更新这篇草稿」'))
  })
  app.post('/drafts/:id/update', action(async (req) => {
    const record = await publisher.updateDraft(req.params.id, req.body.templateId, articleOverride(req))
    return `/recipes/${record.recipe_id}?template=${encodeURIComponent(record.template_id)}&notice=` +
      encodeURIComponent('公众号草稿已按当前预览更新')
  }, (req) => {
    const record = db.byId(req.params.id)
    return record
      ? `/recipes/${record.recipe_id}?template=${encodeURIComponent(req.body.templateId || record.template_id || '')}`
      : '/history'
  }))
  app.post('/drafts/:id/delete', action(async (req) => {
    const record = await publisher.deleteDraft(req.params.id)
    const back = req.body.back === 'recipe' ? `/recipes/${record.recipe_id}` : '/history'
    return `${back}?notice=` + encodeURIComponent('草稿已从公众号和本地记录中删除')
  }, (req) => req.body.back === 'recipe' && req.body.recipeId ? `/recipes/${req.body.recipeId}` : '/history'))
  app.post('/draft/:id', action(async (req) => {
    await publisher.createDraft(req.params.id, 'admin', req.body.templateId, articleOverride(req))
    return `/recipes/${req.params.id}?notice=` + encodeURIComponent('文章已进入公众号草稿箱')
  }, (req) => `/recipes/${req.params.id}?template=${encodeURIComponent(req.body.templateId || '')}`))
  app.post('/publish/:id', action(async (req) => {
    await publisher.publish(req.params.id, 'admin', { republish: req.body.republish === '1',
      templateId: req.body.templateId, article: articleOverride(req) })
    return `/recipes/${req.params.id}?template=${encodeURIComponent(req.body.templateId || '')}&notice=` +
      encodeURIComponent('已提交发表，请稍后查询结果')
  }, (req) => `/recipes/${req.params.id}?template=${encodeURIComponent(req.body.templateId || '')}`))
  app.post('/refresh/:id', action(async (req) => {
    await publisher.refresh(req.params.id)
    return '/history?notice=' + encodeURIComponent('状态已更新')
  }, '/history'))
  app.post('/release/:id', action((req) => {
    publisher.release(req.params.id)
    return '/history?notice=' + encodeURIComponent('失败记录已解除占用')
  }, '/history'))

  app.use((req, res) => res.status(404).render('error', { title: '页面不存在', message: '请从首页重新进入。' }))
  return app
}

function start() {
  const auth = createAuth(process.env.ADMIN_PASSWORD, process.env.SESSION_SECRET)
  const db = openDatabase()
  const publisher = createPublisher(db)
  const app = createApp({ db, publisher, auth })
  const port = Number(process.env.PORT || 3210)
  const host = process.env.HOST || '127.0.0.1'
  const server = app.listen(port, host, () => {
    console.log(`公众号发文管理页：http://${host}:${port}`)
    console.log(`菜品 ${publisher.allRecipes().length} 道；自动发表默认关闭，按北京时间执行。`)
    publisher.tick()
  })
  const timer = setInterval(() => publisher.tick(), 60 * 1000)
  timer.unref()
  function stop() { clearInterval(timer); server.close(() => { db.close(); process.exit(0) }) }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  return server
}

if (require.main === module) start()
module.exports = { createApp, start }
