# 中转 API 配置说明

## 概述

本项目默认使用中转 API `https://apipro.maynor1024.live/`，这是一个兼容 OpenAI API 格式的中转服务，支持多种 AI 模型的访问。

## 配置说明

### 1. 默认中转端点

所有 AI 服务默认使用以下中转端点：

- **OpenAI 兼容接口**: `https://apipro.maynor1024.live/v1`
- **Gemini 接口**: `https://apipro.maynor1024.live`
- **Claude 接口**: `https://apipro.maynor1024.live/v1`

### 2. 支持的模型

#### 文本生成模型
- **GPT-4o**: OpenAI 最新的多模态模型
- **GPT-4**: 强大的推理模型
- **GPT-3.5 Turbo**: 快速的对话模型
- **Gemini 2.0 Flash**: Google 最新的多模态模型
- **Gemini 1.5 Pro**: Google 的高性能模型
- **Claude 3 Sonnet**: Anthropic 的平衡性能模型

#### 图片生成模型
- **DALL-E 3**: OpenAI 的图片生成模型
- **Gemini 3 Pro Image**: Google 的图片生成模型
- **Stable Diffusion**: 开源图片生成模型

## 使用方式

### 方式一：环境变量配置（推荐）

在 `.env` 文件中配置：

```env
# API 端点
OPENAI_BASE_URL=https://apipro.maynor1024.live/v1
GEMINI_API_URL=https://apipro.maynor1024.live
ANTHROPIC_BASE_URL=https://apipro.maynor1024.live/v1

# 模型选择
OPENAI_MODEL=gpt-4o
GEMINI_MODEL=gemini-2.0-flash
ANTHROPIC_MODEL=claude-3-sonnet
IMAGE_MODEL=gemini-3-pro-image-preview
```

### 方式二：前端本地配置

1. 在设置页面开启"本地配置"
2. 编辑提供商配置
3. 填入你的 API Key
4. 端点会自动使用中转 API

### 方式三：YAML 配置文件

复制示例文件并编辑：

```bash
cp text_providers.yaml.example text_providers.yaml
cp image_providers.yaml.example image_providers.yaml
```

编辑 `text_providers.yaml`：

```yaml
active_provider: openai

providers:
  openai:
    type: openai_compatible
    api_key: sk-your-api-key
    base_url: https://apipro.maynor1024.live/v1
    model: gpt-4o
```

## API Key 获取

### 1. OpenAI API Key
- 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
- 创建新的 API Key
- 格式：`sk-xxxx...`

### 2. Gemini API Key
- 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
- 创建新的 API Key
- 格式：`AIza...`

### 3. Claude API Key
- 访问 [Anthropic Console](https://console.anthropic.com/)
- 创建新的 API Key
- 格式：`sk-ant-xxxx...`

## 配置示例

### 完整的 .env 配置

```env
# API Keys（填入你自己的 Key）
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=AIza-your-gemini-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# 中转 API 端点
OPENAI_BASE_URL=https://apipro.maynor1024.live/v1
GEMINI_API_URL=https://apipro.maynor1024.live
ANTHROPIC_BASE_URL=https://apipro.maynor1024.live/v1

# 模型配置
OPENAI_MODEL=gpt-4o
GEMINI_MODEL=gemini-2.0-flash
ANTHROPIC_MODEL=claude-3-sonnet
IMAGE_MODEL=gemini-3-pro-image-preview
```

### 前端配置

在设置页面或直接修改前端配置：

```javascript
{
  textGeneration: {
    activeProvider: 'openai',
    providers: {
      openai: {
        apiKey: 'sk-your-api-key',
        baseURL: 'https://apipro.maynor1024.live/v1',
        model: 'gpt-4o'
      }
    }
  },
  imageGeneration: {
    activeProvider: 'gemini',
    providers: {
      gemini: {
        apiKey: 'AIza-your-api-key',
        baseURL: 'https://apipro.maynor1024.live',
        model: 'gemini-3-pro-image-preview'
      }
    }
  }
}
```

## 优势

### 1. 统一接口
- 所有模型使用相同的中转端点
- 简化配置和管理
- 降低学习成本

### 2. 更好的访问性
- 绕部分地区限制
- 更稳定的连接
- 统一的速率限制

### 3. 灵活性
- 支持多种 AI 模型
- 可随时切换模型
- 支持自定义参数

## 注意事项

### 1. API Key 安全
- 不要在前端硬编码 API Key
- 使用环境变量或安全存储
- 定期更换 API Key

### 2. 速率限制
- 注意 API 调用频率
- 监控配额使用情况
- 必要时启用缓存

### 3. 错误处理
- 处理网络超时
- 处理配额耗尽
- 提供降级方案

## 故障排除

### 连接失败
1. 检查 API Key 是否正确
2. 验证端点 URL 是否可访问
3. 确认网络连接正常

### 认证错误
1. 检查 API Key 格式
2. 确认 API Key 有效
3. 检查 API Key 权限

### 模型不支持
1. 确认模型名称正确
2. 检查中转服务是否支持该模型
3. 尝试使用其他模型

## 相关链接

- [项目主页](https://github.com/HisMax/RedInk)
- [部署文档](./DEPLOY.md)
- [前端配置说明](./FRONTEND_CONFIG.md)
- [中转服务状态](https://apipro.maynor1024.live/)

## 更新日志

### v1.5.0 (2025-12-08)
- ✨ 默认使用中转 API
- ✨ 支持多种 AI 模型
- ✨ 简化配置流程
- 🔒 增强安全配置

## 支持

如需帮助或有问题，请：
1. 提交 GitHub Issue
2. 查看 FAQ 文档
3. 联系技术支持