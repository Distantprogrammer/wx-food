const TEMPLATES = Object.freeze([
  { id: 'classic', name: '家常经典', description: '暖橙色标题、清晰食材与步骤，沿用当前样式。' },
  { id: 'fresh', name: '清新手账', description: '浅绿色卡片与逐步操作，适合清爽家常菜。' },
  { id: 'quick', name: '一页速做', description: '把食材和做法直接排在前面，方便边看边做。' },
  { id: 'editorial', name: '暖心食记', description: '突出菜品介绍和阅读节奏，适合图文分享。' }
])

function getTemplate(id) {
  const template = TEMPLATES.find((item) => item.id === id)
  if (!template) throw new Error('请选择有效的文章模板')
  return template
}

function renderTemplate(id, data) {
  getTemplate(id)
  const e = data.escapeHtml
  const title = e(data.title)
  const category = e(data.category)
  const summary = data.summary ? e(data.summary) : ''
  const calories = data.calories ? ` · 约 ${e(data.calories)} kcal` : ''
  const meta = `难度 ${e(data.difficulty)}${calories}`
  const qr = data.qrUrl
    ? `<p style="margin:14px 0 4px;text-align:center;"><img src="${e(data.qrUrl)}" alt="今天做什么菜小程序码" style="width:180px;height:180px;" /></p><p style="margin:0;text-align:center;color:#777;font-size:13px;">长按识别小程序码</p>`
    : ''
  const noAmounts = data.missingAmounts
    ? '<p style="margin:4px 0 12px;color:#888;font-size:13px;">原始菜谱未提供具体用量，请按人数调整。</p>' : ''

  if (id === 'fresh') {
    const ingredientRows = data.ingredients.map((item) => `<p style="margin:0;padding:9px 12px;border-bottom:1px solid #e4eee5;color:#2f4d3b;">· ${e(item)}</p>`).join('')
    const stepRows = data.steps.map((item, index) => `<section style="margin:0 0 12px;padding:12px 14px;background:#f4f8f2;border-radius:8px;"><p style="margin:0 0 4px;color:#3e7952;font-size:13px;font-weight:bold;">STEP ${String(index + 1).padStart(2, '0')}</p><p style="margin:0;">${e(item)}</p></section>`).join('')
    const tips = data.tips.length ? `<h2 style="margin:26px 0 9px;color:#376445;font-size:18px;">做菜小贴士</h2><ul style="margin:0;padding-left:20px;">${data.tips.map((item) => `<li style="margin-bottom:7px;">${e(item)}</li>`).join('')}</ul>` : ''
    return `<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#314337;font-size:16px;line-height:1.85;">
      <p style="margin:0 0 16px;color:#5f8b68;font-size:13px;letter-spacing:2px;text-align:center;">今天做什么菜 · 每日食谱</p>
      <h1 style="margin:0 0 8px;color:#244a34;font-size:26px;line-height:1.4;text-align:center;">${title}</h1>
      <p style="margin:0 0 22px;color:#778b7b;font-size:13px;text-align:center;">${category} · ${meta}</p>
      ${summary ? `<p style="margin:0 0 22px;padding:15px 17px;background:#f3f8f3;border-left:3px solid #8fb89a;">${summary}</p>` : ''}
      <h2 style="margin:26px 0 10px;color:#376445;font-size:19px;">今天要准备</h2>${noAmounts}
      <section style="margin:0 0 22px;border:1px solid #e4eee5;border-radius:8px;">${ingredientRows}</section>
      <h2 style="margin:26px 0 12px;color:#376445;font-size:19px;">一步一步做</h2>${stepRows}${tips}
      <section style="margin:30px 0 0;padding:18px 14px;background:#edf5ed;border-radius:10px;text-align:center;"><p style="margin:0;color:#305840;font-size:17px;font-weight:bold;">明天吃什么？打开小程序抽一道</p><p style="margin:6px 0 0;color:#66796a;font-size:14px;">微信搜索「今天做什么菜」</p>${qr}</section>
    </section>`
  }

  if (id === 'quick') {
    const ingredients = data.ingredients.map((item) => `<li style="margin:0 0 5px;">${e(item)}</li>`).join('')
    const steps = data.steps.map((item, index) => `<p style="margin:0 0 13px;"><strong style="color:#1d5140;">${index + 1}.</strong> ${e(item)}</p>`).join('')
    const tips = data.tips.length ? `<p style="margin:18px 0 5px;font-weight:bold;">补充提醒</p><p style="margin:0;color:#5c655f;font-size:14px;">${data.tips.map(e).join('；')}</p>` : ''
    return `<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#252c27;font-size:16px;line-height:1.8;">
      <p style="margin:0 0 8px;color:#1d7353;font-size:13px;font-weight:bold;">今日速做 · ${category}</p>
      <h1 style="margin:0 0 8px;font-size:27px;line-height:1.35;">${title}</h1>
      <p style="margin:0 0 14px;padding-bottom:14px;border-bottom:2px solid #243b2c;color:#647168;font-size:14px;">${meta}</p>
      ${summary ? `<p style="margin:0 0 18px;">${summary}</p>` : ''}
      <h2 style="margin:18px 0 7px;font-size:19px;">01 / 食材</h2>${noAmounts}<ul style="margin:0 0 18px;padding-left:22px;">${ingredients}</ul>
      <h2 style="margin:18px 0 10px;padding-top:15px;border-top:1px solid #d9e2d9;font-size:19px;">02 / 做法</h2>${steps}${tips}
      <section style="margin:28px 0 0;padding-top:16px;border-top:2px solid #243b2c;text-align:center;"><p style="margin:0;font-weight:bold;">收藏更多家常菜</p><p style="margin:4px 0;color:#6c756d;font-size:14px;">微信小程序「今天做什么菜」</p>${qr}</section>
    </section>`
  }

  if (id === 'editorial') {
    const ingredients = data.ingredients.map((item) => `<li style="margin:0 0 8px;">${e(item)}</li>`).join('')
    const steps = data.steps.map((item, index) => `<section style="margin:0 0 15px;padding-left:14px;border-left:3px solid #e4aa79;"><p style="margin:0;color:#b46c3b;font-size:13px;font-weight:bold;">第 ${index + 1} 步</p><p style="margin:3px 0 0;">${e(item)}</p></section>`).join('')
    const tips = data.tips.length ? `<section style="margin:24px 0;padding:15px 17px;background:#fff5e9;"><p style="margin:0 0 6px;color:#9e6336;font-weight:bold;">厨房备忘</p><ul style="margin:0;padding-left:20px;">${data.tips.map((item) => `<li style="margin:0 0 6px;">${e(item)}</li>`).join('')}</ul></section>` : ''
    return `<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#3d342e;font-size:16px;line-height:1.9;">
      <p style="margin:0 0 8px;color:#be7947;font-size:13px;letter-spacing:2px;">一日一菜 · 今天做什么菜</p>
      <h1 style="margin:0 0 8px;color:#3b2e26;font-size:27px;line-height:1.4;">${title}</h1>
      <p style="margin:0 0 22px;color:#967f6d;font-size:14px;">${category}　/　${meta}</p>
      <section style="margin:0 0 25px;padding:18px 18px 16px;background:#fff6eb;border-top:3px solid #d8935d;"><p style="margin:0;color:#684d3a;font-size:17px;">${summary || `今天这道${title}，跟着食材和步骤一起做。`}</p></section>
      <h2 style="margin:24px 0 10px;color:#8f5831;font-size:20px;">先把食材备好</h2>${noAmounts}<ul style="margin:0 0 25px;padding-left:21px;">${ingredients}</ul>
      <h2 style="margin:24px 0 14px;color:#8f5831;font-size:20px;">再慢慢做起来</h2>${steps}${tips}
      <section style="margin:30px 0 0;padding:18px;background:#f8eee2;text-align:center;"><p style="margin:0;color:#76482c;font-size:18px;font-weight:bold;">下一顿，交给小程序来选</p><p style="margin:5px 0 0;color:#826d5e;font-size:14px;">微信搜索「今天做什么菜」</p>${qr}</section>
      <p style="margin:18px 0 0;color:#a38e7d;font-size:13px;text-align:center;">好好吃饭，明天见。</p>
    </section>`
  }

  throw new Error('请选择有效的文章模板')
}

module.exports = { TEMPLATES, getTemplate, renderTemplate }
