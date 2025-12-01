# RedInk - 小红书AI图文生成器

> 让传播不再需要门槛，让创作从未如此简单

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Vue 3](https://img.shields.io/badge/vue-3.x-green.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/vite-%3E%3E5.0.0-blue.svg)](https://vitejs.dev/)

## ✨ 项目特色

- **🎯 一句话生成**: 输入主题，AI自动生成完整的小红书图文内容
- **🤖 AI驱动**: 完全依赖前端配置的AI服务，支持多种AI API
- **🖼️ 智能配图**: AI根据内容自动生成高质量配图
- **📱 小红书优化**: 专为小红书平台优化的内容风格和格式
- **⚡ 纯前端**: 无需后端服务器，完全在浏览器中运行
- **🔧 灵活配置**: 支持自定义AI服务和参数
- **💾 本地存储**: 所有数据本地存储，保护隐私

## 🚀 在线体验

**Vercel 部署地址**: [https://redink-ai.vercel.app](https://redink-ai.vercel.app)

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **构建**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **导出功能**: jsPDF, html2canvas, pptxgenjs, file-saver
- **部署**: Vercel

### AI服务支持
- Gemini API
- OpenAI 兼容接口
- 其他支持Gemini格式的AI服务

## 📦 本地开发

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/RedInk.git
cd RedInk

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5174

### 配置AI服务

1. 在应用设置页面点击"AI服务配置"
2. 填入你的API配置：
   - **API Key**: 你的AI服务密钥
   - **服务地址**: AI服务的API地址
   - **模型**: 使用的模型名称
3. 测试连接并保存

#### 支持的AI服务配置

**Gemini API:**
```javascript
{
  "api_key": "your-gemini-api-key",
  "base_url": "https://apipro.maynor1024.live/",
  "model": "gemini-3-pro-image-preview",
  "type": "google_gemini"
}
```

**OpenAI 兼容接口:**
```javascript
{
  "api_key": "your-openai-api-key",
  "base_url": "https://api.openai.com/v1",
  "model": "gpt-4-vision-preview",
  "type": "openai_compatible"
}
```

## 🎮 使用指南

### 基础使用流程
1. **输入主题**: 在首页输入想要创作的主题
2. **选择模板**: 选择适合的内容模板（可选）
3. **生成大纲**: AI自动生成6-9页的内容大纲
4. **编辑调整**: 可以编辑每一页的具体内容
5. **生成图片**: 点击生成，AI自动为每页生成配图
6. **导出文件**: 支持导出为PDF、长图、PPT等多种格式
7. **下载使用**: 下载生成的所有图片

### 高级功能
- **上传参考图片**: 可以上传参考图片指导AI生成
- **单独重新生成**: 对不满意的图片可以单独重新生成
- **历史记录**: 自动保存创作历史，方便���看和管理
- **导出功能**: 支持导出数据和配置

### 导出功能说明
RedInk现在支持强大的导出功能，让你的创作内容可以以多种形式分享：

#### 📄 PDF导出
- 适合打印和正式分享
- 自动排版，每页一张图片
- 支持自定义标题和页码

#### 🖼️ 长图拼接
- 将所有图片拼接成一张长图
- 适合社交媒体分享
- 支持高质量导出

#### 📊 PPT导出
- 生成PowerPoint演示文稿
- 每页一张幻灯片
- 便于演示和展示

#### 💧 自定义水印
- 支持添加文字水印
- 可调节透明度和大小
- 保护你的创作版权

## ⚙️ 配置说明

### 环境变量配置

创建 `.env.local` 文件：

```bash
# 使用前端API模式（纯前端，依赖AI服务）
VITE_USE_LOCAL_API=true

# 如果需要连接后端API（如果有后端服务）
# VITE_USE_LOCAL_API=false
```

### AI服务配置

在应用设置页面可以配置：
- API密钥
- 服务地址
- 模型名称
- 连接测试

## 🌐 Vercel 部署

### 自动部署
1. Fork本项目到你的GitHub
2. 在Vercel中导入项目
3. 配置环境变量（如果需要）
4. 自动部署完成

### 手动部署
```bash
# 构建项目
npm run build

# 本地预览
npm run preview

# 部署到Vercel
vercel --prod
```

## 📁 项目结构

```
RedInk/
├── src/
│   ├── api/                 # API服务
│   │   ├── index.ts        # API路由控制
│   │   └── local.ts        # 本地API实现
│   ├── components/          # Vue组件
│   │   ├── AIConfigModal.vue
│   │   ├── DataManager.vue
│   │   ├── ExportModal.vue  # 导出功能模态框
│   │   └── ...
│   ├── views/              # 页面组件
│   ├── utils/              # 工具函数
│   │   ├── aiImageGenerator.ts
│   │   ├── imageManager.ts
│   │   ├── localDataManager.ts
│   │   └── exportService.ts    # 导出功能服务
│   └── assets/             # 静态资源
├── public/                 # 公共文件
├── package.json
├── vite.config.ts
├── vercel.json            # Vercel部署配置
└── README.md
```

## 🔧 开发说明

### 主要功能模块

1. **AI图片生成器** (`utils/aiImageGenerator.ts`)
   - 支持多种AI API
   - 错误处理和重试机制
   - 连接测试功能

2. **图片管理器** (`utils/imageManager.ts`)
   - 图片压缩和处理
   - IndexedDB本地存储
   - 用户上传图片处理

3. **数据管理器** (`utils/localDataManager.ts`)
   - 本地数据存储
   - 历史记录管理
   - 配置管理

4. **API服务** (`api/`)
   - 统一的API接口
   - 错误处理
   - 进度回调

### 添加新的AI服务支持

1. 在 `aiImageGenerator.ts` 中添加新的API格式支持
2. 在 `parseImageResponse` 方法中添加响应解析逻辑
3. 在配置界面添加新服务的配置选项

## ⚠️ 注意事项

1. **API限制**: 请注意你的AI服务的调用配额和限制
2. **网络依赖**: 需要稳定的网络连接到AI服务
3. **浏览器兼容性**: 需要现代浏览器支持（支持ES2020+）
4. **数据安全**: API密钥会存储在浏览器本地，请注意安全

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循Vue 3组合式API规范
- 添加适当的注释
- 确保代码可读性

## 📄 开源协议

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议进行开源

**你可以自由地：**
- ✅ **个人使用** - 用于学习、研究、个人项目
- ✅ **分享** - 在任何媒介以任何形式复制、发行本作品
- ✅ **修改** - 修改、转换或以本作品为基础进行创作

**但需要遵守以下条款：**
- 📝 **署名** - 必须给出适当的署名
- 🚫 **非商业性使用** - 不得将本作品用于商业目的
- 🔄 **相同方式共享** - 如果你修改本作品，必须以相同协议分发

### 商业授权

如需商业使用，请联系作者获取授权。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 优秀的前端框架
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [Gemini AI](https://ai.google.dev/) - 强大的AI服务
- [Vercel](https://vercel.com/) - 优秀的部署平台

## 📞 联系方式

- **GitHub Issues**: [提交问题](https://github.com/your-username/RedInk/issues)
- **Email**: your-email@example.com

---

如果这个项目对你有帮助，请给个 ⭐ Star！