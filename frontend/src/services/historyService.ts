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
    generated: string[]
  }
  status: string
  thumbnail: string | null
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('保存历史记录失败:', error)
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

    return {
      success: true,
      record_id: newRecord.id
    }
  } catch (error: any) {
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
    thumbnail?: string
  }
): { success: boolean; error?: string } {
  try {
    const records = getAllHistory()
    const index = records.findIndex(r => r.id === recordId)

    if (index === -1) {
      return {
        success: false,
        error: '记录不存在'
      }
    }

    records[index] = {
      ...records[index],
      ...data,
      updated_at: new Date().toISOString()
    }

    saveHistory(records)

    return { success: true }
  } catch (error: any) {
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
    const records = getAllHistory()
    const filtered = records.filter(r =>
      r.title.toLowerCase().includes(keyword.toLowerCase())
    )

    return {
      success: true,
      records: filtered
    }
  } catch (error) {
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
