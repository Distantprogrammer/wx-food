/** 菜谱详情：食材换算、步骤高亮、从已有 HTML 里抽出同一套结构。 */

const UNIT_SRC = 'kg|g|ml|mL|ML|L|克|千克|毫升|升|斤|个|只|根|片|勺|茶匙|汤匙|瓣|把|颗|条|块|滴|棵|叶|罐|杯|碗|枚|粒|朵|头|株'
const UNIT_RE = `(?:${UNIT_SRC})`
const QTY_RE = new RegExp(`^(.+?)\\s+(\\d+(?:\\.\\d+)?)(?:\\s*[-~～]\\s*(\\d+(?:\\.\\d+)?))?\\s*(${UNIT_RE})(?=\\s|$|[（(])\\s*(.*)$`, 'i')
const QTY_LEAD_RE = new RegExp(`^(\\d+(?:\\.\\d+)?)(?:\\s*[-~～]\\s*(\\d+(?:\\.\\d+)?))?\\s*(${UNIT_RE})(?=\\s|$|的)\\s*(?:的\\s*)?(.*)$`, 'i')
const CN_QTY_RE = /^([一二两三四五六七八九十]+)\s*(个|只|根|棵|片|瓣|把|颗|条|块|叶|罐|杯|碗|枚|粒|朵|头|株)\s*(.+)$/
const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
const HL_RE = /\u0000([\s\S]*?)\u0001|<hl>([\s\S]*?)<\/hl>|(\d+(?:\.\d+)?\s*(?:分钟|秒钟|秒|小时|°C|℃|度|倍))/gi
const ISSUE_RE = /issue|pull\s*request|\bPR\b|拉取请求/i

export const STEP_ACTIONS = [
  { key: 'wash', actionTitle: '掰散清洗', icon: '🌿', color: '#E9F7EC', colorDeep: '#2D8A4E', test: /洗|掰|泡|冲|沥/ },
  { key: 'cut', actionTitle: '切段', icon: '🔪', color: '#E8F0FF', colorDeep: '#4A7BD0', test: /切|剁|片|丝|丁|块|段/ },
  { key: 'cook', actionTitle: '煮制', icon: '🍲', color: '#FFF3E0', colorDeep: '#E8975C', test: /煮|炒|煎|炸|炖|焖|烤|蒸|烧|焯|滑/ },
  { key: 'season', actionTitle: '调味', icon: '🧂', color: '#F3E8FF', colorDeep: '#8B5CF6', test: /调味|盐|生抽|老抽|糖|醋|料酒|撒|腌|拌/ },
  { key: 'plate', actionTitle: '装盘', icon: '🍽️', color: '#FDECEC', colorDeep: '#E05C5C', test: /装盘|出锅|盛|摆盘|淋/ }
]

function inferAction(text) {
  const source = String(text || '')
  let best = null
  let bestAt = Infinity
  STEP_ACTIONS.forEach((action) => {
    const match = source.match(action.test)
    if (match && match.index < bestAt) {
      best = action
      bestAt = match.index
    }
  })
  return best || STEP_ACTIONS[2]
}

export function stepForEditor(item) {
  const source = typeof item === 'string' ? { text: item } : (item || {})
  const text = source.text || source.content || source.desc || source.step || ''
  const preset = STEP_ACTIONS.find((action) => action.key === source.actionKey) || inferAction(`${source.actionTitle || ''} ${text}`)
  return {
    actionKey: source.actionKey || preset.key,
    actionTitle: source.actionTitle || preset.actionTitle,
    icon: source.icon || preset.icon,
    color: source.color || preset.color,
    colorDeep: source.colorDeep || preset.colorDeep,
    text,
    tip: source.tip || source.note || ''
  }
}

function decorateStep(item, text, tip) {
  const preset = (item && STEP_ACTIONS.find((action) => action.key === item.actionKey)) || inferAction(`${item?.actionTitle || ''} ${text}`)
  const actionTitle = (item && item.actionTitle) || preset.actionTitle
  let desc = (item && (item.desc || item.description)) || text
  if (actionTitle && desc.startsWith(actionTitle)) {
    desc = desc.slice(actionTitle.length).replace(/^[：:，,。\s]+/, '')
  }
  if (!desc) desc = text
  return {
    text,
    tip: tip || '',
    actionKey: (item && item.actionKey) || preset.key,
    actionTitle,
    icon: (item && item.icon) || preset.icon,
    color: (item && item.color) || preset.color,
    colorDeep: (item && item.colorDeep) || preset.colorDeep,
    parts: highlightParts(desc)
  }
}

function decode(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function strip(html) {
  return decode(String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hl>/gi, '\u0000')
    .replace(/<\/hl>/gi, '\u0001')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function listItems(html) {
  const items = []
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
  let match = re.exec(html)
  while (match) {
    items.push(match[1])
    match = re.exec(html)
  }
  return items
}

function normalizeUnit(unit) {
  const text = String(unit || '').trim()
  if (text === '克') return 'g'
  if (text === '千克') return 'kg'
  if (text === '毫升' || /^ml$/i.test(text)) return 'ml'
  if (text === '升' || /^l$/i.test(text)) return 'L'
  return text
}

function isGram(unit) {
  return /^(g|克)$/i.test(String(unit || '').trim())
}

export function formatQty(qty, unit, servings) {
  const scale = Math.min(6, Math.max(1, Number(servings) || 1))
  if (qty == null || qty === '') return ''
  const list = (Array.isArray(qty) ? qty : [qty]).map(Number).filter((n) => Number.isFinite(n))
  if (!list.length) return ''
  const shown = list.map((n) => formatOne(n * scale, unit))
  if (shown.length < 2 || shown[0] === shown[1]) return shown[0]
  const suffix = shown[0].replace(/^[\d.]+/, '')
  const suffix2 = shown[1].replace(/^[\d.]+/, '')
  if (suffix && suffix === suffix2) {
    return `${shown[0].slice(0, -suffix.length)}-${shown[1].slice(0, -suffix2.length)}${suffix}`
  }
  return `${shown[0]}-${shown[1]}`
}

function formatOne(value, unit) {
  const rawUnit = normalizeUnit(unit)
  const num = Number(value)
  if (isGram(rawUnit) && num >= 50) {
    const grams = Math.round(num / 50) * 50
    if (grams >= 1000) {
      const kg = grams / 1000
      const text = Number.isInteger(kg) ? String(kg) : String(Math.round(kg * 10) / 10)
      return `${text}kg`
    }
    return `${grams}g`
  }
  const text = Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10)
  return `${text}${rawUnit}`
}

const PORTION_TOKEN_RE = new RegExp(
  `(\\d+(?:\\.\\d+)?)(?:\\s*(${UNIT_RE}))?\\s*[-~～]\\s*(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})|(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})`,
  'gi'
)

export function scalePortionText(text, servings) {
  const scale = Math.min(6, Math.max(1, Number(servings) || 1))
  const source = String(text || '')
  if (!source || scale === 1) return source
  if (/[=*×/]|时间|体积|容量/.test(source)) return source
  PORTION_TOKEN_RE.lastIndex = 0
  return source.replace(PORTION_TOKEN_RE, (all, a, unitA, b, unitB, single, singleUnit, offset) => {
    if (single != null) {
      const after = source.slice(offset + all.length, offset + all.length + 1)
      if (singleUnit === '个' && after === '人') return all
      return formatQty(Number(single), singleUnit, scale)
    }
    return formatQty([Number(a), Number(b)], unitB || unitA, scale)
  })
}

function splitNote(name) {
  const match = String(name || '').match(/^(.*?)[（(]([^）)]+)[）)]\s*$/)
  if (!match) return { name: String(name || '').trim(), note: '' }
  return { name: match[1].trim(), note: match[2].trim() }
}

function qtyPair(low, high) {
  return high ? [Number(low), Number(high)] : Number(low)
}

function withNote(name, extra) {
  const named = splitNote(name)
  const tail = String(extra || '').trim()
  const tailNote = tail.replace(/^[（(]/, '').replace(/[）)]$/, '').trim()
  return {
    name: named.name,
    note: named.note || tailNote,
    unitReady: true
  }
}

function canonName(name) {
  const text = String(name || '').replace(/[\s，,、]/g, '')
  if (text === '食盐' || text === '细盐' || text === '粗盐' || text === '精盐') return '盐'
  return text
}

function parseLine(line) {
  const text = String(line || '').replace(/[，,、]\s*(?=\d)/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return null
  const lead = text.match(QTY_LEAD_RE)
  if (lead && lead[4] && lead[4].trim()) {
    const named = withNote(lead[4].trim(), '')
    return { name: named.name, note: named.note, qty: qtyPair(lead[1], lead[2]), unit: normalizeUnit(lead[3] || '') }
  }
  const match = text.match(QTY_RE)
  if (match && match[1].trim() && match[2]) {
    const named = withNote(match[1].trim(), match[5])
    return { name: named.name, note: named.note, qty: qtyPair(match[2], match[3]), unit: normalizeUnit(match[4] || '') }
  }
  const cn = text.match(CN_QTY_RE)
  if (cn && cn[3].trim() && cn[3].trim().length <= 12 && !/[是=：:]|\d/.test(cn[3])) {
    const named = splitNote(cn[3].trim())
    return { name: named.name, note: named.note, qty: CN_NUM[cn[1]] || 1, unit: normalizeUnit(cn[2]) }
  }
  const named = splitNote(text)
  return { name: named.name, note: named.note, qty: null, unit: '' }
}

function sameFood(a, b) {
  const left = canonName(a?.name)
  const right = canonName(b?.name)
  if (!left || !right) return false
  if (left === right) return true
  const short = left.length <= right.length ? left : right
  const long = left.length <= right.length ? right : left
  return short.length >= 2 && (long.startsWith(short) || long.includes(short))
}

function isFormulaLine(line) {
  return /[=*×/]|时间|体积|容量/.test(line)
}

function isSentenceLine(line) {
  const plain = String(line || '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[，,、]\s*(?=\d)/g, ' ')
  return /[。；;，,]|可以|使用|计算|如果|不要|建议/.test(plain)
}

function splitCalculation(html) {
  const source = String(html || '')
  const intro = []
  const paraRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi
  let para = paraRe.exec(source)
  while (para) {
    const text = strip(para[1])
    if (text && !/^(每份|一份)[:：]?$/.test(text)) intro.push(text)
    para = paraRe.exec(source)
  }
  const rows = []
  const notes = []
  listItems(source).map(strip).filter(Boolean).forEach((line) => {
    if (isFormulaLine(line) || isSentenceLine(line)) {
      notes.push(line)
      return
    }
    const row = parseLine(line)
    if (row && row.qty != null) rows.push(row)
    else notes.push(line)
  })
  return { intro, rows, notes }
}

function mergeFoods(foods, calcRows) {
  if (!calcRows.length) return foods
  const used = new Set()
  const merged = foods.map((food) => {
    const index = calcRows.findIndex((row, rowIndex) => !used.has(rowIndex) && row.qty != null && sameFood(food, row))
    if (index < 0) return food
    used.add(index)
    const found = calcRows[index]
    return {
      ...food,
      qty: found.qty,
      unit: found.unit || food.unit,
      note: food.note || found.note
    }
  })
  calcRows.forEach((row, index) => {
    if (used.has(index)) return
    if (merged.some((food) => sameFood(food, row))) return
    merged.push(row)
  })
  return merged
}

function fromObject(item) {
  if (!item || typeof item !== 'object') return null
  if (item.kind === 'tool' || item.type === 'tool') return null
  const name = item.name || item.title || ''
  if (!name) return null
  let qty = item.qty
  if (qty == null && item.amount != null) qty = item.amount
  if (qty == null && item.min != null) qty = item.max != null ? [item.min, item.max] : item.min
  return {
    name: String(name).trim(),
    note: item.note || item.remark || '',
    qty: qty == null || qty === '' ? null : qty,
    unit: normalizeUnit(item.unit || '')
  }
}

function sectionLists(html) {
  const source = String(html || '')
  const parts = source.split(/<h[1-6]\b[^>]*>/i).slice(1)
  const headings = source.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi) || []
  if (!headings.length) return [{ title: '', items: listItems(source).map(strip).filter(Boolean) }]
  return headings.map((heading, index) => ({
    title: strip(heading),
    items: listItems(parts[index] || '').map(strip).filter(Boolean)
  }))
}

function ingredientsFromHtml(html) {
  const foods = []
  const tools = []
  sectionLists(html).forEach((section) => {
    const isTool = /工具/.test(section.title) && !/原料/.test(section.title)
    section.items.forEach((line) => {
      if (isTool) tools.push(line)
      else foods.push(parseLine(line))
    })
  })
  return { foods: foods.filter(Boolean), tools }
}

function mergeQty(foods, html) {
  const extras = []
  sectionLists(html).forEach((section) => {
    if (/工具/.test(section.title) && !/原料/.test(section.title)) return
    section.items.forEach((line) => {
      const row = parseLine(line)
      if (row && row.qty != null) extras.push(row)
    })
  })
  return foods.map((food) => {
    if (food.qty != null) return food
    const found = extras.find((row) => row.name === food.name)
    return found ? { ...food, qty: found.qty, unit: found.unit || food.unit, note: food.note || found.note } : food
  })
}

function stepsFromHtml(html) {
  return listItems(html).map((inner) => {
    let tip = ''
    let body = inner
    const tipTag = inner.match(/<(?:blockquote|p)\b[^>]*>([\s\S]*?)<\/(?:blockquote|p)>/i)
    if (tipTag && /提示|注意|小贴士|贴士/.test(strip(tipTag[1]))) {
      tip = strip(tipTag[1]).replace(/^(?:提示|小贴士|注意)[:：]?/, '').trim()
      body = inner.replace(tipTag[0], '')
    }
    let text = strip(body)
    const tipLine = text.match(/(?:^|\n)\s*(?:提示|小贴士)[:：]\s*(.+)$/)
    if (tipLine) {
      tip = tip || tipLine[1].trim()
      text = text.replace(tipLine[0], '').trim()
    }
    return decorateStep(null, text, tip)
  }).filter((step) => step.text || step.actionTitle)
}

function stepsFromList(list) {
  return list.map((item) => {
    if (typeof item === 'string') return decorateStep(null, strip(item), '')
    const text = strip(item.text || item.content || item.desc || item.step || item.html || '')
    return decorateStep(item, text, item.tip || item.note || '')
  }).filter((step) => step.text || step.actionTitle)
}

export function highlightParts(raw) {
  const text = String(raw || '')
  const parts = []
  HL_RE.lastIndex = 0
  let last = 0
  let match = HL_RE.exec(text)
  while (match) {
    if (match.index > last) parts.push({ hl: false, text: text.slice(last, match.index) })
    parts.push({ hl: true, text: (match[1] || match[2] || match[3] || '').trim() })
    last = match.index + match[0].length
    match = HL_RE.exec(text)
  }
  if (last < text.length) parts.push({ hl: false, text: text.slice(last) })
  return parts.filter((part) => part.text)
}

export function estimateMinutes(recipe, steps) {
  const direct = recipe?.duration || recipe?.cookTime || recipe?.time || recipe?.minutes
  if (direct) {
    const text = String(direct)
    if (/分钟|小时/.test(text)) return text
    const num = Number(direct)
    if (Number.isFinite(num) && num > 0) return `约 ${num} 分钟`
  }
  let total = 0
  ;(steps || []).forEach((step) => {
    const re = /(\d+(?:\.\d+)?)\s*分钟/g
    let match = re.exec(step.text || '')
    while (match) {
      total += Number(match[1])
      match = re.exec(step.text || '')
    }
  })
  return total ? `约 ${Math.round(total)} 分钟` : '时长灵活'
}

export function normalizeCook(recipe) {
  const doc = recipe || {}
  let foods = []
  let tools = []

  if (Array.isArray(doc.tools)) {
    tools = doc.tools.map((item) => (typeof item === 'string' ? item : item.name || '')).filter(Boolean)
  }
  if (Array.isArray(doc.ingredients) && doc.ingredients.length) {
    doc.ingredients.forEach((item) => {
      if (typeof item === 'string') {
        const row = parseLine(item)
        if (row) foods.push(row)
        return
      }
      if (item && (item.kind === 'tool' || item.type === 'tool')) {
        if (item.name) tools.push(item.name)
        return
      }
      const row = fromObject(item)
      if (row) foods.push(row)
    })
  }
  if (!foods.length && doc.ingredientsHtml) {
    const parsed = ingredientsFromHtml(doc.ingredientsHtml)
    foods = parsed.foods
    tools = tools.concat(parsed.tools)
  } else if (doc.ingredientsHtml) {
    const parsed = ingredientsFromHtml(doc.ingredientsHtml)
    tools = tools.concat(parsed.tools)
  }
  const calc = splitCalculation(doc.calculationHtml)
  if (calc.rows.length) foods = mergeFoods(foods, calc.rows)
  if (!foods.some((item) => item.qty != null) && Array.isArray(doc.calculationItems)) {
    const itemRows = doc.calculationItems.map((item) => (typeof item === 'string' ? parseLine(item) : fromObject(item))).filter((item) => item && item.qty != null)
    if (itemRows.length) foods = mergeFoods(foods, itemRows)
  }

  const toolSet = new Set()
  tools = tools.filter((name) => {
    const key = String(name).trim()
    if (!key || toolSet.has(key)) return false
    toolSet.add(key)
    return true
  })

  let steps = []
  if (Array.isArray(doc.steps) && doc.steps.length) steps = stepsFromList(doc.steps)
  if (!steps.length && doc.stepsHtml) steps = stepsFromHtml(doc.stepsHtml)

  const notes = []
  String(doc.notesHtml || '')
    .split(/<\/p>|<br\s*\/?>|<\/li>/i)
    .map(strip)
    .filter(Boolean)
    .forEach((line) => {
      if (!ISSUE_RE.test(line)) notes.push(line)
    })

  const calcNotes = calc.notes.filter((line) => {
    const row = parseLine(line)
    if (row && foods.some((food) => sameFood(food, row))) return false
    return true
  })

  return {
    ingredients: foods,
    tools,
    steps,
    notes,
    calcIntro: calc.intro,
    calcNotes
  }
}
