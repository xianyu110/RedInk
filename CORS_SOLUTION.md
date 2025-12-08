# 解决 CORS 跨域问题

## 问题说明

纯前端应用直接调用 OpenAI API 时会遇到 CORS（跨域资源共享）问题，因为：
- 浏览器的同源策略限制
- OpenAI API 不允许直接从浏览器调用（安全考虑）

## 解决方案

### 方案 1：使用代理服务（推荐）

使用支持 CORS 的代理服务来转发 API 请求。

#### 1.1 使用第三方代理服务

配置 API 地址时使用代理服务：

```
文本生成 API 地址: https://your-proxy.com/v1
图片生成 API 地址: https://your-proxy.com/v1
```

常见的代理服务：
- **OpenAI 官方代理**（如果有）
- **自建代理服务**（见下方）
- **第三方 API 服务商**（如 OpenRouter、API2D 等）

#### 1.2 自建简单代理（使用 Cloudflare Workers）

创建一个 Cloudflare Worker 作为代理：

```javascript
// worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    const openaiUrl = 'https://api.openai.com' + url.pathname
    
    const headers = new Headers(request.headers)
    headers.set('Host', 'api.openai.com')
    
    const response = await fetch(openaiUrl, {
      method: request.method,
      headers: headers,
      body: request.body
    })
    
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return newResponse
  }
}
```

部署后使用 Worker 地址作为 API 地址。

### 方案 2：使用兼容 OpenAI 的国内服务

使用支持 CORS 的国内 API 服务：

1. **API2D** (https://api2d.com)
   - 支持 CORS
   - 兼容 OpenAI API
   - 配置示例：
     ```
     API 地址: https://openai.api2d.net/v1
     API Key: fk-xxxxx (API2D 提供的 Key)
     ```

2. **OpenRouter** (https://openrouter.ai)
   - 支持 CORS
   - 多模型支持
   - 配置示例：
     ```
     API 地址: https://openrouter.ai/api/v1
     API Key: sk-or-xxxxx
     ```

### 方案 3：使用浏览器扩展（仅开发测试）

⚠️ **仅用于开发测试，不适合生产环境**

安装 CORS 解除扩展：
- Chrome: "CORS Unblock" 或 "Allow CORS"
- Firefox: "CORS Everywhere"

### 方案 4：部署带后端的版本

如果需要直接使用 OpenAI API，建议部署带后端的版本：

```bash
# 使用 Docker 部署
docker-compose up -d

# 或使用其他云服务
# 参考 DOCKER_DEPLOY.md
```

## 推荐配置

### 开发环境
使用 CORS 扩展或本地代理

### 生产环境
1. **最佳方案**：使用 Cloudflare Workers 自建代理
2. **简单方案**：使用 API2D 或 OpenRouter
3. **完整方案**：部署带后端的 Docker 版本

## 配置示例

在系统设置中配置：

### 使用 API2D
```
文本生成配置：
- API 地址: https://openai.api2d.net/v1
- API Key: fk-xxxxx
- 模型: gpt-4o

图片生成配置：
- API 地址: https://openai.api2d.net/v1
- API Key: fk-xxxxx
- 模型: dall-e-3
```

### 使用自建代理
```
文本生成配置：
- API 地址: https://your-worker.workers.dev/v1
- API Key: sk-xxxxx (OpenAI 原始 Key)
- 模型: gpt-4o

图片生成配置：
- API 地址: https://your-worker.workers.dev/v1
- API Key: sk-xxxxx (OpenAI 原始 Key)
- 模型: dall-e-3
```

## 检查配置

打开浏览器控制台（F12），查看网络请求：
1. 检查请求 URL 是否正确
2. 检查是否有 CORS 错误
3. 查看 API 返回的错误信息

## 常见错误

### 错误 1: `net::ERR_CONNECTION_RESET`
- **原因**：网络连接被重置，可能是 CORS 问题或 API 地址错误
- **解决**：使用支持 CORS 的代理服务

### 错误 2: `CORS policy: No 'Access-Control-Allow-Origin' header`
- **原因**：API 服务不支持跨域请求
- **解决**：必须使用代理服务

### 错误 3: `401 Unauthorized`
- **原因**：API Key 错误或过期
- **解决**：检查 API Key 是否正确

### 错误 4: `429 Too Many Requests`
- **原因**：请求频率过高
- **解决**：增加请求间隔时间（已设置为 2 秒）

## 技术支持

如需帮助，请提供：
1. 浏览器控制台的完整错误信息
2. 使用的 API 服务商
3. 配置的 API 地址（隐藏 Key）
