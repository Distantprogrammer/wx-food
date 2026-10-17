/** 把 markdown / 已有 HTML 正文扫成同一套节点，供 article-renderer 分发。 */

function decodeEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function parseInlines(text) {
  const source = decodeEntities(text)
  const nodes = []
  const re = /(`[^`\n]+`|==[^=\n]+==|\*\*[^*\n]+\*\*)/g
  let last = 0
  let match = re.exec(source)
  while (match) {
    if (match.index > last) nodes.push({ type: 'text', text: source.slice(last, match.index) })
    const token = match[0]
    if (token.startsWith('`')) nodes.push({ type: 'ic', text: token.slice(1, -1) })
    else if (token.startsWith('==')) nodes.push({ type: 'mark', text: token.slice(2, -2) })
    else nodes.push({ type: 'strong', text: token.slice(2, -2) })
    last = match.index + token.length
    match = re.exec(source)
  }
  if (last < source.length) nodes.push({ type: 'text', text: source.slice(last) })
  return nodes.filter((node) => node.text)
}

function inlineFromHtml(html) {
  const withBreaks = String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
  return parseInlines(withBreaks.replace(/\n+/g, ' ').trim())
}

function plainText(html) {
  return inlineFromHtml(html).map((node) => node.text).join('')
}

function looksLikeHtml(source) {
  return /<\s*(h1|h2|h3|p|ul|ol|table|blockquote|pre|div)\b/i.test(source)
}

function isFormulaLine(line) {
  const text = String(line || '').trim()
  if (!text || text.length > 48) return false
  if (/^[#>\-*+]|\|/.test(text)) return false
  if (/[。！？；，]/.test(text)) return false
  if (/[\u4e00-\u9fff]/.test(text)) return false
  return /[=≤≥]/.test(text)
}

function parseCalloutBody(lines) {
  const paragraphs = []
  let buffer = []
  const flush = () => {
    const text = buffer.join(' ').trim()
    if (text) paragraphs.push(parseInlines(text))
    buffer = []
  }
  lines.forEach((line) => {
    if (!line.trim()) flush()
    else buffer.push(line.trim())
  })
  flush()
  return paragraphs
}

function parseFaq(lines) {
  const items = []
  let current = null
  lines.forEach((line) => {
    const text = line.trim()
    const question = text.match(/^Q\s*[:：]\s*(.*)$/i)
    const answer = text.match(/^A\s*[:：]\s*(.*)$/i)
    if (question) {
      current = { q: question[1], a: '' }
      items.push(current)
      return
    }
    if (answer && current) {
      current.a = answer[1]
      return
    }
    if (current && text) current.a = current.a ? `${current.a}${text}` : text
  })
  return items.filter((item) => item.q)
}

function parseMarkdown(source) {
  const lines = String(source || '').replace(/\r\n/g, '\n').split('\n')
  const nodes = []
  let h2Count = 0
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()
    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const info = trimmed.slice(3).trim()
      const parts = info.split(/\s+/)
      const lang = parts[0] || 'text'
      const filename = parts.slice(1).join(' ') || (lang ? `${lang}` : 'code')
      const body = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        body.push(lines[index])
        index += 1
      }
      index += 1
      nodes.push({ type: 'code', lang, filename, text: body.join('\n') })
      continue
    }

    if (trimmed.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const splitRow = (raw) => raw.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
      const headers = splitRow(trimmed)
      index += 2
      const rows = []
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(splitRow(lines[index]))
        index += 1
      }
      nodes.push({ type: 'table', headers, rows })
      continue
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (image) {
      nodes.push({ type: 'figure', alt: image[1], src: image[2] })
      index += 1
      continue
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const text = heading[2].trim()
      if (level === 2) {
        h2Count += 1
        nodes.push({
          type: 'h2',
          id: `h2-${h2Count}`,
          no: String(h2Count).padStart(2, '0'),
          text,
          inlines: parseInlines(text)
        })
      } else if (level >= 3) {
        nodes.push({ type: 'h3', text, inlines: parseInlines(text) })
      }
      index += 1
      continue
    }

    if (trimmed.startsWith('>')) {
      const quote = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      const marker = quote[0].match(/^\[!(INFO|WARN|SUCCESS|NOTE|FAQ)\]\s*(.*)$/i)
      if (marker && marker[1].toUpperCase() === 'FAQ') {
        nodes.push({ type: 'qa', items: parseFaq(quote.slice(1)), open: {} })
        continue
      }
      const kindMap = { INFO: 'info', WARN: 'warn', SUCCESS: 'success', NOTE: 'note' }
      const kind = marker ? kindMap[marker[1].toUpperCase()] : 'note'
      const bodyLines = marker ? quote.slice(1) : quote
      if (marker && marker[2]) bodyLines.unshift(marker[2])
      nodes.push({ type: 'callout', kind, paragraphs: parseCalloutBody(bodyLines) })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(parseInlines(lines[index].trim().replace(/^\d+\.\s+/, '')))
        index += 1
      }
      nodes.push({ type: 'steps', items })
      continue
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items = []
      const texts = []
      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        const text = lines[index].trim().replace(/^[-*+]\s+/, '')
        texts.push(text)
        items.push(parseInlines(text))
        index += 1
      }
      if (texts.length && texts.every(isFormulaLine)) nodes.push({ type: 'formula', tag: '公式', lines: texts })
      else nodes.push({ type: 'ul', items })
      continue
    }

    if (isFormulaLine(trimmed)) {
      const formulaLines = []
      while (index < lines.length && isFormulaLine(lines[index].trim())) {
        formulaLines.push(lines[index].trim())
        index += 1
      }
      nodes.push({ type: 'formula', tag: '公式', lines: formulaLines })
      continue
    }

    const paragraph = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !lines[index].trim().startsWith('>') &&
      !lines[index].trim().startsWith('#') &&
      !/^[-*+]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !/^!\[/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    const text = paragraph.join(' ')
    if (paragraph.length === 1 && isFormulaLine(text)) nodes.push({ type: 'formula', tag: '公式', lines: [text] })
    else if (text) nodes.push({ type: 'p', inlines: parseInlines(text) })
  }

  return nodes
}

function parseHtml(source) {
  const html = String(source || '')
  const nodes = []
  let h2Count = 0
  const re = /<(h1|h2|h3|h4|p|ul|ol|pre|blockquote|table)\b[^>]*>([\s\S]*?)<\/\1>|<img\b([^>]*?)\/?>/gi
  let match = re.exec(html)
  while (match) {
    const tag = (match[1] || 'img').toLowerCase()
    const inner = match[2] || ''
    if (tag === 'h1') {
      match = re.exec(html)
      continue
    }
    if (tag === 'h2') {
      h2Count += 1
      const text = plainText(inner)
      nodes.push({
        type: 'h2',
        id: `h2-${h2Count}`,
        no: String(h2Count).padStart(2, '0'),
        text,
        inlines: parseInlines(text)
      })
    } else if (tag === 'h3' || tag === 'h4') {
      const text = plainText(inner)
      nodes.push({ type: 'h3', text, inlines: parseInlines(text) })
    } else if (tag === 'p') {
      const text = plainText(inner)
      if (isFormulaLine(text)) nodes.push({ type: 'formula', tag: '公式', lines: [text] })
      else if (text.startsWith('由此') && text.length < 80) {
        nodes.push({ type: 'callout', kind: 'info', paragraphs: [inlineFromHtml(inner)] })
      } else if (text) nodes.push({ type: 'p', inlines: inlineFromHtml(inner) })
    } else if (tag === 'ul') {
      const items = []
      const texts = []
      const itemRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
      let item = itemRe.exec(inner)
      while (item) {
        const text = plainText(item[1])
        texts.push(text)
        items.push(inlineFromHtml(item[1]))
        item = itemRe.exec(inner)
      }
      if (texts.length && texts.every(isFormulaLine)) nodes.push({ type: 'formula', tag: '不等式组', lines: texts })
      else if (items.length) nodes.push({ type: 'ul', items })
    } else if (tag === 'ol') {
      const items = []
      const itemRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
      let item = itemRe.exec(inner)
      while (item) {
        items.push(inlineFromHtml(item[1]))
        item = itemRe.exec(inner)
      }
      if (items.length) nodes.push({ type: 'steps', items })
    } else if (tag === 'pre') {
      const langMatch = inner.match(/class=["'][^"']*language-([\w-]+)/i)
      const code = decodeEntities(inner.replace(/<[^>]+>/g, '')).replace(/^\n/, '').replace(/\n$/, '')
      const lang = langMatch ? langMatch[1] : 'text'
      nodes.push({ type: 'code', lang, filename: lang, text: code })
    } else if (tag === 'blockquote') {
      const text = plainText(inner)
      nodes.push({ type: 'callout', kind: 'note', paragraphs: text ? [parseInlines(text)] : [] })
    } else if (tag === 'table') {
      const rows = []
      const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      let row = rowRe.exec(inner)
      while (row) {
        const cells = []
        const cellRe = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi
        let cell = cellRe.exec(row[1])
        while (cell) {
          cells.push(plainText(cell[1]))
          cell = cellRe.exec(row[1])
        }
        if (cells.length) rows.push(cells)
        row = rowRe.exec(inner)
      }
      if (rows.length) nodes.push({ type: 'table', headers: rows[0], rows: rows.slice(1) })
    } else if (tag === 'img') {
      const attrs = match[3] || ''
      const src = (attrs.match(/\ssrc=["']([^"']+)["']/i) || [])[1] || ''
      const alt = (attrs.match(/\salt=["']([^"']*)["']/i) || [])[1] || ''
      if (src) nodes.push({ type: 'figure', src, alt })
    }
    match = re.exec(html)
  }
  return nodes
}

export function parseArticle(source) {
  const raw = String(source || '')
  if (!raw.trim()) return []
  if (looksLikeHtml(raw)) return parseHtml(raw)
  return parseMarkdown(raw)
}

export function readingMinutes(source) {
  const count = String(source || '').replace(/\s/g, '').length
  return Math.max(1, Math.ceil(count / 400))
}
