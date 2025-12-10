import { supabase, type Database } from '@/lib/supabase.js'
import type { Page } from '@/api'

// 用户服务
export const userService = {
  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 注册
  async signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    })

    // 注意：如果配置了邮箱确认，注册成功但用户状态是未确认
    // 这是正常的，不需要创建配置文件
    // 配置文件会在用户确认邮箱并通过触发器自动创建

    if (error) {
      // 特殊处理某些错误
      if (error.message?.includes('User already registered')) {
        throw new Error('该邮箱已注册，请直接登录')
      } else if (error.message?.includes('Password')) {
        throw new Error('密码不符合要求，至少需要6个字符')
      }
      throw error
    }

    return data
  },

  // 登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  // 邮箱登录（无需密码）
  async signInWithOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) throw error
    return data
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 创建用户配置文件
  async createProfile(userId: string, email: string, displayName?: string) {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        display_name: displayName || email.split('@')[0],
        quota_used: 0,
        quota_limit: Number(import.meta.env.VITE_FREE_QUOTA_LIMIT) || 50,
        subscription_tier: 'free'
      })

    if (error) throw error
  },

  // 获取用户配置文件
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error: any) {
      // 如果表不存在，返回 null
      if (error.message?.includes('Could not find the table') ||
          error.code === 'PGRST116') {
        console.warn('Users table not found, user profile not available')
        return null
      }
      throw error
    }
  },

  // 更新用户配额
  async updateQuota(userId: string, quotaUsed: number) {
    const { error } = await supabase
      .from('users')
      .update({ quota_used: quotaUsed })
      .eq('id', userId)

    if (error) throw error
  },

  // 检查配额
  async checkQuota(userId: string, imagesToGenerate: number = 1) {
    const profile = await this.getProfile(userId)
    if (!profile) throw new Error('用户配置文件不存在')

    const remainingQuota = profile.quota_limit - profile.quota_used
    if (remainingQuota < imagesToGenerate) {
      throw new Error(`配额不足。剩余配额: ${remainingQuota}，需要: ${imagesToGenerate}`)
    }

    return { remainingQuota, profile }
  }
}

// 项目服务
export const projectService = {
  // 创建项目
  async createProject(userId: string, data: {
    title: string
    topic: string
    outline: any
    images?: any
    status?: string
    thumbnail_url?: string | null
    task_id?: string | null
  }) {
    const projectData = {
      user_id: userId,
      title: data.title,
      topic: data.topic,
      outline: data.outline,
      images: data.images || {},
      status: data.status || 'draft',
      thumbnail_url: data.thumbnail_url,
      page_count: data.outline?.pages?.length || 0,
      task_id: data.task_id
    }

    const { data: result, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) throw error
    return result
  },

  // 获取项目列表
  async getProjects(userId: string, page: number = 1, pageSize: number = 20) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      projects: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  },

  // 获取项目详情
  async getProject(projectId: string, userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  // 更新项目
  async updateProject(projectId: string, userId: string, data: Partial<Database['public']['Tables']['projects']['Update']>) {
    const { data: result, error } = await supabase
      .from('projects')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return result
  },

  // 删除项目
  async deleteProject(projectId: string, userId: string) {
    // 先删除相关的图片记录
    await imageService.deleteProjectImages(projectId, userId)

    // 删除项目
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // 搜索项目
  async searchProjects(userId: string, keyword: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${keyword}%,topic.ilike.%${keyword}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// 图片存储服务
export const imageService = {
  // 上传图片
  async uploadImage(userId: string, projectId: string, file: File, filename: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${projectId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName)

    // 保存图片记录
    await this.saveImageRecord(userId, projectId, filename, fileName, publicUrl, file.size)

    return { path: fileName, publicUrl }
  },

  // 批量上传图片
  async uploadImages(userId: string, projectId: string, files: File[]) {
    const results = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filename = `image_${i + 1}`
      try {
        const result = await this.uploadImage(userId, projectId, file, filename)
        results.push({ success: true, filename, ...result })
      } catch (error) {
        console.error(`上传图片 ${filename} 失败:`, error)
        results.push({ success: false, filename, error })
      }
    }
    return results
  },

  // 保存图片记录到数据库
  async saveImageRecord(
    userId: string,
    projectId: string,
    filename: string,
    storagePath: string,
    publicUrl: string,
    size: number
  ) {
    const { error } = await supabase
      .from('images')
      .insert({
        project_id: projectId,
        user_id: userId,
        filename,
        storage_path: storagePath,
        public_url: publicUrl,
        size
      })

    if (error) throw error
  },

  // 获取项目图片列表
  async getProjectImages(projectId: string, userId: string) {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // 删除图片
  async deleteImage(imageId: string, userId: string) {
    // 先获取图片信息
    const { data: imageRecord, error: fetchError } = await supabase
      .from('images')
      .select('storage_path')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    // 从存储中删除
    const { error: storageError } = await supabase.storage
      .from('project-images')
      .remove([imageRecord.storage_path])

    if (storageError) throw storageError

    // 从数据库删除记录
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId)

    if (dbError) throw dbError
  },

  // 删除项目所有图片
  async deleteProjectImages(projectId: string, userId: string) {
    // 获取所有图片
    const images = await this.getProjectImages(projectId, userId)

    // 删除存储中的文件
    const paths = images.map(img => img.storage_path)
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('project-images')
        .remove(paths)

      if (storageError) throw storageError
    }

    // 删除数据库记录
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (dbError) throw dbError
  }
}

// 订阅管理
export const subscriptionService = {
  // 获取订阅配置
  getSubscriptionConfig() {
    return {
      free: {
        name: '免费版',
        quota: Number(import.meta.env.VITE_FREE_QUOTA_LIMIT) || 50,
        features: ['基础生成', '本地存储']
      },
      pro: {
        name: '专业版',
        quota: Number(import.meta.env.VITE_PRO_QUOTA_LIMIT) || 500,
        features: ['高级生成', '云端存储', '批量生成']
      },
      premium: {
        name: '高级版',
        quota: Number(import.meta.env.VITE_PREMIUM_QUOTA_LIMIT) || 5000,
        features: ['无限生成', '高级功能', '优先支持']
      }
    }
  },

  // 升级订阅（模拟）
  async upgradeSubscription(userId: string, tier: 'pro' | 'premium') {
    const config = this.getSubscriptionConfig()
    const newQuotaLimit = config[tier].quota

    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        quota_limit: newQuotaLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    return { success: true, newQuotaLimit }
  }
}