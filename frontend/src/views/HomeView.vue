<template>
  <div class="container home-container">
    <!-- 图片网格轮播背景 -->
    <ShowcaseBackground />

    <!-- Hero Area -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="brand-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          AI 驱动的红墨创作助手
        </div>
        <div class="platform-slogan">
          让传播不再需要门槛，让创作从未如此简单
        </div>
        <h1 class="page-title">灵感一触即发</h1>
        <p class="page-subtitle">输入你的创意主题，让 AI 帮你生成爆款标题、正文和封面图</p>
      </div>

      <!-- 主题输入组合框 -->
      <div class="composer-input">
        <ComposerInput
          ref="composerRef"
          v-model="topic"
          :loading="loading"
          @generate="handleGenerate"
          @imagesChange="handleImagesChange"
        />
      </div>
    </div>

    <!-- 使用流程提示 -->
    <div class="usage-guide">
      <h3>快速开始</h3>
      <div class="guide-steps">
        <div class="guide-step">
          <span class="step-number">1</span>
          <span class="step-text">获取 API Key</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="guide-step" role="button" @click="openSettings">
          <span class="step-number">2</span>
          <span class="step-text">配置 API Key</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="guide-step">
          <span class="step-number">3</span>
          <span class="step-text">开始创作</span>
        </div>
      </div>
      <div class="guide-note">
        <a href="https://apipro.maynor1024.live" target="_blank" class="guide-link">前往获取 API Key →</a>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="page-footer">
      <div class="footer-navigation">
        永久导航: <a href="https://link3.cc/maynorai" target="_blank" rel="noopener noreferrer">link3.cc/maynorai</a>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-toast">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneratorStore } from '../stores/generator'
import { generateOutlineWithAI } from '../services/aiService'

// 引入组件
import ShowcaseBackground from '../components/home/ShowcaseBackground.vue'
import ComposerInput from '../components/home/ComposerInput.vue'

const router = useRouter()
const store = useGeneratorStore()

// 状态
const topic = ref('')
const loading = ref(false)
const error = ref('')
const composerRef = ref<InstanceType<typeof ComposerInput> | null>(null)

// 上传的图片文件
const uploadedImageFiles = ref<File[]>([])

/**
 * 处理图片变化
 */
function handleImagesChange(images: File[]) {
  uploadedImageFiles.value = images
}

/**
 * 生成大纲
 */
async function handleGenerate() {
  if (!topic.value.trim()) return

  loading.value = true
  error.value = ''

  try {
    const imageFiles = uploadedImageFiles.value

    const result = await generateOutlineWithAI(
      topic.value.trim(),
      imageFiles.length > 0 ? imageFiles : undefined
    )

    if (result.success && result.pages) {
      store.setTopic(topic.value.trim())
      store.setOutline(result.outline || '', result.pages)
      store.recordId = null

      // 保存用户上传的图片到 store
      if (imageFiles.length > 0) {
        store.userImages = imageFiles
      } else {
        store.userImages = []
      }

      // 清理 ComposerInput 的预览
      composerRef.value?.clearPreviews()
      uploadedImageFiles.value = []

      router.push('/outline')
    } else {
      error.value = result.error || '生成大纲失败'
    }
  } catch (err: any) {
    error.value = err.message || '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

// 打开设置页面
function openSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.home-container {
  max-width: 1100px;
  padding-top: 10px;
  position: relative;
  z-index: 1;
}

/* Hero Section */
.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 50px 60px;
  animation: fadeIn 0.6s ease-out;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
}

.hero-content {
  margin-bottom: 36px;
}

.brand-pill {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 36, 66, 0.08);
  color: var(--primary);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
}

.platform-slogan {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 24px;
  line-height: 1.6;
  letter-spacing: 0.5px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-sub);
  margin-top: 12px;
}

/* 使用流程提示 */
.usage-guide {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.usage-guide h3 {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.guide-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.guide-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--primary, #ff2442) 0%, #ff6b6b 100%);
  color: white;
  border-radius: 100px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 36, 66, 0.2);
}

.guide-step:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.3);
}

.guide-step[role="button"] {
  cursor: pointer;
}

.step-number {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.step-text {
  white-space: nowrap;
}

.step-arrow {
  font-size: 20px;
  color: var(--primary, #ff2442);
  font-weight: 700;
}

/* Page Footer */
.page-footer {
  text-align: center;
  padding: 24px 0 16px;
  margin-top: 20px;
}

.footer-copyright {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 6px;
}

.footer-copyright a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.footer-copyright a:hover {
  text-decoration: underline;
}

.footer-license {
  font-size: 13px;
  color: #999;
}

.footer-license a {
  color: #666;
  text-decoration: none;
}

.footer-license a:hover {
  color: var(--primary);
}

/* Error Toast */
.error-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #FF4D4F;
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  box-shadow: 0 8px 24px rgba(255, 77, 79, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.guide-note {
  margin-top: 16px;
  text-align: center;
}

.guide-link {
  color: var(--primary, #ff2442);
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.guide-link:hover {
  transform: translateX(4px);
}
</style>
