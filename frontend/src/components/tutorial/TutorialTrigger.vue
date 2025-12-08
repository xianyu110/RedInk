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
  background-color: #eff6ff;
}

.notification-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}

.help-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  width: 280px;
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
  padding: 16px;
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
  padding: 12px;
  margin: 4px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;
}

.tutorial-item:hover {
  border-color: #2563eb;
  background-color: #f8faff;
}

.status {
  color: #10b981;
  font-weight: 600;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  border: 1px solid #dc2626;
  border-radius: 8px;
  background: white;
  color: #dc2626;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background-color: #dc2626;
  color: white;
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
