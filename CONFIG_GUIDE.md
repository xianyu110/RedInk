# 配置指南

## 🎯 两种配置方式

### 方式一：前端浏览器配置（推荐）⭐

**优势：**
- ✅ 无需配置环境变量
- ✅ 在浏览器界面直接配置
- ✅ API Keys 加密存储在浏览器本地
- ✅ 多人使用时每人有独立配置
- ✅ 部署后立即可用

**使用步骤：**
1. 部署到 Vercel（无需配置任何环境变量）
2. 访问你的网站
3. 点击右上角「设置」
4. 启用「本地配置」开关
5. 添加你的 API Keys
6. 开始使用！

**适用场景：**
- 个人使用
- 多人共享部署（每人配置自己的 Key）
- 快速测试

---

### 方式二：Vercel 环境变量配置

**优势：**
- ✅ 集中管理配置
- ✅ 适合团队使用统一 API Key
- ✅ 更安全（Key 不存储在浏览器）

**配置步骤：**
1. 在 Vercel Dashboard 添加环境变量（见下方）
2. 重新部署
3. 访问网站直接使用

**环境变量：**
```bash
TEXT_PROVIDER=openai
TEXT_API_KEY=sk-你的密钥
TEXT_BASE_URL=https://apipro.maynor1024.live/v1
TEXT_MODEL=gpt-4o

IMAGE_PROVIDER=gemini
IMAGE_API_KEY=你的Gemini密钥
IMAGE_BASE_URL=https://apipro.maynor1024.live/v1
IMAGE_MODEL=gemini-3-pro-image-preview
```

**适用场景：**
- 团队共享 API Key
- 公司内部使用

---

## 🚀 快速开始（无需环境变量）

```bash
# 1. 上传到 GitHub
git add .
git commit -m "feat: 支持前端配置和 Vercel 部署"
git push origin main

# 2. 部署到 Vercel
vercel --prod

# 3. 访问网站 → 设置页面 → 启用本地配置 → 完成！
```

就这么简单！✨

---

## 💡 推荐配置

**个人使用：**
→ 使用前端配置，无需设置环境变量

**团队使用：**
→ 使用环境变量配置，统一管理

---

## ⚠️ 注意事项

### Vercel 免费版限制
- 函数运行时间：10秒
- 可能在生成图片时超时
- 建议升级 Pro ($20/月) 获得 60 秒运行时间

### 前端配置安全性
- API Keys 使用 XOR + Base64 加密
- 仅存储在本地浏览器
- 公共电脑请谨慎启用

---

## 🔥 推荐部署方案

| 场景 | 推荐方案 | 配置方式 |
|------|---------|---------|
| 个人使用 | Docker 本地 | Web 界面配置 |
| 在线演示 | Vercel | 前端配置 |
| 团队使用 | Vercel Pro | 环境变量 |

---

需要帮助？查看详细文档：
- [快速部署](./DEPLOY_QUICK.md)
- [环境变量配置](./VERCEL_ENV.md)
