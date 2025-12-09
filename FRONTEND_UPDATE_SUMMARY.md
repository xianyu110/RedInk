# 前端配置更新总结

## 完成的修改

### 1. 默认内置 API 端点
✅ 已将所有提供商的默认 API 端点设置为 `https://apipro.maynor1024.live/`

**修改文件：** `frontend/src/utils/configStorage.ts`
- OpenAI 文本生成：`https://apipro.maynor1024.live/v1`
- Gemini 文本生成：`https://apipro.maynor1024.live`
- Gemini Pro 文本生成：`https://apipro.maynor1024.live`
- OpenAI 图片生成：`https://apipro.maynor1024.live/v1`
- Gemini 图片生成：`https://apipro.maynor1024.live`

### 2. 新增文本模型 gemini-3-pro-preview
✅ 已添加新的文本生成提供商 `gemini-pro`，使用模型 `gemini-3-pro-preview`

**修改文件：**
- `frontend/src/utils/configStorage.ts` - 添加默认配置
- `frontend/src/components/settings/ProviderEditModal.vue` - 添加模型选项
- `frontend/src/components/settings/LocalConfigSection.vue` - 添加显示名称

**配置详情：**
```javascript
'gemini-pro': {
  apiKey: '',
  baseURL: 'https://apipro.maynor1024.live',
  model: 'gemini-3-pro-preview'
}
```

### 3. 隐藏 API 端点修改功能
✅ 已隐藏用户界面中的 API 端点配置选项

**修改文件：**
- `frontend/src/components/settings/LocalConfigSection.vue` - 隐藏端点显示
- `frontend/src/components/settings/ProviderEditModal.vue` - 隐藏端点编辑字段

用户现在只能配置：
- API Key
- 模型名称
- 高并发模式（仅图片生成）
- 自定义参数

### 4. 加强新用户使用流程说明
✅ 在多个页面添加了清晰的使用流程引导

**修改文件：**

#### `frontend/src/views/HelpView.vue`
添加了"本站使用流程"板块，包含四个步骤：
1. [注册](https://apipro.maynor1024.live/register)
2. [登录](https://apipro.maynor1024.live/login)
3. [充值 (新用户可试用)](https://apipro.maynor1024.live/console/topup)
4. [获取令牌](https://apipro.maynor1024.live/console/token)

#### `frontend/src/views/HomeView.vue`
在首页添加了醒目的使用流程提示卡片，包含相同的四个步骤链接。

**样式特点：**
- 使用渐变色按钮，视觉效果突出
- 响应式设计，移动端友好
- 悬停效果增强交互体验
- 清晰的步骤编号和箭头指示

## 用户体验改进

1. **简化配置流程**：用户无需关心 API 端点配置，只需输入 API Key 即可使用
2. **更多模型选择**：新增 Gemini 3 Pro Preview 模型，提供更多选择
3. **清晰的引导**：新用户可以快速了解如何开始使用服务
4. **统一的端点**：所有服务使用统一的 API 端点，降低配置复杂度

## 技术细节

- 所有修改保持向后兼容
- 已有用户的配置不会受到影响
- API 端点虽然在 UI 中隐藏，但在代码中仍然保留，便于未来扩展
- 使用流程链接直接指向外部服务，无需额外配置

## 测试建议

1. 清除浏览器缓存和 localStorage
2. 访问首页，确认使用流程提示正常显示
3. 访问帮助页面，确认新的使用流程板块正常显示
4. 进入系统设置，确认 API 端点字段已隐藏
5. 测试添加新的提供商，确认 gemini-3-pro-preview 模型可选
6. 点击使用流程中的链接，确认跳转正确
