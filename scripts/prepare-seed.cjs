const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dest = path.join(root, 'cloudfunctions', 'seedImport', 'data')
fs.mkdirSync(dest, { recursive: true })

for (const name of ['recipes.json', 'tips.json']) {
  const src = path.join(root, 'data', name)
  if (!fs.existsSync(src)) {
    console.error(`[prepare-seed] missing ${src}`)
    process.exit(1)
  }
  fs.copyFileSync(src, path.join(dest, name))
  console.log(`[prepare-seed] copied ${name}`)
}
