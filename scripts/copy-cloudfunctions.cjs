const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const src = path.join(root, 'cloudfunctions')

function copyCloudFunctions(mode = 'dev') {
  execSync('node cloudfunctions/sync-common.js', {
    cwd: root,
    stdio: 'inherit'
  })

  const outDir = path.join(root, 'dist', mode, 'mp-weixin')
  if (!fs.existsSync(outDir)) {
    console.warn(`[copy-cloudfunctions] skip: ${outDir} not found`)
    return
  }

  const dest = path.join(outDir, 'cloudfunctions')
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true })
  console.log(`[copy-cloudfunctions] copied to ${dest}`)
}

const mode = process.argv[2] || (process.env.NODE_ENV === 'production' ? 'build' : 'dev')
copyCloudFunctions(mode)

module.exports = { copyCloudFunctions }
