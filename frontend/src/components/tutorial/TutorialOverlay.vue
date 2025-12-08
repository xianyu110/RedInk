<template>
  <teleport to="body">
    <transition name="tutorial-overlay">
      <div v-if="isVisible" class="tutorial-overlay" @click.self="handleOverlayClick">
        <div class="tutorial-container" :class="position">
          <div class="tutorial-content">
            <div class="tutorial-header">
              <h3 class="tutorial-title">{{ title }}</h3>
              <button class="close-btn" @click="handleSkip" aria-label="跳过引导">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="tutorial-body">
              <div v-if="imageUrl" class="tutorial-image">
                <img :src="imageUrl" :alt="title" />
              </div>
              <p class="tutorial-description" v-html="description"></p>
              <div v-if="highlights && highlights.length" class="tutorial-highlights">
                <div v-for="(highlight, index) in highlights" :key="index" class="highlight-item">
                  <div class="highlight-icon">{{ highlight.icon }}</div>
                  <span class="highlight-text">{{ highlight.text }}</span>
                </div>
              </div>
            </div>

            <div class="tutorial-footer">
              <div class="tutorial-progress">
                <div class="progress-dots">
                  <span
                    v-for="i in totalSteps"
                    :key="i"
                    class="progress-dot"
                    :class="{ active: i === currentStep }"
                  ></span>
                </div>
                <span class="progress-text">{{ currentStep }} / {{ totalSteps }}</span>
              </div>

              <div class="tutorial-actions">
                <button
                  v-if="showSkip"
                  class="skip-btn"
                  @click="handleSkip"
                >
                  跳过引导
                </button>
                <div class="action-buttons">
                  <button
                    v-if="currentStep > 1"
                    class="prev-btn"
                    @click="handlePrev"
                  >
                    上一步
                  </button>
                  <button
                    class="next-btn"
                    @click="handleNext"
                    :disabled="nextDisabled"
                  >
                    {{ isLastStep ? '完成' : '下一步' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 箭头指示器 -->
          <div v-if="showArrow" class="tutorial-arrow" :class="arrowDirection"></div>
        </div>

        <!-- 高亮目标元素 -->
        <div
          v-if="targetElement && highlightElement"
          class="tutorial-highlight"
          :style="highlightStyle"
        ></div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

interface TutorialStep {
  id: string
  title: string
  description: string
  imageUrl?: string
  target?: string // CSS选择器
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  showArrow?: boolean
  arrowDirection?: 'top' | 'bottom' | 'left' | 'right'
  highlights?: Array<{
    icon: string
    text: string
  }>
  nextDisabled?: boolean
}

interface Props {
  steps: TutorialStep[]
  isVisible: boolean
  currentStepIndex: number
  showSkip?: boolean
  highlightElement?: boolean
  allowClickOutside?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSkip: true,
  highlightElement: true,
  allowClickOutside: false
})

const emit = defineEmits<{
  'next': []
  'prev': []
  'skip': []
  'finish': []
  'update:currentStepIndex': [value: number]
}>()

const currentStep = computed(() => props.currentStepIndex + 1)
const totalSteps = computed(() => props.steps.length)
const currentStepData = computed(() => props.steps[props.currentStepIndex])
const isLastStep = computed(() => currentStep.value === totalSteps.value)

const title = computed(() => currentStepData.value?.title || '')
const description = computed(() => currentStepData.value?.description || '')
const imageUrl = computed(() => currentStepData.value?.imageUrl || '')
const position = computed(() => currentStepData.value?.position || 'center')
const showArrow = computed(() => currentStepData.value?.showArrow || false)
const arrowDirection = computed(() => currentStepData.value?.arrowDirection || 'bottom')
const highlights = computed(() => currentStepData.value?.highlights || [])
const nextDisabled = computed(() => currentStepData.value?.nextDisabled || false)

// 目标元素相关
const targetElement = ref<HTMLElement | null>(null)
const highlightStyle = ref<Record<string, string>>({})

// 查找并定位目标元素
const findTargetElement = async () => {
  if (!currentStepData.value?.target) {
    targetElement.value = null
    return
  }

  await nextTick()
  const element = document.querySelector(currentStepData.value.target) as HTMLElement

  if (element) {
    targetElement.value = element
    updateHighlightPosition()
  } else {
    targetElement.value = null
  }
}

// 更新高亮元素的位置和大小
const updateHighlightPosition = () => {
  if (!targetElement.value || !props.highlightElement) {
    highlightStyle.value = {}
    return
  }

  const rect = targetElement.value.getBoundingClientRect()
  highlightStyle.value = {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    zIndex: '9998'
  }
}

// 处理窗口大小变化
const handleResize = () => {
  updateHighlightPosition()
}

// 事件处理
const handleNext = () => {
  if (isLastStep.value) {
    emit('finish')
  } else {
    emit('update:currentStepIndex', props.currentStepIndex + 1)
    emit('next')
  }
}

const handlePrev = () => {
  if (props.currentStepIndex > 0) {
    emit('update:currentStepIndex', props.currentStepIndex - 1)
    emit('prev')
  }
}

const handleSkip = () => {
  emit('skip')
}

const handleOverlayClick = () => {
  if (props.allowClickOutside) {
    handleNext()
  }
}

// 监听当前步骤变化，重新定位目标元素
watch(() => props.currentStepIndex, () => {
  findTargetElement()
})

// 监听显示状态变化
watch(() => props.isVisible, (visible) => {
  if (visible) {
    findTargetElement()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (props.isVisible) {
    findTargetElement()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.tutorial-container {
  max-width: 500px;
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.tutorial-container.center {
  align-self: center;
}

.tutorial-content {
  padding: 24px;
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tutorial-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.tutorial-body {
  margin-bottom: 24px;
}

.tutorial-image {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.tutorial-image img {
  width: 100%;
  height: auto;
  display: block;
}

.tutorial-description {
  font-size: 15px;
  line-height: 1.6;
  color: #4a4a4a;
  margin: 0 0 16px 0;
}

.tutorial-description :deep(strong) {
  color: #2563eb;
  font-weight: 600;
}

.tutorial-highlights {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.highlight-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.highlight-text {
  font-size: 14px;
  color: #4a4a4a;
  flex: 1;
}

.tutorial-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tutorial-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-dots {
  display: flex;
  gap: 8px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e5e7eb;
  transition: all 0.2s ease;
}

.progress-dot.active {
  width: 24px;
  border-radius: 4px;
  background-color: #2563eb;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.tutorial-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skip-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.prev-btn,
.next-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.prev-btn {
  background-color: #f3f4f6;
  color: #4a4a4a;
}

.prev-btn:hover {
  background-color: #e5e7eb;
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tutorial-arrow {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  transform: rotate(45deg);
}

.tutorial-arrow.top {
  top: -8px;
  left: 50%;
  margin-left: -8px;
}

.tutorial-arrow.bottom {
  bottom: -8px;
  left: 50%;
  margin-left: -8px;
}

.tutorial-arrow.left {
  left: -8px;
  top: 50%;
  margin-top: -8px;
}

.tutorial-arrow.right {
  right: -8px;
  top: 50%;
  margin-top: -8px;
}

.tutorial-highlight {
  border: 3px solid #2563eb;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
  transition: all 0.3s ease;
}

/* 过渡动画 */
.tutorial-overlay-enter-active,
.tutorial-overlay-leave-active {
  transition: all 0.3s ease;
}

.tutorial-overlay-enter-from,
.tutorial-overlay-leave-to {
  opacity: 0;
}

.tutorial-overlay-enter-active .tutorial-container,
.tutorial-overlay-leave-active .tutorial-container {
  transition: all 0.3s ease;
}

.tutorial-overlay-enter-from .tutorial-container,
.tutorial-overlay-leave-to .tutorial-container {
  transform: scale(0.8);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .tutorial-overlay {
    padding: 12px;
  }

  .tutorial-container {
    max-width: 100%;
  }

  .tutorial-content {
    padding: 20px;
  }

  .tutorial-title {
    font-size: 18px;
  }

  .tutorial-description {
    font-size: 14px;
  }

  .tutorial-actions {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    width: 100%;
  }

  .prev-btn,
  .next-btn {
    flex: 1;
  }
}
</style>