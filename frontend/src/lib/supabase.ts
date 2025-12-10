import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'supabase.auth.token'
  }
})

// 数据库表类型定义
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          display_name: string | null
          avatar_url: string | null
          quota_used: number
          quota_limit: number
          subscription_tier: 'free' | 'pro' | 'premium'
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          topic: string
          outline: any
          images: any
          status: string
          created_at: string
          updated_at: string
          thumbnail_url: string | null
          page_count: number
          task_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      images: {
        Row: {
          id: string
          project_id: string
          user_id: string
          filename: string
          storage_path: string
          public_url: string
          created_at: string
          size: number
        }
        Insert: Omit<Database['public']['Tables']['images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['images']['Insert']>
      }
    }
  }
}

// 导出环境变量检查函数
export function checkSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || url === 'YOUR_SUPABASE_URL' ||
      !key || key === 'YOUR_SUPABASE_ANON_KEY') {
    return false
  }

  return true
}

// 获取存储桶 URL
export function getStorageUrl(path: string): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url || url === 'YOUR_SUPABASE_URL') {
    return ''
  }
  return `${url}/storage/v1/object/public/${path}`
}