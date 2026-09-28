const fs = require('fs')
const path = require('path')

const root = __dirname
const content = fs.readFileSync(path.join(root, 'common', 'index.js'), 'utf8')
const targets = ['login', 'updateProfile', 'recipe', 'tip', 'userRecipe', 'seedImport', 'admin', 'feedback', 'notice']

targets.forEach((name) => {
  const dir = path.join(root, name)
  if (!fs.existsSync(dir)) {
    console.warn(`[sync-common] skip missing: ${name}`)
    return
  }
  fs.writeFileSync(path.join(dir, 'common.js'), content, 'utf8')
  console.log(`[sync-common] -> ${name}/common.js`)
})
