/**
 * 历史记录服务 - 使用 localStorage
 */
import type { Page } from '@/api'

export interface HistoryRecord {
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
    generated: string[]  // ⚠️ 注意：不要存储 base64 图片，只存储 URL 引用或留空
  }
  status: string
  thumbnail: string | null  // ⚠️ 注意：不要存储 base64 图片
  page_count?: number  // 页面数量（用于显示）
}

const HISTORY_KEY = 'redink-history'

/**
 * 获取所有历史记录
 */
export function getAllHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('读取历史记录失败:', error)
    return []
  }
}

/**
 * 保存历史记录
 */
function saveHistory(records: HistoryRecord[]): void {
  try {
    // 清理记录，移除可能的 base64 图片数据
    const cleanedRecords = records.map(record => {
      const cleaned = { ...record }
      
      // 不保存图片数据（太大）
      cleaned.images = {
        task_id: record.images.task_id,
        generated: []  // 清空图片数组，避免存储 base64
      }
      cleaned.thumbnail = null  // 不保存缩略图
      
      return cleaned
    })
    
    const jsonString = JSON.stringify(cleanedRecords)
    const sizeKB = (jsonString.length / 1024).toFixed(2)
    
    // 检查大小，如果超过 4MB 则警告
    if (jsonString.length > 4 * 1024 * 1024) {
      console.warn(`⚠️ 历史记录过大: ${sizeKB} KB，建议清理旧记录`)
    }
    
    localStorage.setItem(HISTORY_KEY, jsonString)
    console.log(`✅ 历史记录已保存: ${cleanedRecords.length} 条记录, 大小: ${sizeKB} KB`)
  } catch (error: any) {
    console.error('❌ 保存历史记录失败:', error)
    
    // 检查是否是 localStorage 配额超限
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage 存储空间已满！')
      
      // 尝试清理旧记录
      const records = getAllHistory()
      if (records.length > 10) {
        const kept = records.slice(0, 10)  // 只保留最新的 10 条
        localStorage.setItem(HISTORY_KEY, JSON.stringify(kept))
        alert(`存储空间已满，已自动清理旧记录。保留最新 ${kept.length} 条记录。`)
      } else {
        alert('存储空间已满，无法保存历史记录。请手动清理旧记录。')
      }
    }
  }
}

/**
 * 创建新的历史记录
 */
export function createHistory(
  topic: string,
  outline: { raw: string; pages: Page[] },
  taskId?: string
): { success: boolean; record_id?: string; error?: string } {
  try {
    const records = getAllHistory()
    
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      title: topic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      outline,
      images: {
        task_id: taskId || null,
        generated: []
      },
      status: 'draft',
      thumbnail: null
    }

    records.unshift(newRecord)
    saveHistory(records)

    console.log('✅ 创建新历史记录:', newRecord.id, newRecord.title)

    return {
      success: true,
      record_id: newRecord.id
    }
  } catch (error: any) {
    console.error('❌ 创建历史记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取单个历史记录
 */
export function getHistory(recordId: string): {
  success: boolean
  record?: HistoryRecord
  error?: string
} {
  try {
    const records = getAllHistory()
    const record = records.find(r => r.id === recordId)

    if (!record) {
      return {
        success: false,
        error: '记录不存在'
      }
    }

    return {
      success: true,
      record
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 更新历史记录
 */
export function updateHistory(
  recordId: string,
  data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string | null
  }
): { success: boolean; error?: string } {
  try {
    const records = getAllHistory()
    const index = records.findIndex(r => r.id === recordId)

    if (index === -1) {
      console.error('历史记录不存在:', recordId)
      return {
        success: false,
        error: '记录不存在'
      }
    }

    // 正确合并嵌套对象
    const updatedRecord = {
      ...records[index],
      updated_at: new Date().toISOString()
    }

    // 更新 outline（如果提供）
    if (data.outline) {
      updatedRecord.outline = data.outline
    }

    // 更新 images（如果提供）
    if (data.images) {
      updatedRecord.images = {
        ...updatedRecord.images,
        ...data.images
      }
    }

    // 更新 status（如果提供）
    if (data.status) {
      updatedRecord.status = data.status
    }

    // 更新 thumbnail（如果提供）
    if (data.thumbnail !== undefined) {
      updatedRecord.thumbnail = data.thumbnail
    }

    records[index] = updatedRecord
    saveHistory(records)

    console.log('历史记录已保存到 localStorage:', recordId, updatedRecord)

    return { success: true }
  } catch (error: any) {
    console.error('更新历史记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 删除历史记录
 */
export function deleteHistory(recordId: string): {
  success: boolean
  error?: string
} {
  try {
    const records = getAllHistory()
    const filtered = records.filter(r => r.id !== recordId)
    saveHistory(filtered)

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 搜索历史记录
 */
export function searchHistory(keyword: string): {
  success: boolean
  records: HistoryRecord[]
} {
  try {
    let records = getAllHistory()
    const filtered = records.filter(r =>
      r.title.toLowerCase().includes(keyword.toLowerCase())
    )

    // 添加 page_count 字段
    const result = filtered.map(r => ({
      ...r,
      page_count: r.outline?.pages?.length || 0
    }))

    return {
      success: true,
      records: result
    }
  } catch (error) {
    console.error('搜索历史记录失败:', error)
    return {
      success: true,
      records: []
    }
  }
}

/**
 * 获取统计信息
 */
export function getHistoryStats(): {
  success: boolean
  total: number
  by_status: Record<string, number>
} {
  try {
    const records = getAllHistory()
    const by_status: Record<string, number> = {}

    records.forEach(r => {
      by_status[r.status] = (by_status[r.status] || 0) + 1
    })

    return {
      success: true,
      total: records.length,
      by_status
    }
  } catch (error) {
    return {
      success: true,
      total: 0,
      by_status: {}
    }
  }
}

/**
 * 获取历史记录列表（分页）
 */
export function getHistoryList(
  page: number = 1,
  pageSize: number = 20,
  status?: string
): {
  success: boolean
  records: HistoryRecord[]
  total: number
  page: number
  page_size: number
  total_pages: number
} {
  try {
    let records = getAllHistory()

    // 按状态筛选
    if (status) {
      records = records.filter(r => r.status === status)
    }

    // 添加 page_count 字段（用于显示）
    records = records.map(r => ({
      ...r,
      page_count: r.outline?.pages?.length || 0
    }))

    const total = records.length
    const total_pages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedRecords = records.slice(start, end)

    return {
      success: true,
      records: paginatedRecords,
      total,
      page,
      page_size: pageSize,
      total_pages
    }
  } catch (error) {
    console.error('获取历史记录列表失败:', error)
    return {
      success: true,
      records: [],
      total: 0,
      page,
      page_size: pageSize,
      total_pages: 0
    }
  }
}
