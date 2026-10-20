const fs = require('node:fs')
const path = require('node:path')
const { buildArticle } = require('./article')
const { TEMPLATES, getTemplate } = require('./templates')
const { allRecipes, getRecipe, nextRecipe } = require('./recipes')
const { beijingNow } = require('./time')
const wechat = require('./wechat')

function createPublisher(db, options = {}) {
  const imageDir = options.imageDir || process.env.COVER_IMAGE_DIR || path.resolve(__dirname, '../../images')
  const publicDir = path.resolve(__dirname, '../public')
  let tickRunning = false

  function coverFile(recipe) {
    const filename = path.basename(String(recipe.coverImage || ''))
    const candidate = path.join(imageDir, filename)
    if (filename && /\.(jpe?g|png)$/i.test(filename) && fs.existsSync(candidate) &&
      fs.statSync(candidate).size <= 2 * 1024 * 1024) {
      return { path: candidate, filename, fallback: false }
    }
    return { path: path.join(publicDir, 'default-cover.png'), filename: 'today-food-cover.png', fallback: true }
  }

  function requireRecipe(recipeId) {
    const recipe = getRecipe(recipeId)
    if (!recipe) throw new Error(`找不到可发布的菜品 ID ${recipeId}`)
    return recipe
  }

  function next() { return nextRecipe(db.usedIds()) }

  function selectedToday(date = beijingNow().date) {
    const settings = db.settings()
    if (settings.override_date === date && settings.override_recipe_id) {
      const recipe = getRecipe(settings.override_recipe_id)
      if (recipe && !db.usedIds().has(recipe.recipeId)) return recipe
    }
    return next()
  }

  function setToday(recipeId) {
    const recipe = requireRecipe(recipeId)
    const today = beijingNow().date
    if (db.timerRecord(today)) throw new Error('今天的自动发表已经开始，不能再改选菜品')
    if (db.usedIds().has(recipe.recipeId)) {
      throw new Error('这道菜已有文章记录，自动任务不会重发。请打开这道菜手动发表')
    }
    db.setToday(today, recipe.recipeId)
    return recipe
  }

  function saveSettings(enabled, publishHour, templateId) {
    const hour = Number(publishHour)
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('发表时间须为 0—23 点整')
    getTemplate(templateId)
    if (enabled && !wechat.configured()) throw new Error('请先在 .env 中配置公众号 AppID 和 AppSecret')
    return db.updateSettings({ enabled, publishHour: hour, templateId })
  }

  function applyOverride(generated, override, qrUrl) {
    const title = String(override?.title || generated.title).trim()
    const digest = String(override?.digest || generated.digest).trim()
    let content = String(override?.content || '').trim() || generated.content
    if (!title) throw new Error('文章标题不能为空')
    if ([...title].length > 64) throw new Error('文章标题不能超过 64 个字')
    if ([...digest].length > 120) throw new Error('文章摘要不能超过 120 个字')
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
      .trim()
    if (!content) throw new Error('文章内容不能为空')
    if ([...content].length > 20000) throw new Error('文章内容不能超过 20000 个字')
    const wechatContent = content.replaceAll('/assets/qr.jpg', qrUrl)
    return {
      title, digest,
      content: wechatContent,
      previewContent: wechatContent.replaceAll(qrUrl, '/assets/qr.jpg')
    }
  }

  async function composeArticle(recipe, templateId, override) {
    const selectedTemplate = getTemplate(templateId)
    const cover = coverFile(recipe)
    const uploadedCover = await wechat.uploadCover(fs.readFileSync(cover.path), cover.filename)
    if (!uploadedCover.media_id) throw new Error('微信未返回封面素材 ID')
    const qrFile = path.join(publicDir, 'qr.jpg')
    const uploadedQr = await wechat.uploadInlineImage(fs.readFileSync(qrFile), 'mini-program-qr.jpg')
    if (!uploadedQr.url) throw new Error('微信未返回小程序码图片地址')
    const generated = buildArticle(recipe, uploadedQr.url, selectedTemplate.id)
    const article = applyOverride(generated, override, uploadedQr.url)
    return {
      templateId: selectedTemplate.id,
      preview: { title: article.title, digest: article.digest, content: article.previewContent },
      article: {
        title: article.title, author: '今天做什么菜', digest: article.digest,
        content: article.content, thumb_media_id: uploadedCover.media_id,
        show_cover_pic: 1, need_open_comment: 0, only_fans_can_comment: 0
      }
    }
  }

  async function buildDraft(recipe, templateId, override) {
    const composed = await composeArticle(recipe, templateId, override)
    const draft = await wechat.addDraft(composed.article)
    if (!draft.media_id) throw new Error('微信未返回草稿 ID')
    return { mediaId: draft.media_id, composed }
  }

  async function createDraft(recipeId, source = 'admin', templateId, override) {
    if (!wechat.configured()) throw new Error('公众号凭据尚未配置')
    const recipe = requireRecipe(recipeId)
    const selectedTemplate = getTemplate(templateId || db.settings().template_id)
    const date = beijingNow().date
    const latest = db.byRecipe(recipe.recipeId)
    if (source === 'admin') {
      // 已有草稿时不另建一篇。要换模板或重写内容，走 updateDraft。
      if (latest?.status === 'draft' && latest.draft_media_id) {
        if (override) return updateDraft(latest.id, selectedTemplate.id, override)
        return latest
      }
      if (latest && ['preparing', 'submitting', 'publishing'].includes(latest.status)) {
        throw new Error('这道菜有一篇文章正在处理，请先到发表记录核对')
      }
      if (latest?.status === 'needs_review') {
        throw new Error(`ID ${recipe.recipeId} 有一条待核对记录，请先处理后再发表`)
      }
    } else {
      const scheduled = db.timerRecord(date)
      if (scheduled) {
        if (scheduled.recipe_id === recipe.recipeId && scheduled.status === 'draft' && scheduled.draft_media_id) return scheduled
        throw new Error('今天的自动发表已有记录')
      }
      if (latest) throw new Error(`ID ${recipe.recipeId} 已有文章记录，自动任务不会重发`)
    }
    const reserved = db.reserve(recipe, date, source, selectedTemplate.id)
    try {
      const built = await buildDraft(recipe, selectedTemplate.id, override)
      db.transition(reserved.id, 'preparing', 'draft', { draft_media_id: built.mediaId, last_error: null })
      db.saveArticle(reserved.id, { templateId: built.composed.templateId, ...built.composed.preview })
      return db.byId(reserved.id)
    } catch (error) {
      db.transition(reserved.id, 'preparing', 'needs_review', {
        last_error: String(error.message || error).slice(0, 300)
      })
      throw error
    }
  }

  async function publish(recipeId, source = 'admin', options = {}) {
    // 手动发表可以重发已发表菜品，也可以一天发多篇；自动任务仍然每天一篇且不重发。
    if (source === 'admin' && db.hasPublished(recipeId) && !options.republish) {
      throw new Error('这道菜已经发表过，请确认后再手动发表')
    }
    const record = await createDraft(recipeId, source, options.templateId, options.article)
    if (!db.transition(record.id, 'draft', 'submitting', { last_error: null })) {
      throw new Error('这篇草稿正在发表，请刷新记录')
    }
    try {
      const response = await wechat.submit(record.draft_media_id)
      if (!response.publish_id) throw new Error('微信未返回发表任务 ID')
      db.transition(record.id, 'submitting', 'publishing', { publish_id: String(response.publish_id) })
      return db.byId(record.id)
    } catch (error) {
      if (error.wechatCode === 48001) {
        error.message = '这个公众号没有发布接口权限，草稿仍留在草稿箱。发布接口只开放给已认证的公众号和服务号，可到公众平台后台手动发表这篇草稿。'
      }
      // 微信明确拒绝时可重试；网络超时则保留这条记录，避免同一篇被重复提交。
      db.transition(record.id, 'submitting', error.wechatCode ? 'draft' : 'needs_review', {
        last_error: String(error.message || error).slice(0, 300)
      })
      throw error
    }
  }

  async function refresh(publicationId) {
    const record = db.byId(publicationId)
    if (!record) throw new Error('没有这条发表记录')
    if (record.status === 'published' || !record.publish_id) return record
    const result = await wechat.getPublish(record.publish_id)
    const status = Number(result.publish_status)
    const extra = { last_status_check_at: new Date().toISOString() }
    if (status === 0) {
      extra.article_url = result.article_detail?.item?.[0]?.article_url || ''
      extra.published_at = new Date().toISOString()
      extra.last_error = null
      db.transition(record.id, record.status, 'published', extra)
    } else if (status === 1) {
      db.transition(record.id, record.status, 'publishing', extra)
    } else {
      extra.last_error = `微信发表状态 ${status}，请到公众号后台核对`
      db.transition(record.id, record.status, 'needs_review', extra)
    }
    return db.byId(record.id)
  }

  async function tick() {
    if (tickRunning) return
    tickRunning = true
    try {
      const clock = beijingNow()
      for (const record of db.allRecords().filter((item) => item.status === 'publishing').slice(0, 5)) {
        const last = Date.parse(record.last_status_check_at || 0)
        if (!Number.isFinite(last) || Date.now() - last >= 5 * 60 * 1000) {
          try { await refresh(record.id) } catch (error) { console.error('查询发表状态失败：', error.message) }
        }
      }
      const settings = db.settings()
      if (!settings.enabled || clock.hour < settings.publish_hour || !wechat.configured()) return
      const record = db.timerRecord(clock.date)
      if (record) {
        if (record.status === 'draft' && !record.last_error) await publish(record.recipe_id, 'timer')
        return
      }
      const recipe = selectedToday(clock.date)
      if (recipe) await publish(recipe.recipeId, 'timer')
    } catch (error) {
      console.error('定时发表失败：', error.message)
    } finally { tickRunning = false }
  }

  async function updateDraft(publicationId, templateId, override) {
    if (!wechat.configured()) throw new Error('公众号凭据尚未配置')
    const record = db.byId(publicationId)
    if (!record || record.status !== 'draft' || !record.draft_media_id || record.publish_id) {
      throw new Error('只有已存入公众号、尚未发表的草稿可以更改')
    }
    const recipe = requireRecipe(record.recipe_id)
    const composed = await composeArticle(recipe, templateId || record.template_id, override)
    await wechat.updateDraft(record.draft_media_id, composed.article)
    if (!db.saveArticle(record.id, { templateId: composed.templateId, ...composed.preview })) {
      throw new Error('草稿状态已变化，请刷新后再试')
    }
    return db.byId(record.id)
  }

  async function deleteDraft(publicationId) {
    const record = db.byId(publicationId)
    if (!record) throw new Error('没有这条草稿')
    if (record.status !== 'draft' || record.publish_id) throw new Error('只有尚未发表的草稿可以删除')
    if (record.draft_media_id) {
      if (!wechat.configured()) throw new Error('请先配置公众号凭据，才能删除微信里的草稿')
      try {
        await wechat.deleteDraft(record.draft_media_id)
      } catch (error) {
        if (error.wechatCode !== 40007) throw error
      }
    }
    if (!db.removeDraft(record.id)) throw new Error('草稿状态已变化，请刷新后再试')
    return record
  }

  function preview(recipeId, templateId) {
    const recipe = requireRecipe(recipeId)
    const today = beijingNow().date
    const record = db.byRecipe(recipe.recipeId)
    const selectedTemplate = getTemplate(templateId || record?.template_id || db.settings().template_id)
    const generated = buildArticle(recipe, '/assets/qr.jpg', selectedTemplate.id)
    const sameTemplate = !templateId || templateId === record?.template_id
    const article = record?.article_content && sameTemplate
      ? { ...generated, title: record.article_title || generated.title, digest: record.article_digest || generated.digest, content: record.article_content }
      : generated
    return {
      recipe, article, cover: coverFile(recipe),
      templates: TEMPLATES, selectedTemplate,
      record, publishedBefore: db.hasPublished(recipe.recipeId),
      todayOthers: db.recordsByDate(today).filter((item) => item.recipe_id !== recipe.recipeId).length
    }
  }

  function release(publicationId) {
    if (!db.release(publicationId)) throw new Error('这条记录可能已经提交微信，请先在公众号后台核对')
  }

  return { allRecipes, templates: TEMPLATES, next, selectedToday, setToday, saveSettings, createDraft, updateDraft,
    deleteDraft, publish, refresh, tick, preview, release, coverFile }
}

module.exports = { createPublisher }
