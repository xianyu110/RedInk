import { projectService, imageService, userService } from './supabaseService'
import { useAuthStore } from '@/stores/auth'
import type { Page } from '@/api'
import type { GeneratorState } from '@/stores/generator'

// 云端同步服务
export class CloudSyncService {
  private authStore: any
  private syncEnabled: boolean = false

  constructor() {
    // 延迟初始化，避免在模块顶层使用 store
    this.authStore = null as any
    this.syncEnabled = false

    // 使用 nextTick 确保 store 已经初始化
    import('vue').then(({ nextTick }) => {
      nextTick(() => {
        this.authStore = useAuthStore()
        this.syncEnabled = import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true' &&
                        this.authStore.isSupabaseEnabled &&
                        this.authStore.isAuthenticated
      })
    })
  }

  // 等待store初始化完成
  private async waitForStore() {
    if (this.authStore) return

    // 等待最多1秒让store初始化
    let attempts = 0
    while (!this.authStore && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (!this.authStore) {
      this.authStore = useAuthStore()
    }

    // 每次都重新检查同步状态
    this.syncEnabled = import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true' &&
                    this.authStore.isSupabaseEnabled &&
                    this.authStore.isAuthenticated
  }

  // 保存项目到云端
  async saveProject(state: GeneratorState, taskId: string | null = null) {
    await this.waitForStore()

    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用' }
    }

    try {
      // 检查配额
      const imagesToGenerate = state.outline.pages.length
      await userService.checkQuota(this.authStore.supabaseUser.id, imagesToGenerate)

      // 准备项目数据
      const projectData = {
        title: state.topic || '未命名项目',
        topic: state.topic,
        outline: state.outline,
        images: state.images,
        status: state.stage === 'result' ? 'completed' : state.stage,
        task_id: taskId
      }

      let project
      if (state.recordId) {
        // 更新现有项目
        project = await projectService.updateProject(state.recordId, this.authStore.supabaseUser.id, projectData)
      } else {
        // 创建新项目
        project = await projectService.createProject(this.authStore.supabaseUser.id, projectData)
      }

      return { success: true, projectId: project.id }
    } catch (error: any) {
      console.error('保存项目到云端失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 从云端加载项目
  async loadProject(projectId: string) {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用' }
    }

    try {
      const project = await projectService.getProject(projectId, this.authStore.supabaseUser.id)

      // 获取项目图片
      const images = await imageService.getProjectImages(projectId, this.authStore.supabaseUser.id)

      return {
        success: true,
        data: {
          project,
          images
        }
      }
    } catch (error: any) {
      console.error('从云端加载项目失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 上传生成的图片
  async uploadImages(projectId: string, images: File[]) {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用' }
    }

    try {
      const results = await imageService.uploadImages(
        this.authStore.supabaseUser.id,
        projectId,
        images
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      // 更新用户配额使用量
      if (successCount > 0) {
        const profile = this.authStore.userProfile
        if (profile) {
          await userService.updateQuota(
            this.authStore.supabaseUser.id,
            profile.quota_used + successCount
          )
        }
      }

      return {
        success: true,
        results,
        successCount,
        failCount
      }
    } catch (error: any) {
      console.error('上传图片到云端失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取用户项目列表
  async getProjects(page: number = 1, pageSize: number = 20) {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用', projects: [] }
    }

    try {
      const result = await projectService.getProjects(
        this.authStore.supabaseUser.id,
        page,
        pageSize
      )

      return { success: true, ...result }
    } catch (error: any) {
      console.error('获取项目列表失败:', error)
      return { success: false, error: error.message, projects: [] }
    }
  }

  // 删除项目
  async deleteProject(projectId: string) {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用' }
    }

    try {
      await projectService.deleteProject(projectId, this.authStore.supabaseUser.id)
      return { success: true }
    } catch (error: any) {
      console.error('删除云端项目失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 搜索项目
  async searchProjects(keyword: string) {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用', projects: [] }
    }

    try {
      const projects = await projectService.searchProjects(
        this.authStore.supabaseUser.id,
        keyword
      )
      return { success: true, projects }
    } catch (error: any) {
      console.error('搜索项目失败:', error)
      return { success: false, error: error.message, projects: [] }
    }
  }

  // 获取用户配额信息
  async getUserQuota() {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用' }
    }

    try {
      const profile = await userService.getProfile(this.authStore.supabaseUser.id)
      if (!profile) {
        return { success: false, error: '用户配置不存在' }
      }

      return {
        success: true,
        quota: {
          used: profile.quota_used,
          limit: profile.quota_limit,
          remaining: profile.quota_limit - profile.quota_used,
          tier: profile.subscription_tier
        }
      }
    } catch (error: any) {
      console.error('获取用户配额失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 同步本地历史记录到云端
  async syncLocalHistory(localRecords: any[]) {
    if (!this.syncEnabled || !this.authStore.supabaseUser) {
      return { success: false, error: '云端同步未启用' }
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    }

    for (const record of localRecords) {
      try {
        // 检查是否已存在
        const existing = await projectService.getProject(record.id, this.authStore.supabaseUser!.id)
        if (existing) {
          results.skipped++
          continue
        }

        // 创建新项目
        await projectService.createProject(this.authStore.supabaseUser!.id, {
          title: record.title,
          topic: record.topic,
          outline: record.outline,
          status: record.status,
          task_id: record.task_id
        })

        results.success++
      } catch (error) {
        console.error(`同步项目 ${record.id} 失败:`, error)
        results.failed++
      }
    }

    return { success: true, results }
  }

  // 从云端同步项目到本地
  async syncFromCloud() {
    await this.waitForStore()

    if (!this.syncEnabled) {
      console.log('云端同步未启用的原因:', {
        VITE_ENABLE_CLOUD_SYNC: import.meta.env.VITE_ENABLE_CLOUD_SYNC,
        isSupabaseEnabled: this.authStore?.isSupabaseEnabled,
        isAuthenticated: this.authStore?.isAuthenticated,
        hasSupabaseUser: !!this.authStore?.supabaseUser
      })
      return { success: false, error: '云端同步未启用' }
    }

    if (!this.authStore.supabaseUser) {
      return { success: false, error: '用户未登录' }
    }

    try {
      // 获取云端项目列表
      const result = await this.getProjects(1, 100) // 获取前100个项目

      if (!result.success) {
        return result
      }

      const cloudProjects = result.projects
      const syncedCount = cloudProjects.length

      // 将云端项目转换为本地历史记录格式并合并
      const { getAllHistory, saveHistory, createHistory, getLocalStorageHistory, saveLocalStorageHistory } = await import('./historyService')
      const localRecords = getLocalStorageHistory()

      // 创建云端项目的映射
      const cloudProjectMap = new Map(cloudProjects.map(p => [p.id, p]))

      // 合并本地和云端记录
      const mergedRecords = [...localRecords]

      // 添加云端独有的项目
      for (const project of cloudProjects) {
        if (!localRecords.find(r => r.id === project.id)) {
          const historyRecord = {
            id: project.id,
            title: project.title,
            created_at: project.created_at,
            updated_at: project.updated_at,
            outline: project.outline,
            images: {
              task_id: project.task_id,
              generated: [] // 云端不存储图片URL，只存储引用
            },
            status: project.status,
            thumbnail: null
          }
          mergedRecords.push(historyRecord)
        }
      }

      // 保存合并后的记录
      saveLocalStorageHistory(mergedRecords)

      return {
        success: true,
        message: `成功同步 ${syncedCount} 个项目`
      }
    } catch (error: any) {
      console.error('从云端同步失败:', error)
      return { success: false, error: error.message }
    }
  }
}

// 创建全局实例
export const cloudSync = new CloudSyncService()

// 为了兼容性，也导出CloudSync类
export const CloudSync = CloudSyncService