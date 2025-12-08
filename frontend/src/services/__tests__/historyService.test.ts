/**
 * 历史记录服务测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createHistory,
  updateHistory,
  getHistory,
  getAllHistory,
  deleteHistory
} from '../historyService'

describe('historyService', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
  })

  it('应该能创建历史记录', () => {
    const result = createHistory('测试主题', {
      raw: '测试大纲',
      pages: [
        { index: 0, type: 'cover', content: '封面' },
        { index: 1, type: 'content', content: '内容' }
      ]
    })

    expect(result.success).toBe(true)
    expect(result.record_id).toBeDefined()
  })

  it('应该能更新历史记录（包含 thumbnail）', () => {
    // 先创建记录
    const createResult = createHistory('测试主题', {
      raw: '测试大纲',
      pages: [{ index: 0, type: 'cover', content: '封面' }]
    })

    expect(createResult.success).toBe(true)
    const recordId = createResult.record_id!

    // 更新记录（包含 thumbnail）
    const updateResult = updateHistory(recordId, {
      images: {
        task_id: 'task_123',
        generated: ['https://example.com/image1.jpg']
      },
      status: 'completed',
      thumbnail: 'https://example.com/image1.jpg'
    })

    expect(updateResult.success).toBe(true)

    // 验证更新
    const getResult = getHistory(recordId)
    expect(getResult.success).toBe(true)
    expect(getResult.record?.thumbnail).toBe('https://example.com/image1.jpg')
  })

  it('应该能更新历史记录（thumbnail 为 null）', () => {
    // 先创建记录
    const createResult = createHistory('测试主题', {
      raw: '测试大纲',
      pages: [{ index: 0, type: 'cover', content: '封面' }]
    })

    expect(createResult.success).toBe(true)
    const recordId = createResult.record_id!

    // 更新记录（thumbnail 为 null）
    const updateResult = updateHistory(recordId, {
      images: {
        task_id: 'task_123',
        generated: []
      },
      status: 'draft',
      thumbnail: null
    })

    expect(updateResult.success).toBe(true)

    // 验证更新
    const getResult = getHistory(recordId)
    expect(getResult.success).toBe(true)
    expect(getResult.record?.thumbnail).toBeNull()
  })

  it('应该能获取所有历史记录', () => {
    createHistory('主题1', {
      raw: '大纲1',
      pages: [{ index: 0, type: 'cover', content: '封面1' }]
    })

    createHistory('主题2', {
      raw: '大纲2',
      pages: [{ index: 0, type: 'cover', content: '封面2' }]
    })

    const records = getAllHistory()
    expect(records.length).toBe(2)
  })

  it('应该能删除历史记录', () => {
    const createResult = createHistory('测试主题', {
      raw: '测试大纲',
      pages: [{ index: 0, type: 'cover', content: '封面' }]
    })

    const recordId = createResult.record_id!
    const deleteResult = deleteHistory(recordId)

    expect(deleteResult.success).toBe(true)

    const getResult = getHistory(recordId)
    expect(getResult.success).toBe(false)
  })
})
