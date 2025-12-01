<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>选择内容模板</h2>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="template-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            :class="{ active: selectedTemplate === template.id }"
            @click="selectTemplate(template.id)"
          >
            <div class="template-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
            </div>
            <div class="template-info">
              <h3>{{ template.name }}</h3>
              <p>{{ template.description }}</p>
            </div>
            <div class="template-structure">
              <div class="structure-preview">
                <div
                  v-for="(item, index) in template.structure.slice(0, 3)"
                  :key="index"
                  class="structure-item"
                >
                  <span class="item-type">{{ getPageTypeName(item.type) }}</span>
                  <span class="item-content">{{ item.content.substring(0, 20) }}...</span>
                </div>
                <div v-if="template.structure.length > 3" class="structure-more">
                  +{{ template.structure.length - 3 }} 更多...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义选项 -->
        <div class="custom-option">
          <div
            class="template-card"
            :class="{ active: selectedTemplate === 'custom' }"
            @click="selectTemplate('custom')"
          >
            <div class="template-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M1 12h6m6 0h6"></path>
              </svg>
            </div>
            <div class="template-info">
              <h3>自定义内容</h3>
              <p>不使用模板，自由创作内容</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">取消</button>
        <button class="btn btn-primary" @click="confirmSelection" :disabled="!selectedTemplate">
          确认选择
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTemplates } from '../api/local'

const emit = defineEmits<{
  select: [templateId: string]
  close: []
}>()

defineProps<{
  isVisible: boolean
}>()

const templates = ref<any[]>([])
const selectedTemplate = ref<string>('')

onMounted(() => {
  loadTemplates()
})

const loadTemplates = async () => {
  try {
    const result = await getTemplates()
    if (result.success) {
      templates.value = result.templates
    }
  } catch (error) {
    console.error('加载模板失败:', error)
  }
}

const selectTemplate = (templateId: string) => {
  selectedTemplate.value = templateId
}

const confirmSelection = () => {
  if (selectedTemplate.value) {
    emit('select', selectedTemplate.value)
    closeModal()
  }
}

const closeModal = () => {
  emit('close')
}

const getPageTypeName = (type: string) => {
  const names = {
    cover: '封面',
    content: '内容',
    summary: '总结'
  }
  return names[type as keyof typeof names] || '内容'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: var(--hover-bg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.template-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--primary-light);
  background-color: var(--hover-bg);
}

.template-card.active {
  border-color: var(--primary);
  background-color: var(--primary-light);
  color: var(--primary-dark);
}

.template-icon {
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--primary-light);
  border-radius: 8px;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
}

.template-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.template-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.template-structure {
  width: 300px;
}

.structure-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.structure-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.item-type {
  background-color: var(--hover-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  color: var(--primary);
}

.item-content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.structure-more {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
  padding: 4px 0;
}

.custom-option {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--hover-bg);
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .template-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .template-structure {
    width: 100%;
  }
}
</style>