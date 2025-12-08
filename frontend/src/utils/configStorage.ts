/**
 * 前端配置存储工具
 * 支持加密存储敏感信息（如 API Keys）
 */

// 简单的 XOR 加密（仅用于前端存储，不能用于真正的安全保护）
const XOR_KEY = 'redink-2024-xor-key'

function xorEncrypt(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
    )
  }
  return btoa(result) // Base64 编码
}

function xorDecrypt(encryptedText: string): string {
  const text = atob(encryptedText) // Base64 解码
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
    )
  }
  return result
}

export interface ProviderConfig {
  // API 密钥
  apiKey?: string
  // API 端点
  baseURL?: string
  // 模型名称
  model?: string
  // 是否高并发
  highConcurrency?: boolean
  // 其他配置
  [key: string]: any
}

export interface FrontendConfig {
  // 文本生成配置
  textGeneration: {
    activeProvider: string
    providers: Record<string, ProviderConfig>
  }
  // 图片生成配置
  imageGeneration: {
    activeProvider: string
    providers: Record<string, ProviderConfig>
  }
  // 其他设置
  preferences: {
    // 是否使用本地配置（优先于后端配置）
    useLocalConfig: boolean
    // 是否在测试时显示真实 API Key
    showApiKeyInTest: boolean
    // 默认并发设置
    defaultHighConcurrency: boolean
  }
}

const DEFAULT_CONFIG: FrontendConfig = {
  textGeneration: {
    activeProvider: 'openai',
    providers: {
      openai: {
        apiKey: '',
        baseURL: 'https://apipro.maynor1024.live/v1',
        model: 'gpt-4o'
      },
      gemini: {
        apiKey: '',
        baseURL: 'https://apipro.maynor1024.live',
        model: 'gemini-2.0-flash'
      }
    }
  },
  imageGeneration: {
    activeProvider: 'gemini',
    providers: {
      gemini: {
        apiKey: '',
        baseURL: 'https://apipro.maynor1024.live',
        model: 'gemini-3-pro-image-preview',
        highConcurrency: false
      },
      openai: {
        apiKey: '',
        baseURL: 'https://apipro.maynor1024.live/v1',
        model: 'dall-e-3',
        highConcurrency: false
      }
    }
  },
  preferences: {
    useLocalConfig: false,
    showApiKeyInTest: false,
    defaultHighConcurrency: false
  }
}

const STORAGE_KEY = 'redink-user-config'

export class ConfigStorage {
  /**
   * 保存配置到本地存储
   */
  static save(config: FrontendConfig): void {
    try {
      // 创建配置副本，加密敏感信息
      const configToSave = JSON.parse(JSON.stringify(config))

      // 加密 API Keys
      for (const providerConfig of Object.values(configToSave.textGeneration.providers)) {
        if (providerConfig.apiKey) {
          providerConfig.apiKey = xorEncrypt(providerConfig.apiKey)
        }
      }

      for (const providerConfig of Object.values(configToSave.imageGeneration.providers)) {
        if (providerConfig.apiKey) {
          providerConfig.apiKey = xorEncrypt(providerConfig.apiKey)
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  /**
   * 从本地存储加载配置
   */
  static load(): FrontendConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return DEFAULT_CONFIG
      }

      const config = JSON.parse(stored)

      // 解密 API Keys
      for (const providerConfig of Object.values(config.textGeneration.providers)) {
        if (providerConfig.apiKey) {
          providerConfig.apiKey = xorDecrypt(providerConfig.apiKey)
        }
      }

      for (const providerConfig of Object.values(config.imageGeneration.providers)) {
        if (providerConfig.apiKey) {
          providerConfig.apiKey = xorDecrypt(providerConfig.apiKey)
        }
      }

      return config
    } catch (error) {
      console.error('加载配置失败:', error)
      return DEFAULT_CONFIG
    }
  }

  /**
   * 清除本地配置
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 导出配置（不包含敏感信息）
   */
  static export(): string {
    const config = this.load()
    const exportConfig = {
      textGeneration: {
        activeProvider: config.textGeneration.activeProvider,
        providers: {}
      },
      imageGeneration: {
        activeProvider: config.imageGeneration.activeProvider,
        providers: {}
      },
      preferences: config.preferences
    }

    // 复制配置但不包含 API Keys
    for (const [name, provider] of Object.entries(config.textGeneration.providers)) {
      const { apiKey, ...safeConfig } = provider
      exportConfig.textGeneration.providers[name] = safeConfig
    }

    for (const [name, provider] of Object.entries(config.imageGeneration.providers)) {
      const { apiKey, ...safeConfig } = provider
      exportConfig.imageGeneration.providers[name] = safeConfig
    }

    return JSON.stringify(exportConfig, null, 2)
  }

  /**
   * 导入配置
   */
  static import(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson)
      const currentConfig = this.load()

      // 合并导入的配置，但保留现有的 API Keys
      if (imported.textGeneration) {
        currentConfig.textGeneration.activeProvider = imported.textGeneration.activeProvider
        if (imported.textGeneration.providers) {
          for (const [name, provider] of Object.entries(imported.textGeneration.providers)) {
            if (currentConfig.textGeneration.providers[name]) {
              const existingKey = currentConfig.textGeneration.providers[name].apiKey
              currentConfig.textGeneration.providers[name] = {
                ...currentConfig.textGeneration.providers[name],
                ...provider
              }
              // 如果导入的配置没有 API Key，使用现有的
              if (!currentConfig.textGeneration.providers[name].apiKey) {
                currentConfig.textGeneration.providers[name].apiKey = existingKey
              }
            }
          }
        }
      }

      if (imported.imageGeneration) {
        currentConfig.imageGeneration.activeProvider = imported.imageGeneration.activeProvider
        if (imported.imageGeneration.providers) {
          for (const [name, provider] of Object.entries(imported.imageGeneration.providers)) {
            if (currentConfig.imageGeneration.providers[name]) {
              const existingKey = currentConfig.imageGeneration.providers[name].apiKey
              currentConfig.imageGeneration.providers[name] = {
                ...currentConfig.imageGeneration.providers[name],
                ...provider
              }
              // 如果导入的配置没有 API Key，使用现有的
              if (!currentConfig.imageGeneration.providers[name].apiKey) {
                currentConfig.imageGeneration.providers[name].apiKey = existingKey
              }
            }
          }
        }
      }

      if (imported.preferences) {
        currentConfig.preferences = { ...currentConfig.preferences, ...imported.preferences }
      }

      this.save(currentConfig)
      return true
    } catch (error) {
      console.error('导入配置失败:', error)
      return false
    }
  }
}

// 从环境变量加载默认配置
export function loadEnvDefaults(): FrontendConfig {
  const config = { ...DEFAULT_CONFIG }

  // 从环境变量加载 API 端点
  if (import.meta.env.VITE_OPENAI_BASE_URL) {
    config.textGeneration.providers.openai.baseURL = import.meta.env.VITE_OPENAI_BASE_URL
    config.imageGeneration.providers.openai.baseURL = import.meta.env.VITE_OPENAI_BASE_URL
  }

  if (import.meta.env.VITE_GEMINI_API_URL) {
    config.textGeneration.providers.gemini.baseURL = import.meta.env.VITE_GEMINI_API_URL
    config.imageGeneration.providers.gemini.baseURL = import.meta.env.VITE_GEMINI_API_URL
  }

  // 从环境变量加载模型
  if (import.meta.env.VITE_OPENAI_MODEL) {
    config.textGeneration.providers.openai.model = import.meta.env.VITE_OPENAI_MODEL
  }

  if (import.meta.env.VITE_GEMINI_MODEL) {
    config.textGeneration.providers.gemini.model = import.meta.env.VITE_GEMINI_MODEL
  }

  if (import.meta.env.VITE_IMAGE_MODEL) {
    config.imageGeneration.providers.gemini.model = import.meta.env.VITE_IMAGE_MODEL
  }

  // 从环境变量加载并发设置
  if (import.meta.env.VITE_HIGH_CONCURRENCY) {
    const highConcurrency = import.meta.env.VITE_HIGH_CONCURRENCY === 'true'
    config.preferences.defaultHighConcurrency = highConcurrency
    config.imageGeneration.providers.gemini.highConcurrency = highConcurrency
    config.imageGeneration.providers.openai.highConcurrency = highConcurrency
  }

  return config
}