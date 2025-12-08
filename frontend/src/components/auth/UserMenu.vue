<template>
  <div class="user-menu" ref="menuRef">
    <button class="user-button" @click="toggleMenu">
      <img
        v-if="user?.avatar_url"
        :src="user.avatar_url"
        :alt="user.name"
        class="avatar"
      />
      <div v-else class="avatar-placeholder">
        {{ user?.name?.charAt(0).toUpperCase() || 'U' }}
      </div>
      <span class="user-name">{{ user?.name || '用户' }}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <div v-if="showMenu" class="menu-dropdown">
      <div class="menu-header">
        <img
          v-if="user?.avatar_url"
          :src="user.avatar_url"
          :alt="user.name"
          class="avatar large"
        />
        <div v-else class="avatar-placeholder large">
          {{ user?.name?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="user-info">
          <p class="user-name">{{ user?.name || '用户' }}</p>
          <p class="user-email">{{ user?.email }}</p>
        </div>
      </div>

      <div class="menu-divider"></div>

      <button class="menu-item" @click="editProfile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        编辑资料
      </button>

      <button class="menu-item" @click="openSettings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.54l4.24 4.24M12 23v-6m0-6V1m-4.22 13.22l-4.24-4.24M22.46 14.46l-4.24-4.24"></path>
        </svg>
        系统设置
      </button>

      <div class="menu-divider"></div>

      <button class="menu-item logout" @click="handleLogout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        退出登录
      </button>
    </div>

    <!-- 编辑资料对话框 -->
    <Teleport to="body">
      <div v-if="showEditProfile" class="modal-overlay" @click.self="showEditProfile = false">
        <div class="modal">
          <div class="modal-header">
            <h3>编辑资料</h3>
            <button class="modal-close" @click="showEditProfile = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>昵称</label>
              <input v-model="profileForm.name" type="text" class="form-input" placeholder="请输入昵称" />
            </div>

            <div class="form-group">
              <label>头像 URL</label>
              <input v-model="profileForm.avatar_url" type="url" class="form-input" placeholder="请输入头像 URL（可选）" />
            </div>

            <div class="avatar-preview">
              <img
                v-if="profileForm.avatar_url"
                :src="profileForm.avatar_url"
                alt="头像预览"
                @error="handleAvatarError"
              />
              <div v-else class="avatar-placeholder preview">
                {{ profileForm.name?.charAt(0).toUpperCase() || 'U' }}
              </div>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" @click="showEditProfile = false">取消</button>
            <button class="btn btn-primary" @click="saveProfile" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { updateProfile } from '@/api/auth'

const authStore = useAuthStore()
const router = useRouter()

const menuRef = ref<HTMLElement>()
const showMenu = ref(false)
const showEditProfile = ref(false)
const saving = ref(false)
const error = ref('')

const user = computed(() => authStore.user)

const profileForm = ref({
  name: '',
  avatar_url: ''
})

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    showMenu.value = false
  }
}

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function editProfile() {
  profileForm.value = {
    name: user.value?.name || '',
    avatar_url: user.value?.avatar_url || ''
  }
  showEditProfile.value = true
  showMenu.value = false
  error.value = ''
}

async function saveProfile() {
  if (!authStore.token) return

  saving.value = true
  error.value = ''

  try {
    const result = await updateProfile(authStore.token, profileForm.value)

    if (result.success && result.data) {
      authStore.updateUser(result.data)
      showEditProfile.value = false
    } else {
      error.value = result.error || '保存失败'
    }
  } catch (e) {
    error.value = '保存失败，请重试'
  } finally {
    saving.value = false
  }
}

function handleAvatarError() {
  // 头像加载失败
}

function openSettings() {
  showMenu.value = false
  router.push('/settings')
}

async function handleLogout() {
  showMenu.value = false
  await authStore.logout()
  router.push('/')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  background: #f3f4f6;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.avatar.large {
  width: 64px;
  height: 64px;
  font-size: 24px;
}

.avatar-placeholder.preview {
  width: 80px;
  height: 80px;
  font-size: 32px;
  background: #e5e7eb;
  color: #6b7280;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 280px;
  padding: 0.75rem;
  z-index: 100;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  margin: -0.75rem -0.75rem 0.75rem;
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-info .user-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 13px;
  color: #666;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.75rem -0.75rem;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  font-size: 14px;
  text-align: left;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.logout {
  color: #dc2626;
}

.menu-item.logout:hover {
  background: #fef2f2;
}

/* 编辑资料对话框样式 */
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
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #666;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
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
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.avatar-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar-preview img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
</style>