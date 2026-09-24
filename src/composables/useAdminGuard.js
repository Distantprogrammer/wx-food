import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

/** 管理页守卫：非管理员退回我的 */
export function useAdminGuard() {
  const userStore = useUserStore()

  onShow(() => {
    if (!userStore.isAdmin) {
      uni.showToast({ title: '仅管理员可进入', icon: 'none' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/me/index' })
      }, 400)
    }
  })

  return { userStore, isAdmin: () => userStore.isAdmin }
}
