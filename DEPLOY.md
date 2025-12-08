# 红墨 AI 图文生成器 - 部署指南

## 部署架构

本项目采用现代化的 Vercel + Render 部署架构：

- **前端**：部署在 Vercel（静态网站托管）
- **后端 API**：部署在 Vercel（Serverless Functions）
- **数据库**：部署在 Render（PostgreSQL + Redis）
- **文件存储**：使用 Vercel Blob 或云存储服务

## 部署步骤

### 1. 准备工作

1. 注册必要的账号：
   - [Vercel](https://vercel.com)
   - [Render](https://render.com)
   - [GitHub](https://github.com)

2. Fork 本项目到你的 GitHub 账号

### 2. 部署到 Render（数据库服务）

#### 2.1 创建 PostgreSQL 数据库

1. 登录 Render Dashboard
2. 点击 "New +" -> "PostgreSQL"
3. 配置数据库：
   - **Name**: `redink-db`
   - **Database Name**: `redink`
   - **User**: `redink_user`
   - **Plan**: 选择 Free（免费）或 Pro（生产）
4. 等待数据库创建完成

#### 2.2 创建 Redis（可选）

1. 点击 "New +" -> "Redis"
2. 配置 Redis：
   - **Name**: `redink-redis`
   - **Plan**: Free 或 Pro
3. 等待创建完成

#### 2.3 获取连接信息

从数据库详情页获取连接字符串，格式如：
```
postgresql://redink_user:password@host:port/redink
```

### 3. 部署到 Vercel（前端 + API）

#### 3.1 导入项目

1. 登录 Vercel Dashboard
2. 点击 "Add New..." -> "Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测项目配置

#### 3.2 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# 数据库连接
DATABASE_URL=postgresql://redink_user:password@host:port/redink
REDIS_URL=redis://user:password@host:port

# API Keys（必需）
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=AIza-your-gemini-api-key

# API Endpoints（可选）
OPENAI_BASE_URL=https://api.openai.com/v1
CUSTOM_API_BASE_URL=https://your-custom-api-endpoint.com

# 模型配置（可选）
OPENAI_MODEL=gpt-4o
GEMINI_MODEL=gemini-2.0-flash
IMAGE_MODEL=gemini-3-pro-image-preview

# 并发设置
HIGH_CONCURRENCY=false

# CORS 设置
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

#### 3.3 配置文件存储（可选）

如果使用 Vercel Blob 存储图片：

```env
VERCEL_BLOB_TOKEN=your-vercel-blob-token
VERCEL_BLOB_STORE_URL=https://your-store.vercel-blob.com
```

#### 3.4 部署

1. 点击 "Deploy"
2. 等待构建完成
3. 记录部署后的 URL

### 4. 配置自定义域名（可选）

#### 4.1 Vercel 域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名
3. 按提示配置 DNS 记录

#### 4.2 更新 CORS 设置

如果使用自定义域名，更新 `ALLOWED_ORIGINS` 环境变量：
```
ALLOWED_ORIGINS=https://your-custom-domain.com
```

### 5. 验证部署

1. 访问部署后的前端 URL
2. 进入设置页面，配置 API 服务商
3. 测试生成图文功能
4. 检查历史记录功能是否正常

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/your-username/RedInk.git
cd RedInk
```

### 2. 安装依赖

后端：
```bash
pip install -r requirements.txt
```

前端：
```bash
cd frontend
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Keys
```

### 4. 启动服务

后端：
```bash
PYTHONPATH=. python backend/app.py
```

前端：
```bash
cd frontend
pnpm dev
```

访问：
- 前端：http://localhost:5173
- 后端：http://localhost:12398

## 部署架构说明

### Vercel 端
- **前端**：Vue 3 + TypeScript 静态站点
- **API**：Python Flask 作为 Serverless Functions
- **文件路由**：所有 `/api/*` 请求自动路由到 `api/index.py`

### Render 端
- **PostgreSQL**：持久化历史记录和配置
- **Redis**：缓存和会话存储（可选）

### 数据流
1. 用户请求通过 Vercel 前端发起
2. API 调用通过 Vercel Functions 处理
3. 数据读写连接到 Render PostgreSQL
4. 图片存储在 Vercel Blob 或云存储

## 成本估算

### Vercel（Hobby 计划）
- **带宽**：100GB/月 免费
- **Serverless Functions**：$0.30/百万次调用
- **Storing Blob**：$0.15/GB/月

### Render（Free 计划）
- **PostgreSQL**：免费 256MB RAM
- **Redis**：免费 256MB RAM
- **Web Service**：免费 750 小时/月

### 总计：约 $0-10/月（取决于使用量）

## 故障排除

### 1. API 调用失败
- 检查环境变量是否正确设置
- 确认 API Key 有效且有足够配额

### 2. 数据库连接错误
- 验证 DATABASE_URL 格式是否正确
- 检查 Render 数据库是否运行正常

### 3. 图片生成失败
- 确认图片生成 API 的配额
- 检查 HIGH_CONCURRENCY 设置，必要时关闭

### 4. CORS 错误
- 更新 ALLOWED_ORIGINS 包含实际域名
- 检查 Vercel 路由配置

## 监控和维护

1. **Vercel Dashboard**：监控函数调用和错误
2. **Render Dashboard**：监控数据库性能
3. **日志查看**：通过平台控制台查看应用日志
4. **定期更新**：保持依赖项最新版本

## 升级指南

### 更新应用代码
1. 推送更新到 GitHub
2. Vercel 会自动触发重新部署
3. Render 数据库结构可能需要手动迁移

### 扩展服务
- 超出免费额度后，升级到付费计划
- 可考虑使用 CDN 加速图片加载
- 添加监控和告警系统

## 安全建议

1. **API Keys 管理**：
   - 使用环境变量存储敏感信息
   - 定期轮换 API Keys
   - 使用最小权限原则

2. **数据库安全**：
   - 启用 SSL 连接
   - 使用强密码
   - 定期备份数据

3. **访问控制**：
   - 考虑添加用户认证
   - 实现请求频率限制
   - 记录操作日志

## 联系支持

如果遇到问题，请：
1. 查看 GitHub Issues
2. 查看平台文档：
   - [Vercel Docs](https://vercel.com/docs)
   - [Render Docs](https://render.com/docs)
3. 提交新的 Issue 描述你的问题