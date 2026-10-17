export function auditTone(status) {
  if (status === 'approved' || status === 'ok') return 'ok'
  if (status === 'rejected' || status === 'no') return 'no'
  return 'wait'
}

export function auditLabel(status) {
  if (status === 'approved') return '已通过'
  if (status === 'rejected') return '已驳回'
  return '待审核'
}

export function formatShortTime(value) {
  if (!value) return ''
  const date = new Date(typeof value === 'object' && value.$date ? Number(value.$date) : value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const FOOD_TONES = [
  { test: /汤/, icon: '🍲', tint: '#FFE3CF' },
  { test: /鸡|鸭|肉|牛|羊|猪/, icon: '🍖', tint: '#FFE9CC' },
  { test: /素|瓜|菜|菇/, icon: '🥬', tint: '#E3F2D6' },
  { test: /饭|面|饼|粥|主食/, icon: '🍚', tint: '#FFF0D1' },
  { test: /甜|糕/, icon: '🍰', tint: '#FDECEC' }
]

export function foodMark(categoryName) {
  const name = String(categoryName || '')
  const found = FOOD_TONES.find((item) => item.test.test(name))
  return found || { icon: '🍳', tint: '#FFF3D6' }
}

export function filterContent(raw) {
  return String(raw || '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/<script/gi, '')
    .trim()
}
