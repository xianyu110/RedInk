/**
 * API 适配器 - 统一不同 AI 提供商的 API 格式
 * 自动处理端点路径、请求格式和响应解析
 */

export interface ApiProvider {
  name: string
  type: 'text' | 'image'
  endpoints: {
    chat?: string  // 聊天/对话接口
    completions?: string  // 文本补全接口
    imageGen?: string  // 图片生成接口
    vision?: string  // 视觉理解接口
  }
  format: 'openai' | 'gemini' | 'custom'
  defaultModel: string
  features: {
    supportsImages: boolean  // 是否支持图片输入
    supportsStreaming: boolean  // 是否支持流式输出
    supportsReference: boolean  // 是否支持参考图片
    imageSizes?: string[]  // 支持的图片尺寸
  }
}

// API 提供商配置
export const API_PROVIDERS: Record<string, ApiProvider> = {
  // OpenAI 兼容提供商
  openai: {
    name: 'OpenAI',
    type: 'text',
    endpoints: {
      chat: '/chat/completions',
      completions: '/completions'
    },
    format: 'openai',
    defaultModel: 'gpt-4o',
    features: {
      supportsImages: true,
      supportsStreaming: true,
      supportsReference: true
    }
  },

  // Gemini
  gemini: {
    name: 'Gemini',
    type: 'text',
    endpoints: {
      chat: '/chat/completions',  // 使用兼容接口
      vision: '/v1beta/models/{model}:generateContent'
    },
    format: 'gemini',
    defaultModel: 'gemini-2.0-flash',
    features: {
      supportsImages: true,
      supportsStreaming: false,
      supportsReference: true
    }
  },

  // Gemini 图片生成（原生 API）
  'gemini-image': {
    name: 'Gemini Image',
    type: 'image',
    endpoints: {
      imageGen: '/v1beta/models/{model}:generateContent'
    },
    format: 'gemini',
    defaultModel: 'gemini-3-pro-image-preview',
    features: {
      supportsImages: false,  // 输入不支持图片
      supportsStreaming: false,
      supportsReference: true,
      imageSizes: ['1024x1024', '1024x1365', '2048x2048']
    }
  },

  // DALL-E (OpenAI)
  'dall-e': {
    name: 'DALL-E',
    type: 'image',
    endpoints: {
      imageGen: '/images/generations'
    },
    format: 'openai',
    defaultModel: 'dall-e-3',
    features: {
      supportsImages: false,
      supportsStreaming: false,
      supportsReference: false,
      imageSizes: ['1024x1024', '1024x1792', '1792x1024']
    }
  },

  // 即梦 Jimeng
  jimeng: {
    name: 'Jimeng',
    type: 'image',
    endpoints: {
      chat: '/chat/completions'  // 使用 chat 格式生成图片
    },
    format: 'openai',  // 兼容 OpenAI 格式
    defaultModel: 'jimeng-4.5',
    features: {
      supportsImages: true,
      supportsStreaming: false,
      supportsReference: true,
      imageSizes: ['1024x1365', '1024x1024', '2048x2048', '1365x1024']
    }
  },

  // Doubao (豆包)
  doubao: {
    name: 'Doubao',
    type: 'text',
    endpoints: {
      chat: '/chat/completions'
    },
    format: 'openai',
    defaultModel: 'doubao-pro-4k',
    features: {
      supportsImages: true,
      supportsStreaming: true,
      supportsReference: true
    }
  },

  // Doubao Seedream (豆包文生图)
  'doubao-seedream': {
    name: 'Doubao Seedream',
    type: 'image',
    endpoints: {
      chat: '/chat/completions'  // 使用 chat 格式
    },
    format: 'openai',
    defaultModel: 'doubao-seedream-4-0-250828',
    features: {
      supportsImages: true,
      supportsStreaming: false,
      supportsReference: true,
      imageSizes: ['1024x1024', '1024x1365', '2048x2048']
    }
  },
}

/**
 * API 适配器类
 */
export class ApiAdapter {
  /**
   * 获取完整的 API 端点 URL
   */
  static getEndpointUrl(
    baseURL: string,
    provider: string,
    endpointType: 'chat' | 'completions' | 'imageGen' | 'vision',
    model?: string
  ): string {
    const providerConfig = API_PROVIDERS[provider]
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`)
    }

    let endpoint = providerConfig.endpoints[endpointType]
    if (!endpoint) {
      // 回退到 chat 端点
      endpoint = providerConfig.endpoints.chat
      if (!endpoint) {
        throw new Error(`Provider ${provider} does not support ${endpointType}`)
      }
    }

    // 替换模型占位符
    if (endpoint.includes('{model}')) {
      if (!model) {
        model = providerConfig.defaultModel
      }
      endpoint = endpoint.replace('{model}', model)
    }

    // 确保 baseURL 和 endpoint 正确拼接
    if (baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1)
    }
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint
    }

    return baseURL + endpoint
  }

  /**
   * 转换请求格式以适配不同的提供商
   */
  static transformRequest(
    data: any,
    provider: string,
    requestType: 'chat' | 'imageGen'
  ): any {
    const providerConfig = API_PROVIDERS[provider]
    if (!providerConfig) {
      return data
    }

    switch (providerConfig.format) {
      case 'openai':
        // OpenAI 格式，直接返回
        return data

      case 'gemini':
        // Gemini 原生格式转换
        if (requestType === 'imageGen') {
          return this.transformToGeminiImageFormat(data)
        }
        // Chat 格式在大多数情况下兼容 OpenAI
        return data

      default:
        return data
    }
  }

  /**
   * 转换为 Gemini 原生图片生成格式
   */
  private static transformToGeminiImageFormat(data: any): any {
    const { prompt, size, aspectRatio } = data

    const generationConfig: any = {
      responseModalities: ['IMAGE']
    }

    if (size) {
      if (size === '1024x1365') {
        generationConfig.imageConfig = { aspectRatio: '3:4' }
      } else if (size === '1365x1024') {
        generationConfig.imageConfig = { aspectRatio: '4:3' }
      } else if (size === '1024x1024') {
        generationConfig.imageConfig = { aspectRatio: '1:1' }
      } else if (size === '2048x2048') {
        generationConfig.imageConfig = { aspectRatio: '1:1' }
      }
    } else if (aspectRatio) {
      generationConfig.imageConfig = { aspectRatio }
    }

    return {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig
    }
  }

  /**
   * 解析响应并提取所需数据
   */
  static parseResponse(
    response: any,
    provider: string,
    requestType: 'chat' | 'imageGen'
  ): any {
    const providerConfig = API_PROVIDERS[provider]
    if (!providerConfig) {
      return response
    }

    switch (providerConfig.format) {
      case 'openai':
        // OpenAI 格式
        if (requestType === 'imageGen') {
          // 尝试从不同位置提取图片 URL
          if (response.data?.[0]?.url) {
            return { imageUrl: response.data[0].url }
          } else if (response.choices?.[0]?.message?.content) {
            // 从消息内容中提取 URL
            const content = response.choices[0].message.content
            const urlMatch = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/gi)
            if (urlMatch?.[0]) {
              return { imageUrl: urlMatch[0] }
            }
            // 尝试 markdown 格式
            const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/i)
            if (markdownMatch?.[1]) {
              return { imageUrl: markdownMatch[1] }
            }
          }
        }
        return response

      case 'gemini':
        // Gemini 原生格式
        if (requestType === 'imageGen' && response.candidates?.[0]?.content?.parts) {
          const imagePart = response.candidates[0].content.parts.find(
            (part: any) => part.inlineData
          )
          if (imagePart?.inlineData?.data) {
            return {
              imageUrl: `data:image/png;base64,${imagePart.inlineData.data}`
            }
          }
        }
        return response

      default:
        return response
    }
  }

  /**
   * 根据提供商检测类型
   */
  static detectProvider(model: string, baseURL: string): string {
    // 从模型名检测
    if (model.includes('gpt') || model.includes('dall-e')) {
      return 'openai'
    } else if (model.includes('gemini')) {
      if (model.includes('image')) {
        return 'gemini-image'
      }
      return 'gemini'
    } else if (model.includes('jimeng')) {
      return 'jimeng'
    } else if (model.includes('doubao')) {
      if (model.includes('seedream')) {
        return 'doubao-seedream'
      }
      return 'doubao'
    }

    // 从 baseURL 检测
    if (baseURL.includes('generativelanguage.googleapis.com')) {
      return 'gemini'
    }

    // 默认返回 openai
    return 'openai'
  }

  /**
   * 获取提供商支持的图片尺寸
   */
  static getSupportedImageSizes(provider: string): string[] {
    const providerConfig = API_PROVIDERS[provider]
    return providerConfig?.features?.imageSizes || []
  }

  /**
   * 检查提供商是否支持某个特性
   */
  static supportsFeature(provider: string, feature: 'images' | 'streaming' | 'reference'): boolean {
    const providerConfig = API_PROVIDERS[provider]
    if (!providerConfig) {
      return false
    }

    switch (feature) {
      case 'images':
        return providerConfig.features.supportsImages
      case 'streaming':
        return providerConfig.features.supportsStreaming
      case 'reference':
        return providerConfig.features.supportsReference
      default:
        return false
    }
  }
}