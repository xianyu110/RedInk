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
      <!-- 文本生成配置 -->
      <div class="config-group">
        <h3 class="config-group-title">文本生成服务</h3>
        <div class="provider-cards">
          <div
            v-for="(provider, name) in config.textGeneration.providers"
            :key="name"
            class="provider-card"
            :class="{ active: config.textGeneration.activeProvider === name }"
          >
            <div class="card-header">
              <h4>{{ getProviderDisplayName(name) }}</h4>
              <div class="card-actions">
                <button
                  class="btn-text"
                  @click="activateTextProvider(name)"
                  v-if="config.textGeneration.activeProvider !== name"
                >
                  激活
                </button>
                <span class="active-badge" v-else>当前激活</span>
                <button class="btn-text" @click="editProvider('text', name)">编辑</button>
              </div>
            </div>
            <div class="card-body">
              <!-- API Key 使用全局配置，不再单独显示 -->
              <div class="config-item">
                <label>API 端点:</label>
                <span class="config-value readonly">{{ provider.baseURL || '默认' }}</span>
              </div>
              <div class="config-item">
                <label>模型:</label>
                <span class="config-value">{{ provider.model || '默认' }}</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-outline" @click="addProvider('text')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加提供商
        </button>
      </div>

      <!-- 图片生成配置 -->
      <div class="config-group">
        <h3 class="config-group-title">图片生成服务</h3>
        <div class="provider-cards">
          <div
            v-for="(provider, name) in config.imageGeneration.providers"
            :key="name"
            class="provider-card"
            :class="{ active: config.imageGeneration.activeProvider === name }"
          >
            <div class="card-header">
              <h4>{{ getProviderDisplayName(name) }}</h4>
              <div class="card-actions">
                <button
                  class="btn-text"
                  @click="activateImageProvider(name)"
                  v-if="config.imageGeneration.activeProvider !== name"
                >
                  激活
                </button>
                <span class="active-badge" v-else>当前激活</span>
                <button class="btn-text" @click="editProvider('image', name)">编辑</button>
              </div>
            </div>
            <div class="card-body">
              <!-- API Key 使用全局配置，不再单独显示 -->
              <div class="config-item">
                <label>API 端点:</label>
                <span class="config-value readonly">{{ provider.baseURL || '默认' }}</span>
              </div>
              <div class="config-item">
                <label>模型:</label>
                <span class="config-value">{{ provider.model || '默认' }}</span>
              </div>
              <div class="config-item">
                <label>高并发模式:</label>
                <span class="config-value">{{ provider.highConcurrency ? '开启' : '关闭' }}</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-outline" @click="addProvider('image')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加提供商
        </button>
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
import { ref, computed, onMounted } from 'vue'
import { useLocalConfigStore } from '@/stores/localConfig'
import { type ProviderConfig } from '@/utils/configStorage'
import ProviderEditModal from './ProviderEditModal.vue'
import { useToast } from '@/composables/useToast'

const localConfigStore = useLocalConfigStore()
const { showToast } = useToast()

const editingProvider = ref<{
  service: 'text' | 'image'
  name: string
  config: ProviderConfig
} | null>(null)

const importInput = ref<HTMLInputElement>()
const globalApiKey = ref('')
const showGlobalApiKey = ref(false)

const config = computed(() => localConfigStore.config)
const useLocalConfig = computed({
  get: () => localConfigStore.useLocalConfig,
  set: (value: boolean) => localConfigStore.setUseLocalConfig(value)
})

onMounted(() => {
  localConfigStore.init()
  globalApiKey.value = localConfigStore.config.globalApiKey || ''
})

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

// 激活文本生成提供商
function activateTextProvider(name: string) {
  localConfigStore.activateTextProvider(name)
  showToast(`已激活 ${getProviderDisplayName(name)} 作为文本生成服务`, 'success')
}

// 激活图片生成提供商
function activateImageProvider(name: string) {
  localConfigStore.activateImageProvider(name)
  showToast(`已激活 ${getProviderDisplayName(name)} 作为图片生成服务`, 'success')
}

// 编辑提供商
function editProvider(service: 'text' | 'image', name: string) {
  const providers = service === 'text'
    ? config.value.textGeneration.providers
    : config.value.imageGeneration.providers

  editingProvider.value = {
    service,
    name,
    config: { ...providers[name] }
  }
}

// 添加提供商
function addProvider(service: 'text' | 'image') {
  const name = prompt('请输入提供商名称（如: openai, gemini, claude 等）:')
  if (!name) return

  // 检查是否已存在
  const providers = service === 'text'
    ? config.value.textGeneration.providers
    : config.value.imageGeneration.providers

  if (providers[name]) {
    showToast('提供商已存在', 'error')
    return
  }

  // 创建新的提供商配置（不再需要 API Key）
  const defaultConfig: ProviderConfig = service === 'text'
    ? {
        baseURL: name === 'openai' ? 'https://apipro.maynor1024.live/v1' :
                 name === 'gemini' ? 'https://apipro.maynor1024.live' :
                 name === 'claude' ? 'https://apipro.maynor1024.live/v1' : '',
        model: name === 'openai' ? 'gpt-4o' :
               name === 'gemini' ? 'gemini-2.0-flash' :
               name === 'claude' ? 'claude-3-sonnet' : ''
      }
    : {
        baseURL: name === 'openai' ? 'https://apipro.maynor1024.live/v1' :
                 name === 'gemini' ? 'https://apipro.maynor1024.live' : '',
        model: name === 'openai' ? 'dall-e-3' :
               name === 'gemini' ? 'gemini-3-pro-image-preview' : '',
        highConcurrency: false
      }

  editingProvider.value = {
    service,
    name,
    config: defaultConfig
  }
}

// 保存提供商配置
function handleSaveProvider(service: 'text' | 'image', name: string, providerConfig: ProviderConfig) {
  const storeConfig = localConfigStore.config
  if (service === 'text') {
    // 检查是否为新添加的
    const isNew = !storeConfig.textGeneration.providers[name]
    if (isNew) {
      localConfigStore.addTextProvider(name, providerConfig)
    } else {
      localConfigStore.updateTextProvider(name, providerConfig)
    }
  } else {
    const isNew = !storeConfig.imageGeneration.providers[name]
    if (isNew) {
      localConfigStore.addImageProvider(name, providerConfig)
    } else {
      localConfigStore.updateImageProvider(name, providerConfig)
    }
  }

  editingProvider.value = null
  showToast('配置已保存', 'success')
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
    'stable-diffusion': 'Stable Diffusion'
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
</style>