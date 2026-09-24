import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function copyCloudFunctionsPlugin() {
  return {
    name: 'copy-cloudfunctions',
    closeBundle() {
      if (process.env.UNI_PLATFORM !== 'mp-weixin') return
      const mode = process.env.NODE_ENV === 'production' ? 'build' : 'dev'
      execSync(`node scripts/copy-cloudfunctions.cjs ${mode}`, {
        cwd: rootDir,
        stdio: 'inherit'
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    copyCloudFunctionsPlugin()
  ],
})
