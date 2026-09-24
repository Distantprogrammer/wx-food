const SENSITIVE_WORDS = [
  '赌博', '色情', '暴力', '毒品', '诈骗', '反动', '邪教',
  '枪支', '爆炸', '恐怖', '卖淫', '嫖娼', '裸聊'
]

export function filterSensitiveWords(text = '') {
  const value = String(text || '')
  const hits = []

  SENSITIVE_WORDS.forEach((word) => {
    if (value.includes(word)) {
      hits.push(word)
    }
  })

  return {
    passed: hits.length === 0,
    hits
  }
}

export function validateMessageContent(content = '') {
  const value = String(content || '').trim()
  if (!value) {
    return { valid: false, message: '请输入正文内容' }
  }
  if (value.length > 1000) {
    return { valid: false, message: '正文不能超过1000字' }
  }
  const sensitive = filterSensitiveWords(value)
  if (!sensitive.passed) {
    return { valid: false, message: `包含敏感词：${sensitive.hits.join('、')}` }
  }
  return { valid: true, message: 'ok' }
}

export function validateTargetName(name = '') {
  const value = String(name || '').trim()
  if (!value) {
    return { valid: false, message: '请输入对方称呼' }
  }
  if (value.length > 20) {
    return { valid: false, message: '称呼不能超过20字' }
  }
  const sensitive = filterSensitiveWords(value)
  if (!sensitive.passed) {
    return { valid: false, message: `称呼包含敏感词：${sensitive.hits.join('、')}` }
  }
  return { valid: true, message: 'ok' }
}
