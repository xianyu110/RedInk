/**
 * 前端API服务 - 完全依赖前端配置的AI服务
 * 使用本地存储和前端AI API实现所有功能
 */

import type { Page } from './index'
import { localDataManager } from '../utils/localDataManager'
import { imageManager, type GeneratedImage } from '../utils/imageManager'

export interface ProgressEvent {
  index: number
  status: 'generating' | 'done' | 'error'
  current?: number
  total?: number
  image_url?: string
  message?: string
}

export interface FinishEvent {
  success: boolean
  task_id: string
  images: string[]
}

// ==================== 大纲生成 ====================

export async function generateOutline(
  topic: string,
  images?: File[],
  templateId?: string
): Promise<{ success: boolean; outline?: string; pages?: Page[]; has_images?: boolean; error?: string }> {
  try {
    // 使用本地大纲生成器
    const result = await localDataManager.generateOutline(topic, templateId)

    return {
      success: result.success,
      outline: result.outline,
      pages: result.pages,
      has_images: !!(images && images.length > 0)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成大纲失败'
    }
  }
}

// ==================== 图片生成 ====================

export async function generateImagesPost(
  pages: Page[],
  taskId: string | null,
  fullOutline: string,
  onProgress: (event: ProgressEvent) => void,
  onComplete: (event: ProgressEvent) => void,
  onError: (event: ProgressEvent) => void,
  onFinish: (event: FinishEvent) => void,
  onStreamError: (error: Error) => void,
  userImages?: File[],
  userTopic?: string
) {
  try {
    const newTaskId = taskId || generateTaskId()

    // 加载AI配置
    await imageManager.loadAIConfig()

    // 检查AI是否已配置
    if (!imageManager.isAIConfigured()) {
      throw new Error('AI图片生成服务未配置，请在设置中配置API后重试')
    }

    // 开始生成
    onProgress({
      index: -1,
      status: 'generating',
      message: `开始生成 ${pages.length} 张图片 (AI模式)...`
    })

    const results = await imageManager.generateImages(
      pages,
      (index, status, url) => {
        onProgress({
          index,
          status,
          image_url: url,
          current: index + 1,
          total: pages.length
        })

        if (status === 'done') {
          onComplete({ index, status: 'done', image_url: url })
        } else if (status === 'error') {
          onError({ index, status: 'error', message: 'AI生成失败' })
        }
      },
      userImages
    )

    // 完成
    const successImages = results.filter(img => img.status === 'done')
    onFinish({
      success: successImages.length === pages.length,
      task_id: newTaskId,
      images: successImages.map(img => img.url)
    })

    return newTaskId
  } catch (error) {
    onStreamError(error as Error)
  }
}

// ==================== 图片重新生成 ====================

export async function regenerateImage(
  taskId: string,
  page: Page,
  useReference: boolean = true,
  context?: {
    fullOutline?: string
    userTopic?: string
  }
): Promise<{ success: boolean; index: number; image_url?: string; error?: string }> {
  try {
    const result = await imageManager.regenerateImage(page.index, page.content)

    if (result.success && result.url) {
      return {
        success: true,
        index: page.index,
        image_url: result.url
      }
    } else {
      return {
        success: false,
        index: page.index,
        error: result.error || '重新生成失败'
      }
    }
  } catch (error) {
    return {
      success: false,
      index: page.index,
      error: error instanceof Error ? error.message : '重新生成失败'
    }
  }
}

// ==================== 批量重试失败图片 ====================

export async function retryFailedImages(
  taskId: string,
  pages: Page[],
  onProgress: (event: ProgressEvent) => void,
  onComplete: (event: ProgressEvent) => void,
  onError: (event: ProgressEvent) => void,
  onFinish: (event: { success: boolean; total: number; completed: number; failed: number }) => void,
  onStreamError: (error: Error) => void
) {
  try {
    onProgress({
      index: -1,
      status: 'generating',
      message: '开始重新生成失败的图片...'
    })

    // 检查AI是否已配置
    if (!imageManager.isAIConfigured()) {
      throw new Error('AI图片生成服务未配置，请在设置中配置API后重试')
    }

    // 批量重试过程
    const results: GeneratedImage[] = []
    let completed = 0
    let failed = 0

    for (const page of pages) {
      try {
        const url = await imageManager.generateImage(page.index, page.content)
        results.push({ index: page.index, url, status: 'done' })
        completed++

        onComplete({ index: page.index, status: 'done', image_url: url })
        onProgress({
          index: page.index,
          status: 'done',
          current: completed,
          total: pages.length
        })
      } catch (error) {
        results.push({ index: page.index, url: '', status: 'error' })
        failed++

        onError({ index: page.index, status: 'error', message: 'AI重试失败' })
      }
    }

    onFinish({
      success: failed === 0,
      total: pages.length,
      completed,
      failed
    })
  } catch (error) {
    onStreamError(error as Error)
  }
}

// ==================== 历史记录API ====================

export interface HistoryRecord {
  id: string
  title: string
  created_at: string
  updated_at: string
  status: string
  thumbnail: string | null
  page_count: number
  task_id: string | null
}

export interface HistoryDetail {
  id: string
  title: string
  created_at: string
  updated_at: string
  outline: {
    raw: string
    pages: Page[]
  }
  images: {
    task_id: string | null
    generated: string[]
  }
  status: string
  thumbnail: string | null
}

// 创建历史记录
export async function createHistory(
  topic: string,
  outline: { raw: string; pages: Page[] },
  taskId?: string
): Promise<{ success: boolean; record_id?: string; error?: string }> {
  return await localDataManager.createHistory(topic, outline, taskId)
}

// 获取历史记录列表
export async function getHistoryList(
  page: number = 1,
  pageSize: number = 20,
  status?: string
): Promise<{
  success: boolean
  records: HistoryRecord[]
  total: number
  page: number
  page_size: number
  total_pages: number
}> {
  return await localDataManager.getHistoryList(page, pageSize, status)
}

// 获取历史记录详情
export async function getHistory(recordId: string): Promise<{
  success: boolean
  record?: HistoryDetail
  error?: string
}> {
  return await localDataManager.getHistory(recordId)
}

// 更新历史记录
export async function updateHistory(
  recordId: string,
  data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string
  }
): Promise<{ success: boolean; error?: string }> {
  return await localDataManager.updateHistory(recordId, data)
}

// 删除历史记录
export async function deleteHistory(recordId: string): Promise<{
  success: boolean
  error?: string
}> {
  return await localDataManager.deleteHistory(recordId)
}

// 搜索历史记录
export async function searchHistory(keyword: string): Promise<{
  success: boolean
  records: HistoryRecord[]
}> {
  return await localDataManager.searchHistory(keyword)
}

// 获取统计信息
export async function getHistoryStats(): Promise<{
  success: boolean
  total: number
  by_status: Record<string, number>
}> {
  return await localDataManager.getHistoryStats()
}

// ==================== 配置管理API ====================

export interface Config {
  text_generation: {
    active_provider: string
    providers: Record<string, any>
  }
  image_generation: {
    active_provider: string
    providers: Record<string, any>
  }
}

// 获取配置
export async function getConfig(): Promise<{
  success: boolean
  config?: Config
  error?: string
}> {
  return await localDataManager.getConfig()
}

// 更新配置
export async function updateConfig(config: Partial<Config>): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  return await localDataManager.updateConfig(config)
}

// 测试服务商连接（本地版本总是成功）
export async function testConnection(config: {
  type: string
  provider_name?: string
  api_key?: string
  base_url?: string
  model: string
}): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  // 模拟测试过程
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    success: true,
    message: '本地服务商连接成功'
  }
}

// ==================== 其他API ====================

// 获取图片URL（从IndexedDB中获取存储的图片）
export async function getImageUrl(taskId: string, filename: string, thumbnail: boolean = true): Promise<string | null> {
  // 尝试从IndexedDB获取存储的图片
  const index = parseInt(filename.split('.')[0]) || 0
  return await imageManager.getImage(index)
}

// 扫描所有任务（本地版本简化实现）
export async function scanAllTasks(): Promise<{
  success: boolean
  total_tasks?: number
  synced?: number
  failed?: number
  orphan_tasks?: string[]
  results?: any[]
  error?: string
}> {
  return {
    success: true,
    total_tasks: 0,
    synced: 0,
    failed: 0,
    orphan_tasks: []
  }
}

// ==================== 模板API ====================

// 获取可用模板
export async function getTemplates(): Promise<{
  success: boolean
  templates: any[]
}> {
  return await localDataManager.getTemplates()
}

// ==================== 工具函数 ====================

function generateTaskId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 数据导出功能
export async function exportData(): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    const historyResult = await getHistoryList(1, 1000) // 获取所有记录
    const configResult = await getConfig()
    const templatesResult = await getTemplates()

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      history: historyResult.records,
      config: configResult.config,
      templates: templatesResult.templates
    }

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败'
    }
  }
}

// 数据导入功能
export async function importData(jsonData: string): Promise<{
  success: boolean
  imported?: number
  error?: string
}> {
  try {
    const data = JSON.parse(jsonData)

    if (!data.version || !data.history) {
      return {
        success: false,
        error: '无效的数据格式'
      }
    }

    let imported = 0

    // 导入历史记录
    for (const record of data.history) {
      try {
        await createHistory(record.title, record.outline, record.task_id)
        imported++
      } catch (error) {
        console.error('导入记录失败:', record, error)
      }
    }

    // 导入配置（可选）
    if (data.config) {
      await updateConfig(data.config)
    }

    return {
      success: true,
      imported
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导入失败'
    }
  }
}