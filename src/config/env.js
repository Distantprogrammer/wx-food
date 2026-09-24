/** 请替换为你的微信云开发环境 ID */
export const CLOUD_ENV_ID = 'cloud1-d6gjzfkan9e2a2b19'

/**
 * 菜谱封面云存储目录前缀
 *
 * ❌ 错误（缺存储桶，会被当成相对路径）：
 *    cloud://cloud1-d6gjzfkan9e2a2b19/download/recipe-images/
 *
 * ✅ 正确：云开发 → 存储 → 点开任意图 → 复制「文件ID」→ 去掉最后的文件名
 *    cloud://cloud1-d6gjzfkan9e2a2b19.636c-cloud1-d6gjzfkan9e2a2b19-125xxxxxxxx/download/recipe-images/
 *                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *                                    这一段必须有（环境ID后面有一个点 + 桶名）
 */
export const CLOUD_IMAGE_PREFIX = 'cloud://cloud1-d6gjzfkan9e2a2b19.636c-cloud1-d6gjzfkan9e2a2b19-1323028788/download/recipe-images/'

export const PAGE_SIZE = 20

export const DIFFICULTY_MAP = {
  1: { key: 'easy', text: '简单' },
  2: { key: 'easy', text: '简单' },
  3: { key: 'medium', text: '中等' },
  4: { key: 'hard', text: '困难' },
  5: { key: 'hard', text: '困难' }
}

export const CATEGORY_ICONS = {
  soup: '🍲',
  dessert: '🍰',
  condiment: '🧂',
  vegetable_dish: '🥬',
  drink: '🥤',
  aquatic: '🐟',
  breakfast: '🌅',
  'semi-finished': '📦',
  staple: '🍚',
  meat_dish: '🥩'
}
