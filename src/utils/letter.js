const DETAIL_CACHE_KEY = 'wsy:letter-detail'

export function openLetterDetail(message) {
  if (!message?._id) return
  uni.setStorageSync(DETAIL_CACHE_KEY, {
    _id: message._id,
    authorName: message.authorName,
    targetName: message.targetName,
    content: message.content,
    createTime: message.createTime,
    likeCount: message.likeCount,
    collectCount: message.collectCount,
    liked: Boolean(message.liked),
    collected: Boolean(message.collected)
  })
  uni.navigateTo({ url: `/pages/letter/detail/index?id=${message._id}` })
}

export function readLetterDetailCache(id) {
  try {
    const cached = uni.getStorageSync(DETAIL_CACHE_KEY)
    if (cached?._id === id) {
      uni.removeStorageSync(DETAIL_CACHE_KEY)
      return cached
    }
  } catch (e) {
    /* ignore */
  }
  return null
}
