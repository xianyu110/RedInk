<template>
  <div class="data-manager">
    <div class="section">
      <h3>数据管理</h3>
      <p class="description">管理你的本地数据，包括导入导出和清理功能</p>

      <div class="actions">
        <button class="btn btn-primary" @click="exportData" :disabled="isExporting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {{ isExporting ? '导出中...' : '导出数据' }}
        </button>

        <label class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17,8 12,3 7,8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          导入数据
          <input
            type="file"
            accept=".json"
            @change="handleImport"
            style="display: none;"
          />
        </label>

        <button class="btn btn-danger" @click="clearAllData" :disabled="isClearing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          {{ isClearing ? '清理中...' : '清空数据' }}
        </button>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="section">
      <h3>数据统计</h3>
      <div class="stats-grid" v-if="stats">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">总记录数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.by_status?.completed || 0 }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.by_status?.draft || 0 }}</div>
          <div class="stat-label">草稿</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatStorageSize(storageSize) }}</div>
          <div class="stat-label">存储空间</div>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getHistoryStats, exportData as exportDataService, importData as importDataService } from '../api'

// 状态
const isExporting = ref(false)
const isClearing = ref(false)
const stats = ref<any>(null)
const storageSize = ref(0)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

onMounted(() => {
  loadStats()
  calculateStorageSize()
})

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const result = await getHistoryStats()
    if (result.success) {
      stats.value = result
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

/**
 * 计算存储大小
 */
function calculateStorageSize() {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith('redink-')) {
      total += localStorage[key].length + key.length
    }
  }
  storageSize.value = total
}

/**
 * 格式化存储大小
 */
function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 显示消息
 */
function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
  message.value = text
  messageType.value = type

  setTimeout(() => {
    message.value = ''
  }, 3000)
}

/**
 * 导出数据
 */
async function exportData() {
  isExporting.value = true

  try {
    const result = await exportDataService()

    if (result.success && result.data) {
      // 创建下载链接
      const blob = new Blob([result.data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `redink-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)

      showMessage('数据导出成功', 'success')
    } else {
      showMessage(result.error || '导出失败', 'error')
    }
  } catch (error) {
    showMessage('导出失败: ' + (error as Error).message, 'error')
  } finally {
    isExporting.value = false
  }
}

/**
 * 处理导入
 */
async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()

    if (!confirm('导入数据将覆盖现有的重复记录，确定继续吗？')) {
      return
    }

    const result = await importDataService(text)

    if (result.success) {
      showMessage(`成功导入 ${result.imported} 条记录`, 'success')
      await loadStats()
      calculateStorageSize()
    } else {
      showMessage(result.error || '导入失败', 'error')
    }
  } catch (error) {
    showMessage('导入失败: ' + (error as Error).message, 'error')
  }

  // 清空文件输入
  (event.target as HTMLInputElement).value = ''
}

/**
 * 清空所有数据
 */
async function clearAllData() {
  if (!confirm('确定要清空所有数据吗？此操作不可撤销！')) {
    return
  }

  if (!confirm('再次确认：所有历史记录、配置和模板都将被删除！')) {
    return
  }

  isClearing.value = true

  try {
    // 清空所有 redink- 开头的 localStorage 数据
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('redink-')) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))

    // 清空 IndexedDB 中的图片数据
    if ('indexedDB' in window) {
      const deleteRequest = indexedDB.deleteDatabase('RedInkImages')
      deleteRequest.onsuccess = () => {
        console.log('图片数据库已清空')
      }
    }

    showMessage('所有数据已清空', 'success')

    // 重新加载统计数据
    await loadStats()
    calculateStorageSize()
  } catch (error) {
    showMessage('清空失败: ' + (error as Error).message, 'error')
  } finally {
    isClearing.value = false
  }
}
</script>

<style scoped>
.data-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.description {
  margin: 0 0 20px 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: white;
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--hover-bg);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  background: var(--hover-bg);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.message {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.message.success {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.message.error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message.info {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

@media (max-width: 768px) {
  .data-manager {
    padding: 16px;
  }

  .section {
    padding: 20px;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>