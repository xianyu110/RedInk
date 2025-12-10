<template>
  <div class="container">
    <div class="page-header">
      <div>
        <h1 class="page-title">生成结果</h1>
        <p class="page-subtitle">
          <span v-if="isGenerating">正在生成第 {{ store.progress.current + 1 }} / {{ store.progress.total }} 页</span>
          <span v-else-if="hasFailedImages">{{ failedCount }} 张图片生成失败，可点击重试</span>
          <span v-else>全部 {{ store.progress.total }} 张图片生成完成</span>
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button
          v-if="hasFailedImages && !isGenerating"
          class="btn btn-primary"
          @click="retryAllFailed"
          :disabled="isRetrying"
        >
          {{ isRetrying ? '补全中...' : '一键补全失败图片' }}
        </button>
        <button class="btn" @click="router.push('/outline')" style="border:1px solid var(--border-color)">
          返回大纲
        </button>
      </div>
    </div>

    <div class="card">
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600;">生成进度</span>
        <span style="color: var(--primary); font-weight: 600;">{{ Math.round(progressPercent) }}%</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progressPercent + '%' }" />
      </div>

      <div v-if="error" class="error-msg">
        {{ error }}
      </div>

      <div class="grid-cols-4" style="margin-top: 40px;">
        <div v-for="image in store.images" :key="image.index" class="image-card">
          <!-- 图片展示区域 -->
          <div v-if="image.url && image.status === 'done'" class="image-preview">
            <img :src="image.url" :alt="`第 ${image.index + 1} 页`" />
            <!-- 重新生成按钮（悬停显示） -->
            <div class="image-overlay">
              <button
                class="overlay-btn"
                @click="regenerateImage(image.index)"
                :disabled="image.status === 'retrying'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                重新生成
              </button>
            </div>
          </div>

          <!-- 生成中/重试中状态 -->
          <div v-else-if="image.status === 'generating' || image.status === 'retrying'" class="image-placeholder">
            <div class="spinner"></div>
            <div class="status-text">{{ image.status === 'retrying' ? '重试中...' : '生成中...' }}</div>
          </div>

          <!-- 失败状态 -->
          <div v-else-if="image.status === 'error'" class="image-placeholder error-placeholder">
            <div class="error-icon">!</div>
            <div class="status-text">生成失败</div>
            <button
              class="retry-btn"
              @click="retrySingleImage(image.index)"
              :disabled="isRetrying"
            >
              点击重试
            </button>
          </div>

          <!-- 等待中状态 -->
          <div v-else class="image-placeholder">
            <div class="status-text">等待中</div>
          </div>

          <!-- 底部信息栏 -->
          <div class="image-footer">
            <span class="page-label">Page {{ image.index + 1 }}</span>
            <span class="status-badge" :class="image.status">
              {{ getStatusText(image.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneratorStore } from '../stores/generator'
import { generateImagesForPages, generateImageWithAI } from '../services/aiService'
import { createHistory, updateHistory } from '../services/historyService'

const router = useRouter()
const store = useGeneratorStore()

const error = ref('')
const isRetrying = ref(false)

const isGenerating = computed(() => store.progress.status === 'generating')

const progressPercent = computed(() => {
  if (store.progress.total === 0) return 0
  return (store.progress.current / store.progress.total) * 100
})

const hasFailedImages = computed(() => store.images.some(img => img.status === 'error'))

const failedCount = computed(() => store.images.filter(img => img.status === 'error').length)

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    generating: '生成中',
    done: '已完成',
    error: '失败',
    retrying: '重试中'
  }
  return texts[status] || '等待中'
}

// 重试单张图片（异步并发执行，不阻塞）
async function retrySingleImage(index: number) {
  const page = store.outline.pages.find(p => p.index === index)
  if (!page) return

  // 立即设置为重试状态
  store.setImageRetrying(index)

  // 使用新的 AI 服务重新生成
  const result = await generateImageWithAI('', page.content)

  if (result.success && result.imageUrl) {
    store.updateImage(index, result.imageUrl)
    
    // 更新历史记录状态（不保存图片，避免 localStorage 超限）
    if (store.recordId) {
      updateHistory(store.recordId, {
        status: 'partial'
      })
    }
  } else {
    store.updateProgress(index, 'error', undefined, result.error)
  }
}

// 重新生成图片（成功的也可以重新生成，立即返回不等待）
function regenerateImage(index: number) {
  retrySingleImage(index)
}

// 批量重试所有失败的图片
async function retryAllFailed() {
  const failedPages = store.getFailedPages()
  if (failedPages.length === 0) return

  isRetrying.value = true

  // 设置所有失败的图片为重试状态
  failedPages.forEach(page => {
    store.setImageRetrying(page.index)
  })

  try {
    // 逐个重试失败的图片
    for (const page of failedPages) {
      const result = await generateImageWithAI('', page.content)

      if (result.success && result.imageUrl) {
        store.updateImage(page.index, result.imageUrl)
      } else {
        store.updateProgress(page.index, 'error', undefined, result.error)
      }

      // 添加延迟避免 API 限流
      if (failedPages.indexOf(page) < failedPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // 更新历史记录状态（不保存图片，避免 localStorage 超限）
    if (store.recordId) {
      const hasSuccess = store.images.some(img => img.status === 'done')
      updateHistory(store.recordId, {
        status: hasSuccess ? 'partial' : 'draft'
      })
    }
  } catch (e) {
    error.value = '重试失败: ' + String(e)
  } finally {
    isRetrying.value = false
  }
}

onMounted(async () => {
  if (store.outline.pages.length === 0) {
    router.push('/')
    return
  }

  // 创建历史记录（如果还没有）
  if (!store.recordId) {
    try {
      const result = createHistory(store.topic, {
        raw: store.outline.raw,
        pages: store.outline.pages
      })
      if (result.success && result.record_id) {
        store.recordId = result.record_id
        console.log('创建历史记录:', store.recordId)
      }
    } catch (e) {
      console.error('创建历史记录失败:', e)
    }
  }

  store.startGeneration()

  // 生成任务 ID
  const taskId = `task_${Date.now()}`
  store.taskId = taskId

  // 使用新的图片生成服务 - 逐个生成图片
  for (let i = 0; i < store.outline.pages.length; i++) {
    const page = store.outline.pages[i]
    
    // 设置为生成中状态
    store.updateProgress(i, 'generating')

    // 生成图片
    const result = await generateImageWithAI('', page.content)

    if (result.success && result.imageUrl) {
      store.updateProgress(i, 'done', result.imageUrl)
    } else {
      store.updateProgress(i, 'error', undefined, result.error)
    }

    // 添加延迟避免 API 限流（DALL-E 3 有速率限制）
    if (i < store.outline.pages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 完成生成
  store.finishGeneration(taskId)

  // 更新历史记录
  if (store.recordId) {
    try {
      // 收集所有生成的图片 URL
      const generatedImages = store.images
        .filter(img => img.status === 'done' && img.url)
        .map(img => img.url)

      // 确定状态
      let status = 'completed'
      if (hasFailedImages.value) {
        status = generatedImages.length > 0 ? 'partial' : 'draft'
      }

      // 只更新状态，不保存图片（避免 localStorage 超限）
      await updateHistory(store.recordId, {
        status: status
      })
      console.log('✅ 历史记录状态已更新:', status)
      console.log('⚠️ 图片未保存到历史记录（localStorage 限制），请及时下载图片')
    } catch (e) {
      console.error('更新历史记录失败:', e)
    }
  }

  // 如果没有失败的，跳转到结果页
  if (!hasFailedImages.value) {
    setTimeout(() => {
      router.push('/result')
    }, 1000)
  }
})
</script>

<style scoped>
.image-preview {
  aspect-ratio: 3/4;
  overflow: hidden;
  position: relative;
  flex: 1; /* 填充卡片剩余空间 */
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.overlay-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
}

.overlay-btn:hover {
  background: var(--primary);
  color: white;
}

.overlay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-placeholder {
  aspect-ratio: 3/4;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1; /* 填充卡片剩余空间 */
  min-height: 240px; /* 确保有最小高度 */
}

.error-placeholder {
  background: #fff5f5;
}

.error-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.status-text {
  font-size: 13px;
  color: var(--text-sub);
}

.retry-btn {
  margin-top: 8px;
  padding: 6px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.retry-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.retry-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.image-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-label {
  font-size: 12px;
  color: var(--text-sub);
}

.status-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge.done {
  background: #E6F7ED;
  color: #52C41A;
}

.status-badge.generating,
.status-badge.retrying {
  background: #E6F4FF;
  color: #1890FF;
}

.status-badge.error {
  background: #FFF1F0;
  color: #FF4D4F;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
