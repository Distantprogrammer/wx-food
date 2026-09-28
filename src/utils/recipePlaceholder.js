/**
 * 菜谱封面缺失时的本地 SVG 兜底
 * 路径对应 src/static/images/*.svg → 小程序 /static/images/*
 */

export const DEFAULT_RECIPE_PLACEHOLDER = '/static/images/staple.svg'

/** slug → 静态图；兼容 meat / meat_dish 等命名 */
const PLACEHOLDER_BY_SLUG = {
  meat: '/static/images/meat.svg',
  meat_dish: '/static/images/meat.svg',
  vegetable: '/static/images/vegetable.svg',
  vegetable_dish: '/static/images/vegetable.svg',
  soup: '/static/images/soup.svg',
  aquatic: '/static/images/aquatic.svg',
  staple: '/static/images/staple.svg',
  breakfast: '/static/images/breakfast.svg',
  dessert: '/static/images/dessert.svg',
  drink: '/static/images/drink.svg'
}

/**
 * @param {string} [categorySlug]
 * @returns {string} 本地静态资源路径
 */
export function getRecipePlaceholder(categorySlug) {
  const key = String(categorySlug || '')
    .trim()
    .toLowerCase()
  if (!key) return DEFAULT_RECIPE_PLACEHOLDER
  return PLACEHOLDER_BY_SLUG[key] || DEFAULT_RECIPE_PLACEHOLDER
}
