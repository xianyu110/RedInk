<template>
  <div id="app">
    <!-- 侧边栏 Sidebar -->
    <aside class="layout-sidebar">
      <div class="logo-area">
        <img src="/logo.png" alt="红墨" class="logo-icon" />
        <span class="logo-text">红墨</span>
      </div>

      <nav class="nav-menu">
        <RouterLink to="/" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          创作中心
        </RouterLink>
        <RouterLink to="/history" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          历史记录
        </RouterLink>
        <RouterLink to="/help" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          帮助中心
        </RouterLink>
        <RouterLink to="/settings" class="nav-item" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m-6-6h6m6 0h-6"></path><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          系统设置
        </RouterLink>
      </nav>

      <!-- 用户信息区域 -->
      <div class="user-area">
        <UserMenu v-if="isAuthenticated" />
        <button v-else class="login-btn" @click="showLogin = true">
          登录
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="layout-main">
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" />

        <!-- 全局页脚版权信息（首页除外） -->
        <footer v-if="route.path !== '/'" class="global-footer">
          <div class="footer-content">
            <div class="footer-navigation">
              永久导航: <a href="https://link3.cc/maynorai" target="_blank" rel="noopener noreferrer">link3.cc/maynorai</a>
            </div>
          </div>
        </footer>
      </RouterView>
    </main>

    <!-- 登录模态框 -->
    <LoginModal v-if="showLogin" @close="showLogin = false" />

    <!-- 教程管理器 -->
    <TutorialManager ref="tutorialManagerRef" />
  </div>
</template>

<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { onMounted, computed, ref, watch } from 'vue'
import { setupAutoSave } from './stores/generator'
import { useAuthStore } from './stores/auth'
import { useLocalConfigStore } from './stores/localConfig'
import UserMenu from './components/auth/UserMenu.vue'
import LoginModal from './components/auth/LoginModal.vue'
import TutorialManager from './components/tutorial/TutorialManager.vue'
import TutorialTrigger from './components/tutorial/TutorialTrigger.vue'

const authStore = useAuthStore()
const localConfigStore = useLocalConfigStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const showLogin = ref(false)
const tutorialManagerRef = ref<InstanceType<typeof TutorialManager> | null>(null)

// 处理启动教程
const handleStartTutorial = (tutorialId: string) => {
  if (tutorialManagerRef.value) {
    tutorialManagerRef.value.startTutorial(tutorialId)
  }
}

// 启用自动保存到 localStorage
onMounted(() => {
  setupAutoSave()
  // 初始化认证状态
  authStore.init()
  // 初始化用户偏好设置
  localConfigStore.initPreferences()

  // 监听登录事件
  window.addEventListener('show-login', () => {
    showLogin.value = true
  })

  // 如果用户已登录，检查是否需要显示欢迎引导
  if (isAuthenticated.value && tutorialManagerRef.value) {
    setTimeout(() => {
      tutorialManagerRef.value?.checkWelcomeTutorial()
    }, 1500)
  }
})

// 监听用户登录状态变化
watch(isAuthenticated, (newValue) => {
  if (newValue && tutorialManagerRef.value) {
    // 用户刚刚登录，延迟显示欢迎引导
    setTimeout(() => {
      tutorialManagerRef.value?.autoTriggerTutorial('login')
    }, 1000)
  }
})
</script>

<style>
.help-area {
  margin-top: 20px;
  padding: 10px 0;
  display: flex;
  justify-content: center;
}

.user-area {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  background: #2563eb;
}
</style>
