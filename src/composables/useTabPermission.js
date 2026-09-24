import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import {
  getDefaultTabPath,
  getTabPermissionsByUser,
  getVisibleTabBarList
} from '@/config/tabbar'

export function useTabPermission() {
  const userStore = useUserStore()

  const tabPermissions = computed(() =>
    getTabPermissionsByUser(userStore.userInfo)
  )

  const visibleTabBarList = computed(() =>
    getVisibleTabBarList(tabPermissions.value)
  )

  function switchToDefaultTab() {
    uni.switchTab({ url: getDefaultTabPath() })
  }

  return {
    tabPermissions,
    visibleTabBarList,
    switchToDefaultTab
  }
}
