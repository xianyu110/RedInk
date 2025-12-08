<template>
  <div class="tutorial-trigger">
    <!-- 帮助按钮 -->
    <button
      v-if="showHelpButton"
      class="help-btn"
      @click="showHelpMenu"
      :class="{ 'has-notification': hasNewTutorial }"
      aria-label="帮助和引导"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
      </svg>
      <span v-if="hasNewTutorial" class="notification-dot"></span>
    </button>

    <!-- 帮助菜单 -->
    <div v-if="showMenu" class="help-menu" @click.stop>
      <div class="menu-header">
        <h4>帮助中心</h4>
        <button class="close-menu-btn" @click="hideMenu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="menu-content">
        <div class="menu-section">
          <h5>新手引导</h5>
          <div class="tutorial-list">
            <button
              v-for="tutorial in availableTutorials"
              :key="tutorial.id"
              class="tutorial-item"
              :class="{ completed: isCompleted(tutorial.id) }"
              @click="startTutorial(tutorial.id)"
            >
              <div class="tutorial-info">
                <span class="tutorial-name">{{ tutorial.name }}</span>
                <span class="tutorial-status">
                  {{ isCompleted(tutorial.id) ? '已完成 ✓' : '未完成' }}
                </span>
              </div>
              <div class="tutorial-icon">
                {{ isCompleted(tutorial.id) ? '✅' : '📚' }}
              </div>
            </button>
          </div>
        </div>

        <div class="menu-section">
          <h5>快捷操作</h5>
          <div class="quick-actions">
            <button class="action-btn" @click="resetAllTutorials">
              <span class="action-icon">🔄</span>
              <span class="action-text">重置所有引导</span>
            </button>
            <button class="action-btn" @click="showShortcutModal">
              <span class="action-icon">⌨️</span>
              <span class="action-text">快捷键</span>
            </button>
            <button class="action-btn" @click="showFAQ">
              <span class="action-icon">❓</span>
              <span class="action-text">常见问题</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div v-if="showMenu" class="menu-overlay" @click="hideMenu"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocalConfigStore } from '@/stores/localConfig'

interface Tutorial {
  id: string
  name: string
  description?: string
}

interface Props {
  showHelpButton?: boolean
  showOnFirstVisit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHelpButton: true,
  showOnFirstVisit: true
})

const emit = defineEmits<{
  'start-tutorial': [tutorialId: string]
}>()

const localConfigStore = useLocalConfigStore()
const showMenu = ref(false)

// 可用的教程列表
const availableTutorials: Tutorial[] = [
  {
    id: 'welcome',
    name: '欢迎使用 RedInk',
    description: '了解平台的基本功能和使用方法'
  },
  {
    id: 'home-guide',
    name: '首页功能引导',
    description: '学习如何使用首页的各项功能'
  },
  {
    id: 'outline-guide',
    name: '大纲编辑指南',
    description: '掌握大纲编辑的技巧和功能'
  },
  {
    id: 'result-guide',
    name: '结果页面使用',
    description: '了解如何查看和编辑生成结果'
  }
]

// 计算属性
const hasNewTutorial = computed(() => {
  const completedTutorials = getCompletedTutorials()
  return availableTutorials.some(tutorial => !completedTutorials.includes(tutorial.id))
})

// 获取已完成的教程列表
const getCompletedTutorials = (): string[] => {
  return localConfigStore.preferences.completedTutorials || []
}

// 检查教程是否已完成
const isCompleted = (tutorialId: string): boolean => {
  return getCompletedTutorials().includes(tutorialId)
}

// 显示帮助菜单
const showHelpMenu = () => {
  showMenu.value = true
}

// 隐藏帮助菜单
const hideMenu = () => {
  showMenu.value = false
}

// 启动教程
const startTutorial = (tutorialId: string) => {
  hideMenu()
  emit('start-tutorial', tutorialId)
}

// 重置所有教程
const resetAllTutorials = () => {
  if (confirm('确定要重置所有引导教程吗？这将清除您的完成记录。')) {
    localConfigStore.updatePreferences({
      completedTutorials: []
    })
    alert('引导教程已重置，您可以从头开始学习。')
  }
}

// 显示快捷键模态框
const showShortcutModal = () => {
  hideMenu()
  // 这里可以显示快捷键说明
  alert('快捷键功能正在开发中...')
}

// 显示 FAQ
const showFAQ = () => {
  hideMenu()
  // 这里可以显示 FAQ 页面或模态框
  alert('常见问题页面正在开发中...')
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (showMenu.value) {
    hideMenu()
  }
}

// 监听键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // ESC 键关闭菜单
  if (event.key === 'Escape' && showMenu.value) {
    hideMenu()
  }
  // Ctrl/Cmd + ? 显示帮助
  if ((event.ctrlKey || event.metaKey) && event.key === '?') {
    event.preventDefault()
    showHelpMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.tutorial-trigger {
  position: relative;
  display: inline-block;
}

.help-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  border: none;
  cursor: pointer;
  color: #4a4a4a;
  transition: all 0.2s ease;
}

.help-btn:hover {
  background-color: #e5e7eb;
  color: #2563eb;
}

.help-btn.has-notification {
  background-color: #2563eb;
  color: white;
}

.notification-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}

.help-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.menu-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-menu-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s ease;
}

.close-menu-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.menu-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.menu-section {
  margin-bottom: 24px;
}

.menu-section:last-child {
  margin-bottom: 0;
}

.menu-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #4a4a4a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tutorial-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tutorial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.tutorial-item:hover {
  border-color: #2563eb;
  background-color: #f8faff;
}

.tutorial-item.completed {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.tutorial-info {
  flex: 1;
}

.tutorial-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.tutorial-status {
  font-size: 12px;
  color: #666;
}

.tutorial-icon {
  font-size: 16px;
  margin-left: 8px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.action-btn:hover {
  border-color: #2563eb;
  background-color: #f8faff;
}

.action-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.action-text {
  font-size: 14px;
  color: #4a4a4a;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .help-menu {
    width: 280px;
    right: -20px;
  }

  .menu-content {
    padding: 12px;
  }
}
</style>