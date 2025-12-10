<template>
  <div class="container" style="max-width: 100%;">
    <div class="page-header" style="max-width: 1200px; margin: 0 auto 30px auto;">
      <div>
        <h1 class="page-title">编辑大纲</h1>
        <p class="page-subtitle">调整页面顺序，修改文案，打造完美内容</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" @click="goBack" style="background: white; border: 1px solid var(--border-color);">
          上一步
        </button>
        <button class="btn btn-primary generate-images-btn" @click="startGeneration">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>
          开始生成图片
        </button>
      </div>
    </div>

    <div class="outline-grid outline-editor">
      <div
        v-for="(page, idx) in store.outline.pages"
        :key="page.index"
        class="card outline-card"
        :draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragover.prevent="onDragOver($event, idx)"
        @drop="onDrop($event, idx)"
        :class="{ 'dragging-over': dragOverIndex === idx }"
      >
        <!-- 拖拽手柄 (改为右上角或更加隐蔽) -->
        <div class="card-top-bar">
          <div class="page-info">
             <span class="page-number">P{{ idx + 1 }}</span>
             <span class="page-type" :class="page.type">{{ getPageTypeName(page.type) }}</span>
          </div>
          
          <div class="card-controls">
            <!-- 参考图片指示器 -->
            <button
              v-if="store.userImages.length > 0"
              class="icon-btn"
              @click="showImageSelector(idx)"
              :class="{ active: store.getPageReferenceImages(page.index).length > 0 }"
              :title="store.getPageReferenceImages(page.index).length > 0 ? `${store.getPageReferenceImages(page.index).length} 张参考图片` : '选择参考图片'"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                 <circle cx="8.5" cy="8.5" r="1.5"></circle>
                 <polyline points="21 15 16 10 5 21"></polyline>
               </svg>
               <span v-if="store.getPageReferenceImages(page.index).length > 0" class="badge">{{ store.getPageReferenceImages(page.index).length }}</span>
            </button>
            <div class="drag-handle" title="拖拽排序">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
            </div>
            <button class="icon-btn" @click="deletePage(idx)" title="删除此页">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <textarea
          v-model="page.content"
          class="textarea-paper"
          placeholder="在此输入文案..."
          @input="store.updatePage(page.index, page.content)"
        />
        
        <div class="word-count">{{ page.content.length }} 字</div>
      </div>

      <!-- 添加按钮卡片 -->
      <div class="card add-card-dashed" @click="addPage('content')">
        <div class="add-content">
          <div class="add-icon">+</div>
          <span>添加页面</span>
        </div>
      </div>
    </div>
    
    <div style="height: 100px;"></div>

    <!-- 图片选择器弹窗 -->
    <div v-if="imageSelectorVisible" class="modal-overlay" @click.self="closeImageSelector">
      <div class="modal-content image-selector">
        <div class="modal-header">
          <h3>为第 {{ selectedPageIndex + 1 }} 页选择参考图片</h3>
          <button class="close-btn" @click="closeImageSelector">×</button>
        </div>
        <div class="modal-body">
          <div class="image-grid">
            <div
              v-for="(image, index) in store.userImages"
              :key="index"
              class="image-item"
              :class="{ selected: isImageSelected(selectedPageIndex, index) }"
              @click="toggleImageSelection(selectedPageIndex, index)"
            >
              <img :src="getImageUrl(image)" :alt="`参考图片 ${index + 1}`" />
              <div class="check-mark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeImageSelector">取消</button>
          <button class="btn btn-primary" @click="confirmImageSelection">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneratorStore } from '../stores/generator'

const router = useRouter()
const store = useGeneratorStore()

const dragOverIndex = ref<number | null>(null)
const draggedIndex = ref<number | null>(null)

// 图片选择器相关
const imageSelectorVisible = ref(false)
const selectedPageIndex = ref(0)
const tempSelectedImages = ref<number[]>([])

const getPageTypeName = (type: string) => {
  const names = {
    cover: '封面',
    content: '内容',
    summary: '总结'
  }
  return names[type as keyof typeof names] || '内容'
}

// 拖拽逻辑
const onDragStart = (e: DragEvent, index: number) => {
  draggedIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }
}

const onDragOver = (e: DragEvent, index: number) => {
  if (draggedIndex.value === index) return
  dragOverIndex.value = index
}

const onDrop = (e: DragEvent, index: number) => {
  dragOverIndex.value = null
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    store.movePage(draggedIndex.value, index)
  }
  draggedIndex.value = null
}

const deletePage = (index: number) => {
  if (confirm('确定要删除这一页吗？')) {
    store.deletePage(index)
  }
}

const addPage = (type: 'cover' | 'content' | 'summary') => {
  store.addPage(type, '')
  // 滚动到底部
  nextTick(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  })
}

const goBack = () => {
  router.back()
}

// 图片选择器方法
const showImageSelector = (pageIndex: number) => {
  selectedPageIndex.value = pageIndex
  // 初始化临时选择状态
  const currentSelection = store.pageImageMapping[pageIndex] || []
  tempSelectedImages.value = [...currentSelection]
  imageSelectorVisible.value = true
}

const closeImageSelector = () => {
  imageSelectorVisible.value = false
  tempSelectedImages.value = []
}

const isImageSelected = (pageIndex: number, imageIndex: number) => {
  return tempSelectedImages.value.includes(imageIndex)
}

const toggleImageSelection = (pageIndex: number, imageIndex: number) => {
  const index = tempSelectedImages.value.indexOf(imageIndex)
  if (index > -1) {
    tempSelectedImages.value.splice(index, 1)
  } else {
    tempSelectedImages.value.push(imageIndex)
  }
}

const confirmImageSelection = () => {
  store.setPageImageMapping(selectedPageIndex.value, tempSelectedImages.value)
  closeImageSelector()
}

const getImageUrl = (file: File) => {
  return URL.createObjectURL(file)
}

const startGeneration = () => {
  router.push('/generate')
}
</script>

<style scoped>
/* 网格布局 */
.outline-grid {
  display: grid;
  /* 响应式列：最小宽度 280px，自动填充 */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.outline-card {
  display: flex;
  flex-direction: column;
  padding: 16px; /* 减小内边距 */
  transition: all 0.2s ease;
  border: none;
  border-radius: 8px; /* 较小的圆角 */
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  /* 保持一定的长宽比感，虽然高度自适应，但由于 flex column 和内容撑开，
     这里设置一个 min-height 让它看起来像个竖向卡片 */
  min-height: 360px; 
  position: relative;
}

.outline-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  z-index: 10;
}

.outline-card.dragging-over {
  border: 2px dashed var(--primary);
  opacity: 0.8;
}

/* 顶部栏 */
.card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-number {
  font-size: 14px;
  font-weight: 700;
  color: #ccc;
  font-family: 'Inter', sans-serif;
}

.page-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.page-type.cover { color: #FF4D4F; background: #FFF1F0; }
.page-type.content { color: #8c8c8c; background: #f5f5f5; }
.page-type.summary { color: #52C41A; background: #F6FFED; }

.card-controls {
  display: flex;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.2s;
}
.outline-card:hover .card-controls { opacity: 1; }

.drag-handle {
  cursor: grab;
  padding: 2px;
}
.drag-handle:active { cursor: grabbing; }

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 2px;
  transition: color 0.2s;
}
.icon-btn:hover { color: #FF4D4F; }

/* 文本区域 - 核心 */
.textarea-paper {
  flex: 1; /* 占据剩余空间 */
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 16px; /* 更大的字号 */
  line-height: 1.7; /* 舒适行高 */
  color: #333;
  resize: none; /* 禁止手动拉伸，保持卡片整体感 */
  font-family: inherit;
  margin-bottom: 10px;
}

.textarea-paper:focus {
  outline: none;
}

.word-count {
  text-align: right;
  font-size: 11px;
  color: #ddd;
  margin-top: auto;
}

/* 添加卡片 */
.add-card-dashed {
  border: 2px dashed #eee;
  background: transparent;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 360px;
  color: #ccc;
  transition: all 0.2s;
}

.add-card-dashed:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(255, 36, 66, 0.02);
}

.add-content {
  text-align: center;
}

.add-icon {
  font-size: 32px;
  font-weight: 300;
  margin-bottom: 8px;
}

/* 图片选择器样式 */
.icon-btn.active {
  color: var(--primary);
  background: rgba(var(--primary-rgb), 0.1);
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--primary);
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 10px;
  line-height: 1;
}

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
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-selector .modal-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-selector .modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-item.selected {
  border: 3px solid var(--primary);
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s;
}

.image-item.selected .check-mark {
  opacity: 1;
  transform: scale(1);
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
