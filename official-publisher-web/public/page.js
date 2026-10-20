function showLoading(message) {
  if (document.querySelector('.loading-mask')) return
  const mask = document.createElement('div')
  mask.className = 'loading-mask'
  mask.innerHTML = '<div class="loading-card" role="status"><span class="spinner"></span><span></span></div>'
  mask.querySelector('.loading-card span:last-child').textContent = message || '正在提交到微信，请稍候…'
  document.body.appendChild(mask)
}

function fillArticle(form) {
  if (!form.hasAttribute('data-article')) return
  const title = document.getElementById('articleTitle')
  const digest = document.getElementById('articleDigest')
  const body = document.getElementById('articleBody')
  const titleInput = form.querySelector('[name="articleTitle"]')
  const digestInput = form.querySelector('[name="articleDigest"]')
  const contentInput = form.querySelector('[name="articleContent"]')
  if (titleInput && title) titleInput.value = title.value
  if (digestInput && digest) digestInput.value = digest.value
  if (contentInput && body) contentInput.value = body.innerHTML
}

const editButton = document.getElementById('editArticle')
const articleTitle = document.getElementById('articleTitle')
const articleDigest = document.getElementById('articleDigest')
const articleBody = document.getElementById('articleBody')
if (editButton && articleTitle && articleDigest && articleBody) {
  let dirty = false
  const markDirty = () => { dirty = true }
  articleTitle.addEventListener('input', markDirty)
  articleDigest.addEventListener('input', markDirty)
  articleBody.addEventListener('input', markDirty)
  editButton.addEventListener('click', () => {
    const editing = editButton.getAttribute('aria-pressed') !== 'true'
    editButton.setAttribute('aria-pressed', editing ? 'true' : 'false')
    editButton.textContent = editing ? '完成编辑' : '编辑文章'
    articleBody.contentEditable = editing ? 'true' : 'false'
    document.querySelector('.article-shell')?.classList.toggle('is-editing', editing)
    if (editing) articleTitle.focus()
  })
  document.querySelector('.template-form')?.addEventListener('submit', (event) => {
    if (!dirty) return
    if (!confirm('切换模板会按新模板重新生成文章，当前修改不会保留。继续切换吗？')) event.preventDefault()
  })
}

document.addEventListener('submit', (event) => {
  const form = event.target
  if (!(form instanceof HTMLFormElement) || event.defaultPrevented) return
  fillArticle(form)
  if (!form.hasAttribute('data-wechat')) return
  showLoading(form.getAttribute('data-loading'))
  form.querySelectorAll('button').forEach((button) => { button.disabled = true })
})
