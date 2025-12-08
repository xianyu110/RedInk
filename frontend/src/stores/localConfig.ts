import { defineStore } from 'pinia'
import { ConfigStorage, loadEnvDefaults, type FrontendConfig, type ProviderConfig } from '@/utils/configStorage'

export const useLocalConfigStore = defineStore('localConfig', {
  state: () => ({
    config: loadEnvDefaults() as FrontendConfig,
    initialized: false,
    // 用户偏好设置
    preferences: {
      completedTutorials: [] as string[],
      showTutorialOnLogin: true,
      theme: 'light' as 'light' | 'dark',
      language: 'zh-CN'
    }
  }),

  getters: {
    // 获取当前激活的文本生成提供商配置
    activeTextProvider: (state): ProviderConfig => {
      return state.config.textGeneration.providers[state.config.textGeneration.activeProvider] || {}
    },

    // 获取当前激活的图片生成提供商配置
    activeImageProvider: (state): ProviderConfig => {
      return state.config.imageGeneration.providers[state.config.imageGeneration.activeProvider] || {}
    },

    // 是否使用本地配置
    useLocalConfig: (state): boolean => {
      return state.config.preferences.useLocalConfig
    }
  },

  actions: {
    // 初始化配置
    init() {
      if (!this.initialized) {
        this.config = ConfigStorage.load()
        this.initialized = true
      }
    },

    // 保存配置
    save() {
      ConfigStorage.save(this.config)
    },

    // 清除配置
    clear() {
      ConfigStorage.clear()
      this.config = loadEnvDefaults()
    },

    // 设置是否使用本地配置
    setUseLocalConfig(use: boolean) {
      this.config.preferences.useLocalConfig = use
      this.save()
    },

    // 更新文本生成提供商
    updateTextProvider(name: string, providerConfig: ProviderConfig) {
      this.config.textGeneration.providers[name] = {
        ...this.config.textGeneration.providers[name],
        ...providerConfig
      }
      this.save()
    },

    // 更新图片生成提供商
    updateImageProvider(name: string, providerConfig: ProviderConfig) {
      this.config.imageGeneration.providers[name] = {
        ...this.config.imageGeneration.providers[name],
        ...providerConfig
      }
      this.save()
    },

    // 激活文本生成提供商
    activateTextProvider(name: string) {
      if (this.config.textGeneration.providers[name]) {
        this.config.textGeneration.activeProvider = name
        this.save()
      }
    },

    // 激活图片生成提供商
    activateImageProvider(name: string) {
      if (this.config.imageGeneration.providers[name]) {
        this.config.imageGeneration.activeProvider = name
        this.save()
      }
    },

    // 删除文本生成提供商
    deleteTextProvider(name: string) {
      delete this.config.textGeneration.providers[name]
      // 如果删除的是当前激活的，切换到第一个可用的
      const providers = Object.keys(this.config.textGeneration.providers)
      if (!providers.includes(this.config.textGeneration.activeProvider) && providers.length > 0) {
        this.config.textGeneration.activeProvider = providers[0]
      }
      this.save()
    },

    // 删除图片生成提供商
    deleteImageProvider(name: string) {
      delete this.config.imageGeneration.providers[name]
      // 如果删除的是当前激活的，切换到第一个可用的
      const providers = Object.keys(this.config.imageGeneration.providers)
      if (!providers.includes(this.config.imageGeneration.activeProvider) && providers.length > 0) {
        this.config.imageGeneration.activeProvider = providers[0]
      }
      this.save()
    },

    // 导出配置
    exportConfig(): string {
      return ConfigStorage.export()
    },

    // 导入配置
    importConfig(configJson: string): boolean {
      const success = ConfigStorage.import(configJson)
      if (success) {
        this.config = ConfigStorage.load()
      }
      return success
    },

    // 添加新的文本生成提供商
    addTextProvider(name: string, providerConfig: ProviderConfig) {
      this.config.textGeneration.providers[name] = providerConfig
      this.save()
    },

    // 添加新的图片生成提供商
    addImageProvider(name: string, providerConfig: ProviderConfig) {
      this.config.imageGeneration.providers[name] = providerConfig
      this.save()
    },

    // 获取用于 API 调用的配置（如果使用本地配置则返回本地配置，否则返回 null）
    getApiConfig(service: 'text' | 'image'): {
      apiKey: string
      baseURL: string
      model: string
      highConcurrency?: boolean
    } | null {
      if (!this.config.preferences.useLocalConfig) {
        return null
      }

      const config = service === 'text'
        ? this.config.textGeneration
        : this.config.imageGeneration

      const provider = config.providers[config.activeProvider]

      if (!provider || !provider.apiKey) {
        return null
      }

      return {
        apiKey: provider.apiKey,
        baseURL: provider.baseURL || '',
        model: provider.model || '',
        highConcurrency: provider.highConcurrency || false
      }
    },

    // 检查 API Key 是否已配置
    hasApiKey(service: 'text' | 'image', providerName?: string): boolean {
      const config = service === 'text'
        ? this.config.textGeneration
        : this.config.imageGeneration

      const name = providerName || config.activeProvider
      const provider = config.providers[name]

      return !!(provider && provider.apiKey)
    },

    // 获取所有已配置的提供商名称
    getConfiguredProviders(service: 'text' | 'image'): string[] {
      const config = service === 'text'
        ? this.config.textGeneration
        : this.config.imageGeneration

      return Object.keys(config.providers).filter(name =>
        config.providers[name].apiKey && config.providers[name].apiKey.length > 0
      )
    },

    // 更新用户偏好设置
    updatePreferences(newPreferences: Partial<typeof this.preferences>) {
      this.preferences = {
        ...this.preferences,
        ...newPreferences
      }
      this.savePreferences()
    },

    // 标记教程为已完成
    markTutorialCompleted(tutorialId: string) {
      if (!this.preferences.completedTutorials.includes(tutorialId)) {
        this.preferences.completedTutorials.push(tutorialId)
        this.savePreferences()
      }
    },

    // 检查教程是否已完成
    isTutorialCompleted(tutorialId: string): boolean {
      return this.preferences.completedTutorials.includes(tutorialId)
    },

    // 重置所有教程完成状态
    resetTutorials() {
      this.preferences.completedTutorials = []
      this.savePreferences()
    },

    // 保存偏好设置到 localStorage
    savePreferences() {
      localStorage.setItem('redink-preferences', JSON.stringify(this.preferences))
    },

    // 从 localStorage 加载偏好设置
    loadPreferences() {
      const saved = localStorage.getItem('redink-preferences')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          this.preferences = {
            ...this.preferences,
            ...parsed
          }
        } catch (error) {
          console.error('Failed to load preferences:', error)
        }
      }
    },

    // 初始化偏好设置
    initPreferences() {
      this.loadPreferences()
    }
  }
})