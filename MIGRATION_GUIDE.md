# 迁移指南 - 完成纯前端改造

## 已完成的改造

✅ vercel.json - 配置为纯静态部署
✅ aiService.ts - 前端直接调用 AI API
✅ historyService.ts - 历史记录使用 localStorage  
✅ HomeView.vue - 使用新的 AI 服务生成大纲

## 需要手动完成的改造

### 1. GenerateView.vue - 图片生成页面

**需要修改的地方：**

找到 `onMounted` 函数中的图片生成逻辑，替换为：

```typescript
onMounted(async () => {
  if (store.outline.pages.length === 0) {
    router.push('/')
    return
  }

  // 创建历史记录
  if (!store.recordId) {
    const result = createHistory(store.topic, {
      raw: store.outline.raw,
      pages: store.outline.pages
    })
    if (result.success && result.record_id) {
      store.recordId = result.record_id
    }
  }

  store.startGeneration()

  // 使用新的图片生成服务
  await generateImagesForPages(
    store.outline.pages,
    (index, status, url, errorMsg) => {
      if (status === 'done' && url) {
        store.updateProgress(index, 'done', url)
      } else if (status === 'error') {
        store.updateProgress(index, 'error', undefined, errorMsg)
      }
    }
  )

  // 生成完成
  const taskId = Date.now().toString()
  store.finishGeneration(taskId)

  // 更新历史记录
  if (store.recordId) {
    const generatedImages = store.images
      .filter(img => img.status === 'done' && img.url)
      .map(img => img.url)

    updateHistory(store.recordId, {
      images: {
        task_id: taskId,
        generated: generatedImages
      },
      status: hasFailedImages.value ? 'partial' : 'completed',
      thumbnail: generatedImages[0] || null
    })
  }

  // 跳转到结果页
  if (!hasFailedImages.value) {
    setTimeout(() => router.push('/result'), 1000)
  }
})
```

**修改重新生成图片的函数：**

```typescript
async function regenerateImage(index: number) {
  if (!store.taskId) return

  const page = store.outline.pages.find(p => p.index === index)
  if (!page) return

  store.setImageRetrying(index)

  const imagePrompt = `Create an illustration for: ${page.content.substring(0, 200)}`
  const result = await generateImageWithAI(imagePrompt)

  if (result.success && result.imageUrl) {
    store.updateImage(index, result.imageUrl)
    
    // 更新历史记录
    if (store.recordId) {
      const generatedImages = store.images
        .filter(img => img.status === 'done' && img.url)
        .map(img => img.url)
      
      updateHistory(store.recordId, {
        images: {
          task_id: store.taskId,
          generated: generatedImages
        }
      })
    }
  } else {
    store.updateProgress(index, 'error', undefined, result.error)
  }
}
```

### 2. HistoryView.vue - 历史记录页面

**修改 import：**

```typescript
import { getHistoryList, getHistory, deleteHistory, searchHistory, getHistoryStats } from '../services/historyService'
```

**修改所有 API 调用：**

- `getHistoryList()` - 已经是同步的，直接调用
- `getHistory(id)` - 已经是同步的，直接调用  
- `deleteHistory(id)` - 已经是同步的，直接调用
- `searchHistory(keyword)` - 已经是同步的，直接调用

**移除 async/await：**

```typescript
// 之前
const res = await getHistoryList(page, pageSize, status)

// 现在
const res = getHistoryList(page, pageSize, status)
```

### 3. ResultView.vue - 结果页面

**修改重新生成图片的函数：**

```typescript
async function regenerateImage(image: GeneratedImage) {
  regeneratingIndex.value = image.index
  
  const pageContent = store.outline.pages.find(p => p.index === image.index)
  if (!pageContent) {
    alert('无法找到对应页面的内容')
    return
  }

  const imagePrompt = `Create an illustration for: ${pageContent.content.substring(0, 200)}`
  const result = await generateImageWithAI(imagePrompt)

  if (result.success && result.imageUrl) {
    store.updateImage(image.index, result.imageUrl)
    
    // 更新历史记录
    if (store.recordId) {
      const generatedImages = store.images
        .filter(img => img.status === 'done' && img.url)
        .map(img => img.url)
      
      updateHistory(store.recordId, {
        images: {
          task_id: store.taskId!,
          generated: generatedImages
        }
      })
    }
  } else {
    alert(result.error || '重新生成失败')
  }

  regeneratingIndex.value = null
}
```

### 4. 移除不需要的文件

可以删除以下后端相关文件（可选）：

```bash
rm -rf api/
rm -rf backend/
rm -rf docker/
rm docker-compose.yml
rm Dockerfile
rm requirements.txt
rm pyproject.toml
rm uv.lock
```

### 5. 更新 README.md

添加部署说明：

```markdown
## 部署

### Vercel 部署（推荐）

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 自动部署完成

### 本地运行

\`\`\`bash
cd frontend
npm install --legacy-peer-deps
npm run dev
\`\`\`

## 配置

首次使用需要配置 API Key：

1. 进入"系统设置"
2. 启用"使用本地配置"
3. 添加文本生成和图片生成服务商
4. 填写 API Key 和配置
```

## 测试清单

完成改造后，测试以下功能：

- [ ] 生成大纲
- [ ] 编辑大纲
- [ ] 生成图片
- [ ] 重新生成单张图片
- [ ] 保存到历史记录
- [ ] 查看历史记录
- [ ] 删除历史记录
- [ ] 搜索历史记录
- [ ] 配置管理

## 部署到 Vercel

```bash
# 提交所有更改
git add -A
git commit -m "完成纯前端改造"
git push origin main

# 在 Vercel 导入项目
# 访问 https://vercel.com
# 选择你的 GitHub 仓库
# 点击 Deploy
```

## 注意事项

1. **API Key 安全**：API Key 只存储在浏览器 localStorage，不会上传到服务器
2. **数据持久化**：所有数据存储在 localStorage，清除浏览器数据会丢失
3. **图片存储**：图片 URL 存储在 localStorage，图片本身由 AI 服务商托管
4. **跨域问题**：如果 AI API 不支持 CORS，需要使用代理或选择支持 CORS 的 API

## 常见问题

**Q: 图片生成失败？**
A: 检查 API Key 是否正确，API 端点是否支持 CORS

**Q: 历史记录丢失？**
A: localStorage 有容量限制（通常 5-10MB），建议定期导出数据

**Q: 如何备份数据？**
A: 可以添加导出/导入功能，将 localStorage 数据导出为 JSON 文件
