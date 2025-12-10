<template>
  <div class="card local-config-section">
    <div class="section-header">
      <div>
        <h2 class="section-title">本地配置</h2>
        <p class="section-desc">在浏览器中存储 API 配置，无需后端存储</p>
      </div>
      <div class="section-actions">
        <label class="switch">
          <input
            type="checkbox"
            v-model="useLocalConfig"
            @change="toggleLocalConfig"
          />
          <span class="slider"></span>
        </label>
        <span class="switch-label">{{ useLocalConfig ? '已启用' : '已禁用' }}</span>
      </div>
    </div>

    <!-- 配置说明 -->
    <div v-if="useLocalConfig" class="config-notice">
      <div class="notice-icon">ℹ️</div>
      <div class="notice-content">
        <p><strong>本地配置说明：</strong></p>
        <ul>
          <li>API Key 将加密存储在浏览器本地</li>
          <li>配置仅在当前浏览器有效，不会同步</li>
          <li>启用后将优先使用本地配置而非后端配置</li>
          <li>建议在个人电脑上使用，公共设备请谨慎启用</li>
        </ul>
      </div>
    </div>

    <!-- 全局 API Key -->
    <template v-if="useLocalConfig">
      <div class="global-api-key-section">
        <h3 class="section-subtitle">API 密钥配置</h3>
        <p class="section-help">输入一次 API Key，所有服务自动使用</p>
        <div class="api-key-input-group">
          <div class="input-wrapper">
            <input
              v-model="globalApiKey"
              :type="showGlobalApiKey ? 'text' : 'password'"
              placeholder="请输入 API Key"
              class="api-key-input"
              @input="handleGlobalApiKeyChange"
            />
            <button
              type="button"
              class="toggle-visibility-btn"
              @click="showGlobalApiKey = !showGlobalApiKey"
            >
              {{ showGlobalApiKey ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <div v-if="globalApiKey" class="api-key-status">
            ✓ 已配置 ({{ maskApiKey(globalApiKey) }})
          </div>
        </div>
      </div>
    </template>

    <!-- 配置详情 -->
    <template v-if="useLocalConfig">
      <!-- API 端点配置 -->
      <div class="config-group">
        <h3 class="config-group-title">API 端点配置</h3>
        <div class="api-endpoint-config">
          <div class="form-group">
            <label>API 端点地址</label>
            <input
              type="text"
              v-model="endpointUrl"
              class="form-input"
              placeholder="例如: https://api.openai.com/v1"
            />
            <span class="form-hint">系统会自动检测并选择合适的 API 端点，无需手动选择</span>
          </div>

          <div class="test-section">
            <button class="btn btn-secondary" @click="testConnection" :disabled="testing">
              <span v-if="testing" class="spinner-small"></span>
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
            <div v-if="testResult" class="test-result" :class="{ success: testResult.success, error: !testResult.success }">
              {{ testResult.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- 服务状态 -->
      <div class="config-group">
        <h3 class="config-group-title">服务状态</h3>
        <div class="service-status">
          <div class="status-item">
            <label>文本生成:</label>
            <span class="status-value" :class="{ active: hasTextService }">
              {{ hasTextService ? '已配置' : '未配置' }}
            </span>
          </div>
          <div class="status-item">
            <label>图片生成:</label>
            <span class="status-value" :class="{ active: hasImageService }">
              {{ hasImageService ? '已配置' : '未配置' }}
            </span>
          </div>
          <div class="status-item">
            <label>自动检测:</label>
            <span class="status-value active">已启用</span>
          </div>
        </div>
      </div>

      <!-- 模型配置 -->
      <div class="config-group">
        <h3 class="config-group-title">模型配置</h3>
        <div class="model-config">
          <!-- 文本模型 -->
          <div class="model-section">
            <h4 class="model-section-title">
              <span class="model-icon">📝</span>
              文本生成模型
            </h4>
            <div class="model-select-group">
              <select v-model="textModel" @change="updateTextModel" class="model-select">
                <option value="gpt-4">GPT-4 (推荐)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="doubao-pro-4k">豆包 Pro-4K</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
              <span class="model-info">选择用于生成大纲和文案的模型</span>
            </div>
          </div>

          <!-- 图像模型 -->
          <div class="model-section">
            <h4 class="model-section-title">
              <span class="model-icon">🎨</span>
              图像生成模型
            </h4>
            <div class="model-select-group">
              <select v-model="imageModel" @change="updateImageModel" class="model-select">
                <option value="jimeng-4.5">即梦 4.5 (性价比首选)</option>
                <option value="dall-e-3">DALL-E 3 (高质量)</option>
                <option value="doubao-seedream-4-0-250828">豆包 Seedream (国风优选)</option>
                <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image</option>
                <option value="midjourney-v6">Midjourney V6</option>
              </select>
              <span class="model-info">选择用于生成图片的模型</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 配置操作 -->
      <div class="config-actions">
        <button class="btn btn-outline" @click="exportConfig">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          导出配置
        </button>
        <button class="btn btn-outline" @click="importConfig">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          导入配置
        </button>
        <button class="btn btn-danger" @click="clearConfig" style="margin-left: auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          清除所有配置
        </button>
      </div>
    </template>

    <!-- 编辑对话框 -->
    <Teleport to="body">
      <ProviderEditModal
        v-if="editingProvider"
        :service="editingProvider.service"
        :name="editingProvider.name"
        :config="editingProvider.config"
        @save="handleSaveProvider"
        @cancel="editingProvider = null"
      />
    </Teleport>

    <!-- 隐藏的文件输入 -->
    <input
      type="file"
      ref="importInput"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLocalConfigStore } from '@/stores/localConfig'
import { type ProviderConfig } from '@/utils/configStorage'
import { useToast } from '@/composables/useToast'
import { testApiConnection, clearEndpointCache } from '@/services/smartApiService'

const localConfigStore = useLocalConfigStore()
const { showToast } = useToast()

// 新的响应式数据
const endpointUrl = ref('')
const testing = ref(false)
const testResult = ref<{
  success: boolean
  message?: string
} | null>(null)

const importInput = ref<HTMLInputElement>()
const globalApiKey = ref('')
const showGlobalApiKey = ref(false)

// 模型配置
const textModel = ref('gpt-4')
const imageModel = ref('jimeng-4.5')

// 移除 editingProvider，不再需要编辑对话框

const config = computed(() => localConfigStore.config)
const useLocalConfig = computed({
  get: () => localConfigStore.useLocalConfig,
  set: (value: boolean) => localConfigStore.setUseLocalConfig(value)
})

onMounted(() => {
  localConfigStore.init()
  globalApiKey.value = localConfigStore.config.globalApiKey || ''

  // 初始化 endpoint URL
  const activeTextProvider = localConfigStore.config.textGeneration.providers[
    localConfigStore.config.textGeneration.activeProvider
  ]
  if (activeTextProvider?.baseURL) {
    endpointUrl.value = activeTextProvider.baseURL
  }

  // 初始化模型值
  const textProvider = localConfigStore.config.textGeneration.providers[
    localConfigStore.config.textGeneration.activeProvider
  ]
  const imageProvider = localConfigStore.config.imageGeneration.providers[
    localConfigStore.config.imageGeneration.activeProvider
  ]

  if (textProvider?.model) {
    textModel.value = textProvider.model
  }
  if (imageProvider?.model) {
    imageModel.value = imageProvider.model
  }
})

// 计算属性
const hasTextService = computed(() => {
  return !!(globalApiKey.value && endpointUrl.value)
})

const hasImageService = computed(() => {
  return !!(globalApiKey.value && endpointUrl.value)
})

// 监听 endpoint URL 变化
watch(endpointUrl, (newUrl) => {
  if (newUrl) {
    // 更新所有提供商的 baseURL
    Object.keys(config.value.textGeneration.providers).forEach(name => {
      localConfigStore.updateTextProvider(name, { baseURL: newUrl })
    })
    Object.keys(config.value.imageGeneration.providers).forEach(name => {
      localConfigStore.updateImageProvider(name, { baseURL: newUrl })
    })

    // 清除缓存以便重新检测
    clearEndpointCache()
  }
})

// 测试连接
async function testConnection() {
  if (!globalApiKey.value || !endpointUrl.value) {
    showToast('请先配置 API Key 和端点地址', 'error')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    // 测试文本生成
    const textResult = await testApiConnection(endpointUrl.value, globalApiKey.value, 'text')
    if (textResult.success) {
      testResult.value = {
        success: true,
        message: `连接成功！检测到: ${textResult.detectedProvider} (${textResult.detectedModel})`
      }
      showToast('API 连接测试成功', 'success')
    } else {
      testResult.value = {
        success: false,
        message: textResult.message || '连接失败'
      }
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || '测试失败'
    }
  } finally {
    testing.value = false
  }
}

// 处理全局 API Key 变化
function handleGlobalApiKeyChange() {
  localConfigStore.setGlobalApiKey(globalApiKey.value)
}

// 切换本地配置
function toggleLocalConfig() {
  if (useLocalConfig.value) {
    showToast('本地配置已启用，API 配置将优先使用本地存储', 'success')
  } else {
    showToast('本地配置已禁用，将使用后端配置', 'info')
  }
}



// 导出配置
function exportConfig() {
  const configJson = localConfigStore.exportConfig()
  const blob = new Blob([configJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `redink-config-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('配置已导出', 'success')
}

// 导入配置
function importConfig() {
  importInput.value?.click()
}

// 处理导入文件
function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const configJson = e.target?.result as string
      const success = localConfigStore.importConfig(configJson)
      if (success) {
        showToast('配置导入成功', 'success')
      } else {
        showToast('配置导入失败，请检查文件格式', 'error')
      }
    } catch (error) {
      showToast('配置文件解析失败', 'error')
    }
  }
  reader.readAsText(file)

  // 清空文件输入
  if (importInput.value) {
    importInput.value.value = ''
  }
}

// 清除配置
function clearConfig() {
  if (!confirm('确定要清除所有本地配置吗？此操作不可恢复。')) return

  localConfigStore.clear()
  showToast('所有本地配置已清除', 'success')
}

// 获取提供商显示名称
function getProviderDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    'openai': 'OpenAI',
    'gemini': 'Google Gemini',
    'gemini-pro': 'Gemini 3 Pro',
    'claude': 'Anthropic Claude',
    'dall-e': 'DALL-E',
    'midjourney': 'Midjourney',
    'stable-diffusion': 'Stable Diffusion',
    'jimeng': 'Jimeng AI',  // 添加 jimeng 显示名称
    'jimeng-4.5': 'Jimeng 4.5'
  }
  return displayNames[name] || name
}

// 掩码显示 API Key
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '***'
  const start = apiKey.substring(0, 4)
  const end = apiKey.substring(apiKey.length - 4)
  return `${start}...${end}`
}

// 更新文本模型
function updateTextModel() {
  const activeProvider = localConfigStore.config.textGeneration.activeProvider
  localConfigStore.updateTextProvider(activeProvider, { model: textModel.value })
  showToast('文本模型已更新', 'success')
}

// 更新图像模型
function updateImageModel() {
  const activeProvider = localConfigStore.config.imageGeneration.activeProvider
  localConfigStore.updateImageProvider(activeProvider, { model: imageModel.value })
  showToast('图像模型已更新', 'success')
}
</script>

<style scoped>
.local-config-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Switch 样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.switch-label {
  font-size: 14px;
  color: #666;
}

/* 配置说明 */
.config-notice {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

/* 全局 API Key 部分 */
.global-api-key-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 2rem;
  color: white;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
}

.section-help {
  font-size: 14px;
  margin: 0 0 16px 0;
  opacity: 0.9;
}

.api-key-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.api-key-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.2s;
}

.api-key-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.api-key-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.toggle-visibility-btn {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.toggle-visibility-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.api-key-status {
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 6px;
  display: inline-block;
}

.notice-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notice-content p {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.notice-content ul {
  margin: 0;
  padding-left: 20px;
}

.notice-content li {
  font-size: 14px;
  color: #666;
  margin-bottom: 0.25rem;
}

/* 配置组 */
.config-group {
  margin-bottom: 2rem;
}

.config-group-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

/* 提供商卡片 */
.provider-cards {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.provider-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.provider-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.provider-card.active {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.active-badge {
  font-size: 12px;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
}

.btn-text {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-text:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-item {
  display: flex;
  gap: 0.5rem;
  font-size: 14px;
}

.config-item label {
  color: #666;
  min-width: 80px;
}

.config-value {
  color: #333;
  font-weight: 500;
}

.config-value.readonly {
  color: #666;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

/* 配置操作 */
.config-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* 响应式 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .config-actions {
    flex-wrap: wrap;
  }

  .config-actions .btn:last-child {
    margin-left: 0;
    width: 100%;
    margin-top: 0.5rem;
  }
}

/* 模型配置样式 */
.model-config {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.model-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.model-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.model-icon {
  font-size: 20px;
}

.model-select-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.model-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.model-select:hover {
  border-color: #3b82f6;
}

.model-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.model-info {
  font-size: 13px;
  color: #6b7280;
}
</style>