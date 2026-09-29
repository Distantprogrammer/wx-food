/**
 * 菜谱章节 HTML ↔ 结构化块
 * 支持：p / h3 / ul / ol（及粘贴时的常见变体）
 */

function uid() {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 去掉标签，保留可见文本 */
export function stripTags(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\s+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function parseListItems(inner) {
  const items = []
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let m
  while ((m = re.exec(inner))) {
    items.push(stripTags(m[1]))
  }
  if (!items.length) {
    const plain = stripTags(inner)
    if (plain) items.push(plain)
  }
  return items
}

/**
 * @returns {{ id: string, type: 'p'|'h3'|'ul'|'ol', text?: string, items?: string[] }[]}
 */
export function parseHtmlToBlocks(html) {
  const raw = String(html || '').trim()
  if (!raw) return []

  const blocks = []
  const re = /<(p|h[1-6]|ul|ol|pre)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi
  let last = 0
  let m
  while ((m = re.exec(raw))) {
    const gap = raw.slice(last, m.index).trim()
    if (gap) {
      const text = stripTags(gap)
      if (text) blocks.push(createBlock('p', { text }))
    }
    const tag = m[1].toLowerCase()
    const inner = m[3] || ''
    if (tag === 'ul' || tag === 'ol') {
      blocks.push(createBlock(tag, { items: parseListItems(inner) }))
    } else if (tag.startsWith('h')) {
      blocks.push(createBlock('h3', { text: stripTags(inner) }))
    } else if (tag === 'pre') {
      blocks.push(createBlock('p', { text: stripTags(inner) }))
    } else {
      // 保留空 <p></p>，与 blocksToHtml 往返一致
      blocks.push(createBlock('p', { text: stripTags(inner) }))
    }
    last = m.index + m[0].length
  }
  const tail = raw.slice(last).trim()
  if (tail) {
    const text = stripTags(tail)
    if (text) blocks.push(createBlock('p', { text }))
  }

  // 纯文本 / 无法识别时整段当段落
  if (!blocks.length) {
    const text = stripTags(raw)
    if (text) blocks.push(createBlock('p', { text }))
  }
  return blocks
}

export function createBlock(type = 'p', extra = {}) {
  if (type === 'ul' || type === 'ol') {
    return {
      id: uid(),
      type,
      items: Array.isArray(extra.items) && extra.items.length ? extra.items.slice() : ['']
    }
  }
  return {
    id: uid(),
    type: type === 'h3' ? 'h3' : 'p',
    text: extra.text != null ? String(extra.text) : ''
  }
}

export function blocksToHtml(blocks) {
  const list = Array.isArray(blocks) ? blocks : []
  return list
    .map((b) => {
      if (!b) return ''
      if (b.type === 'ul' || b.type === 'ol') {
        // 保留空列表结构，避免「添加后删不掉 / 一保存就消失」
        const rawItems = Array.isArray(b.items) && b.items.length ? b.items : ['']
        const lis = rawItems.map((t) => `<li>${escapeHtml(String(t || '').trim())}</li>`).join('\n')
        return `<${b.type}>\n${lis}\n</${b.type}>`
      }
      const text = String(b.text || '')
      const trimmed = text.trim()
      if (b.type === 'h3') return `<h3>${escapeHtml(trimmed)}</h3>`
      // 空段落也要落盘，否则新增空块无法参与 HTML 往返，删除会被 watch 还原
      if (!trimmed) return '<p></p>'
      const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
      if (lines.length <= 1) return `<p>${escapeHtml(trimmed)}</p>`
      return lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n')
    })
    .filter(Boolean)
    .join('\n')
}

/** 粘贴 HTML：解析后追加或替换 */
export function mergePastHtml(existingBlocks, pastedHtml, { replace = false } = {}) {
  const incoming = parseHtmlToBlocks(pastedHtml)
  if (replace) return incoming
  const base = Array.isArray(existingBlocks) ? existingBlocks.slice() : []
  // 去掉末尾空段落再拼接
  while (base.length && isEmptyBlock(base[base.length - 1])) base.pop()
  return base.concat(incoming)
}

export function isEmptyBlock(b) {
  if (!b) return true
  if (b.type === 'ul' || b.type === 'ol') {
    return !(b.items || []).some((t) => String(t || '').trim())
  }
  return !String(b.text || '').trim()
}
