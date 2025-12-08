# 新用户引导功能说明

## 功能概述

RedInk 内置了完整的新用户引导系统，帮助用户快速了解和掌握平台的各项功能。

## 功能特性

### 1. 自动触发
- **首次访问**：用户首次访问网站时，会自动显示欢迎引导
- **智能检测**：系统会记录用户已完成的教程，避免重复打扰

### 2. 多场景教程
系统内置了 4 个核心教程：

#### 欢迎使用 RedInk 👋
- 介绍 RedInk 的基本功能
- 说明完整的工作流程
- 帮助用户建立整体认知

#### 首页功能引导 🏠
- 如何输入创作主题
- 如何上传参考图片
- AI 智能分析功能介绍

#### 大纲编辑指南 📝
- 如何编辑和优化大纲
- 如何调整页面顺序
- 生成配图的操作方法

#### 结果页面使用 🎨
- 如何预览生成的图片
- 如何重新生成单张图片
- 如何下载和保存作品

### 3. 帮助中心
- **侧边栏按钮**：点击侧边栏的帮助按钮可以随时访问教程
- **通知提示**：未完成的教程会显示红点提示
- **重新学习**：可以随时重新学习任何教程
- **重置功能**：支持重置所有教程完成状态

### 4. 帮助页面
访问 `/help` 路由可以查看：
- 所有可用教程列表
- 详细的使用指南
- 常见问题解答
- 联系支持方式

## 技术实现

### 组件结构

```
frontend/src/components/tutorial/
├── TutorialManager.vue      # 教程管理器（弹窗展示）
└── TutorialTrigger.vue      # 教程触发按钮（侧边栏）

frontend/src/views/
└── HelpView.vue             # 帮助中心页面
```

### 状态管理

教程完成状态保存在 `localConfig` store 中：

```typescript
// 标记教程为已完成
localConfigStore.markTutorialCompleted('welcome')

// 检查教程是否已完成
localConfigStore.isTutorialCompleted('welcome')

// 重置所有教程
localConfigStore.resetTutorials()
```

### 数据持久化

- 教程完成状态保存在 `localStorage` 中
- 键名：`redink-preferences`
- 跨会话保持状态

## 使用方式

### 用户视角

1. **首次访问**
   - 打开网站后自动显示欢迎引导
   - 可以选择"下一步"继续或"跳过"关闭

2. **查看帮助**
   - 点击侧边栏的帮助按钮（问号图标）
   - 选择想要学习的教程
   - 或访问帮助中心页面

3. **重新学习**
   - 在帮助菜单中点击任意教程
   - 或在帮助中心页面点击教程卡片

### 开发者视角

#### 添加新教程

在 `TutorialManager.vue` 中添加：

```typescript
const tutorials: Record<string, TutorialStep[]> = {
  'new-tutorial': [
    {
      id: 'step-1',
      title: '步骤标题',
      description: '步骤描述，支持 <strong>HTML</strong>'
    }
  ]
}
```

在 `TutorialTrigger.vue` 中注册：

```typescript
const tutorials = [
  { id: 'new-tutorial', name: '新教程名称' }
]
```

#### 手动触发教程

```typescript
// 通过事件触发
window.dispatchEvent(new CustomEvent('start-tutorial', { 
  detail: 'tutorial-id' 
}))

// 或直接调用组件方法
tutorialManagerRef.value?.startTutorial('tutorial-id')
```

## 样式定制

### 主题色

教程使用渐变色主题，可以在组件中修改：

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 响应式设计

- 移动端自动适配
- 弹窗宽度自动调整
- 触摸友好的交互

## 最佳实践

1. **简洁明了**：每个步骤的描述控制在 2-3 句话
2. **循序渐进**：按照用户使用流程设计教程顺序
3. **视觉引导**：使用 emoji 和图标增强可读性
4. **及时反馈**：完成教程后给予明确的完成提示

## 未来改进

- [ ] 添加交互式高亮（指向具体元素）
- [ ] 支持视频教程
- [ ] 多语言支持
- [ ] 教程进度统计
- [ ] 个性化推荐教程

## 相关文件

- `frontend/src/components/tutorial/TutorialManager.vue`
- `frontend/src/components/tutorial/TutorialTrigger.vue`
- `frontend/src/views/HelpView.vue`
- `frontend/src/stores/localConfig.ts`
- `frontend/src/App.vue`
