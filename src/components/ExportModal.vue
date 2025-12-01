<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>导出设置</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 导出格式选择 -->
        <div class="form-group">
          <label class="form-label">导出格式</label>
          <div class="format-grid">
            <div
              class="format-option"
              :class="{ active: selectedFormats.includes('pdf') }"
              @click="toggleFormat('pdf')"
            >
              <div class="format-icon">📄</div>
              <div class="format-name">PDF</div>
              <div class="format-desc">适合打印和分享</div>
            </div>

            <div
              class="format-option"
              :class="{ active: selectedFormats.includes('longImage') }"
              @click="toggleFormat('longImage')"
            >
              <div class="format-icon">🖼️</div>
              <div class="format-name">长图</div>
              <div class="format-desc">拼接成一张长图</div>
            </div>

            <div
              class="format-option"
              :class="{ active: selectedFormats.includes('pptx') }"
              @click="toggleFormat('pptx')"
            >
              <div class="format-icon">📊</div>
              <div class="format-name">PPT</div>
              <div class="format-desc">PowerPoint演示文稿</div>
            </div>
          </div>
        </div>

        <!-- 文件标题 -->
        <div class="form-group">
          <label class="form-label">文件标题</label>
          <input
            v-model="exportOptions.title"
            type="text"
            class="form-input"
            placeholder="输入文件标题（可选）"
          />
        </div>

        <!-- 水印设置 -->
        <div class="form-group">
          <div class="watermark-header">
            <label class="form-label">水印设置</label>
            <label class="switch">
              <input
                type="checkbox"
                v-model="watermarkEnabled"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div v-if="watermarkEnabled" class="watermark-options">
            <input
              v-model="exportOptions.watermark!.text"
              type="text"
              class="form-input"
              placeholder="输入水印文字"
            />

            <div class="watermark-settings">
              <div class="setting-item">
                <label>透明度</label>
                <input
                  v-model.number="exportOptions.watermark!.opacity"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                />
                <span>{{ exportOptions.watermark!.opacity }}</span>
              </div>

              <div class="setting-item">
                <label>字体大小</label>
                <input
                  v-model.number="exportOptions.watermark!.fontSize"
                  type="range"
                  min="10"
                  max="30"
                  step="2"
                />
                <span>{{ exportOptions.watermark!.fontSize }}</span>
              </div>

              <div class="setting-item">
                <label>颜色</label>
                <input
                  v-model="exportOptions.watermark!.color"
                  type="color"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 图片质量 -->
        <div class="form-group">
          <label class="form-label">导出质量</label>
          <div class="quality-options">
            <div
              class="quality-option"
              :class="{ active: exportOptions.quality === 0.8 }"
              @click="exportOptions.quality = 0.8"
            >
              标准
            </div>
            <div
              class="quality-option"
              :class="{ active: exportOptions.quality === 0.9 }"
              @click="exportOptions.quality = 0.9"
            >
              高质量
            </div>
            <div
              class="quality-option"
              :class="{ active: exportOptions.quality === 1.0 }"
              @click="exportOptions.quality = 1.0"
            >
              最高质量
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="$emit('close')">取消</button>
        <button
          class="btn btn-primary"
          @click="handleExport"
          :disabled="selectedFormats.length === 0 || exporting"
        >
          {{ exporting ? '导出中...' : '开始导出' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { exportService, type ExportOptions, type ImageData } from '../utils/exportService'

const props = defineProps<{
  visible: boolean
  images: ImageData[]
}>()

const emit = defineEmits<{
  close: []
  exportStart: []
  exportComplete: []
  exportError: [error: string]
}>()

const selectedFormats = ref<string[]>(['pdf'])
const exporting = ref(false)
const watermarkEnabled = ref(false)

const exportOptions = reactive<ExportOptions>({
  title: '',
  watermark: {
    text: 'RedInk',
    opacity: 0.3,
    fontSize: 20,
    color: '#666666'
  },
  quality: 0.9
})

// 监听水印开关
watch(watermarkEnabled, (enabled) => {
  if (!enabled) {
    exportOptions.watermark = undefined
  } else {
    exportOptions.watermark = {
      text: 'RedInk',
      opacity: 0.3,
      fontSize: 20,
      color: '#666666'
    }
  }
})

const toggleFormat = (format: string) => {
  const index = selectedFormats.value.indexOf(format)
  if (index > -1) {
    selectedFormats.value.splice(index, 1)
  } else {
    selectedFormats.value.push(format)
  }
}

const handleExport = async () => {
  if (selectedFormats.value.length === 0) return

  exporting.value = true
  emit('exportStart')

  try {
    const exportPromises: Promise<void>[] = []

    for (const format of selectedFormats.value) {
      switch (format) {
        case 'pdf':
          exportPromises.push(exportService.exportToPDF(props.images, exportOptions))
          break
        case 'longImage':
          exportPromises.push(exportService.exportToLongImage(props.images, exportOptions))
          break
        case 'pptx':
          exportPromises.push(exportService.exportToPPT(props.images, exportOptions))
          break
      }
    }

    await Promise.all(exportPromises)
    emit('exportComplete')
    emit('close')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '导出失败'
    emit('exportError', errorMessage)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-sub);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.format-option {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}

.format-option.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.format-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.format-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.format-desc {
  font-size: 12px;
  color: var(--text-sub);
}

.watermark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.watermark-options {
  margin-top: 12px;
}

.watermark-settings {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.setting-item label {
  min-width: 60px;
  font-size: 14px;
  color: var(--text-sub);
}

.setting-item input[type="range"] {
  flex: 1;
}

.setting-item span {
  min-width: 30px;
  text-align: right;
  font-size: 14px;
  color: var(--text-primary);
}

.setting-item input[type="color"] {
  width: 50px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.quality-options {
  display: flex;
  gap: 12px;
}

.quality-option {
  flex: 1;
  padding: 10px;
  text-align: center;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.quality-option:hover {
  border-color: var(--primary);
}

.quality-option.active {
  border-color: var(--primary);
  background: var(--primary);
  color: white;
}
</style>