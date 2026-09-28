/**
 * 全局页面分享：所有页面支持微信右上角转发 / 朋友圈
 */
import { enableNativeShareMenu, getActiveShareConfig, resetPendingShare } from '@/utils/share'

export default {
  onShow() {
    // 进入页面恢复默认（分享当前页）；业务侧可再 setPendingShare / prepareRecipeShare
    resetPendingShare()
    enableNativeShareMenu()
  },
  onShareAppMessage() {
    return getActiveShareConfig()
  },
  onShareTimeline() {
    const config = getActiveShareConfig()
    const query = config.path?.includes('?') ? config.path.split('?')[1] : ''
    return {
      title: config.title,
      query,
      imageUrl: config.imageUrl
    }
  }
}
