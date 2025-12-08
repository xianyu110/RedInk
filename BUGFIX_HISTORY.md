# Bug 修复记录

## 问题描述

在生成图片时出现 JavaScript 错误：
```
TypeError: t is not a function
at cg (index-CjcC1qVq.js:64:1754)
```

错误发生在创建历史记录和更新历史记录时。

## 根本原因

1. **类型不匹配**：在 `GenerateView.vue` 中，`updateHistory` 函数被调用时传入的 `thumbnail` 参数可能是 `null`，但 TypeScript 类型定义中 `thumbnail` 只接受 `string | undefined`。

2. **编译后的代码**：在生产环境中，代码被压缩后，函数名被替换为单字母变量（如 `t`），当类型不匹配时会导致运行时错误。

## 修复方案

### 1. 修复 `GenerateView.vue`

**修改前：**
```typescript
const thumbnail = generatedImages.length > 0 ? generatedImages[0] : null

updateHistory(store.recordId, {
  images: { task_id: taskId, generated: generatedImages },
  status: status,
  thumbnail: thumbnail
})
```

**修改后：**
```typescript
const thumbnail = generatedImages.length > 0 ? generatedImages[0] : undefined

const updateData: any = {
  images: { task_id: taskId, generated: generatedImages },
  status: status
}

if (thumbnail) {
  updateData.thumbnail = thumbnail
}

updateHistory(store.recordId, updateData)
```

### 2. 修复 `historyService.ts` 类型定义

**修改前：**
```typescript
export function updateHistory(
  recordId: string,
  data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string  // 只接受 string
  }
): { success: boolean; error?: string }
```

**修改后：**
```typescript
export function updateHistory(
  recordId: string,
  data: {
    outline?: { raw: string; pages: Page[] }
    images?: { task_id: string | null; generated: string[] }
    status?: string
    thumbnail?: string | null  // 接受 string 或 null
  }
): { success: boolean; error?: string }
```

## 测试

创建了单元测试文件 `frontend/src/services/__tests__/historyService.test.ts` 来验证：
- 创建历史记录
- 更新历史记录（包含 thumbnail）
- 更新历史记录（thumbnail 为 null）
- 获取和删除历史记录

## 验证步骤

1. 重新构建前端：
   ```bash
   cd frontend
   npm run build
   ```

2. 测试创建历史记录功能
3. 测试图片生成功能
4. 验证历史记录是否正确保存

## 影响范围

- `frontend/src/views/GenerateView.vue`
- `frontend/src/services/historyService.ts`
- 新增测试文件：`frontend/src/services/__tests__/historyService.test.ts`

## 状态

✅ 已修复并重新构建
