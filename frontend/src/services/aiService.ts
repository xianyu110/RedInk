/**
 * AI 服务 - 直接调用 AI API
 */
import { useLocalConfigStore } from '@/stores/localConfig'
import type { Page } from '@/api'

/**
 * 直接调用 OpenAI 兼容 API 生成大纲
 */
export async function generateOutlineWithAI(topic: string, images?: File[]): Promise<{
  success: boolean
  outline?: string
  pages?: Page[]
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
    let prompt = `请为以下主题生成小红书图文内容大纲：

主题：${topic}

要求：
1. 生成 5-8 页内容
2. 第一页是封面（type: cover），包含标题和副标题
3. 中间页是内容页（type: content），每页一个要点
4. 最后一页是总结（type: summary）
5. 每页内容简洁有力，适合配图

请按以下格式输出，每页之间用 <page> 分隔：

【封面】
标题：[吸引人的标题]
副标题：[简短说明]

<page>

【第1页】
[第一个要点的详细内容]

<page>

...以此类推`

    // 如果有图片，添加图片说明
    if (images && images.length > 0) {
      prompt += `\n\n注意：用户上传了 ${images.length} 张参考图片，请结合图片内容生成大纲。`
    }

    // 调用 OpenAI 兼容 API
    const apiUrl = apiConfig.baseURL.endsWith('/v1')
      ? `${apiConfig.baseURL}/chat/completions`
      : `${apiConfig.baseURL}/v1/chat/completions`
    
    console.log('调用文本生成 API:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
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
      pages
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '生成大纲失败'
    }
  }
}

/**
 * 解析大纲文本为页面数组
 */
function parseOutline(outlineText: string): Page[] {
  const pages: Page[] = []
  const sections = outlineText.split(/<page>/i).map(s => s.trim()).filter(Boolean)

  sections.forEach((section, index) => {
    let type: 'cover' | 'content' | 'summary' = 'content'

    // 判断页面类型
    if (index === 0 || section.includes('封面') || section.includes('标题')) {
      type = 'cover'
    } else if (index === sections.length - 1 || section.includes('总结') || section.includes('结语')) {
      type = 'summary'
    }

    pages.push({
      index,
      type,
      content: section
    })
  })

  return pages
}

/**
 * 直接调用图片生成 API
 */
export async function generateImageWithAI(
  prompt: string,
  pageContent?: string,
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

    // 优化提示词
    const optimizedPrompt = pageContent 
      ? `Create a beautiful, professional illustration for social media post. Content: ${pageContent.substring(0, 300)}. Style: modern, clean, eye-catching, suitable for Xiaohongshu (Little Red Book) platform.`
      : prompt

    // 调用图片生成 API
    const apiUrl = apiConfig.baseURL.endsWith('/v1') 
      ? `${apiConfig.baseURL}/images/generations`
      : `${apiConfig.baseURL}/v1/images/generations`
    
    console.log('调用图片生成 API:', apiUrl)
    console.log('提示词:', optimizedPrompt)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model || 'dall-e-3',
        prompt: optimizedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = `图片生成失败: ${response.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMsg = errorData.error?.message || errorMsg
        console.error('API 错误响应:', errorData)
      } catch {
        errorMsg = errorText || errorMsg
        console.error('API 错误文本:', errorText)
      }
      
      return {
        success: false,
        error: errorMsg
      }
    }

    const data = await response.json()
    console.log('图片生成成功:', data)
    const imageUrl = data.data[0].url

    return {
      success: true,
      imageUrl
    }
  } catch (error: any) {
    console.error('图片生成异常:', error)
    
    // 检查是否是网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: '网络连接失败，请检查：1) API 地址是否正确 2) 是否存在 CORS 跨域问题 3) 网络连接是否正常'
      }
    }
    
    return {
      success: false,
      error: error.message || '图片生成失败'
    }
  }
}

/**
 * 批量生成图片
 */
export async function generateImagesForPages(
  pages: Page[],
  onProgress: (index: number, status: 'generating' | 'done' | 'error', url?: string, error?: string) => void
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    
    onProgress(i, 'generating')

    // 使用页面内容生成图片
    const result = await generateImageWithAI('', page.content)

    if (result.success && result.imageUrl) {
      onProgress(i, 'done', result.imageUrl)
    } else {
      onProgress(i, 'error', undefined, result.error)
    }

    // 添加延迟避免 API 限流（DALL-E 3 有速率限制）
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
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean
  imageUrl?: string
  error?: string
}> {
  return await generateImageWithAI('', page.content, onProgress)
}
