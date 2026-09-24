import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, updateProfile as updateProfileApi, getProfile } from '@/services/auth'
import { getRoleLabel } from '@/utils/permission'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const loading = ref(false)

  const isLogin = computed(() => Boolean(userInfo.value?.openid))
  const isAdmin = computed(() => Number(userInfo.value?.role) === 1)
  const roleLabel = computed(() => getRoleLabel(userInfo.value?.role))

  function init() {
    try {
      const cached = uni.getStorageSync('userInfo')
      if (cached) {
        userInfo.value = typeof cached === 'string' ? JSON.parse(cached) : cached
      }
    } catch (e) {
      userInfo.value = null
    }
  }

  function persist(data) {
    userInfo.value = data
    uni.setStorageSync('userInfo', JSON.stringify(data))
  }

  async function login() {
    loading.value = true
    try {
      const res = await loginApi()
      if (res.code !== 200) {
        throw new Error(res.message || '登录失败')
      }
      persist(res.data)
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function refreshUser() {
    if (!isLogin.value) return null
    try {
      const res = await getProfile()
      if (res.code === 200 && res.data) {
        persist(res.data)
        return res.data
      }
    } catch (e) {
      console.error('refresh user error:', e)
    }
    return userInfo.value
  }

  async function updateProfile(data) {
    const res = await updateProfileApi(data)
    if (res.code !== 200) {
      throw new Error(res.message || '更新失败')
    }
    persist(res.data)
    return res.data
  }

  function logout() {
    userInfo.value = null
    uni.removeStorageSync('userInfo')
  }

  return {
    userInfo,
    loading,
    isLogin,
    isAdmin,
    roleLabel,
    init,
    login,
    refreshUser,
    updateProfile,
    logout
  }
})
