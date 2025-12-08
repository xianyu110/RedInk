# 存储限制说明

## 问题

纯前端应用使用 localStorage 保存历史记录时遇到存储空间限制。

## 原因

### localStorage 限制
- **容量限制**：大多数浏览器限制为 5-10MB
- **存储内容**：只能存储字符串
- **图片问题**：
  - DALL-E 返回的图片 URL 通常是临时的（24小时过期）
  - 如果转换为 base64 存储，一张 1024x1024 的图片约 1-2MB
  - 5-8 张图片就会超出 localStorage 限制

### 当前实现的限制
```
大纲文本: ~10KB
图片 URL (8张): ~1KB
图片 base64 (8张): ~10MB ❌ 超出限制！
```

## 解决方案

### 方案 1：不保存图片（当前实现）✅

**优点**：
- 简单可靠
- 不会超出存储限制
- 历史记录只保存大纲

**缺点**：
- 无法查看历史生成的图片
- 需要重新生成图片

**实现**：
```typescript
// 只保存元数据，不保存图片
cleaned.images = {
  task_id: record.images.task_id,
  generated: []  // 清空图片数组
}
cleaned.thumbnail = null
```

### 方案 2：使用 IndexedDB

**优点**：
- 容量更大（通常 50MB+）
- 可以存储二进制数据
- 可以保存图片

**缺点**：
- API 复杂（异步）
- 需要重构代码
- 图片仍然会过期（DALL-E URL 24小时）

**实现示例**：
```typescript
// 需要使用 IndexedDB API
const db = await openDB('redink-db', 1, {
  upgrade(db) {
    db.createObjectStore('history')
    db.createObjectStore('images')
  }
})
```

### 方案 3：使用云存储

**优点**：
- 无容量限制
- 图片永久保存
- 多设备同步

**缺点**：
- 需要后端服务
- 需要用户认证
- 违背纯前端设计

### 方案 4：下载到本地

**优点**：
- 用户完全控制
- 无存储限制
- 永久保存

**缺点**：
- 需要手动管理文件
- 无法在应用内查看历史

**实现**：
```typescript
// 生成完成后自动下载
function downloadAllImages() {
  store.images.forEach((image, index) => {
    const link = document.createElement('a')
    link.href = image.url
    link.download = `page_${index + 1}.png`
    link.click()
  })
}
```

## 当前策略

### 历史记录功能调整

1. **保存内容**：
   - ✅ 标题
   - ✅ 大纲文本
   - ✅ 创建时间
   - ✅ 状态
   - ❌ 图片（不保存）

2. **用户体验**：
   - 可以查看历史大纲
   - 可以重新编辑大纲
   - 可以基于历史大纲重新生成图片
   - 建议用户及时下载生成的图片

3. **自动清理**：
   - 当存储满时，自动保留最新 10 条记录
   - 用户可以手动删除旧记录

## 使用建议

### 对于用户

1. **及时下载图片**
   - 生成完成后立即下载
   - 使用"一键下载"功能
   - 图片不会保存在历史记录中

2. **管理历史记录**
   - 定期清理不需要的记录
   - 历史记录主要用于查看大纲
   - 可以基于历史大纲重新生成

3. **备份重要内容**
   - 复制大纲文本到其他地方
   - 下载生成的图片到本地
   - 不要依赖浏览器存储

### 对于开发者

如果需要完整的历史记录功能（包含图片），建议：

1. **使用 IndexedDB**
   ```bash
   npm install idb
   ```
   
2. **或部署带后端的版本**
   ```bash
   docker-compose up -d
   ```

3. **或使用云存储服务**
   - Supabase Storage
   - AWS S3
   - Cloudflare R2

## 技术细节

### localStorage 容量检测

```javascript
// 检查当前使用量
function getLocalStorageSize() {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return (total / 1024).toFixed(2) + ' KB'
}

console.log('localStorage 使用量:', getLocalStorageSize())
```

### 清理旧记录

```javascript
// 手动清理
localStorage.removeItem('redink-history')

// 或只保留最新 N 条
const records = JSON.parse(localStorage.getItem('redink-history') || '[]')
const kept = records.slice(0, 10)
localStorage.setItem('redink-history', JSON.stringify(kept))
```

## 未来改进

可能的改进方向：

1. **实现 IndexedDB 版本**
   - 更大的存储空间
   - 更好的性能
   - 可以存储图片

2. **添加导出功能**
   - 导出大纲为 Markdown
   - 导出图片为 ZIP
   - 导出完整项目

3. **云同步（可选）**
   - 用户可选择启用
   - 需要登录
   - 多设备同步

## 总结

当前纯前端实现的限制：
- ✅ 可以保存大纲和元数据
- ❌ 无法保存生成的图片
- ✅ 用户需要手动下载图片
- ✅ 历史记录主要用于查看和重用大纲

这是纯前端架构的固有限制，如需完整功能请使用带后端的版本。
