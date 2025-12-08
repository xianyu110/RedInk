<template>
  <div class="modal-overlay" @click.self="handleCancel">
    <div class="modal">
      <div class="modal-header">
        <h3>编辑配置 - {{ getProviderDisplayName(name) }}</h3>
        <button class="modal-close" @click="handleCancel">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- API Key -->
        <div class="form-group">
          <label for="apiKey">
            API Key <span class="required">*</span>
          </label>
          <div class="input-group">
            <input
              id="apiKey"
              v-model="localConfig.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="请输入 API Key"
              class="form-input"
            />
            <button
              type="button"
              class="input-action"
              @click="showApiKey = !showApiKey"
            >
              {{ showApiKey ? '隐藏' : '显示' }}
            </button>
          </div>
          <p class="form-help">
            API Key 将加密存储在本地，不会上传到服务器
          </p>
        </div>

        <!-- API 端点 -->
        <div class="form-group">
          <label for="baseURL">
            API 端点
          </label>
          <input
            id="baseURL"
            v-model="localConfig.baseURL"
            type="url"
            placeholder="https://api.example.com/v1"
            class="form-input"
          />
          <p class="form-help">
            留空使用默认端点
          </p>
        </div>

        <!-- 模型 -->
        <div class="form-group">
          <label for="model">
            模型名称
          </label>
          <div class="input-group">
            <input
              id="model"
              v-model="localConfig.model"
              placeholder="gpt-4o"
              class="form-input"
            />
            <select
              v-model="localConfig.model"
              class="input-select"
              @change="updateModel"
            >
              <option value="">选择默认模型</option>
              <optgroup v-if="name === 'openai'" label="OpenAI 模型">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </optgroup>
              <optgroup v-if="name === 'gemini'" label="Gemini 模型">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </optgroup>
              <optgroup v-if="service === 'image'" label="图片生成模型">
                <option value="dall-e-3">DALL-E 3</option>
                <option value="dall-e-2">DALL-E 2</option>
                <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image</option>
                <option value="stable-diffusion">Stable Diffusion</option>
              </optgroup>
            </select>
          </div>
        </div>

        <!-- 高并发模式（仅图片生成） -->
        <div v-if="service === 'image'" class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localConfig.highConcurrency"
            />
            <span class="checkbox-text">
              高并发模式
              <small>同时生成多张图片，需要 API 支持高并发</small>
            </span>
          </label>
        </div>

        <!-- 自定义参数 -->
        <div class="form-group">
          <label>自定义参数</label>
          <div
            v-for="(value, key) in customParams"
            :key="key"
            class="custom-param-item"
          >
            <input
              v-model="customParams[key].key"
              placeholder="参数名"
              class="param-key"
            />
            <input
              v-model="customParams[key].value"
              placeholder="参数值"
              class="param-value"
            />
            <button
              type="button"
              class="param-remove"
              @click="removeCustomParam(key)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <button
            type="button"
            class="btn btn-text"
            @click="addCustomParam"
          >
            + 添加自定义参数
          </button>
        </div>

        <!-- 测试配置 -->
        <div class="form-group">
          <button
            type="button"
            class="btn btn-outline"
            @click="testConnection"
            :disabled="testing || !localConfig.apiKey"
          >
            <svg
              v-if="testing"
              class="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
            {{ testResult.message }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-outline"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSave"
          :disabled="!localConfig.apiKey"
        >
          保存配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { type ProviderConfig } from '@/utils/configStorage'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  service: 'text' | 'image'
  name: string
  config: ProviderConfig
}>()

const emit = defineEmits<{
  save: [service: 'text' | 'image', name: string, config: ProviderConfig]
  cancel: []
}>()

const { showToast } = useToast()

const localConfig = reactive<ProviderConfig>({
  apiKey: '',
  baseURL: '',
  model: '',
  highConcurrency: false,
  ...props.config
})

const customParams = ref<Record<string, { key: string; value: string }>>({})
const showApiKey = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// 初始化自定义参数
function initCustomParams() {
  customParams.value = {}
  for (const [key, value] of Object.entries(props.config)) {
    if (!['apiKey', 'baseURL', 'model', 'highConcurrency'].includes(key)) {
      customParams.value[Date.now().toString()] = { key, value: String(value) }
    }
  }
}

// 更新模型选择
function updateModel() {
  // 可以在这里根据模型自动调整其他参数
}

// 添加自定义参数
function addCustomParam() {
  const key = Date.now().toString()
  customParams.value[key] = { key: '', value: '' }
}

// 删除自定义参数
function removeCustomParam(key: string) {
  delete customParams.value[key]
}

// 测试连接
async function testConnection() {
  if (!localConfig.apiKey) {
    showToast('请先输入 API Key', 'warning')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    // 构建测试请求
    const testPayload = {
      type: props.service,
      provider_name: props.name,
      api_key: localConfig.apiKey,
      base_url: localConfig.baseURL,
      model: localConfig.model || (props.service === 'text' ? 'gpt-4o' : 'dall-e-3')
    }

    // 发送测试请求到后端
    const response = await fetch('/api/config/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })

    const data = await response.json()

    if (data.success) {
      testResult.value = {
        success: true,
        message: '连接测试成功！配置有效'
      }
      showToast('连接测试成功', 'success')
    } else {
      testResult.value = {
        success: false,
        message: data.error || '连接测试失败'
      }
      showToast('连接测试失败', 'error')
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: '网络错误或服务器无响应'
    }
    showToast('测试请求失败', 'error')
  } finally {
    testing.value = false
  }
}

// 保存配置
function handleSave() {
  if (!localConfig.apiKey) {
    showToast('请输入 API Key', 'warning')
    return
  }

  // 合并自定义参数
  const finalConfig: ProviderConfig = {
    apiKey: localConfig.apiKey,
    baseURL: localConfig.baseURL,
    model: localConfig.model,
    highConcurrency: localConfig.highConcurrency
  }

  for (const param of Object.values(customParams.value)) {
    if (param.key && param.value) {
      finalConfig[param.key] = param.value
    }
  }

  emit('save', props.service, props.name, finalConfig)
}

// 取消
function handleCancel() {
  emit('cancel')
}

// 获取提供商显示名称
function getProviderDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    'openai': 'OpenAI',
    'gemini': 'Google Gemini',
    'claude': 'Anthropic Claude',
    'dall-e': 'DALL-E',
    'midjourney': 'Midjourney',
    'stable-diffusion': 'Stable Diffusion'
  }
  return displayNames[name] || name
}

// 监听配置变化，更新测试结果
watch(localConfig, () => {
  testResult.value = null
}, { deep: true })

// 初始化
initCustomParams()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #dc2626;
}

.form-help {
  font-size: 12px;
  color: #6b7280;
  margin-top: 0.25rem;
}

.input-group {
  position: relative;
  display: flex;
}

.form-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px 0 0 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-action {
  padding: 0 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-left: none;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.input-action:hover {
  background: #e5e7eb;
  color: #374151;
}

.input-select {
  width: 200px;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0 6px 6px 0;
  border-left: none;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

/* Checkbox 样式 */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-text small {
  font-size: 12px;
  color: #6b7280;
  font-weight: normal;
}

/* 自定义参数 */
.custom-param-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.param-key,
.param-value {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.param-remove {
  padding: 0.5rem;
  background: none;
  border: 1px solid #dc2626;
  border-radius: 4px;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.param-remove:hover {
  background: #dc2626;
  color: white;
}

/* 测试结果 */
.test-result {
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 14px;
}

.test-result.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.test-result.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-text {
  background: none;
  color: #3b82f6;
  border: none;
  padding: 0.5rem 0;
  font-size: 14px;
}

.btn-text:hover {
  color: #2563eb;
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 响应式 */
@media (max-width: 640px) {
  .modal {
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-header,
  .modal-footer {
    padding: 1rem;
  }

  .custom-param-item {
    flex-direction: column;
  }

  .input-group {
    flex-direction: column;
  }

  .form-input {
    border-radius: 6px;
    border-bottom: 1px solid #e5e7eb;
  }

  .input-action,
  .input-select {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    border-top: none;
  }
}
</style>