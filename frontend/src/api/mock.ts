// 模拟API - 纯前端最小MVP版本
import type { Page, OutlineResponse, ProgressEvent, FinishEvent, HistoryRecord, HistoryDetail } from './index'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟生成大纲
export async function generateOutline(
  topic: string,
  images?: File[]
): Promise<OutlineResponse & { has_images?: boolean }> {
  await delay(1000)

  const mockPages: Page[] = [
    {
      index: 0,
      type: 'cover',
      content: `震惊！${topic}背后的秘密竟然是这个...`
    },
    {
      index: 1,
      type: 'content',
      content: `今天要和大家分享一个关于${topic}的惊人发现。当我深入了解这个话题时，发现了很多意想不到的信息...`
    },
    {
      index: 2,
      type: 'content',
      content: `首先，${topic}的历史可以追溯到很久以前。在那个年代，人们就已经开始探索这个领域了。通过不断的研究和实践，我们才有了今天的认知。`
    },
    {
      index: 3,
      type: 'content',
      content: `让我们来看看具体的案例。小明是一个普通的用户，他在接触${topic}后，生活发生了翻天覆地的变化。他说："这彻底改变了我的认知！"`
    },
    {
      index: 4,
      type: 'summary',
      content: `通过今天的分享，相信大家对${topic}有了更深入的了解。如果你也有相关的经历，欢迎在评论区留言交流！记得点赞关注哦~`
    }
  ]

  return {
    success: true,
    outline: mockPages.map(p => p.content).join('\n\n'),
    pages: mockPages,
    has_images: images && images.length > 0
  }
}

// 模拟生成图片
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
    const newTaskId = taskId || Date.now().toString()
    const mockImages: string[] = []

    for (let i = 0; i < pages.length; i++) {
      onProgress({
        index: i,
        status: 'generating',
        current: i + 1,
        total: pages.length,
        message: `正在生成第 ${i + 1} 张图片...`
      })

      await delay(800)

      // 模拟图片URL（使用placeholder）
      const mockImageUrl = `https://picsum.photos/400/300?random=${Date.now() + i}`
      mockImages.push(mockImageUrl)

      onComplete({
        index: i,
        status: 'done',
        image_url: mockImageUrl
      })
    }

    onFinish({
      success: true,
      task_id: newTaskId,
      images: mockImages
    })
  } catch (error) {
    onStreamError(error as Error)
  }
}

// 模拟历史记录管理
const STORAGE_KEY = 'redink_history'

export async function createHistory(
  topic: string,
  outline: { raw: string; pages: Page[] },
  taskId?: string
): Promise<{ success: boolean; record_id?: string; error?: string }> {
  try {
    const histories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const newRecord = {
      id: Date.now().toString(),
      title: topic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'completed',
      thumbnail: null,
      page_count: outline.pages.length,
      task_id: taskId || null,
      outline,
      images: {
        task_id: taskId || null,
        generated: []
      }
    }

    histories.unshift(newRecord)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(histories))

    return {
      success: true,
      record_id: newRecord.id
    }
  } catch (error) {
    return {
      success: false,
      error: '保存失败'
    }
  }
}

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
  try {
    const histories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

    return {
      success: true,
      records: histories,
      total: histories.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(histories.length / pageSize)
    }
  } catch (error) {
    return {
      success: false,
      records: [],
      total: 0,
      page,
      page_size: pageSize,
      total_pages: 0
    }
  }
}

export async function getHistory(recordId: string): Promise<{
  success: boolean
  record?: HistoryDetail
  error?: string
}> {
  try {
    const histories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const record = histories.find((r: any) => r.id === recordId)

    if (record) {
      return {
        success: true,
        record
      }
    } else {
      return {
        success: false,
        error: '记录不存在'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取失败'
    }
  }
}

export async function deleteHistory(recordId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const histories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const filtered = histories.filter((r: any) => r.id !== recordId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: '删除失败'
    }
  }
}

// 其他必要的函数
export function getImageUrl(taskId: string, filename: string, thumbnail: boolean = true): string {
  return `https://picsum.photos/400/300?random=${taskId}`
}

export async function regenerateImage(
  taskId: string,
  page: Page,
  useReference: boolean = true,
  context?: {
    fullOutline?: string
    userTopic?: string
  }
): Promise<{ success: boolean; index: number; image_url?: string; error?: string }> {
  await delay(1000)
  return {
    success: true,
    index: page.index,
    image_url: `https://picsum.photos/400/300?random=${Date.now()}`
  }
}

export async function retryFailedImages(
  taskId: string,
  pages: Page[],
  onProgress: (event: ProgressEvent) => void,
  onComplete: (event: ProgressEvent) => void,
  onError: (event: ProgressEvent) => void,
  onFinish: (event: { success: boolean; total: number; completed: number; failed: number }) => void,
  onStreamError: (error: Error) => void
) {
  // 简化实现，直接调用 generateImagesPost
  return generateImagesPost(
    pages,
    taskId,
    '',
    onProgress,
    onComplete,
    onError,
    onFinish,
    onStreamError
  )
}

// 模拟配置相关（返回空配置）
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

export async function getConfig(): Promise<{
  success: boolean
  config?: Config
  error?: string
}> {
  return {
    success: true,
    config: {
      text_generation: {
        active_provider: 'mock',
        providers: {}
      },
      image_generation: {
        active_provider: 'mock',
        providers: {}
      }
    }
  }
}

export async function updateConfig(config: Partial<Config>): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  return {
    success: true,
    message: '演示模式，配置已模拟保存'
  }
}

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
  await delay(500)
  return {
    success: true,
    message: '演示模式：连接测试成功'
  }
}

// 搜索功能
export async function searchHistory(keyword: string): Promise<{
  success: boolean
  records: HistoryRecord[]
}> {
  try {
    const histories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const filtered = histories.filter((r: HistoryRecord) =>
      r.title.includes(keyword) || r.outline.raw.includes(keyword)
    )

    return {
      success: true,
      records: filtered
    }
  } catch (error) {
    return {
      success: false,
      records: []
    }
  }
}

// 统计功能
export async function getHistoryStats(): Promise<{
  success: boolean
  total: number
  by_status: Record<string, number>
}> {
  try {
    const histories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const stats = histories.reduce((acc: any, record: HistoryRecord) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {})

    return {
      success: true,
      total: histories.length,
      by_status: stats
    }
  } catch (error) {
    return {
      success: false,
      total: 0,
      by_status: {}
    }
  }
}

// 扫描任务（空实现）
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
    orphan_tasks: [],
    results: []
  }
}