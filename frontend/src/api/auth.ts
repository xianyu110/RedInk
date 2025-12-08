import axios from 'axios'

const API_BASE_URL = '/api'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
  last_login_at?: string
  is_active: boolean
  preferences: Record<string, any>
}

export interface LoginResponse {
  user: User
  token: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// 邮箱登录
export async function login(email: string): Promise<{
  success: boolean
  data?: LoginResponse
  error?: string
}> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email })
    return response.data
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || '登录失败'
    }
  }
}

// 获取当前用户信息
export async function getCurrentUser(token: string): Promise<{
  success: boolean
  data?: User
  error?: string
}> {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || '获取用户信息失败'
    }
  }
}

// 更新用户资料
export async function updateProfile(
  token: string,
  data: {
    name?: string
    avatar_url?: string
    preferences?: Record<string, any>
  }
): Promise<{
  success: boolean
  data?: User
  error?: string
}> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/update-profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || '更新失败'
    }
  }
}

// 登出
export async function logout(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/logout`)
    return response.data
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || '登出失败'
    }
  }
}