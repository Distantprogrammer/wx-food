import { seedImport } from '@/services/userRecipe'
import { showApiError } from '@/utils/apiError'

/**
 * 分批导入种子数据，避免云函数超时
 */
export async function runSeedImport({ onProgress } = {}) {
  const report = (msg) => {
    if (typeof onProgress === 'function') onProgress(msg)
    else uni.showLoading({ title: msg, mask: true })
  }

  report('导入分类…')
  let res = await seedImport({ action: 'categories' }, { silent: true })
  if (res.code !== 200) throw new Error(res.message || '导入分类失败')

  let start = 0
  while (true) {
    report(`导入菜谱 ${start}…`)
    res = await seedImport({ action: 'recipes', start, limit: 10 }, { silent: true })
    if (res.code !== 200) throw new Error(res.message || '导入菜谱失败')
    report(`菜谱 ${res.data?.progress || ''}`)
    start = res.data?.recipesNext
    if (start == null) break
  }

  start = 0
  while (true) {
    report(`导入技巧 ${start}…`)
    res = await seedImport({ action: 'tips', start, limit: 10 }, { silent: true })
    if (res.code !== 200) throw new Error(res.message || '导入技巧失败')
    start = res.data?.tipsNext
    if (start == null) break
  }

  uni.hideLoading()
  uni.showToast({ title: '导入完成', icon: 'success' })
}

export async function safeRunSeedImport(options) {
  try {
    await runSeedImport(options)
    return true
  } catch (e) {
    uni.hideLoading()
    showApiError(e, '导入失败')
    return false
  }
}
