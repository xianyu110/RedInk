<template>
  <div class="tutorial-trigger">
    <button
      class="help-btn"
      @click="showMenu = !showMenu"
      :class="{ 'has-notification': hasNewTutorial }"
      aria-label="帮助和引导"
      title="帮助中心 (Ctrl+?)"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
      </svg>
      <span v-if="hasNewTutorial" class="notification-dot"></span>
    </button>

    <div v-if="showMenu" class="help-menu">
      <div class="menu-header">
        <h4>帮助中心</h4>
        <button class="close-menu-btn" @click="showMenu = false">×</button>
      </div>

      <div class="menu-content">
        <button
          v-for="tutorial in tutorials"
          :key="tutorial.id"
          class="tutorial-item"
          @click="startTutorial(tutorial.id)"
        >
          <span>{{ tutorial.name }}</span>
          <span class="status">{{ isCompleted(tutorial.id) ? '✓' : '→' }}</span>
        </button>

        <button class="reset-btn" @click="resetTutorials">
          重置所有引导
        </button>
      </div>
    </div>

    <div v-if="showMenu" class="menu-overlay" @click="showMenu = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalConfigStore } from '@/stores/localConfig'

const emit = defineEmits<{
  'start-tutorial': [tutorialId: string]
}>()

const localConfigStore = useLocalConfigStore()
const showMenu = ref(false)

const tutorials = [
  { id: 'welcome', name: '欢迎使用 RedInk' },
  { id: 'home-guide', name: '首页功能引导' },
  { id: 'outline-guide', name: '大纲编辑指南' },
  { id: 'result-guide', name: '结果页面使用' }
]

const hasNewTutorial = computed(() => {
  return tutorials.some(t => !isCompleted(t.id))
})

const isCompleted = (tutorialId: string): boolean => {
  return localConfigStore.preferences.completedTutorials?.includes(tutorialId) || false
}

const startTutorial = (tutorialId: string) => {
  showMenu.value = false
  emit('start-tutorial', tutorialId)
}

const resetTutorials = () => {
  if (confirm('确定要重置所有引导吗？')) {
    localConfigStore.resetTutorials()
    showMenu.value = false
  }
}
</script>

<style scoped>
.tutorial-trigger {
  position: relative;
}

.help-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.help-btn:hover {
  background-color: rgba(255, 36, 66, 0.05);
  border-color: rgba(255, 36, 66, 0.2);
  color: var(--primary, #ff2442);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.15);
}

.help-btn.has-notification {
  background-color: rgba(255, 36, 66, 0.05);
  border-color: rgba(255, 36, 66, 0.2);
}

.notification-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background-color: var(--primary, #ff2442);
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.help-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 12px;
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--primary, #ff2442) 0%, #ff6b6b 100%);
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
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  line-height: 1;
}

.menu-content {
  padding: 8px;
}

.tutorial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  margin: 6px 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  font-size: 14px;
  color: #333;
}

.tutorial-item:hover {
  border-color: var(--primary, #ff2442);
  background-color: rgba(255, 36, 66, 0.03);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.08);
}

.status {
  color: var(--primary, #ff2442);
  font-weight: 600;
  font-size: 16px;
}

.reset-btn {
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.reset-btn:hover {
  background-color: #f5f5f5;
  border-color: rgba(0, 0, 0, 0.15);
  color: #333;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
</style>
