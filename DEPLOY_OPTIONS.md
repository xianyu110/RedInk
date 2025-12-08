# 部署方案汇总

## ⚡️ 最推荐方案：Docker 部署

**为什么推荐 Docker？**
- ✅ 一键启动，无需复杂配置
- ✅ 本地运行，无时间限制
- ✅ 支持所有功能（历史记录、文件存储）
- ✅ 完全免费

**部署命令：**
```bash
docker run -d -p 12398:12398 histonemax/redink:latest
```

访问 `http://localhost:12398`，在设置页面配置 API Keys 即可使用。

---

## 🌐 备选方案 1：Vercel 手动配置

如果自动构建失败，尝试手动配置：

### 步骤 1：在 Vercel Dashboard 设置

1. **Framework Preset**: 选择 `Other`
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### 步骤 2：配置环境变量（可选）

如果不想用前端配置，添加这些环境变量：
```
TEXT_PROVIDER=openai
TEXT_API_KEY=你的密钥
TEXT_BASE_URL=https://apipro.maynor1024.live/v1
TEXT_MODEL=gpt-4o

IMAGE_PROVIDER=gemini
IMAGE_API_KEY=你的Gemini密钥
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=gemini-3-pro-image-preview
```

---

## 🔧 备选方案 2：分离部署

**前端和后端分开部署：**

### 前端（Vercel）
```bash
# 1. 进入 frontend 目录
cd frontend

# 2. 初始化 Vercel
vercel

# 3. 部署
vercel --prod
```

### 后端（Render/Railway）
使用 Render 或 Railway 部署 Python 后端。

**优势：**
- 前端静态部署，更稳定
- 后端独立运行，无时间限制

---

## 📦 备选方案 3：Netlify 部署

Netlify 对前端项目支持更好：

```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 部署
netlify deploy --prod --dir=frontend/dist
```

**netlify.toml 配置：**
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.com/api/:splat"
  status = 200
```

---

## 🐳 备选方案 4：使用 Docker Compose

**适合本地开发和测试：**

```yaml
# docker-compose.yml
version: '3.8'
services:
  redink:
    image: histonemax/redink:latest
    ports:
      - "12398:12398"
    volumes:
      - ./output:/app/output
      - ./history:/app/history
      - ./text_providers.yaml:/app/text_providers.yaml
      - ./image_providers.yaml:/app/image_providers.yaml
    restart: unless-stopped
```

启动：
```bash
docker-compose up -d
```

---

## 💡 方案对比

| 方案 | 难度 | 成本 | 功能完整性 | 推荐指数 |
|------|------|------|-----------|---------|
| Docker 本地 | ⭐ | 免费 | 100% | ⭐⭐⭐⭐⭐ |
| Vercel 手动配置 | ⭐⭐ | 免费 | 70% | ⭐⭐⭐⭐ |
| 分离部署 | ⭐⭐⭐ | 免费 | 100% | ⭐⭐⭐ |
| Netlify | ⭐⭐ | 免费 | 70% | ⭐⭐⭐ |
| Docker Compose | ⭐ | 免费 | 100% | ⭐⭐⭐⭐⭐ |

---

## 🎯 我的建议

### 个人使用
→ **Docker 本地部署** - 最简单、功能最完整

### 在线演示
→ **Vercel 手动配置** - 免费在线访问

### 生产环境
→ **分离部署** - 前端 Vercel，后端 Render/Railway

---

## ❓ 如果 Vercel 一直失败

**最简单的解决方案：**

放弃 Vercel，使用 Docker：
```bash
# 就这一行命令
docker run -d -p 12398:12398 histonemax/redink:latest

# 然后访问
open http://localhost:12398
```

5分钟搞定，不用折腾配置！🎉

---

需要帮助？选择一个方案，我帮你详细配置！
