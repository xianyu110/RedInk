# Gemini 图片生成配置指南

## 问题修复

已修复以下问题：
1. ✅ 历史记录创建时的 `TypeError: t is not a function` 错误
2. ✅ 添加了对 Gemini 图片生成 API 的支持
3. ✅ 修复了 `thumbnail` 字段类型不匹配的问题

## Gemini 图片生成 API 配置

### 方式一：使用 Gemini 原生格式（推荐）

使用 Gemini 原生 API 格式，支持更多配置选项：

**在系统设置中配置图片生成 API：**

```
API Base URL: http://prod-cn.your-api-server.com/v1beta
API Key: 你的 API Key
Model: gemini-3-pro-image-preview
```

或者直接使用完整的 endpoint：

```
API Base URL: http://prod-cn.your-api-server.com/v1beta/models/gemini-3-pro-image-preview:generateContent
API Key: 你的 API Key
Model: gemini-3-pro-image-preview
```

### 方式二：使用 Chat 兼容格式

如果你的代理 API 支持 OpenAI 兼容的 chat completions 格式：

```
API Base URL: https://apipro.maynor1024.live/v1
API Key: 你的 API Key
Model: gemini-2.0-flash-exp-image-generation
```

## API 调用格式

### Gemini 原生格式（已支持）

```json
POST /v1beta/models/gemini-3-pro-image-preview:generateContent?key=YOUR_API_KEY
{
  "contents": [
    {
      "parts": [
        {
          "text": "Create a beautiful illustration..."
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "aspectRatio": "3:4"
    }
  }
}
```

**响应格式：**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": "base64编码的图片数据..."
            }
          }
        ]
      }
    }
  ]
}
```

### Chat 兼容格式（已支持）

```json
POST /v1/chat/completions
{
  "model": "gemini-2.0-flash-exp-image-generation",
  "messages": [
    {
      "role": "user",
      "content": "Create a beautiful illustration..."
    }
  ],
  "max_tokens": 4096
}
```

**响应格式：**
```json
{
  "choices": [
    {
      "message": {
        "content": "data:image/png;base64,..." 或 "https://..."
      }
    }
  ]
}
```

## 当前 500 错误的可能原因

1. **API Key 无效或过期**
   - 检查你的 API Key 是否正确
   - 确认 API Key 有图片生成权限

2. **Model 名称不正确**
   - 确认你的��理 API 支持的 model 名称
   - 常见的 Gemini 图片生成模型：
     - `gemini-2.0-flash-exp-image-generation`
     - `gemini-3-pro-image-preview`

3. **API Base URL 配置错误**
   - 确保 URL 格式正确
   - 不要在末尾添加多余的斜杠

4. **代理 API 限制**
   - 检查是否达到了 API 调用限制
   - 确认账户余额是否充足

5. **提示词格式问题**
   - 某些 API 对提示词长度有限制
   - 尝试使用更短的提示词

## 调试步骤

1. **打开浏览器开发者工具**
   - 按 F12 打开控制台
   - 查看 Console 标签页的日志输出

2. **查看网络请求**
   - 切换到 Network 标签页
   - 找到失败的 API 请求
   - 查看请求详情和响应内容

3. **检查配置**
   - 在系统设置中确认 API 配置
   - 确保 Base URL、API Key 和 Model 都正确

4. **测试 API**
   - 使用 Postman 或 curl 直接测试 API
   - 确认 API 本身是否正常工作

## 示例配置

### 使用 OpenAI 代理

```
API Base URL: https://api.openai.com/v1
API Key: sk-...
Model: dall-e-3
```

### 使用 Gemini 代理（Chat 格式）

```
API Base URL: https://apipro.maynor1024.live/v1
API Key: 你的 API Key
Model: gemini-2.0-flash-exp-image-generation
```

## 代码改进

已在 `frontend/src/services/aiService.ts` 中添加：

1. **自动检测 API 类型**
   - 通过 model 名称或 baseURL 判断是否使用 Gemini
   - 自动选择正确的 API 格式

2. **详细的错误日志**
   - 在控制台输出详细的请求和响应信息
   - 便于调试和排查问题

3. **支持多种图片格式**
   - 支持 base64 编码的图片
   - 支持 URL 格式的图片
   - 自动转换为 data URL

## 下一步

1. 检查浏览器控制台的错误信息
2. 确认你的 API 配置是否正确
3. 如果问题持续，提供控制台的错误日志以便进一步诊断
