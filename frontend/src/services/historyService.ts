/**
 * 历史记录服务 - 使用 Supabase 或 localStorage
 */
import type { Page } from '@/api'
import { supabase, checkSupabaseConfig } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

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
 * 检查是否应该使用 Supabase
 */
function shouldUseSupabase(): boolean {
  return checkSupabaseConfig() && import.meta.env.VITE_ENABLE_SUPABASE === 'true' && supabase !== null
}

/**
 * 获取所有历史记录
 */
export async function getAllHistory(): Promise<HistoryRecord[]> {
  // 如果启用了 Supabase，从 Supabase 获取
  if (shouldUseSupabase()) {
    try {
      const authStore = useAuthStore()
      if (!authStore.supabaseUser) {
        console.warn('用户未登录，无法从 Supabase 获取历史记录')
        return []
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', authStore.supabaseUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('从 Supabase 获取历史记录失败:', error)
        // 降级到 localStorage
        return getLocalStorageHistory()
      }

      // 转换 Supabase 数据格式为 HistoryRecord 格式
      const records: HistoryRecord[] = (data || []).map(project => ({
        id: project.id,
        title: project.title,
        created_at: project.created_at,
        updated_at: project.updated_at,
        outline: project.outline || { raw: '', pages: [] },
        images: {
          task_id: project.task_id,
          generated: []  // 图片 URL 需要另外存储
        },
        status: project.status || 'draft',
        thumbnail: project.thumbnail_url,
        page_count: project.page_count || 0
      }))

      console.log(`✅ 从 Supabase 加载了 ${records.length} 条历史记录`)
      return records
    } catch (error) {
      console.error('获取 Supabase 历史记录异常:', error)
      // 降级到 localStorage
      return getLocalStorageHistory()
    }
  }

  // 否则从 localStorage 获取
  return getLocalStorageHistory()
}

/**
 * 从 localStorage 获取历史记录
 */
function getLocalStorageHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('读取历史记录失败:', error)
    return []
  }
}

/**
 * 保存历史记录到 localStorage
 */
function saveLocalStorageHistory(records: HistoryRecord[]): void {
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
export async function createHistory(
  topic: string,
  outline: { raw: string; pages: Page[] },
  taskId?: string
): Promise<{ success: boolean; record_id?: string; error?: string }> {
  try {
    // 如果启用了 Supabase，保存到 Supabase
    if (shouldUseSupabase()) {
      const authStore = useAuthStore()
      if (!authStore.supabaseUser) {
        return { success: false, error: '用户未登录' }
      }

      const projectData = {
        user_id: authStore.supabaseUser.id,
        title: topic,
        topic: topic,  // Supabase 需要 topic 字段
        outline,
        images: {},
        status: 'draft',
        thumbnail_url: null,
        page_count: outline.pages?.length || 0,
        task_id: taskId || null
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        console.error('保存到 Supabase 失败:', error)
        // 降级到 localStorage
        return createLocalStorageHistory(topic, outline, taskId)
      }

      console.log('✅ 创建新历史记录到 Supabase:', data.id, topic)
      return { success: true, record_id: data.id }
    }

    // 否则保存到 localStorage
    return createLocalStorageHistory(topic, outline, taskId)
  } catch (error: any) {
    console.error('❌ 创建历史记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 在 localStorage 中创建历史记录
 */
function createLocalStorageHistory(
  topic: string,
  outline: { raw: string; pages: Page[] },
  taskId?: string
): { success: boolean; record_id?: string; error?: string } {
  try {
    const records = getLocalStorageHistory()

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
    saveLocalStorageHistory(records)

    console.log('✅ 创建新历史记录到 localStorage:', newRecord.id, newRecord.title)

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
export async function updateHistory(
  recordId: string,
  data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 如果启用了 Supabase，更新到 Supabase
    if (shouldUseSupabase()) {
      const authStore = useAuthStore()
      if (!authStore.supabaseUser) {
        return { success: false, error: '用户未登录' }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // ���新 outline（如果提供）
      if (data.outline) {
        updateData.outline = data.outline
      }

      // 更新 images（如果提供）
      if (data.images) {
        updateData.images = data.images
      }

      // 更新 status（如果提供）
      if (data.status) {
        updateData.status = data.status
      }

      // 更新 thumbnail（如果提供）
      if (data.thumbnail !== undefined) {
        updateData.thumbnail_url = data.thumbnail
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', recordId)
        .eq('user_id', authStore.supabaseUser.id)

      if (error) {
        console.error('更新到 Supabase 失败:', error)
        // 降级到 localStorage
        return updateLocalStorageHistory(recordId, data)
      }

      console.log('✅ 历史记录已更新到 Supabase:', recordId)
      return { success: true }
    }

    // 否则更新到 localStorage
    return updateLocalStorageHistory(recordId, data)
  } catch (error: any) {
    console.error('更新历史记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 在 localStorage 中更新历史记录
 */
function updateLocalStorageHistory(
  recordId: string,
  data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string | null
  }
): { success: boolean; error?: string } {
  try {
    const records = getLocalStorageHistory()
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
    saveLocalStorageHistory(records)

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
export async function deleteHistory(recordId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 如果启用了 Supabase，从 Supabase 删除
    if (shouldUseSupabase()) {
      const authStore = useAuthStore()
      if (!authStore.supabaseUser) {
        return { success: false, error: '用户未登录' }
      }

      // 先删除相关的图片记录
      await supabase
        .from('images')
        .delete()
        .eq('project_id', recordId)
        .eq('user_id', authStore.supabaseUser.id)

      // 删除项目记录
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', recordId)
        .eq('user_id', authStore.supabaseUser.id)

      if (error) {
        console.error('从 Supabase 删除失败:', error)
        // 降级到 localStorage
        return deleteLocalStorageHistory(recordId)
      }

      console.log('✅ 历史记录已从 Supabase 删除:', recordId)
      return { success: true }
    }

    // 否则从 localStorage 删除
    return deleteLocalStorageHistory(recordId)
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 从 localStorage 删除历史记录
 */
function deleteLocalStorageHistory(recordId: string): {
  success: boolean
  error?: string
} {
  try {
    const records = getLocalStorageHistory()
    const filtered = records.filter(r => r.id !== recordId)
    saveLocalStorageHistory(filtered)

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
export async function searchHistory(keyword: string): Promise<{
  success: boolean
  records: HistoryRecord[]
}> {
  try {
    let records = await getAllHistory()
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
export async function getHistoryStats(): Promise<{
  success: boolean
  total: number
  by_status: Record<string, number>
}> {
  try {
    const records = await getAllHistory()
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
    let records = await getAllHistory()

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
