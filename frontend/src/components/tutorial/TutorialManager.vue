<template>
  <TutorialOverlay
    :steps="currentTutorialSteps"
    :is-visible="showTutorial"
    :current-step-index="currentStepIndex"
    :show-skip="showSkipOption"
    :highlight-element="highlightElements"
    @next="handleNext"
    @prev="handlePrev"
    @skip="handleSkip"
    @finish="handleFinish"
    @update:current-step-index="updateStepIndex"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TutorialOverlay from './TutorialOverlay.vue'
import { useAuthStore } from '@/stores/auth'
import { useLocalConfigStore } from '@/stores/localConfig'

interface TutorialStep {
  id: string
  title: string
  description: string
  imageUrl?: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  showArrow?: boolean
  arrowDirection?: 'top' | 'bottom' | 'left' | 'right'
  highlights?: Array<{
    icon: string
    text: string
  }>
  nextDisabled?: boolean
}

interface Tutorial {
  id: string
  name: string
  steps: TutorialStep[]
  trigger?: 'login' | 'first-visit' | 'manual'
  showOnlyOnce?: boolean
}

const authStore = useAuthStore()
const localConfigStore = useLocalConfigStore()

// 定义教程内容
const tutorials: Tutorial[] = [
  {
    id: 'welcome',
    name: '欢迎引导',
    trigger: 'login',
    showOnlyOnce: true,
    steps: [
      {
        id: 'welcome-1',
        title: '欢迎使用 RedInk ✨',
        description: 'RedInk 是一个 AI 驱动的小红书内容生成平台，帮助您快速创建精美的图文内容。',
        imageUrl: '/images/tutorial/welcome.png',
        position: 'center',
        highlights: [
          {
            icon: '🎨',
            text: '智能生成精美图片'
          },
          {
            icon: '✍️',
            text: '自动创作吸引人的文案'
          },
          {
            icon: '📱',
            text: '完美适配小红书风格'
          }
        ]
      },
      {
        id: 'welcome-2',
        title: '开始创作很简单',
        description: '只需<strong>输入一个主题</strong>，AI 就会为您生成完整的小红书内容。',
        imageUrl: '/images/tutorial/how-it-works.png',
        position: 'center'
      },
      {
        id: 'welcome-3',
        title: '完整的工作流程',
        description: '从主题输入 → 大纲编辑 → 图片生成 → 内容发布，每个步骤都经过精心设计。',
        imageUrl: '/images/tutorial/workflow.png',
        position: 'center'
      }
    ]
  },
  {
    id: 'home-guide',
    name: '首页引导',
    trigger: 'first-visit',
    showOnlyOnce: true,
    steps: [
      {
        id: 'home-1',
        title: '输入您的创作主题',
        description: '在输入框中描述您想要创作的内容主题，比如"春季美妆教程"或"美食探店"。🎯',
        target: '.composer-input',
        position: 'top',
        showArrow: true,
        arrowDirection: 'bottom'
      },
      {
        id: 'home-2',
        title: 'AI 智能分析',
        description: '输入主题后，AI 会自动分析并生成创作建议，帮您打开思路。💡',
        target: '.ai-suggestions',
        position: 'top',
        showArrow: true,
        arrowDirection: 'bottom'
      },
      {
        id: 'home-3',
        title: '个性化设置',
        description: '点击用户头像可以访问个人中心，查看历史记录和进行个性化设置。⚙️',
        target: '.user-menu',
        position: 'bottom',
        showArrow: true,
        arrowDirection: 'top'
      }
    ]
  },
  {
    id: 'outline-guide',
    name: '大纲编辑引导',
    trigger: 'manual',
    showOnlyOnce: false,
    steps: [
      {
        id: 'outline-1',
        title: '编辑您的大纲',
        description: 'AI 已经为您生成了初步大纲，您可以根据需要进行调整和优化。📝',
        target: '.outline-editor',
        position: 'right',
        showArrow: true,
        arrowDirection: 'left'
      },
      {
        id: 'outline-2',
        title: '添加更多要点',
        description: '点击添加按钮可以增加新的要点，让内容更加丰富。➕',
        target: '.add-point-btn',
        position: 'top',
        showArrow: true,
        arrowDirection: 'bottom'
      },
      {
        id: 'outline-3',
        title: '生成配图',
        description: '满意大纲后，点击生成按钮，AI 将为每个要点生成精美的配图。🎨',
        target: '.generate-images-btn',
        position: 'top',
        showArrow: true,
        arrowDirection: 'bottom'
      }
    ]
  },
  {
    id: 'result-guide',
    name: '结果页面引导',
    trigger: 'manual',
    showOnlyOnce: false,
    steps: [
      {
        id: 'result-1',
        title: '查看生成结果',
        description: '您的图文内容已经生成完成！可以在这里预览和编辑。🎉',
        target: '.result-container',
        position: 'center'
      },
      {
        id: 'result-2',
        title: '编辑文字内容',
        description: '点击文字区域可以编辑文案内容，让表达更加精准。✏️',
        target: '.text-editor',
        position: 'left',
        showArrow: true,
        arrowDirection: 'right'
      },
      {
        id: 'result-3',
        title: '保存到历史记录',
        description: '创作完成后，记得保存到历史记录，方便随时查看和管理。💾',
        target: '.save-btn',
        position: 'top',
        showArrow: true,
        arrowDirection: 'bottom'
      }
    ]
  }
]

// 状态管理
const currentTutorialId = ref<string | null>(null)
const currentStepIndex = ref(0)
const showTutorial = ref(false)
const showSkipOption = ref(true)
const highlightElements = ref(true)

// 计算属性
const currentTutorial = computed(() => {
  return tutorials.find(t => t.id === currentTutorialId.value)
})

const currentTutorialSteps = computed(() => {
  return currentTutorial.value?.steps || []
})

// 获取已完成的教程列表
const getCompletedTutorials = (): string[] => {
  return localConfigStore.preferences.completedTutorials || []
}

// 检查教程是否已完成
const isTutorialCompleted = (tutorialId: string): boolean => {
  return getCompletedTutorials().includes(tutorialId)
}

// 标记教程为已完成
const markTutorialCompleted = (tutorialId: string) => {
  const completed = getCompletedTutorials()
  if (!completed.includes(tutorialId)) {
    completed.push(tutorialId)
    localConfigStore.updatePreferences({
      completedTutorials: completed
    })
  }
}

// 启动教程
const startTutorial = (tutorialId: string) => {
  const tutorial = tutorials.find(t => t.id === tutorialId)
  if (!tutorial) return

  // 如果教程只需要显示一次且已经完成，则不显示
  if (tutorial.showOnlyOnce && isTutorialCompleted(tutorialId)) {
    return
  }

  currentTutorialId.value = tutorialId
  currentStepIndex.value = 0
  showTutorial.value = true
  showSkipOption.value = true
  highlightElements.value = true
}

// 手动启动教程
export const startTutorialManually = (tutorialId: string) => {
  startTutorial(tutorialId)
}

// 重新开始教程
export const restartTutorial = (tutorialId: string) => {
  startTutorial(tutorialId)
}

// 自动触发教程
export const autoTriggerTutorial = (trigger: 'login' | 'first-visit') => {
  const tutorial = tutorials.find(t => t.trigger === trigger)
  if (tutorial) {
    startTutorial(tutorial.id)
  }
}

// 检查是否需要显示欢迎引导
export const checkWelcomeTutorial = () => {
  const welcomeTutorial = tutorials.find(t => t.id === 'welcome')
  if (welcomeTutorial && !isTutorialCompleted('welcome') && authStore.isAuthenticated) {
    // 延迟显示，让用户先登录完成
    setTimeout(() => {
      startTutorial('welcome')
    }, 1000)
  }
}

// 事件处理
const handleNext = () => {
  // 可以在这里添加额外的逻辑
  console.log('Tutorial next step')
}

const handlePrev = () => {
  // 可以在这里添加额外的逻辑
  console.log('Tutorial prev step')
}

const handleSkip = () => {
  if (currentTutorialId.value && currentTutorial.value?.showOnlyOnce) {
    markTutorialCompleted(currentTutorialId.value)
  }
  showTutorial.value = false
  currentTutorialId.value = null
  currentStepIndex.value = 0
}

const handleFinish = () => {
  if (currentTutorialId.value) {
    markTutorialCompleted(currentTutorialId.value)
  }
  showTutorial.value = false
  currentTutorialId.value = null
  currentStepIndex.value = 0
}

const updateStepIndex = (index: number) => {
  currentStepIndex.value = index
}

// 监听用户登录状态
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    checkWelcomeTutorial()
  }
})

// 监听路由变化，自动触发相应的教程
watch(() => window.location.pathname, (newPath) => {
  if (showTutorial.value) return // 如果正在显示教程，不自动触发

  // 根据路径触发相应的教程
  if (newPath === '/' && !isTutorialCompleted('home-guide')) {
    setTimeout(() => {
      startTutorial('home-guide')
    }, 2000)
  }
})

// 暴露方法给外部使用
defineExpose({
  startTutorial: startTutorialManually,
  restartTutorial,
  autoTriggerTutorial,
  checkWelcomeTutorial
})
</script>