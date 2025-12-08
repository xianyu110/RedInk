# Vercel 部署指南 - 纯前端版本

## 特性

✅ **纯前端应用** - 无需后端服务器
✅ **完全免费** - 部署到 Vercel 免费版
✅ **数据本地化** - 所有数据存储在浏览器 localStorage
✅ **隐私保护** - API Key 只存储在用户浏览器
✅ **一键部署** - 连接 GitHub 自动部署

## 快速部署

### 方式 1：通过 Vercel Dashboard（推荐）

1. **Fork 本仓库到你的 GitHub**

2. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

3. **导入项目**
   - 点击 "Add New" → "Project"
   - 选择你 Fork 的仓库
   - 点击 "Import"

4. **配置项目**
   - Framework Preset: 选择 "Other"
   - Build Command: `cd frontend && npm install --legacy-peer-deps && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: 留空

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成（约 2-3 分钟）

6. **访问应用**
   - 部署完成后会得到一个 URL，如 `https://your-app.vercel.app`
   - 访问 URL 即可使用

### 方式 2：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

## 使用说明

### 1. 配置 API Key

部署完成后，首次使用需要配置 API Key：

1. 访问你的应用
2. 点击左侧菜单的"系统设置"
3. 启用"使用本地配置"
4. 添加文本生成服务商：
   - 服务商名称：`openai`
   - 类型：OpenAI 兼容
   - API Key：你的 API Key
   - Base URL：`https://api.openai.com/v1`（或你的代理地址）
   - 模型：`gpt-4o`

5. 添加图片生成服务商：
   - 服务商名称：`dalle`
   - 类型：Image API
   - API Key：你的 API Key
   - Base URL：`https://api.openai.com/v1`
   - 模型：`dall-e-3`

### 2. 开始使用

配置完成后：
1. 回到首页
2. 输入主题
3. 点击"生成大纲"
4. 编辑大纲
5. 生成图片

### 3. 数据说明

- **配置数据**：存储在浏览器 localStorage，不会上传到服务器
- **历史记录**：存储在浏览器 localStorage，清除浏览器数据会丢失
- **图片**：生成的图片 URL 存储在 localStorage，图片本身存储在 AI 服务商

## 自定义域名

1. 在 Vercel Dashboard 中打开你的项目
2. 点击 "Settings" → "Domains"
3. 添加你的域名
4. 按照提示配置 DNS

## 环境变量（可选）

如果你想预设一些配置，可以在 Vercel 中添加环境变量：

```
VITE_DEFAULT_TEXT_API_URL=https://api.openai.com/v1
VITE_DEFAULT_IMAGE_API_URL=https://api.openai.com/v1
```

## 更新应用

应用会自动更新：
1. 推送代码到 GitHub
2. Vercel 自动检测并重新部署
3. 几分钟后更新生效

## 本地开发

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 常见问题

### Q: 数据会丢失吗？
A: 数据存储在浏览器 localStorage，只要不清除浏览器数据就不会丢失。建议定期导出重要数据。

### Q: 可以多设备同步吗？
A: 不可以，数据只存储在当前浏览器。如需多设备使用，需要在每个设备上分别配置。

### Q: API Key 安全吗？
A: API Key 只存储在你的浏览器，不会上传到任何服务器。但请注意不要在公共电脑上使用。

### Q: 图片生成很慢？
A: 图片生成速度取决于 AI 服务商的响应速度，通常需要 10-30 秒每张。

### Q: 可以使用其他 AI 服务吗？
A: 可以，只要是 OpenAI 兼容的 API 都可以使用，如 Azure OpenAI、国内代理等。

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由**：Vue Router
- **存储**：localStorage
- **部署**：Vercel

## 许可证

CC BY-NC-SA 4.0
