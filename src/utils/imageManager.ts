/**
 * AI图片生成管理器
 * 完全依赖前端配置的API服务，提供AI图片生成、用户图片管理、图片压缩等功能
 */

import { aiImageGenerator } from './aiImageGenerator'

export interface ImageGenerationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'png' | 'jpeg'
  style?: string
}

export interface GeneratedImage {
  index: number
  url: string
  blob?: Blob
  status: 'generating' | 'done' | 'error'
  error?: string
  isUserUpload?: boolean
}

class ImageManager {
  private readonly STORAGE_KEY = 'redink-uploaded-images'

  // ==================== 图片生成 ====================

  /**
   * 生成图片（完全依赖AI）
   */
  async generateImage(
    index: number,
    pageContent: string,
    options: ImageGenerationOptions = {}
  ): Promise<string> {
    const { width = 512, height = 512 } = options

    if (!aiImageGenerator.isConfigured()) {
      throw new Error('AI图片生成服务未配置，请在设置中配置API')
    }

    try {
      const result = await aiImageGenerator.generateImage(pageContent, {
        width,
        height,
        ...options
      })

      if (result.success && result.url) {
        return result.url
      } else {
        throw new Error(result.error || 'AI图片生成失败')
      }
    } catch (error) {
      console.error('AI图片生成失败:', error)
      throw new Error(error instanceof Error ? error.message : 'AI图片生成失败')
    }
  }

  /**
   * 从文件生成图片URL
   */
  async processUploadedFile(file: File): Promise<{ url: string; blob: Blob }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        if (e.target?.result) {
          const url = e.target.result as string
          fetch(url)
            .then(res => res.blob())
            .then(blob => {
              resolve({ url, blob })
            })
            .catch(reject)
        }
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 压缩图片
   */
  async compressImage(
    file: File,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
  ): Promise<Blob> {
    const { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = options

    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法创建canvas上下文'))
          return
        }

        // 计算压缩后的尺寸
        const { width, height } = this.calculateCompressedSize(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        )

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 批量生成图片（完全依赖AI）
   */
  async generateImages(
    pages: Array<{ index: number; content: string; type: string }>,
    onProgress: (index: number, status: 'generating' | 'done' | 'error', url?: string) => void,
    userUploads?: File[]
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = []

    for (const page of pages) {
      onProgress(page.index, 'generating')

      try {
        let url: string

        // 如果有用户上传的图片，优先使用
        if (userUploads && userUploads[page.index]) {
          const processed = await this.processUploadedFile(userUploads[page.index])
          url = processed.url

          // 存储到本地
          await this.storeImage(page.index, processed.blob)
        } else {
          // AI生成图片
          url = await this.generateImage(page.index, page.content)
        }

        onProgress(page.index, 'done', url)

        results.push({
          index: page.index,
          url,
          status: 'done',
          isUserUpload: !!userUploads?.[page.index]
        })
      } catch (error) {
        console.error(`生成第${page.index + 1}页图片失败:`, error)
        onProgress(page.index, 'error')

        results.push({
          index: page.index,
          url: '',
          status: 'error',
          error: error instanceof Error ? error.message : 'AI生成失败'
        })
      }

      // 添加延迟以避免 API 限制
      if (aiImageGenerator.isConfigured()) {
        await this.delay(2000) // AI生成需要更长延迟
      }
    }

    return results
  }

  /**
   * 重新生成单张图片
   */
  async regenerateImage(
    index: number,
    pageContent: string,
    userUpload?: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // 模拟生成延迟
      await this.delay(1500)

      if (userUpload) {
        const processed = await this.processUploadedFile(userUpload)
        await this.storeImage(index, processed.blob)
        return { success: true, url: processed.url }
      } else {
        const url = await this.generateImage(index, pageContent)
        return { success: true, url }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '重新生成失败'
      }
    }
  }

  // ==================== 图片存储 ====================

  /**
   * 存储图片到IndexedDB
   */
  async storeImage(index: number, blob: Blob): Promise<void> {
    try {
      const db = await this.getImageDB()
      const transaction = db.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')

      await store.put({ index, blob, timestamp: Date.now() })
    } catch (error) {
      console.error('存储图片失败:', error)
    }
  }

  /**
   * 从IndexedDB获取图片
   */
  async getImage(index: number): Promise<string | null> {
    try {
      const db = await this.getImageDB()
      const transaction = db.transaction(['images'], 'readonly')
      const store = transaction.objectStore('images')

      const result = await store.get(index)

      if (result?.blob) {
        return URL.createObjectURL(result.blob)
      }

      return null
    } catch (error) {
      console.error('获取图片失败:', error)
      return null
    }
  }

  /**
   * 清理旧图片
   */
  async cleanupOldImages(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.getImageDB()
      const transaction = db.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')

      const cursor = await store.openCursor()
      const now = Date.now()

      while (cursor) {
        if (now - cursor.value.timestamp > maxAge) {
          await cursor.delete()
        }
        await cursor.continue()
      }
    } catch (error) {
      console.error('清理图片失败:', error)
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 计算压缩后的尺寸
   */
  private calculateCompressedSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight }

    // 计算缩放比例
    const widthRatio = maxWidth / width
    const heightRatio = maxHeight / height
    const ratio = Math.min(widthRatio, heightRatio)

    // 如果不需要缩小，返回原始尺寸
    if (ratio >= 1) {
      return { width, height }
    }

    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取图片数据库
   */
  private async getImageDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RedInkImages', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'index' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // ==================== AI 配置管理 ====================

  /**
   * 配置AI图片生成器
   */
  configureAI(config: { api_key: string; base_url: string; model: string; type: string }) {
    aiImageGenerator.setConfig(config)
  }

  /**
   * 测试AI连接
   */
  async testAIConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    return await aiImageGenerator.testConnection()
  }

  /**
   * 检查AI是否已配置
   */
  isAIConfigured(): boolean {
    return aiImageGenerator.isConfigured()
  }

  /**
   * 从本地配置加载AI设置
   */
  async loadAIConfig() {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.config?.image_generation) {
          const activeProvider = data.config.image_generation.active_provider
          const provider = data.config.image_generation.providers[activeProvider]

          if (provider && provider.api_key && provider.base_url) {
            this.configureAI({
              api_key: provider.api_key,
              base_url: provider.base_url,
              model: provider.model,
              type: provider.type
            })
            return true
          }
        }
      }
    } catch (error) {
      console.warn('加载AI配置失败:', error)
    }

    return false
  }
}

// 单例实例
export const imageManager = new ImageManager()

// 导出类型
export type { ImageManager }