# Vercel 部署配置指南

## 环境变量配置

在 Vercel Dashboard 中配置以下环境变量：

### 1. 进入项目设置
1. 登录 Vercel Dashboard
2. 选择你的项目（RedInk）
3. 点击 "Settings" → "Environment Variables"

### 2. 添加环境变量

#### 文本生成配置（必填）
```
TEXT_PROVIDER=openai
TEXT_API_KEY=你的OpenAI或兼容API的密钥
TEXT_BASE_URL=https://apipro.maynor1024.live/v1
TEXT_MODEL=gpt-4o
```

#### 图片生成配置（必填）
```
IMAGE_PROVIDER=gemini
IMAGE_API_KEY=你的Gemini或兼容API的密钥
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=gemini-3-pro-image-preview
```

### 3. 环境选择
- 选择 "Production", "Preview", "Development" 全部勾选
- 这样所有环境都能使用这些配置

### 4. 重新部署
添加环境变量后，需要重新部署：
1. 点击 "Deployments" 标签
2. 找到最新的部署
3. 点击右侧的 "..." → "Redeploy"

## 配置说明

### TEXT_PROVIDER 可选值：
- `openai` - OpenAI 或兼容接口
- `gemini` - Google Gemini

### IMAGE_PROVIDER 可选值：
- `gemini` - Google Gemini 图片生成
- `openai` - DALL-E 或兼容接口

### API Key 获取：
- OpenAI: https://platform.openai.com/api-keys
- Google Gemini: https://aistudio.google.com/app/apikey
- 或使用你的代理 API 服务

## 验证配置

部署完成后，访问以下接口验证：

1. **调试接口**：`https://你的域名/api/debug`
   - 检查 `has_google_api_key` 或 `has_gemini_api_key` 是否为 `true`

2. **配置接口**：`https://你的域名/api/config`
   - 应该返回配置信息

3. **测试生成**：在前端页面测试大纲生成功能

## 常见问题

### Q: 添加环境变量后还是 500 错误？
A: 需要重新部署才能生效，不会自动应用。

### Q: 如何使用 Google 官方 API？
A: 
```
TEXT_PROVIDER=gemini
TEXT_API_KEY=你的Google API Key
TEXT_BASE_URL=  # 留空使用官方接口
TEXT_MODEL=gemini-2.0-flash-exp
```

### Q: 超时怎么办？
A: 
- Vercel 免费版只有 10 秒超时
- 需要升级到 Pro 版（$20/月）获得 60 秒超时
- 或者后端部署到 Render（免费，无超时限制）

## 下一步

配置完成后，你的应用应该能正常工作了！

如果还有问题，查看 Vercel 的 Function Logs：
1. 进入项目 Dashboard
2. 点击 "Deployments"
3. 选择最新部署
4. 点击 "Functions" 标签查看日志
