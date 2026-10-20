const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { DatabaseSync } = require('node:sqlite')

process.env.RECIPE_FILE = path.join(__dirname, 'recipes.fixture.json')
const wechat = require('../src/wechat')
wechat.configured = () => true
wechat.uploadCover = async () => ({ media_id: 'cover' })
wechat.uploadInlineImage = async () => ({ url: 'https://example.test/qr.jpg' })
wechat.addDraft = async () => ({ media_id: 'draft-1' })
wechat.submit = async () => ({ publish_id: 'publish-1' })
wechat.getPublish = async () => ({ publish_status: 0,
  article_detail: { item: [{ article_url: 'https://mp.weixin.qq.com/s/test' }] } })

const { openDatabase } = require('../src/db')
const { createPublisher } = require('../src/publisher')
const { beijingNow } = require('../src/time')

test('manual publications may repeat a recipe and a date', () => {
  const db = openDatabase(':memory:')
  try {
    const today = beijingNow().date
    db.reserve({ recipeId: 1, title: '黄瓜皮蛋汤' }, today, 'admin')
    db.reserve({ recipeId: 1, title: '黄瓜皮蛋汤' }, today, 'admin')
    db.reserve({ recipeId: 2, title: '米粥' }, today, 'admin')
    assert.equal(db.usedIds().size, 2)
    assert.equal(db.recordsByDate(today).length, 3)
    assert.equal(db.byRecipe(1).recipe_id, 1)
  } finally { db.close() }
})

test('saved drafts can switch preview, then be updated or deleted', async () => {
  const db = openDatabase(':memory:')
  const publisher = createPublisher(db)
  const originalAddDraft = wechat.addDraft
  const originalUpdateDraft = wechat.updateDraft
  const originalDeleteDraft = wechat.deleteDraft
  let submittedContent = ''
  let updated = null
  let deletedMediaId = ''
  wechat.addDraft = async (article) => {
    submittedContent = article.content
    return { media_id: 'draft-template' }
  }
  wechat.updateDraft = async (mediaId, article) => {
    updated = { mediaId, content: article.content, article }
    return {}
  }
  wechat.deleteDraft = async (mediaId) => {
    deletedMediaId = mediaId
    return {}
  }
  try {
    assert.equal(db.settings().template_id, 'classic')
    publisher.saveSettings(false, 18, 'quick')
    assert.equal(publisher.preview(1).selectedTemplate.id, 'quick')
    const draft = await publisher.createDraft(1, 'admin', 'fresh')
    assert.equal(draft.template_id, 'fresh')
    assert.match(submittedContent, /STEP 01/)
    const switched = publisher.preview(1, 'editorial')
    assert.equal(switched.selectedTemplate.id, 'editorial')
    assert.equal(switched.record.template_id, 'fresh')
    const changed = await publisher.updateDraft(draft.id, 'editorial')
    assert.equal(changed.template_id, 'editorial')
    assert.equal(updated.mediaId, 'draft-template')
    assert.match(updated.content, /一日一菜/)
    const custom = await publisher.updateDraft(draft.id, 'editorial', {
      title: '今天吃什么｜改过的标题',
      digest: '新的摘要',
      content: '<p>改过的正文</p><img src="/assets/qr.jpg">'
    })
    assert.equal(custom.article_title, '今天吃什么｜改过的标题')
    assert.equal(publisher.preview(1).article.title, '今天吃什么｜改过的标题')
    assert.match(publisher.preview(1).article.content, /改过的正文/)
    assert.match(publisher.preview(1).article.content, /\/assets\/qr\.jpg/)
    assert.equal(updated.article.title, '今天吃什么｜改过的标题')
    assert.match(updated.article.content, /https:\/\/example\.test\/qr\.jpg/)
    assert.doesNotMatch(updated.article.content, /\/assets\/qr\.jpg/)
    assert.equal((await publisher.publish(1, 'admin', { templateId: 'quick' })).template_id, 'editorial')
    await assert.rejects(() => publisher.deleteDraft(draft.id), /只有尚未发表/)
    const another = await publisher.createDraft(2, 'admin', 'classic')
    await publisher.deleteDraft(another.id)
    assert.equal(deletedMediaId, 'draft-template')
    assert.equal(db.byRecipe(2), undefined)
    assert.throws(() => publisher.saveSettings(false, 18, 'unknown'), /有效的文章模板/)
  } finally {
    wechat.addDraft = originalAddDraft
    wechat.updateDraft = originalUpdateDraft
    wechat.deleteDraft = originalDeleteDraft
    db.close()
  }
})

test('manual publish can repeat a published recipe without a daily cap', async () => {
  const db = openDatabase(':memory:')
  const publisher = createPublisher(db)
  try {
    assert.equal(publisher.allRecipes().length, 2)
    assert.equal(publisher.next().recipeId, 1)
    const draft = await publisher.createDraft(1)
    assert.equal(draft.status, 'draft')
    assert.equal((await publisher.createDraft(1)).id, draft.id)
    assert.equal(publisher.next().recipeId, 2)
    assert.equal((await publisher.publish(1)).status, 'publishing')
    const published = await publisher.refresh(draft.id)
    assert.equal(published.status, 'published')
    assert.equal(published.article_url, 'https://mp.weixin.qq.com/s/test')
    await assert.rejects(() => publisher.publish(1), /已经发表过/)
    const again = await publisher.publish(1, 'admin', { republish: true })
    assert.notEqual(again.id, draft.id)
    assert.equal(again.status, 'publishing')
    const second = await publisher.createDraft(2)
    assert.equal(second.recipe_id, 2)
    assert.equal(db.recordsByDate(beijingNow().date).length, 3)
  } finally { db.close() }
})

test('uncertain submission is locked against retry', async () => {
  const db = openDatabase(':memory:')
  const publisher = createPublisher(db)
  const originalSubmit = wechat.submit
  wechat.submit = async () => { throw new Error('模拟网络超时') }
  try {
    await assert.rejects(() => publisher.publish(1), /模拟网络超时/)
    assert.equal(db.byRecipe(1).status, 'needs_review')
    await assert.rejects(() => publisher.publish(1), /待核对/)
  } finally { wechat.submit = originalSubmit; db.close() }
})

test('timer does not retry an explicitly rejected draft every minute', async () => {
  const db = openDatabase(':memory:')
  const publisher = createPublisher(db)
  const originalSubmit = wechat.submit
  let attempts = 0
  wechat.submit = async () => {
    attempts += 1
    const error = new Error('微信明确拒绝')
    error.wechatCode = 48001
    throw error
  }
  try {
    db.updateSettings({ enabled: true, publishHour: 0, templateId: 'editorial' })
    await publisher.tick()
    await publisher.tick()
    assert.equal(attempts, 1)
    assert.equal(db.byRecipe(1).status, 'draft')
    assert.equal(db.byRecipe(1).template_id, 'editorial')
  } finally { wechat.submit = originalSubmit; db.close() }
})

test('timer skips manually published recipes and still posts once a day', async () => {
  const db = openDatabase(':memory:')
  const publisher = createPublisher(db)
  try {
    await publisher.publish(1)
    db.updateSettings({ enabled: true, publishHour: 0 })
    await publisher.tick()
    await publisher.tick()
    const today = beijingNow().date
    const rows = db.recordsByDate(today)
    const timerRows = rows.filter((row) => row.source === 'timer')
    assert.equal(timerRows.length, 1)
    assert.equal(timerRows[0].recipe_id, 2)
    assert.equal(rows.some((row) => row.recipe_id === 1 && row.source === 'admin'), true)
  } finally { db.close() }
})

test('legacy publication table keeps old rows and allows another post', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publisher-'))
  const filename = path.join(dir, 'publisher.sqlite')
  const legacy = new DatabaseSync(filename)
  legacy.exec(`
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 0,
      publish_hour INTEGER NOT NULL DEFAULT 18 CHECK (publish_hour BETWEEN 0 AND 23),
      override_date TEXT,
      override_recipe_id INTEGER
    );
    INSERT INTO settings (id) VALUES (1);
    CREATE TABLE publications (
      recipe_id INTEGER PRIMARY KEY,
      publish_date TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      draft_media_id TEXT,
      publish_id TEXT,
      article_url TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at TEXT,
      last_status_check_at TEXT
    );
    INSERT INTO publications (recipe_id, publish_date, title, status, source)
    VALUES (1, '2026-10-20', '黄瓜皮蛋汤', 'published', 'admin');
  `)
  legacy.close()
  const db = openDatabase(filename)
  try {
    const existing = db.byRecipe(1)
    assert.equal(existing.status, 'published')
    assert.equal(existing.template_id, 'classic')
    assert.equal(db.settings().template_id, 'classic')
    assert.equal(existing.id > 0, true)
    db.reserve({ recipeId: 1, title: '黄瓜皮蛋汤' }, '2026-10-20', 'admin')
    assert.equal(db.recordsByDate('2026-10-20').length, 2)
    assert.equal(db.publishedIds().has(1), true)
  } finally {
    db.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
