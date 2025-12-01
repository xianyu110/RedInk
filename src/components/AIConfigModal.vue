<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>AI 服务配置</h2>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="config-section">
          <h3>文本生成 (Gemini)</h3>
          <div class="form-group">
            <label>API Key *</label>
            <input
              v-model="textConfig.api_key"
              type="password"
              placeholder="输入你的 Gemini API Key"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>服务地址</label>
            <input
              v-model="textConfig.base_url"
              type="url"
              placeholder="https://apipro.maynor1024.live/"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>模型</label>
            <input
              v-model="textConfig.model"
              type="text"
              placeholder="gemini-3-pro-preview"
              class="form-input"
            />
          </div>
        </div>

        <div class="config-section">
          <h3>图片生成 (Gemini)</h3>
          <div class="form-group">
            <label>API Key *</label>
            <input
              v-model="imageConfig.api_key"
              type="password"
              placeholder="输入你的 Gemini API Key"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>服务地址</label>
            <input
              v-model="imageConfig.base_url"
              type="url"
              placeholder="https://apipro.maynor1024.live/"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>模型</label>
            <input
              v-model="imageConfig.model"
              type="text"
              placeholder="gemini-3-pro-image-preview"
              class="form-input"
            />
          </div>
        </div>

        <!-- 测试连接 -->
        <div class="test-section">
          <button
            class="btn btn-secondary"
            @click="testConnection"
            :disabled="isTesting || !hasValidConfig"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            {{ isTesting ? '测试中...' : '测试连接' }}
          </button>

          <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
            {{ testResult.success ? testResult.message : testResult.error }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">取消</button>
        <button class="btn btn-primary" @click="saveConfig" :disabled="!hasValidConfig">
          保存配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { imageManager } from '../utils/imageManager'
import { updateConfig } from '../api'

const emit = defineEmits<{
  close: []
  save: []
}>()

const props = defineProps<{
  isVisible: boolean
}>()

// 配置状态
const textConfig = ref({
  api_key: '',
  base_url: 'https://apipro.maynor1024.live/',
  model: 'gemini-3-pro-preview',
  type: 'google_gemini'
})

const imageConfig = ref({
  api_key: '',
  base_url: 'https://apipro.maynor1024.live/',
  model: 'gemini-3-pro-image-preview',
  type: 'google_gemini',
  high_concurrency: false,
  short_prompt: false
})

const isTesting = ref(false)
const testResult = ref<{ success?: boolean; message?: string; error?: string } | null>(null)

// 计算属性
const hasValidConfig = computed(() => {
  return textConfig.value.api_key && imageConfig.value.api_key &&
         textConfig.value.base_url && imageConfig.value.base_url
})

onMounted(() => {
  loadCurrentConfig()
})

/**
 * 加载当前配置
 */
async function loadCurrentConfig() {
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.config) {
        // 加载文本配置
        const textProvider = data.config.text_generation?.providers?.gemini
        if (textProvider) {
          textConfig.value = { ...textConfig.value, ...textProvider }
        }

        // 加载图片配置
        const imageProvider = data.config.image_generation?.providers?.gemini
        if (imageProvider) {
          imageConfig.value = { ...imageConfig.value, ...imageProvider }
        }
      }
    }
  } catch (error) {
    console.warn('加载当前配置失败:', error)
  }
}

/**
 * 测试连接
 */
async function testConnection() {
  if (!hasValidConfig.value) return

  isTesting.value = true
  testResult.value = null

  try {
    // 配置AI生成器
    imageManager.configureAI({
      api_key: imageConfig.value.api_key,
      base_url: imageConfig.value.base_url,
      model: imageConfig.value.model,
      type: imageConfig.value.type
    })

    // 测试连接
    const result = await imageManager.testAIConnection()
    testResult.value = result

  } catch (error) {
    testResult.value = {
      success: false,
      error: error instanceof Error ? error.message : '测试失败'
    }
  } finally {
    isTesting.value = false
  }
}

/**
 * 保存配置
 */
async function saveConfig() {
  if (!hasValidConfig.value) return

  try {
    const configData = {
      text_generation: {
        active_provider: 'gemini',
        providers: {
          gemini: textConfig.value
        }
      },
      image_generation: {
        active_provider: 'gemini',
        providers: {
          gemini: imageConfig.value
        }
      }
    }

    const result = await updateConfig(configData)

    if (result.success) {
      // 重新配置AI生成器
      imageManager.configureAI({
        api_key: imageConfig.value.api_key,
        base_url: imageConfig.value.base_url,
        model: imageConfig.value.model,
        type: imageConfig.value.type
      })

      alert('配置保存成功！现在可以使用AI生成功能了。')
      emit('save')
      closeModal()
    } else {
      alert('配置保存失败: ' + result.error)
    }

  } catch (error) {
    alert('配置保存失败: ' + (error as Error).message)
  }
}

/**
 * 关闭弹窗
 */
function closeModal() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: var(--hover-bg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.config-section {
  margin-bottom: 32px;
}

.config-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.test-section {
  padding: 16px;
  background-color: var(--hover-bg);
  border-radius: 8px;
  text-align: center;
}

.test-result {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.test-result.success {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.test-result.error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--hover-bg);
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .modal-body {
    padding: 20px;
  }
}
</style>