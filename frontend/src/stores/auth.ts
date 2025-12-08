import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { login as loginApi, getCurrentUser, logout as logoutApi, type User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化 - 从 localStorage 恢复状态
  function init() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')

    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        // 如果解析失败，清除无效数据
        clearAuth()
      }
    }
  }

  // 登录
  async function login(email: string) {
    loading.value = true
    try {
      const result = await loginApi(email)

      if (result.success && result.data) {
        token.value = result.data.token
        user.value = result.data.user

        // 保存到 localStorage
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('auth_user', JSON.stringify(result.data.user))

        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      return { success: false, error: '登录失败，请重试' }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      await logoutApi()
    } catch (error) {
      // 即使登出 API 失败，也要清除本地状态
      console.error('Logout API error:', error)
    }

    clearAuth()
  }

  // 清除认证状态
  function clearAuth() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // 验证 token
  async function verifyToken() {
    if (!token.value) return false

    try {
      const result = await getCurrentUser(token.value)
      if (result.success && result.data) {
        user.value = result.data
        localStorage.setItem('auth_user', JSON.stringify(result.data))
        return true
      } else {
        // token 无效，清除状态
        clearAuth()
        return false
      }
    } catch (error) {
      clearAuth()
      return false
    }
  }

  // 更新用户信息
  function updateUser(userData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  return {
    // 状态
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    isAuthenticated,

    // 方法
    init,
    login,
    logout,
    verifyToken,
    updateUser,
    clearAuth
  }
})