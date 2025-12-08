# Vercel 手动部署指南

## 🚨 自动构建失败？用这个方法！

Vercel 的自动检测在 monorepo 项目中可能有问题。使用手动配置 100% 成功。

---

## 📋 步骤 1：在 Vercel Dashboard 创建项目

1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库：`xianyu110/RedInk`
3. **不要直接点 Deploy！** 先进行下面的配置

---

## ⚙️ 步骤 2：配置项目设置

在 "Configure Project" 页面，设置如下：

### Framework Preset
```
Vite
```

### Root Directory
```
frontend
```
**⚠️ 这是关键！** 点击 "Edit" 修改为 `frontend`

### Build and Output Settings

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

---

## 🔧 步骤 3：环境变量（可选）

如果想用环境变量配置 API Keys：

点击 "Environment Variables"，添加：

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

**或者不设置环境变量**，部署后在前端页面配置（推荐）

---

## 🚀 步骤 4：部署

点击 **"Deploy"** 按钮，等待构建完成。

这次应该成功了！✨

---

## 📸 配置截图示例

```
Framework Preset:  Vite ▼
Root Directory:    frontend  [Edit]
Build Command:     npm run build
Output Directory:  dist
Install Command:   npm install
```

---

## ✅ 部署成功后

1. 访问你的 Vercel 域名（如 `your-app.vercel.app`）
2. 点击右上角「设置」
3. 启用「本地配置」
4. 填入你的 API Keys
5. 开始使用！

---

## ❌ 如果还是失败

**放弃 Vercel，用 Docker 本地部署：**

```bash
docker run -d -p 12398:12398 histonemax/redink:latest
```

5 分钟搞定，功能完整，不用折腾！

---

## 🔗 相关文档

- [部署方案对比](./DEPLOY_OPTIONS.md)
- [配置说明](./CONFIG_GUIDE.md)
- [快速部署指南](./DEPLOY_QUICK.md)
