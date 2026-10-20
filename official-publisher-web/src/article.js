const DIFFICULTY = ['入门', '简单', '普通', '进阶', '挑战']
const { getTemplate, renderTemplate } = require('./templates')

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]))
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g, (entity) => ({
      '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"
    }[entity]))
}

function plainText(html) {
  return decodeEntities(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function getSummary(recipe) {
  const explicit = String(recipe.summary || '').trim()
  if (explicit) return explicit
  const firstParagraph = String(recipe.markdownHtml || '').match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  return firstParagraph ? plainText(firstParagraph[1]) : ''
}

function getTips(recipe) {
  const html = String(recipe.notesHtml || '')
  const matches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
  return matches.map((match) => plainText(match[1]))
    .filter((item) => item && !/参考资料|Issue|Pull request|贡献|原文链接/i.test(item))
    .slice(0, 4)
}

function buildArticle(recipe, qrUrl = '', templateId = 'classic') {
  const template = getTemplate(templateId)
  const title = String(recipe.title || '').trim()
  if (!title) throw new Error('菜谱缺少标题')
  const ingredients = Array.isArray(recipe.calculationItems) && recipe.calculationItems.length
    ? recipe.calculationItems
    : recipe.ingredients
  const steps = recipe.steps
  if (!Array.isArray(ingredients) || !ingredients.length || !Array.isArray(steps) || !steps.length) {
    throw new Error('菜谱需要有食材和步骤')
  }

  const summary = getSummary(recipe)
  const tips = getTips(recipe)
  const level = Math.min(5, Math.max(1, Number(recipe.difficulty) || 3))
  const calories = Number(recipe.calories)
  const list = (items) => items.map((item) => `<li style="margin:0 0 9px;">${escapeHtml(item)}</li>`).join('')
  const qr = qrUrl
    ? `<p style="margin:14px 0 0;text-align:center;"><img src="${escapeHtml(qrUrl)}" style="width:180px;height:180px;" /></p><p style="margin:5px 0 0;text-align:center;color:#666;font-size:13px;">长按识别小程序码</p>`
    : ''
  const classicContent = `
<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#333;line-height:1.85;font-size:16px;">
  <p style="margin:0 0 8px;color:#d56b32;font-size:13px;letter-spacing:2px;">今天吃什么 · 每天一道家常菜</p>
  <h1 style="margin:0 0 12px;color:#2e352d;font-size:25px;line-height:1.4;">${escapeHtml(title)}</h1>
  <p style="margin:0 0 18px;color:#777;font-size:14px;">${escapeHtml(recipe.categoryName || '家常菜')} · 今天就照着做</p>
  ${summary ? `<p style="margin:0 0 20px;">${escapeHtml(summary)}</p>` : ''}
  <p style="margin:0 0 24px;padding:10px 14px;background:#fff7ef;color:#8c542f;">难度：${DIFFICULTY[level - 1]}${Number.isFinite(calories) && calories > 0 ? `　热量估算：${calories} kcal` : ''}</p>
  <h2 style="margin:28px 0 12px;padding-left:10px;border-left:4px solid #e68a4a;font-size:20px;">准备食材</h2>
  ${ingredients === recipe.ingredients ? '<p style="color:#888;font-size:13px;">原始菜谱未提供具体用量</p>' : ''}
  <ul style="padding-left:22px;margin:0 0 22px;">${list(ingredients)}</ul>
  <h2 style="margin:28px 0 12px;padding-left:10px;border-left:4px solid #e68a4a;font-size:20px;">开始制作</h2>
  <ol style="padding-left:22px;margin:0 0 22px;">${list(steps)}</ol>
  ${tips.length ? `<h2 style="margin:28px 0 12px;padding-left:10px;border-left:4px solid #e68a4a;font-size:20px;">小贴士</h2><ul style="padding-left:22px;">${list(tips)}</ul>` : ''}
  <section style="margin:30px 0 18px;padding:18px 16px;background:#f6f8f2;text-align:center;">
    <p style="margin:0 0 8px;color:#42543a;font-size:18px;font-weight:bold;">今天吃什么，让骰子帮你决定</p>
    <p style="margin:0;color:#666;font-size:14px;">打开微信小程序「今天做什么菜」，再抽一道家常菜。</p>
    ${qr}
  </section>
  <p style="margin:22px 0 0;text-align:center;color:#999;font-size:13px;">每天一道菜，晚餐少纠结。明天见。</p>
</section>`.trim()

  const content = template.id === 'classic' ? classicContent : renderTemplate(template.id, {
    title, category: recipe.categoryName || '家常菜', summary,
    difficulty: DIFFICULTY[level - 1], calories: Number.isFinite(calories) && calories > 0 ? calories : null,
    ingredients, steps, tips, qrUrl, missingAmounts: ingredients === recipe.ingredients, escapeHtml
  })

  return {
    title: `今天吃什么｜${title}`,
    digest: (summary || `${title}，跟着菜谱准备食材和步骤。`).slice(0, 110),
    content,
    templateId: template.id,
    preview: {
      recipeId: Number(recipe.recipeId),
      title,
      categoryName: recipe.categoryName || '',
      summary,
      difficultyText: DIFFICULTY[level - 1],
      calories: Number.isFinite(calories) && calories > 0 ? calories : null,
      coverImage: recipe.coverImage || '',
      ingredients,
      steps,
      tips
    }
  }
}

module.exports = { buildArticle }
