# 🚀 快速部署指南 - MVP 版本

## 方案对比

| 部署方式 | 时间 | 难度 | 成本 | 适用场景 |
|---------|------|------|------|---------|
| **Docker** | 5分钟 | ⭐ | 免费 | 本地使用、测试 |
| **Vercel** | 10分钟 | ⭐⭐ | 免费 | 在线演示、分享 |

---

## 方案一：Docker 部署（推荐）

### 最简单的方式

```bash
# 一键启动
docker run -d -p 12398:12398 histonemax/redink:latest

# 访问 http://localhost:12398
# 在设置页面配置你的 API Keys
```

### 使用本地配置文件

```bash
# 1. 创建配置文件
cat > text_providers.yaml <<EOF
active_provider: openai
providers:
  openai:
    type: openai_compatible
    api_key: sk-你的API密钥
    base_url: https://apipro.maynor1024.live/v1
    model: gpt-4o
EOF

cat > image_providers.yaml <<EOF
active_provider: gemini
providers:
  gemini:
    type: image_api
    api_key: 你的Gemini密钥
    base_url: https://apipro.maynor1024.live/v1
    model: gemini-3-pro-image-preview
    high_concurrency: false
EOF

# 2. 启动容器
docker run -d \
  -p 12398:12398 \
  -v $(pwd)/text_providers.yaml:/app/text_providers.yaml \
  -v $(pwd)/image_providers.yaml:/app/image_providers.yaml \
  -v $(pwd)/output:/app/output \
  histonemax/redink:latest

# 3. 访问
open http://localhost:12398
```

---

## 方案二：Vercel 部署

### 步骤 1：准备代码

```bash
# 确保代码是最新的
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

### 步骤 2：部署到 Vercel

**选项 A：使用 Vercel CLI（推荐）**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

**选项 B：使用 Vercel Dashboard**

1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 点击 "Deploy"

### 步骤 3：配置环境变量

⚠️ **这是最重要的步骤！**

在 Vercel Dashboard 中：
1. 进入项目 → Settings → Environment Variables
2. 添加以下变量：

```bash
# 文本生成（必需）
TEXT_PROVIDER=openai
TEXT_API_KEY=sk-你的API密钥
TEXT_BASE_URL=https://apipro.maynor1024.live/v1
TEXT_MODEL=gpt-4o

# 图片生成（必需）
IMAGE_PROVIDER=gemini
IMAGE_API_KEY=你的Gemini密钥
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=gemini-3-pro-image-preview
```

3. 点击 "Save"
4. 重新部署：Deployments → 点击最新部署的 "..." → Redeploy

### 步骤 4：验证部署

```bash
# 访问你的 Vercel 域名
https://your-project.vercel.app

# 测试 API
curl https://your-project.vercel.app/api
```

---

## ⚠️ Vercel 部署注意事项

### 1. 运行时间限制

| 计划 | 最大运行时间 | 推荐用途 |
|------|------------|---------|
| Hobby（免费） | 10秒 | ❌ 可能超时 |
| Pro | 60秒 | ✅ 推荐 |

💡 **建议**：
- 免费版可能在图片生成时超时
- 升级到 Pro ($20/月) 获得更好的体验
- 或使用 Docker 本地部署

### 2. 文件存储限制

Vercel Serverless Functions 只能写入 `/tmp` 目录，且每次请求后会清空。

**影响**：
- ✅ 图片生成正常（临时存储）
- ❌ 历史记录不会保存
- ❌ 下载功能可能受限

**解决方案**：
- 使用前端直接保存图片到浏览器
- 或集成对象存储（S3、OSS 等）

### 3. API 配额

确保你的 API Keys 有足够的配额：
- OpenAI API: 需要付费账户
- Gemini API: 免费层有限制

---

## 🎯 推荐配置

### 个人使用/测试
→ **Docker 本地部署**
- 无时间限制
- 支持历史记录
- 完全免费

### 在线分享/演示
→ **Vercel Pro 部署**
- 自动 HTTPS
- 全球 CDN
- 简单易用

---

## 常见问题

### Q1: Vercel 部署后 API 返回 500 错误

**原因**：未配置环境变量

**解决**：
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保所有必需变量都已添加
3. 重新部署

### Q2: Docker 启动后无法访问

**检查**：
```bash
# 查看容器状态
docker ps

# 查看日志
docker logs <container_id>

# 检查端口
lsof -i :12398
```

### Q3: 图片生成很慢

**优化**：
- 关闭高并发模式（`high_concurrency: false`）
- 使用更快的 API（Gemini 通常比 DALL-E 快）
- 减少生成的图片数量

---

## 下一步

部署成功后：
1. ✅ 测试生成功能
2. ✅ 检查 API 调用是否正常
3. ✅ 验证图片下载功能
4. ✅ 分享你的链接！

需要帮助？查看详细文档：[VERCEL_ENV.md](./VERCEL_ENV.md)
