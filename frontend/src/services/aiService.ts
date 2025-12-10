/**
 * AI 服务 - 直接调用 AI API
 * 使用 ApiAdapter 统一处理不同提供商
 */
import { useLocalConfigStore } from '@/stores/localConfig'
import type { Page } from '@/api'
import { ApiAdapter } from '@/utils/apiAdapter'

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试的 fetch 请求
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API 请求尝试 ${attempt}/${maxRetries}:`, url)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // 如果响应成功，直接返回
      if (response.ok) {
        return response
      }

      // 如果是客户端错误（4xx），不重试
      if (response.status >= 400 && response.status < 500) {
        console.error(`客户端错误 ${response.status}，不进行重试`)
        return response
      }

      // 如果是服务器错误（5xx）或网络问题，准备重试
      console.error(`服务器错误 ${response.status}，第 ${attempt} 次尝试失败`)

    } catch (error: any) {
      lastError = error

      if (error.name === 'AbortError') {
        console.error(`请求超时，第 ${attempt} 次尝试失败`)
      } else {
        console.error(`网络错误，第 ${attempt} 次尝试失败:`, error.message)
      }

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        console.log(`等待 ${retryDelay}ms 后重试...`)
        await delay(retryDelay)
        retryDelay *= 2 // 指数退避
      }
    }
  }

  throw lastError || new Error('请求失败')
}

/**
 * 解析大纲文本
 */
function parseOutline(outlineText: string): Page[] {
  const pages: Page[] = []
  const sections = outlineText.split(/【第\d+页】/)

  sections.forEach((section, index) => {
    if (section.trim()) {
      const content = section.trim()
      // 移除可能的页码标题
      const cleanContent = content.replace(/^【第\d+页】\s*/, '').trim()

      if (cleanContent) {
        pages.push({
          id: Date.now() + index,
          content: cleanContent,
          imageUrl: ''
        })
      }
    }
  })

  return pages
}

/**
 * 直接调用 AI API 生成大纲
 */
export async function generateOutlineWithAI(topic: string, images?: File[]): Promise<{
  success: boolean
  outline?: string
  pages?: Page[]
  imageAnalysis?: string
  error?: string
}> {
  try {
    const localConfigStore = useLocalConfigStore()
    const apiConfig = localConfigStore.getApiConfig('text')

    if (!apiConfig || !apiConfig.apiKey) {
      return {
        success: false,
        error: '请先在系统设置中配置文本生成 API Key'
      }
    }

    // 构建提示词
    let prompt = `请为以下主题生成小红书图文内���大纲：

主题：${topic}

要求：
1. 生成3-5页内容
2. 每页内容50-100字
3. 内容要有吸引力，适合小红书平台
4. 使用【第1页】、【第2页】等格式分隔

请直接生成大纲，不需要额外解释。`

    // 如果有参考图片，分析图片内容
    let imageAnalysis = ''
    if (images && images.length > 0) {
      try {
        // 获取视觉分析 API 配置
        const visionConfig = localConfigStore.getApiConfig('text')

        if (visionConfig && ApiAdapter.supportsFeature(
          ApiAdapter.detectProvider(visionConfig.model || '', visionConfig.baseURL),
          'images'
        )) {
          // 转换图片为 base64
          const imagePromises = images.map(file => {
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => {
                const base64 = e.target?.result as string
                resolve({
                  type: "image_url",
                  image_url: {
                    url: base64
                  }
                })
              }
              reader.readAsDataURL(file)
            })
          })

          const convertedImages = await Promise.all(imagePromises)

          // 构建视觉分析请求
          const visionProvider = ApiAdapter.detectProvider(visionConfig.model || '', visionConfig.baseURL)
          const visionUrl = ApiAdapter.getEndpointUrl(visionConfig.baseURL, visionProvider, 'chat')

          const visionRequest = {
            model: visionConfig.model || 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: '分析这些图片的内容、风格和主题，为生成小红书内容提供参考。'
                  },
                  ...convertedImages
                ]
              }
            ]
          }

          const visionResponse = await fetchWithRetry(visionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${visionConfig.apiKey}`
            },
            body: JSON.stringify(visionRequest)
          })

          if (visionResponse.ok) {
            const visionData = await visionResponse.json()
            imageAnalysis = visionData.choices?.[0]?.message?.content || ''
            prompt += `\n\n参考图片分析：${imageAnalysis}`
          }
        }
      } catch (e) {
        console.log('Vision API 调用失败，使用普通模式生成')
      }
    }

    // 检测提供商并调用 API
    const provider = ApiAdapter.detectProvider(apiConfig.model || '', apiConfig.baseURL)
    const endpointUrl = ApiAdapter.getEndpointUrl(apiConfig.baseURL, provider, 'chat')

    const requestData = {
      model: apiConfig.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }

    // 转换请求格式
    const transformedData = ApiAdapter.transformRequest(requestData, provider, 'chat')

    // 调用 API
    const response = await fetchWithRetry(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify(transformedData)
    })

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: `API 调用失败: ${response.status} ${error}`
      }
    }

    const data = await response.json()
    const outlineText = data.choices[0].message.content

    // 解析大纲
    const pages = parseOutline(outlineText)

    return {
      success: true,
      outline: outlineText,
      pages,
      imageAnalysis
    }
  } catch (error: any) {
    console.error('生成大纲失败:', error)
    return {
      success: false,
      error: error.message || '生成大纲失败'
    }
  }
}

/**
 * 使用 AI 生成图片
 */
export async function generateImageWithAI(
  title: string,
  content?: string,
  referenceImages?: File[],
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean
  imageUrl?: string
  error?: string
}> {
  try {
    const localConfigStore = useLocalConfigStore()
    const apiConfig = localConfigStore.getApiConfig('image')

    if (!apiConfig || !apiConfig.apiKey) {
      return {
        success: false,
        error: '请先在系统设置中配置图片生成 API Key'
      }
    }

    // 构建提示词
    let optimizedPrompt = content || title
    if (!optimizedPrompt) {
      return {
        success: false,
        error: '请提供图片生成内容'
      }
    }

    // 添加小红书优化
    optimizedPrompt = `Create a beautiful, professional illustration for social media post. Content: ${optimizedPrompt}. Style: modern, clean, eye-catching, suitable for Xiaohongshu (Little Red Book) platform.`

    // 处理参考图片
    let imageContent: any[] = []
    if (referenceImages && referenceImages.length > 0) {
      const imagePromises = referenceImages.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            resolve({
              type: "image_url",
              image_url: {
                url: base64
              }
            })
          }
          reader.readAsDataURL(file)
        })
      })

      const convertedImages = await Promise.all(imagePromises)
      imageContent = convertedImages

      optimizedPrompt = `${optimizedPrompt}

IMPORTANT: Use the provided reference images as visual guidance for style, composition, and content.`
    }

    // 使用适配器检测提供商
    const provider = ApiAdapter.detectProvider(apiConfig.model || '', apiConfig.baseURL)
    console.log('检测到的图片生成提供商:', provider)

    // 获取端点并构建请求
    const endpointUrl = ApiAdapter.getEndpointUrl(apiConfig.baseURL, provider, 'chat', apiConfig.model)

    // 构建消息内容
    const messageContent: any[] = [
      {
        type: 'text',
        text: optimizedPrompt
      }
    ]

    // 添加参考图片（如果支持）
    if (imageContent.length > 0 && ApiAdapter.supportsFeature(provider, 'reference')) {
      messageContent.push(...imageContent)
    }

    // 构建请求
    const requestData = {
      model: apiConfig.model,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      ...(provider === 'dall-e' && {
        size: '1024x1024',
        quality: 'standard',
        n: 1
      }),
      ...(provider === 'jimeng' && {
        temperature: 0.7,
        max_tokens: 2000
      })
    }

    // 转换请求格式
    const transformedData = ApiAdapter.transformRequest(requestData, provider, 'imageGen')
    console.log(`${provider} 请求参数:`, transformedData)

    // 调用 API
    const response = await fetchWithRetry(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify(transformedData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${provider} API 错误:`, errorText)

      let errorMsg = `图片生成失败: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        errorMsg = errorData.error?.message || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }

      return {
        success: false,
        error: errorMsg
      }
    }

    const data = await response.json()
    console.log(`${provider} API 响应:`, data)

    // 使用适配器解析响应
    const parsedResponse = ApiAdapter.parseResponse(data, provider, 'imageGen')

    if (parsedResponse.imageUrl) {
      return {
        success: true,
        imageUrl: parsedResponse.imageUrl
      }
    } else {
      console.error(`${provider} API 返回格式:`, JSON.stringify(data, null, 2))
      return {
        success: false,
        error: `${provider} API 返回格式错误，未找到图片`
      }
    }

  } catch (error: any) {
    console.error('图片生成异常:', error)

    // 根据错误类型提供更友好的提示
    let errorMessage = '图片生成失败'

    if (error.name === 'AbortError') {
      errorMessage = '请求超时，请检查网络连接后重试'
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = '网络连接失败，请检查网络或 API 端点是否正确'
    } else if (error.message?.includes('ERR_CONNECTION_CLOSED')) {
      errorMessage = '连接被服务器关闭，请稍后重试'
    } else if (error.message?.includes('404')) {
      errorMessage = 'API 端点不存在，请检查 API 配置'
    } else if (error.message?.includes('401')) {
      errorMessage = 'API 密钥无效，请检查配置'
    } else if (error.message?.includes('429')) {
      errorMessage = '请求过于频繁，请稍后再试'
    } else if (error.message?.includes('500')) {
      errorMessage = '服务器内部错误，请稍后重试'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * 批量生成图片
 */
export async function generateImagesForPages(
  pages: Page[],
  onProgress: (index: number, status: 'generating' | 'done' | 'error', url?: string, error?: string) => void,
  getReferenceImages?: (pageIndex: number) => File[]
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    onProgress(i, 'generating')

    // 获取页面对应的参考图片
    const referenceImages = getReferenceImages ? getReferenceImages(i) : undefined

    // 使用页面内容生成图片
    const result = await generateImageWithAI('', page.content, referenceImages)

    if (result.success && result.imageUrl) {
      onProgress(i, 'done', result.imageUrl)
    } else {
      onProgress(i, 'error', undefined, result.error)
    }

    // 添加延迟避免 API 限流
    if (i < pages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

/**
 * 重新生成单张图片
 */
export async function regenerateSingleImage(
  page: Page,
  onProgress: (status: 'generating' | 'done' | 'error', url?: string, error?: string) => void,
  referenceImages?: File[]
): Promise<void> {
  onProgress('generating')

  const result = await generateImageWithAI('', page.content, referenceImages)

  if (result.success && result.imageUrl) {
    onProgress('done', result.imageUrl)
  } else {
    onProgress('error', undefined, result.error)
  }
}

// ===== 小红书内容生成功能 =====

/**
 * 生成小红书标题
 */
export async function generateTitles(topic: string, outline: string) {
  try {
    const config = await getAIConfig()
    if (!config) {
      return { success: false, error: '请先配置 API Key' }
    }

    const prompt = `为以下主题生成5个小红书风格的标题，要求：
1. 简洁吸引人，15-20字以内
2. 使用emoji表情增加吸引力
3. 包含热门标签或关键词
4. 符合小红书平台的调性

主题：${topic}
大纲：${outline}

请直接返回5个标题，每行一个：`

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      })
    })

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const titles = data.choices[0].message.content
        .split('\n')
        .filter((t: string) => t.trim())
        .map((t: string) => t.trim().replace(/^\d+\.\s*/, ''))
        .slice(0, 5)

      return { success: true, titles }
    } else {
      return { success: false, error: data.error?.message || '生成失败' }
    }
  } catch (error: any) {
    return { success: false, error: error.message || '生成失败' }
  }
}

/**
 * 生成小红书文案
 */
export async function generateCaptions(pages: Page[], topic: string) {
  try {
    const config = await getAIConfig()
    if (!config) {
      return { success: false, error: '请先配置 API Key' }
    }

    const captions = []

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const prompt = `为以下内容生成小红书风格的文案：
主题：${topic}
内容：${page.content}

要求：
1. 100-150字
2. 亲切自然的语气
3. 适当使用emoji
4. 包含实用信息或个人感受
5. 适合配图发布`

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      const data = await response.json()

      if (data.choices && data.choices[0]) {
        captions.push(data.choices[0].message.content.trim())
      } else {
        captions.push('文案生成失败')
      }

      // 避免API限流
      if (i < pages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return { success: true, captions }
  } catch (error: any) {
    return { success: false, error: error.message || '生成失败' }
  }
}

/**
 * 生成小红书标签
 */
export async function generateTags(topic: string, captions: string[]) {
  try {
    const config = await getAIConfig()
    if (!config) {
      return { success: false, error: '请先配置 API Key' }
    }

    const captionsText = captions.join('\n')
    const prompt = `根据以下主题和文案，生成10-15个小红书热门标签：
主题：${topic}
文案概要：${captionsText}

要求：
1. 包含主题相关的核心标签
2. 添加流行的生活/美学类标签
3. 使用#格式
4. 每行一个标签
5. 优先选择小红书平台热门标签

请直接返回标签列表：`

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      })
    })

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const tags = data.choices[0].message.content
        .split('\n')
        .filter((t: string) => t.trim())
        .map((t: string) => t.trim())
        .slice(0, 15)

      return { success: true, tags }
    } else {
      return { success: false, error: data.error?.message || '生成失败' }
    }
  } catch (error: any) {
    return { success: false, error: error.message || '生成失败' }
  }
}