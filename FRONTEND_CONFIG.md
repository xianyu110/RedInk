# 前端配置功能说明

## 概述

红墨 AI 图文生成器支持前端自定义配置 API Keys、API Endpoints 和 Models，让用户可以：

1. **本地存储配置** - 在浏览器中安全存储 API Keys
2. **灵活切换服务** - 支持多个 AI 服务商，可随时切换
3. **自定义参数** - 支持添加自定义参数和模型
4. **导入导出** - 方便备份和迁移配置

## 功能特点

### 🔒 安全存储
- API Keys 使用 XOR 加密存储在浏览器本地
- 不会上传到服务器，保护用户隐私
- 支持一键清除所有本地配置

### 🎯 优先级机制
- 本地配置优先于服务器配置
- 可随时切换使用本地或服务器配置
- 新用户默认使用服务器配置

### 🔄 灵活切换
- 支持多个服务提供商同时配置
- 一键激活不同的服务
- 配置实时生效，无需重启

## 使用指南

### 1. 开启本地配置

1. 访问设置页面
2. 在"本地配置"区域，开启开关
3. 系统将提示本地配置已启用

### 2. 配置 API Key

1. 点击"编辑"按钮或"添加提供商"
2. 输入 API Key（必填）
3. 配置 API 端点（可选，留空使用默认）
4. 选择或输入模型名称
5. 点击"测试连接"验证配置
6. 保存配置

### 3. 管理多个提供商

- **添加**：点击"添加提供商"按钮
- **编辑**：点击提供商卡片上的"编辑"
- **激活**：点击"激活"按钮切换服务
- **删除**：在编辑时清空 API Key 即可

### 4. 导入导出配置

- **导出**：点击"导出配置"下载 JSON 文件
- **导入**：点击"导入配置"选择 JSON 文件
- 导出时不包含敏感信息，仅包含配置参数

## 支持的服务商

### 文本生成
- **OpenAI** - GPT-4, GPT-3.5 Turbo
- **Google Gemini** - Gemini 2.0, Gemini 1.5
- **Anthropic Claude** - Claude 3 Sonnet, Opus
- **自定义服务商** - 支持任意兼容 OpenAI 的 API

### 图片生成
- **DALL-E 3** - OpenAI 的图片生成模型
- **Gemini Image** - Google 的图片生成模型
- **Stable Diffusion** - 开源的图片生成模型
- **自定义服务** - 支持任意图片生成 API

## 环境变量配置

### 前端默认配置

在 `.env` 文件中配置默认值（`VITE_` 前缀）：

```env
# OpenAI 默认配置
VITE_OPENAI_API_KEY=sk-your-key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o

# Gemini 默认配置
VITE_GEMINI_API_KEY=AIza-your-key
VITE_GEMINI_MODEL=gemini-2.0-flash

# 高并发模式
VITE_HIGH_CONCURRENCY=false
```

### 功能开关

```env
# 启用本地配置功能
VITE_ENABLE_LOCAL_CONFIG=true

# 默认使用本地配置
VITE_DEFAULT_USE_LOCAL_CONFIG=false
```

## 配置示例

### OpenAI 自定义端点

```json
{
  "apiKey": "sk-your-api-key",
  "baseURL": "https://your-proxy.com/v1",
  "model": "gpt-4o"
}
```

### Gemini 配置

```json
{
  "apiKey": "AIza-your-api-key",
  "baseURL": "https://generativelanguage.googleapis.com",
  "model": "gemini-2.0-flash"
}
```

### 自定义参数

```json
{
  "apiKey": "sk-your-api-key",
  "baseURL": "https://api.example.com",
  "model": "custom-model",
  "temperature": 0.7,
  "max_tokens": 2000,
  "custom_param": "value"
}
```

## 安全注意事项

### ⚠️ 重要提示

1. **本地存储风险**：
   - 配置存储在浏览器本地
   - 清除浏览器数据会丢失配置
   - 建议定期导出备份

2. **公共设备警告**：
   - 不要在公共电脑启用本地配置
   - 使用后务必清除所有配置
   - 考虑使用无痕模式

3. **API Key 保护**：
   - 不要分享导出的配置文件
   - 定期更换 API Keys
   - 使用最小权限原则

### 🔒 加密说明

- 使用 XOR 加密保护 API Keys
- 加密密钥固定，仅提供基本保护
- **不适用于存储高度敏感信息**
- 建议使用服务商提供的 API Key 权限限制

## 故障排除

### 配置不生效
1. 确认已开启"本地配置"开关
2. 检查 API Key 是否正确输入
3. 测试连接是否成功

### 连接测试失败
1. 验证 API Key 是否有效
2. 检查网络连接
3. 确认 API 端点是否正确

### 找不到配置
1. 检查是否在同一个浏览器
2. 确认没有清除浏览器数据
3. 尝试重新导入配置文件

## 技术细节

### 存储机制
- 使用 `localStorage` 存储配置
- 加密算法：XOR + Base64
- 存储键名：`redink-user-config`

### 配置结构

```typescript
interface FrontendConfig {
  textGeneration: {
    activeProvider: string
    providers: Record<string, ProviderConfig>
  }
  imageGeneration: {
    activeProvider: string
    providers: Record<string, ProviderConfig>
  }
  preferences: {
    useLocalConfig: boolean
    showApiKeyInTest: boolean
    defaultHighConcurrency: boolean
  }
}
```

### 优先级规则

1. 用户本地配置（最高优先级）
2. 环境变量配置
3. 服务器配置
4. 默认配置（最低优先级）

## 更新日志

### v1.5.0 (2025-12-08)
- ✨ 新增前端本地配置功能
- ✨ 支持 API Keys 加密存储
- ✨ 支持多服务商配置
- ✨ 支持配置导入导出
- 🔒 增强安全性和隐私保护

## 反馈和建议

如果您在使用过程中遇到问题或有改进建议，请：

1. 提交 GitHub Issue
2. 联系开发团队
3. 参与社区讨论