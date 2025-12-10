<template>
  <div class="container" style="max-width: 1200px;">

    <!-- Header Area -->
    <div class="page-header">
      <div>
        <h1 class="page-title">我的创作</h1>
      </div>
      <div style="display: flex; gap: 10px;">
        <button
          class="btn"
          @click="handleScanAll"
          :disabled="isScanning"
          style="border: 1px solid var(--border-color);"
        >
          <svg v-if="!isScanning" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          <div v-else class="spinner-small" style="margin-right: 6px;"></div>
          {{ isScanning ? '同步中...' : '同步历史' }}
        </button>
        <button class="btn btn-primary" @click="router.push('/')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          新建图文
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <StatsOverview v-if="stats" :stats="stats" />

    <!-- Toolbar: Tabs & Search -->
    <div class="toolbar-wrapper">
      <div class="tabs-container" style="margin-bottom: 0; border-bottom: none;">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'all' }"
          @click="switchTab('all')"
        >
          全部
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'completed' }"
          @click="switchTab('completed')"
        >
          已完成
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'draft' }"
          @click="switchTab('draft')"
        >
          草稿箱
        </div>
      </div>

      <div class="search-mini">
        <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索标题..."
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="records.length === 0" class="empty-state-large">
      <div class="empty-img">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
      </div>
      <h3>暂无相关记录</h3>
      <p class="empty-tips">去创建一个新的作品吧</p>
    </div>

    <div v-else class="gallery-grid">
      <GalleryCard
        v-for="record in records"
        :key="record.id"
        :record="record"
        @preview="viewImages"
        @edit="loadRecord"
        @delete="confirmDelete"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
       <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
       <span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span>
       <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Next</button>
    </div>

    <!-- Image Viewer Modal -->
    <ImageGalleryModal
      v-if="viewingRecord"
      :visible="!!viewingRecord"
      :record="viewingRecord"
      :regeneratingImages="regeneratingImages"
      @close="closeGallery"
      @showOutline="showOutlineModal = true"
      @regenerate="regenerateHistoryImage"
      @downloadAll="downloadAllImages"
      @download="downloadImage"
    />

    <!-- 大纲查看模态框 -->
    <OutlineModal
      v-if="showOutlineModal && viewingRecord"
      :visible="showOutlineModal"
      :pages="viewingRecord.outline.pages"
      @close="showOutlineModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getHistoryList,
  getHistoryStats,
  searchHistory,
  deleteHistory,
  getHistory,
  updateHistory,
  type HistoryRecord
} from '../services/historyService'
import { regenerateSingleImage } from '../services/aiService'
import { useGeneratorStore } from '../stores/generator'

// 引入组件
import StatsOverview from '@/components/history/StatsOverview.vue'
import GalleryCard from '@/components/history/GalleryCard.vue'
import ImageGalleryModal from '@/components/history/ImageGalleryModal.vue'
import OutlineModal from '@/components/history/OutlineModal.vue'

const router = useRouter()
const route = useRoute()
const store = useGeneratorStore()

// 数据状态
const records = ref<HistoryRecord[]>([])
const loading = ref(false)
const stats = ref<any>(null)
const currentTab = ref('all')
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

// 查看器状态
const viewingRecord = ref<any>(null)
const regeneratingImages = ref<Set<number>>(new Set())
const showOutlineModal = ref(false)
const isScanning = ref(false)

/**
 * 加载历史记录列表
 */
async function loadData() {
  loading.value = true
  try {
    let statusFilter = currentTab.value === 'all' ? undefined : currentTab.value
    console.log('📋 加载历史记录列表, 页码:', currentPage.value, '状态:', statusFilter)

    const res = await getHistoryList(currentPage.value, 12, statusFilter)
    console.log('📋 历史记录列表结果:', res)

    if (res.success) {
      records.value = res.records
      totalPages.value = res.total_pages
      console.log('✅ 加载成功:', res.records.length, '条记录')
    } else {
      console.error('❌ 加载失败')
    }
  } catch(e) {
    console.error('❌ 加载异常:', e)
  } finally {
    loading.value = false
  }
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const res = await getHistoryStats()
    console.log('📊 统计数据:', res)
    if (res.success) stats.value = res
  } catch(e) {
    console.error('❌ 加载统计失败:', e)
  }
}

/**
 * 切换标签页
 */
function switchTab(tab: string) {
  currentTab.value = tab
  currentPage.value = 1
  loadData()
}

/**
 * 搜索历史记录
 */
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    loadData()
    return
  }
  loading.value = true
  try {
    const res = await searchHistory(searchKeyword.value)
    if (res.success) {
      records.value = res.records
      totalPages.value = 1
    }
  } catch(e) {} finally {
    loading.value = false
  }
}

/**
 * 加载记录并跳转到编辑页
 */
async function loadRecord(id: string) {
  const res = await getHistory(id)
  if (res.success && res.record) {
    store.setTopic(res.record.title)
    store.setOutline(res.record.outline.raw, res.record.outline.pages)
    store.recordId = res.record.id
    if (res.record.images.generated.length > 0) {
      store.taskId = res.record.images.task_id
      store.images = res.record.outline.pages.map((page, idx) => {
        const imageUrl = res.record!.images.generated[idx]
        return {
          index: idx,
          url: imageUrl || '',
          status: imageUrl ? 'done' : 'error',
          retryable: !imageUrl
        }
      })
    }
    router.push('/outline')
  }
}

/**
 * 查看图片
 */
async function viewImages(id: string) {
  const res = await getHistory(id)
  if (res.success) viewingRecord.value = res.record
}

/**
 * 关闭图片查看器
 */
function closeGallery() {
  viewingRecord.value = null
  showOutlineModal.value = false
}

/**
 * 确认删除
 */
async function confirmDelete(record: any) {
  if(confirm('确定删除吗？')) {
    await deleteHistory(record.id)
    loadData()
    loadStats()
  }
}

/**
 * 切换页码
 */
function changePage(p: number) {
  currentPage.value = p
  loadData()
}

/**
 * 重新生成历史记录中的图片
 */
async function regenerateHistoryImage(index: number) {
  if (!viewingRecord.value) {
    alert('无法重新生成：缺少记录信息')
    return
  }

  const page = viewingRecord.value.outline.pages[index]
  if (!page) return

  regeneratingImages.value.add(index)

  try {
    const result = await regenerateSingleImage(page)

    if (result.success && result.imageUrl) {
      viewingRecord.value.images.generated[index] = result.imageUrl

      updateHistory(viewingRecord.value.id, {
        images: {
          task_id: viewingRecord.value.images.task_id,
          generated: viewingRecord.value.images.generated
        }
      })

      regeneratingImages.value.delete(index)
    } else {
      regeneratingImages.value.delete(index)
      alert('重新生成失败: ' + (result.error || '未知错误'))
    }
  } catch (e) {
    regeneratingImages.value.delete(index)
    alert('重新生成失败: ' + String(e))
  }
}

/**
 * 下载单张图片
 */
function downloadImage(imageUrl: string, index: number) {
  if (!imageUrl) return
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = `page_${index + 1}.png`
  link.click()
}

/**
 * 打包下载所有图片
 */
function downloadAllImages() {
  if (!viewingRecord.value) return
  
  // 逐个下载所有图片
  viewingRecord.value.images.generated.forEach((imageUrl: string, index: number) => {
    if (imageUrl) {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `page_${index + 1}.png`
        link.click()
      }, index * 300)
    }
  })
}

/**
 * 同步历史记录（纯前端版本不需要扫描后端任务）
 */
function handleScanAll() {
  isScanning.value = true
  try {
    // 纯前端版本，只需要重新加载数据
    loadData()
    loadStats()
    alert('同步完成！')
  } catch (e) {
    console.error('同步失败:', e)
    alert('同步失败: ' + String(e))
  } finally {
    isScanning.value = false
  }
}

onMounted(async () => {
  await loadData()
  await loadStats()

  // 检查路由参数，如果有 ID 则自动打开图片查看器
  if (route.params.id) {
    await viewImages(route.params.id as string)
  }
})
</script>

<style scoped>
/* Small Spinner */
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Toolbar */
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0;
}

.search-mini {
  position: relative;
  width: 240px;
  margin-bottom: 10px;
}

.search-mini input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 100px;
  border: 1px solid var(--border-color);
  font-size: 14px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-mini input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-light);
}

.search-mini .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #ccc;
}

/* Gallery Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 40px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state-large {
  text-align: center;
  padding: 80px 0;
  color: var(--text-sub);
}

.empty-img {
  font-size: 64px;
  opacity: 0.5;
}

.empty-state-large .empty-tips {
  margin-top: 10px;
  color: var(--text-placeholder);
}
</style>
