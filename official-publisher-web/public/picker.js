function closeRecipeMenus(except) {
  document.querySelectorAll('[data-recipe-select]').forEach((root) => {
    if (root === except) return
    root.classList.remove('is-open')
    const menu = root.querySelector('[data-menu]')
    if (menu) menu.hidden = true
    root.querySelector('[data-trigger]')?.setAttribute('aria-expanded', 'false')
  })
}

document.querySelectorAll('[data-recipe-select]').forEach((root) => {
  const trigger = root.querySelector('[data-trigger]')
  const menu = root.querySelector('[data-menu]')
  const filter = root.querySelector('[data-filter]')
  const empty = root.querySelector('[data-empty]')
  const hidden = root.querySelector('input[name="recipeId"]')
  const label = root.querySelector('[data-label]')
  const form = root.closest('form')
  const options = [...menu.querySelectorAll('.recipe-option')]

  function applyFilter() {
    const query = filter.value.trim().replace(/^#/, '').toLocaleLowerCase()
    const numeric = /^\d+$/.test(query)
    let visible = 0
    for (const option of options) {
      const id = option.dataset.id || ''
      const title = (option.dataset.title || '').toLocaleLowerCase()
      const matched = !query || title.includes(query) || id === query || (numeric && id.startsWith(query))
      option.hidden = !matched
      if (matched) visible += 1
    }
    if (empty) empty.hidden = visible !== 0
  }

  function setOpen(open) {
    if (open) closeRecipeMenus(root)
    menu.hidden = !open
    root.classList.toggle('is-open', open)
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (!open) return
    filter.value = ''
    applyFilter()
    filter.focus()
  }

  trigger.addEventListener('click', () => setOpen(menu.hidden))
  filter.addEventListener('input', applyFilter)
  filter.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') event.preventDefault()
  })

  menu.addEventListener('click', (event) => {
    const option = event.target.closest('.recipe-option')
    if (!option || option.hidden || option.tagName === 'A' || !hidden) return
    hidden.value = option.dataset.id
    label.textContent = option.dataset.label
    options.forEach((item) => item.classList.remove('active'))
    option.classList.add('active')
    setOpen(false)
  })

  form?.addEventListener('submit', (event) => {
    if (hidden?.value) return
    event.preventDefault()
    setOpen(true)
  })
})

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-recipe-select]')) return
  closeRecipeMenus()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeRecipeMenus()
})
