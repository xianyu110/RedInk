# 快速配置指南

## 图片生成 API 配置

### 使用你的 API

在系统设置中配置图片生成 API：

```
API Base URL: https://apipro.maynor1024.live/v1beta
API Key: 你的 API Key
Model: gemini-3-pro-image-preview
```

### 完整的 API 调用示例

代码会自动构建以下请求：

```
POST https://apipro.maynor1024.live/v1beta/models/gemini-3-pro-image-preview:generateContent?key=YOUR_API_KEY

Content-Type: application/json

{
  "contents": [
    {
      "parts": [
        {
          "text": "Create a beautiful, professional illustration for social media post..."
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

### 预期响应格式

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": "iVBORw0KGgoAAAANSUhEUgAA..."
            }
          }
        ]
      }
    }
  ]
}
```

## 调试步骤

1. **打开浏览器开发者工具**（按 F12）

2. **查看 Console 标签页**
   - 会显示：`图片生成配置: { isGemini: true, isGeminiNative: true, model: "gemini-3-pro-image-preview", baseURL: "https://apipro.maynor1024.live/v1beta" }`
   - 如果有错误，会显示详细的错误信息

3. **查看 Network 标签页**
   - 找到 `generateContent` 请求
   - 查看请求 URL、Headers 和 Body
   - 查看响应状态码和内容

4. **常见问题**

   **问题 1：500 错误**
   - 检查 API Key 是否正确
   - 检查 Model 名称是否正确
   - 查看响应内容中的错误信息

   **问题 2：404 错误**
   - 检查 Base URL 是否正确
   - 确认 endpoint 路径是否正确

   **问题 3：CORS 错误**
   - 这是跨域问题，需要 API 服务器支持 CORS
   - 或者使用代理服务器

## 测试 API

你可以使用 curl 命令测试 API：

```bash
curl -X POST "https://apipro.maynor1024.live/v1beta/models/gemini-3-pro-image-preview:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Create a beautiful illustration of a sunset"
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
  }'
```

## 配置截图位置

在应用中：
1. 点击右上角的设置图标
2. 找到"图片生成 API"部分
3. 填入上述配置信息
4. 点击保存

## 下一步

配置完成后：
1. 刷新页面
2. 创建新的内容
3. 生成大纲
4. 开始生成图片
5. 查看浏览器控制台的日志

如果遇到问题，请提供控制台的错误信息。
