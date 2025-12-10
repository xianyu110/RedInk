<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ isLogin ? '登录' : '注册' }}红墨 AI</h2>
        <button class="modal-close" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="logo-section">
          <img src="/logo.png" alt="红墨" class="logo" />
          <h3>让创作从未如此简单</h3>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 切换登录/注册 -->
          <div v-if="authStore.isSupabaseEnabled" class="auth-switch">
            <button
              type="button"
              :class="['switch-btn', { active: isLogin }]"
              @click="isLogin = true"
            >
              登录
            </button>
            <button
              type="button"
              :class="['switch-btn', { active: !isLogin }]"
              @click="isLogin = false"
            >
              注册
            </button>
          </div>

          <div class="form-group">
            <label for="email">邮箱地址</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="请输入您的邮箱"
              class="form-input"
              :disabled="loading"
            />
          </div>

          <!-- 注册时显示用户名 -->
          <div v-if="authStore.isSupabaseEnabled && !isLogin" class="form-group">
            <label for="displayName">用户名（可选）</label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              placeholder="请输入您的用户名"
              class="form-input"
              :disabled="loading"
            />
          </div>

          <!-- 密码输入框 -->
          <div v-if="showPassword" class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="至少6个字符，包含字母和数字"
              class="form-input"
              :disabled="loading"
              minlength="6"
            />
            <p v-if="password && password.length < 6" class="password-hint">
              密码至少需要6个字符
            </p>
          </div>

          <button
            type="submit"
            class="login-btn"
            :disabled="loading || !email"
          >
            <span v-if="!loading">{{ isLogin ? '登录' : '注册' }}</span>
            <span v-else class="loading-text">
              <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLogin ? '登录中...' : '注册中...' }}
            </span>
          </button>

          <p v-if="error" :class="['message', error === 'success' ? 'success-message' : 'error-message']">
            {{ error === 'success' ? (isLogin ? '请检查邮箱中的登录链接' : '注册成功，请检查邮箱验证链接') : error }}
          </p>
        </form>

        <div class="features">
          <div class="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>无需密码，邮箱即登录</span>
          </div>
          <div class="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>安全私密，历史记录加密存储</span>
          </div>
          <div class="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            <span>永久保存，随时查看历史记录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { handleSupabaseError } from '@/utils/errorHandler'

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')
const isLogin = ref(true) // true=登录, false=注册

// 判断是否显示密码输入框
// Supabase 模式下，登录和注册都需要密码
const showPassword = computed(() => authStore.isSupabaseEnabled)

async function handleLogin() {
  if (!email.value) return

  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      // 登录
      const result = await authStore.login(email.value, password.value || undefined)

      if (result.success) {
        if (result.message) {
          // OTP 登录需要提示用户查收邮件
          error.value = result.message
          error.value = 'success' // 使用特殊值表示成功消息
        } else {
          emit('close')
          // 如果有重定向地址，跳转到重定向地址
          const redirect = router.currentRoute.value.query.redirect as string
          if (redirect) {
            router.push(redirect)
          }
        }
      } else {
        // 根据不同的错误类型显示不同的提示
        if (result.error?.includes('password')) {
          error.value = '密码错误，请检查后重试'
        } else if (result.error?.includes('Invalid login')) {
          error.value = '邮箱或密码错误'
        } else {
          error.value = result.error || '登录失败，请重试'
        }
      }
    } else {
      // 注册
      // 检查密码强度
      if (password.value && password.value.length < 6) {
        error.value = '密码至少需要6个字符'
        loading.value = false
        return
      }

      const result = await authStore.signUp(email.value, password.value || '', displayName.value || undefined)

      if (result.success) {
        error.value = result.message
        error.value = 'success' // 使用特殊值表示成功消息
        // 切换到登录模式
        isLogin.value = true
        password.value = ''
        displayName.value = ''
      } else {
        // 根据不同的错误类型显示不同的提示
        if (result.error?.includes('User already registered')) {
          error.value = '该邮箱已注册，请直接登录'
          isLogin.value = true
        } else if (result.error?.includes('password')) {
          error.value = '密码不符合要求，至少6个字符'
        } else if (result.error?.includes('signup_disabled')) {
          error.value = '注册功能已禁用'
        } else {
          error.value = result.error || '注册失败，请重试'
        }
      }
    }
  } catch (e: any) {
    // 使用错误处理器
    error.value = handleSupabaseError(e)
  }

  loading.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: #666;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #333;
}

.modal-body {
  padding: 0 2rem 2rem;
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.logo-section h3 {
  margin: 0;
  font-size: 20px;
  color: #666;
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.password-hint {
  margin-top: 0.5rem;
  font-size: 12px;
  color: #ef4444;
}

.login-btn {
  width: 100%;
  padding: 0.875rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  background: #2563eb;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 8px;
}

.switch-btn {
  flex: 1;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 14px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #666;
  font-size: 14px;
}

.feature svg {
  flex-shrink: 0;
  color: #10b981;
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 响应式 */
@media (max-width: 640px) {
  .modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .modal-header,
  .modal-body {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>