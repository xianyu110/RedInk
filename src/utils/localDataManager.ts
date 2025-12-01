/**
 * 本地存储管理器 - 替代后端API
 * 提供历史记录、配置、图片等数据的本地存储和管理
 */

export interface Page {
  index: number
  type: 'cover' | 'content' | 'summary'
  content: string
}

export interface HistoryRecord {
  id: string
  title: string
  created_at: string
  updated_at: string
  status: 'draft' | 'completed' | 'failed'
  thumbnail: string | null
  page_count: number
  task_id: string | null
  outline: {
    raw: string
    pages: Page[]
  }
  images: {
    task_id: string | null
    generated: string[]
  }
}

export interface AppConfig {
  text_generation: {
    active_provider: string
    providers: Record<string, any>
  }
  image_generation: {
    active_provider: string
    providers: Record<string, any>
  }
}

class LocalDataManager {
  private readonly STORAGE_KEYS = {
    HISTORY: 'redink-history',
    CONFIG: 'redink-config',
    IMAGES: 'redink-images',
    TEMPLATES: 'redink-templates'
  }

  // ==================== 历史记录管理 ====================

  async createHistory(topic: string, outline: { raw: string; pages: Page[] }, taskId?: string): Promise<{ success: boolean; record_id?: string; error?: string }> {
    try {
      const records = this.getHistoryRecords()
      const newRecord: HistoryRecord = {
        id: this.generateId(),
        title: topic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'draft',
        thumbnail: null,
        page_count: outline.pages.length,
        task_id: taskId || null,
        outline,
        images: {
          task_id: taskId || null,
          generated: []
        }
      }

      records.unshift(newRecord) // 新记录放在最前面
      this.saveHistoryRecords(records)

      return { success: true, record_id: newRecord.id }
    } catch (error) {
      return { success: false, error: `创建历史记录失败: ${error}` }
    }
  }

  async getHistoryList(page: number = 1, pageSize: number = 20, status?: string): Promise<{
    success: boolean
    records: HistoryRecord[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }> {
    try {
      let records = this.getHistoryRecords()

      // 状态过滤
      if (status && status !== 'all') {
        records = records.filter(record => record.status === status)
      }

      const total = records.length
      const totalPages = Math.ceil(total / pageSize)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedRecords = records.slice(start, end)

      return {
        success: true,
        records: paginatedRecords,
        total,
        page,
        page_size: pageSize,
        total_pages: totalPages
      }
    } catch (error) {
      return {
        success: false,
        records: [],
        total: 0,
        page: 1,
        page_size: pageSize,
        total_pages: 0
      }
    }
  }

  async getHistory(recordId: string): Promise<{ success: boolean; record?: HistoryRecord; error?: string }> {
    try {
      const records = this.getHistoryRecords()
      const record = records.find(r => r.id === recordId)

      if (!record) {
        return { success: false, error: '历史记录不存在' }
      }

      return { success: true, record }
    } catch (error) {
      return { success: false, error: `获取历史记录失败: ${error}` }
    }
  }

  async updateHistory(recordId: string, data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const records = this.getHistoryRecords()
      const recordIndex = records.findIndex(r => r.id === recordId)

      if (recordIndex === -1) {
        return { success: false, error: '历史记录不存在' }
      }

      // 更新记录
      const record = records[recordIndex]
      if (data.outline) record.outline = data.outline
      if (data.images) record.images = data.images
      if (data.status) record.status = data.status as 'draft' | 'completed' | 'failed'
      if (data.thumbnail !== undefined) record.thumbnail = data.thumbnail

      record.updated_at = new Date().toISOString()
      record.page_count = record.outline.pages.length

      records[recordIndex] = record
      this.saveHistoryRecords(records)

      return { success: true }
    } catch (error) {
      return { success: false, error: `更新历史记录失败: ${error}` }
    }
  }

  async deleteHistory(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const records = this.getHistoryRecords()
      const filteredRecords = records.filter(r => r.id !== recordId)

      if (records.length === filteredRecords.length) {
        return { success: false, error: '历史记录不存在' }
      }

      this.saveHistoryRecords(filteredRecords)
      return { success: true }
    } catch (error) {
      return { success: false, error: `删除历史记录失败: ${error}` }
    }
  }

  async searchHistory(keyword: string): Promise<{ success: boolean; records: HistoryRecord[] }> {
    try {
      const records = this.getHistoryRecords()
      const lowerKeyword = keyword.toLowerCase()

      const filteredRecords = records.filter(record =>
        record.title.toLowerCase().includes(lowerKeyword) ||
        record.outline.raw.toLowerCase().includes(lowerKeyword)
      )

      return { success: true, records: filteredRecords }
    } catch (error) {
      return { success: false, records: [] }
    }
  }

  async getHistoryStats(): Promise<{ success: boolean; total: number; by_status: Record<string, number> }> {
    try {
      const records = this.getHistoryRecords()
      const by_status = records.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return { success: true, total: records.length, by_status }
    } catch (error) {
      return { success: false, total: 0, by_status: {} }
    }
  }

  // ==================== 配置管理 ====================

  async getConfig(): Promise<{ success: boolean; config?: AppConfig; error?: string }> {
    try {
      const configData = localStorage.getItem(this.STORAGE_KEYS.CONFIG)
      let config: AppConfig

      if (configData) {
        config = JSON.parse(configData)
      } else {
        // 默认配置
        config = {
          text_generation: {
            active_provider: 'gemini',
            providers: {
              gemini: {
                name: 'Gemini AI',
                description: 'Google Gemini AI 文本生成',
                api_key: '',
                base_url: 'https://apipro.maynor1024.live/',
                model: 'gemini-3-pro-preview',
                type: 'google_gemini'
              }
            }
          },
          image_generation: {
            active_provider: 'gemini',
            providers: {
              gemini: {
                name: 'Gemini Image',
                description: 'Google Gemini AI 图片生成',
                api_key: '',
                base_url: 'https://apipro.maynor1024.live/',
                model: 'gemini-3-pro-image-preview',
                type: 'google_gemini',
                high_concurrency: false,
                short_prompt: false
              }
            }
          }
        }
        this.saveConfig(config)
      }

      return { success: true, config }
    } catch (error) {
      return { success: false, error: `获取配置失败: ${error}` }
    }
  }

  async updateConfig(config: Partial<AppConfig>): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const currentConfig = await this.getConfig()
      if (!currentConfig.config) {
        return { success: false, error: '无法获取当前配置' }
      }

      const updatedConfig = {
        ...currentConfig.config,
        ...config
      }

      this.saveConfig(updatedConfig)
      return { success: true, message: '配置更新成功' }
    } catch (error) {
      return { success: false, error: `更新配置失败: ${error}` }
    }
  }

  // ==================== 模板管理 ====================

  async getTemplates(): Promise<{ success: boolean; templates: any[] }> {
    try {
      const templatesData = localStorage.getItem(this.STORAGE_KEYS.TEMPLATES)
      let templates = templatesData ? JSON.parse(templatesData) : this.getDefaultTemplates()

      if (!templatesData) {
        this.saveTemplates(templates)
      }

      return { success: true, templates }
    } catch (error) {
      return { success: false, templates: [] }
    }
  }

  // ==================== 大纲生成辅助 ====================

  async generateOutline(topic: string, templateId?: string): Promise<{ success: boolean; outline?: string; pages?: Page[]; error?: string }> {
    try {
      const templates = await this.getTemplates()
      let template = templates.templates.find((t: any) => t.id === templateId)

      if (!template) {
        // 使用默认模板
        template = this.getDefaultTemplates()[0]
      }

      // 根据主题和模板生成大纲
      const { outline, pages } = this.generateOutlineFromTemplate(topic, template)

      return { success: true, outline, pages }
    } catch (error) {
      return { success: false, error: `生成大纲失败: ${error}` }
    }
  }

  // ==================== 私有方法 ====================

  private getHistoryRecords(): HistoryRecord[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.HISTORY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取历史记录失败:', error)
      return []
    }
  }

  private saveHistoryRecords(records: HistoryRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(records))
    } catch (error) {
      console.error('保存历史记录失败:', error)
      throw error
    }
  }

  private saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(config))
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  }

  private saveTemplates(templates: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates))
    } catch (error) {
      console.error('保存模板失败:', error)
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getDefaultTemplates() {
    return [
      {
        id: 'xiaohongshu',
        name: '小红书图文',
        description: '适用于小红书平台的图文内容',
        structure: [
          { type: 'cover', content: '封面标题和吸引点' },
          { type: 'content', content: '问题引入和痛点分析' },
          { type: 'content', content: '解决方案和核心价值' },
          { type: 'content', content: '具体步骤和方法' },
          { type: 'content', content: '案例展示和效果' },
          { type: 'content', content: '注意事项和避坑指南' },
          { type: 'summary', content: '总结回顾和行动号召' }
        ]
      },
      {
        id: 'product-review',
        name: '产品测评',
        description: '产品使用体验和推荐',
        structure: [
          { type: 'cover', content: '产品名称和核心卖点' },
          { type: 'content', content: '开箱外观和第一印象' },
          { type: 'content', content: '功能测试和性能表现' },
          { type: 'content', content: '优缺点分析' },
          { type: 'content', content: '使用场景和适用人群' },
          { type: 'content', content: '购买建议和性价比' },
          { type: 'summary', content: '总结和推荐指数' }
        ]
      },
      {
        id: 'tutorial',
        name: '教程指南',
        description: '步骤化教程和操作指南',
        structure: [
          { type: 'cover', content: '教程标题和预期效果' },
          { type: 'content', content: '准备工作' },
          { type: 'content', content: '步骤一：详细说明' },
          { type: 'content', content: '步骤二：详细说明' },
          { type: 'content', content: '步骤三：详细说明' },
          { type: 'content', content: '常见问题和解决方案' },
          { type: 'summary', content: '总结和进阶建议' }
        ]
      }
    ]
  }

  private generateOutlineFromTemplate(topic: string, template: any): { outline: string; pages: Page[] } {
    const pages: Page[] = template.structure.map((item: any, index: number) => ({
      index,
      type: item.type,
      content: this.generateContentFromTemplate(topic, item.content)
    }))

    const outline = pages.map(page => page.content).join('\n\n<page>\n\n')

    return { outline, pages }
  }

  private generateContentFromTemplate(topic: string, template: string): string {
    // 简单的内容生成逻辑，可以根据需要扩展
    const replacements: Record<string, string> = {
      '封面标题': `${topic} - 完整指南`,
      '吸引点': '30秒掌握核心要点！',
      '问题引入': `你是否也在为${topic}而烦恼？`,
      '解决方案': `教你如何轻松搞定${topic}`,
      '产品名称': topic,
      '教程标题': `${topic}详细教程`
    }

    let content = template
    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value)
    })

    return content
  }
}

// 单例实例
export const localDataManager = new LocalDataManager()

// 导出类型
export type { LocalDataManager }