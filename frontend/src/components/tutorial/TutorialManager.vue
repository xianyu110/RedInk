<template>
  <div v-if="showTutorial" class="tutorial-overlay" @click.self="handleSkip">
    <div class="tutorial-box">
      <div class="tutorial-header">
        <h3>{{ currentStep?.title }}</h3>
        <button @click="handleSkip" class="close-btn">×</button>
      </div>

      <div class="tutorial-body">
        <p v-html="currentStep?.description"></p>
      </div>

      <div class="tutorial-footer">
        <div class="progress">
          <span class="progress-text">{{ currentStepIndex + 1 }} / {{ currentTutorialSteps.length }}</span>
        </div>

        <div class="actions">
          <button v-if="showSkipButton" @click="handleSkip" class="btn-skip">
            跳过
          </button>
          <button v-if="currentStepIndex > 0" @click="handlePrev" class="btn-prev">
            上一步
          </button>
          <button @click="handleNext" class="btn-next">
            {{ isLastStep ? '完成' : '下一步' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalConfigStore } from '@/stores/localConfig'

interface TutorialStep {
  id: string
  title: string
  description: string
}

const localConfigStore = useLocalConfigStore()

const tutorials: Record<string, TutorialStep[]> = {
  'welcome': [
    {
      id: 'welcome-1',
      title: '欢迎使用 RedInk ✨',
      description: 'RedInk 是一个 AI 驱动的小红书内容生成平台，帮助您快速创建精美的图文内容。'
    },
    {
      id: 'welcome-2',
      title: '开始创作很简单',
      description: '只需<strong>输入一个主题</strong>，AI 就会为您生成完整的小红书内容。'
    },
    {
      id: 'welcome-3',
      title: '完整的工作流程',
      description: '从主题输入 → 大纲编辑 → 图片生成 → 内容发布，每个步骤都经过精心设计。'
    }
  ],
  'home-guide': [
    {
      id: 'home-1',
      title: '输入您的创作主题',
      description: '在输入框中描述您想要创作的内容主题，比如"春季美妆教程"或"美食探店"。🎯'
    },
    {
      id: 'home-2',
      title: 'AI 智能分析',
      description: '输入主题后，AI 会自动分析并生成创作建议，帮您打开思路。💡'
    }
  ],
  'outline-guide': [
    {
      id: 'outline-1',
      title: '编辑您的大纲',
      description: 'AI 已经为您生成了初步大纲，您可以根据需要进行调整和优化。📝'
    },
    {
      id: 'outline-2',
      title: '生成配图',
      description: '满意大纲后，点击生成按钮，AI 将为每个要点生成精美的配图。🎨'
    }
  ],
  'result-guide': [
    {
      id: 'result-1',
      title: '查看生成结果',
      description: '您的图文内容已经生成完成！可以在这里预览和编辑。🎉'
    },
    {
      id: 'result-2',
      title: '保存到历史记录',
      description: '创作完成后，记得保存到历史记录，方便随时查看和管理。💾'
    }
  ]
}

const currentTutorialId = ref<string | null>(null)
const currentStepIndex = ref(0)
const showTutorial = ref(false)
const showSkipButton = ref(true)

const currentTutorialSteps = computed(() => {
  if (!currentTutorialId.value) return []
  return tutorials[currentTutorialId.value] || []
})

const currentStep = computed(() => {
  return currentTutorialSteps.value[currentStepIndex.value]
})

const isLastStep = computed(() => {
  return currentStepIndex.value === currentTutorialSteps.value.length - 1
})

const startTutorial = (tutorialId: string) => {
  const tutorial = tutorials[tutorialId]
  if (!tutorial) return

  currentTutorialId.value = tutorialId
  currentStepIndex.value = 0
  showTutorial.value = true
}

const handleNext = () => {
  if (isLastStep.value) {
    handleFinish()
  } else {
    currentStepIndex.value++
  }
}

const handlePrev = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const handleSkip = () => {
  if (currentTutorialId.value) {
    localConfigStore.markTutorialCompleted(currentTutorialId.value)
  }
  showTutorial.value = false
  currentTutorialId.value = null
  currentStepIndex.value = 0
}

const handleFinish = () => {
  if (currentTutorialId.value) {
    localConfigStore.markTutorialCompleted(currentTutorialId.value)
  }
  showTutorial.value = false
  currentTutorialId.value = null
  currentStepIndex.value = 0
}

const checkWelcomeTutorial = () => {
  if (!localConfigStore.isTutorialCompleted('welcome')) {
    startTutorial('welcome')
  }
}

const autoTriggerTutorial = (trigger: string) => {
  if (trigger === 'login') {
    checkWelcomeTutorial()
  }
}

defineExpose({
  startTutorial,
  checkWelcomeTutorial,
  autoTriggerTutorial
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

.tutorial-box {
  max-width: 500px;
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tutorial-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  line-height: 1;
}

.tutorial-body {
  padding: 24px;
}

.tutorial-body p {
  font-size: 15px;
  line-height: 1.6;
  color: #4a4a4a;
  margin: 0;
}

.tutorial-body :deep(strong) {
  color: #2563eb;
  font-weight: 600;
}

.tutorial-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-skip, .btn-prev, .btn-next {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-skip {
  background-color: transparent;
  color: #666;
}

.btn-skip:hover {
  background-color: #f3f4f6;
}

.btn-prev {
  background-color: #f3f4f6;
  color: #4a4a4a;
}

.btn-prev:hover {
  background-color: #e5e7eb;
}

.btn-next {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-next:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
