/**
 * AI 图片生成器 - 完全依赖前端配置的API服务
 */

export interface AIImageConfig {
  api_key: string
  base_url: string
  model: string
  type: string
  high_concurrency?: boolean
  short_prompt?: boolean
}

export interface ImageGenerationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'png' | 'jpeg'
  style?: string
}

class AIImageGenerator {
  private config: AIImageConfig | null = null

  /**
   * 设置 AI 配置
   */
  setConfig(config: AIImageConfig) {
    this.config = config
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!(this.config?.api_key && this.config?.base_url)
  }

  /**
   * 使用 AI 生成图片
   */
  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AI 图片生成服务未配置，请在设置中配置 API' }
    }

    try {
      const { width = 512, height = 512 } = options

      // 构建增强的图片生成提示词
      const enhancedPrompt = this.buildImagePrompt(prompt, width, height)

      console.log('开始调用 AI API 生成图片:', {
        endpoint: `${this.config!.base_url}/v1beta/models/${this.config!.model}:generateContent`,
        model: this.config!.model,
        prompt: enhancedPrompt.substring(0, 100) + '...'
      })

      // 使用 Gemini API 生成图片
      const requestBody = {
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }

      const response = await fetch(`${this.config!.base_url}/v1beta/models/${this.config!.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config!.api_key}`,
        },
        body: JSON.stringify(requestBody)
      })

      console.log('API 响应状态:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API 错误响应:', errorData)
        throw new Error(`AI 图片生成失败: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      console.log('AI API 响应数据:', data)

      // 解析响应，获取生成的图片
      const imageUrl = this.parseImageResponse(data)

      if (!imageUrl) {
        throw new Error('无法从 AI 响应中获取生成的图片')
      }

      console.log('AI 生成的图片:', imageUrl)
      return { success: true, url: imageUrl }

    } catch (error) {
      console.error('AI 图片生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI 图片生成失败'
      }
    }
  }

  /**
   * 批量生成图片
   */
  async generateImages(
    prompts: string[],
    options: ImageGenerationOptions = {},
    onProgress?: (index: number, total: number) => void
  ): Promise<Array<{ success: boolean; url?: string; error?: string }>> {
    const results = []

    for (let i = 0; i < prompts.length; i++) {
      onProgress?.(i + 1, prompts.length)

      const result = await this.generateImage(prompts[i], options)
      results.push(result)

      // 添加延迟以避免 API 限制
      if (i < prompts.length - 1) {
        await this.delay(1000)
      }
    }

    return results
  }

  /**
   * 构建图片生成提示词
   */
  private buildImagePrompt(prompt: string, width: number, height: number): string {
    const aspectRatio = width === height ? '正方形' : width > height ? '横向' : '纵向'

    return `请为以下内容生成一张高质量的图片："${prompt}"

图片要求：
- 尺寸：${width}x${height} (${aspectRatio})
- 风格：现代、简洁、专业的摄影风格
- 用途：小红书社交媒体配图
- 色彩：明亮、吸引人、具有视觉冲击力
- 构图：主体突出，背景简洁
- 质量：高分辨率，细节清晰
- 氛围：积极、引人入胜、生活方式导向

请生成一张适合社交媒体分享的精美图片。如果可能，请直接生成图片内容。`
  }

  /**
   * 解析图片API响应
   */
  private parseImageResponse(data: any): string | null {
    try {
      console.log('解析图片API响应:', data)

      // 尝试解析标准图片生成API响应格式
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const firstImage = data.data[0]

        // 如果返回的是URL
        if (firstImage.url) {
          return firstImage.url
        }

        // 如果返回的是base64数据
        if (firstImage.b64_json) {
          return `data:image/png;base64,${firstImage.b64_json}`
        }
      }

      // 尝试解析 Gemini 格式的响应
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts
        const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'))

        if (imagePart?.inlineData?.data) {
          const mimeType = imagePart.inlineData.mimeType
          const base64Data = imagePart.inlineData.data
          return `data:${mimeType};base64,${base64Data}`
        }
      }

      // 尝试其他可能的响应格式
      if (data.image_url) {
        return data.image_url
      }

      if (data.url) {
        return data.url
      }

      console.warn('未找到支持的图片响应格式:', data)
      return null

    } catch (error) {
      console.error('解析图片响应失败:', error)
      return null
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: '配置不完整' }
    }

    try {
      // 使用简单的测试请求
      const testPrompt = "测试图片"
      const result = await this.generateImage(testPrompt, { width: 256, height: 256 })

      if (result.success) {
        return { success: true, message: 'AI 图片生成服务连接成功' }
      } else {
        return { success: false, error: result.error || '连接测试失败' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '连接测试失败'
      }
    }
  }
}

// 单例实例
export const aiImageGenerator = new AIImageGenerator()

// 导出类型
export type { AIImageGenerator }