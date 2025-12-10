import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { userService } from '@/services/supabaseService'
import { supabase, checkSupabaseConfig } from '@/lib/supabase.js'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { login as loginApi, getCurrentUser, logout as logoutApi, type User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | SupabaseUser | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const supabaseUser = ref<SupabaseUser | null>(null)
  const userProfile = ref<any>(null)

  // 计算属性
  const isAuthenticated = computed(() => {
    // 如果启用了 Supabase，使用 Supabase 的认证状态
    if (checkSupabaseConfig() && import.meta.env.VITE_ENABLE_SUPABASE === 'true') {
      return !!supabaseUser.value
    }
    // 否则使用原有的认证系统
    return !!token.value && !!user.value
  })

  const isSupabaseEnabled = computed(() =>
    checkSupabaseConfig() && import.meta.env.VITE_ENABLE_SUPABASE === 'true'
  )

  // 初始化 - 从 localStorage 恢复状态
  async function init() {
    // 如果启用了 Supabase，初始化 Supabase 认证
    if (isSupabaseEnabled.value) {
      await initSupabase()
      return
    }

    // 否则使用原有的认证系统
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

  // 初始化 Supabase 认证
  async function initSupabase() {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      supabaseUser.value = authUser
      // 延迟加载用户配置，避免在初始化时失败
      try {
        const profile = await userService.getProfile(authUser.id)
        userProfile.value = profile
      } catch (error) {
        console.warn('Failed to load user profile:', error)
        userProfile.value = null
      }
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        supabaseUser.value = session.user
        try {
          const profile = await userService.getProfile(session.user.id)
          userProfile.value = profile
        } catch (error) {
          console.warn('Failed to load user profile:', error)
          userProfile.value = null
        }
      } else if (event === 'SIGNED_OUT') {
        supabaseUser.value = null
        userProfile.value = null
      }
    })
  }

  // 登录
  async function login(email: string, password?: string) {
    loading.value = true

    try {
      // 如果启用了 Supabase，使用 Supabase 认证
      if (isSupabaseEnabled.value) {
        // 如果有密码，使用密码登录
        if (password) {
          const result = await userService.signIn(email, password)
          supabaseUser.value = result.user
          const profile = await userService.getProfile(result.user!.id)
          userProfile.value = profile
          return { success: true }
        } else {
          // 否则使用邮箱 OTP 登录
          const result = await userService.signInWithOtp(email)
          return { success: true, message: '请检查邮箱中的登录链接' }
        }
      }

      // 否则使用原有的认证系统
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
      return { success: false, error: error.message || '登录失败，请重试' }
    } finally {
      loading.value = false
    }
  }

  // 注册（仅 Supabase）
  async function signUp(email: string, password: string, displayName?: string) {
    if (!isSupabaseEnabled.value) {
      return { success: false, error: '未启用云端服务' }
    }

    loading.value = true
    try {
      const result = await userService.signUp(email, password, displayName)
      return { success: true, message: '注册成功，请检查邮箱验证链接' }
    } catch (error: any) {
      return { success: false, error: error.message || '注册失败，请重试' }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      // 如果启用了 Supabase，使用 Supabase 登出
      if (isSupabaseEnabled.value) {
        await userService.signOut()
        supabaseUser.value = null
        userProfile.value = null
      } else {
        // 否则使用原有的认证系统
        await logoutApi()
      }
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
    supabaseUser.value = null
    userProfile.value = null
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

  // 计算属性：根据认证状态返回当前用户
  const currentUser = computed(() => {
    if (isSupabaseEnabled.value) {
      // Supabase 模式下，返回用户配置文件信息
      if (userProfile.value) {
        return {
          id: userProfile.value.id,
          name: userProfile.value.display_name || userProfile.value.email?.split('@')[0] || '用户',
          email: userProfile.value.email,
          avatar_url: userProfile.value.avatar_url
        }
      }
      // 如果没有配置文件，使用 Supabase 用户信息
      if (supabaseUser.value) {
        return {
          id: supabaseUser.value.id,
          name: supabaseUser.value.user_metadata?.display_name || supabaseUser.value.email?.split('@')[0] || '用户',
          email: supabaseUser.value.email || '',
          avatar_url: supabaseUser.value.user_metadata?.avatar_url
        }
      }
      return null
    } else {
      // 传统模式
      return user.value
    }
  })

  return {
    // 状态
    user: currentUser,
    token: readonly(token),
    loading: readonly(loading),
    supabaseUser: readonly(supabaseUser),
    userProfile: readonly(userProfile),
    isAuthenticated,
    isSupabaseEnabled,

    // 方法
    init,
    login,
    signUp,
    logout,
    verifyToken,
    updateUser,
    clearAuth,
    initSupabase
  }
})