import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

/**
 * 管理页守卫：
 * - 默认仅管理员
 * - allowUserSubmit=true 时放行已登录用户（用于待审新增）
 */
export function useAdminGuard(options = {}) {
  const userStore = useUserStore()
  const allowUserSubmit = () =>
    typeof options.allowUserSubmit === 'function'
      ? !!options.allowUserSubmit()
      : !!options.allowUserSubmit

  onShow(() => {
    if (allowUserSubmit()) {
      if (!userStore.isLogin) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/me/index' })
        }, 400)
      }
      return
    }
    if (!userStore.isAdmin) {
      uni.showToast({ title: '仅管理员可进入', icon: 'none' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/me/index' })
      }, 400)
    }
  })

  return { userStore, isAdmin: () => userStore.isAdmin }
}
