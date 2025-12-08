# Vercel 环境变量配置说明

部署到 Vercel 时，需要在 Vercel 项目设置中配置以下环境变量：

## 必需的环境变量

### 文本生成 API（选择其一）

**使用 OpenAI 或兼容接口：**
```
TEXT_PROVIDER=openai
TEXT_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
TEXT_BASE_URL=https://apipro.maynor1024.live/v1
TEXT_MODEL=gpt-4o
```

**或使用 Google Gemini：**
```
TEXT_PROVIDER=gemini
TEXT_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
TEXT_BASE_URL=https://apipro.maynor1024.live
TEXT_MODEL=gemini-2.0-flash
```

### 图片生成 API（选择其一）

**使用 Gemini 图片生成：**
```
IMAGE_PROVIDER=gemini
IMAGE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=gemini-3-pro-image-preview
```

**或使用 DALL-E：**
```
IMAGE_PROVIDER=openai_image
IMAGE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=dall-e-3
```

## 如何在 Vercel 中设置环境变量

1. 进入你的 Vercel 项目 Dashboard
2. 点击 "Settings" 标签
3. 在左侧菜单选择 "Environment Variables"
4. 添加上述环境变量
5. 确保选择 "Production" 环境
6. 点击 "Save"
7. 重新部署项目

## 快速配置示例

**最简单配置（使用中转 API）：**

```bash
# 复制粘贴这些到 Vercel 环境变量
TEXT_PROVIDER=openai
TEXT_API_KEY=你的API密钥
TEXT_BASE_URL=https://apipro.maynor1024.live/v1
TEXT_MODEL=gpt-4o

IMAGE_PROVIDER=gemini
IMAGE_API_KEY=你的Gemini密钥
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=gemini-3-pro-image-preview
```

## 注意事项

- ⚠️ API Keys 必须有效，否则生成功能无法使用
- ⚠️ Vercel 免费版有运行时间限制（10秒），图片生成可能超时
- ⚠️ 建议升级到 Vercel Pro 以获得 60 秒运行时间
- 💡 推荐使用中转 API 以提高稳定性
