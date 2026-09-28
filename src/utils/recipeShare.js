/**
 * 菜品分享：标题 / 路径；自定义分享图预留，现阶段不生成
 */
import { setPendingShare } from '@/utils/share'

/**
 * 预留：生成菜品自定义分享封面（canvas / 云端合成等）
 * 现阶段返回空字符串，微信走默认截图
 * @param {object} _recipe
 * @returns {Promise<string>}
 */
export async function buildRecipeShareImage(_recipe) {
  return ''
}

/**
 * 写入当前菜品分享配置（供右上角转发 / 朋友圈使用）
 * @param {object|null} recipe
 * @param {{ imageUrl?: string }} [options] 可显式传入封面；不传则走 buildRecipeShareImage（现为空）
 */
export async function prepareRecipeShare(recipe, options = {}) {
  if (!recipe?.id) return

  let imageUrl = options.imageUrl
  if (imageUrl == null) {
    imageUrl = await buildRecipeShareImage(recipe)
  }

  setPendingShare({
    title: recipe.title ? `${recipe.title} · 今天做什么菜` : '今天做什么菜',
    path: `/subPackages/pkg-recipe/detail/index?id=${recipe.id}`,
    imageUrl: imageUrl || ''
  })
}
