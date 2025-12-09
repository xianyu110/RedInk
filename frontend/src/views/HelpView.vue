<template>
  <div class="container help-container">
    <div class="page-header">
      <h1 class="page-title">帮助中心</h1>
      <p class="page-subtitle">了解如何使用 RedInk 创作精美的小红书内容</p>
    </div>

    <!-- 新用户使用流程 -->
    <section class="help-section">
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        本站使用流程
      </h2>
      <div class="usage-flow">
        <div class="flow-card">
          <div class="flow-number">1</div>
          <div class="flow-content">
            <h3>注册账号</h3>
            <p>前往注册页面创建您的账号</p>
            <a href="https://apipro.maynor1024.live/register" target="_blank" class="flow-link">
              立即注册 →
            </a>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-card">
          <div class="flow-number">2</div>
          <div class="flow-content">
            <h3>登录系统</h3>
            <p>使用注册的账号登录</p>
            <a href="https://apipro.maynor1024.live/login" target="_blank" class="flow-link">
              前往登录 →
            </a>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-card">
          <div class="flow-number">3</div>
          <div class="flow-content">
            <h3>充值余额</h3>
            <p>新用户可免费试用</p>
            <a href="https://apipro.maynor1024.live/console/topup" target="_blank" class="flow-link">
              去充值 →
            </a>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-card">
          <div class="flow-number">4</div>
          <div class="flow-content">
            <h3>获取令牌</h3>
            <p>获取 API 令牌开始使用</p>
            <a href="https://apipro.maynor1024.live/console/token" target="_blank" class="flow-link">
              获取令牌 →
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速开始 -->
    <section class="help-section">
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        快速教程
      </h2>
      <div class="tutorial-grid">
        <div
          v-for="tutorial in tutorials"
          :key="tutorial.id"
          class="tutorial-card"
          @click="startTutorial(tutorial.id)"
        >
          <div class="tutorial-icon">{{ tutorial.icon }}</div>
          <h3>{{ tutorial.name }}</h3>
          <p>{{ tutorial.description }}</p>
          <div class="tutorial-status">
            <span v-if="isTutorialCompleted(tutorial.id)" class="completed">
              ✓ 已完成
            </span>
            <span v-else class="start-btn">开始学习 →</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用指南 -->
    <section class="help-section">
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        使用指南
      </h2>
      <div class="guide-list">
        <div class="guide-item">
          <div class="guide-number">1</div>
          <div class="guide-content">
            <h3>输入创作主题</h3>
            <p>在首页输入框中描述你想要创作的内容主题，比如"春季美妆教程"、"咖啡店探店"等。可以上传参考图片来保持品牌风格。</p>
          </div>
        </div>
        <div class="guide-item">
          <div class="guide-number">2</div>
          <div class="guide-content">
            <h3>编辑内容大纲</h3>
            <p>AI 会自动生成 6-9 页的内容大纲。你可以根据需要调整每一页的标题和描述，确保内容符合你的预期。</p>
          </div>
        </div>
        <div class="guide-item">
          <div class="guide-number">3</div>
          <div class="guide-content">
            <h3>生成精美配图</h3>
            <p>确认大纲后，点击生成按钮。AI 会为每一页生成精美的配图，整个过程大约需要 10-30 秒。</p>
          </div>
        </div>
        <div class="guide-item">
          <div class="guide-number">4</div>
          <div class="guide-content">
            <h3>下载和发布</h3>
            <p>生成完成后，可以预览所有图片，对不满意的图片进行重新生成。最后一键下载所有图片，即可发布到小红书。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 常见问题 -->
    <section class="help-section">
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
        常见问题
      </h2>
      <div class="faq-list">
        <div class="faq-item">
          <h3>如何配置 API？</h3>
          <p>进入"系统设置"页面，可以配置文本生成和图片生成的 API。支持 OpenAI、Gemini 等多种服务商。</p>
        </div>
        <div class="faq-item">
          <h3>生成的图片可以商用吗？</h3>
          <p>图片的商用权限取决于你使用的 AI 服务商的条款。建议查看相关服务商的使用协议。</p>
        </div>
        <div class="faq-item">
          <h3>如何保持品牌风格一致？</h3>
          <p>在输入主题时，可以上传品牌相关的参考图片。AI 会根据参考图片的风格生成内容。</p>
        </div>
        <div class="faq-item">
          <h3>历史记录保存在哪里？</h3>
          <p>历史记录保存在浏览器的本地存储中。建议及时下载重要的图片，避免清除浏览器数据时丢失。</p>
        </div>
      </div>
    </section>

    <!-- 联系支持 -->
    <section class="help-section">
      <div class="support-card">
        <h2>需要更多帮助？</h2>
        <p>如果你遇到问题或有任何建议，欢迎通过以下方式联系我们：</p>
        <div class="support-links">
          <a href="https://github.com/HisMax/RedInk/issues" target="_blank" class="support-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub Issues
          </a>
          <a href="mailto:histonemax@gmail.com" class="support-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email 支持
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useLocalConfigStore } from '@/stores/localConfig'
import { useRouter } from 'vue-router'

const localConfigStore = useLocalConfigStore()
const router = useRouter()

const tutorials = [
  {
    id: 'welcome',
    name: '欢迎使用 RedInk',
    description: '了解 RedInk 的基本功能和使用流程',
    icon: '👋'
  },
  {
    id: 'home-guide',
    name: '首页功能引导',
    description: '学习如何输入主题和上传参考图片',
    icon: '🏠'
  },
  {
    id: 'outline-guide',
    name: '大纲编辑指南',
    description: '掌握如何编辑和优化内容大纲',
    icon: '📝'
  },
  {
    id: 'result-guide',
    name: '结果页面使用',
    description: '了解如何预览、下载和管理生成的图片',
    icon: '🎨'
  }
]

const isTutorialCompleted = (tutorialId: string): boolean => {
  return localConfigStore.isTutorialCompleted(tutorialId)
}

const startTutorial = (tutorialId: string) => {
  // 触发教程
  window.dispatchEvent(new CustomEvent('start-tutorial', { detail: tutorialId }))
  
  // 根据教程 ID 跳转到对应页面
  if (tutorialId === 'home-guide') {
    router.push('/')
  }
}
</script>

<style scoped>
.help-container {
  max-width: 1000px;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.page-subtitle {
  font-size: 18px;
  color: #666;
}

.help-section {
  margin-bottom: 60px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.section-title svg {
  color: var(--primary, #ff2442);
}

/* 使用流程 */
.usage-flow {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
  padding: 20px 0;
}

.flow-card {
  flex: 1;
  min-width: 200px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.flow-card:hover {
  border-color: var(--primary, #ff2442);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 36, 66, 0.15);
}

.flow-number {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary, #ff2442) 0%, #ff6b6b 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 16px;
}

.flow-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.flow-content p {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.flow-link {
  display: inline-block;
  color: var(--primary, #ff2442);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}

.flow-link:hover {
  color: #ff6b6b;
  text-decoration: underline;
}

.flow-arrow {
  font-size: 32px;
  color: var(--primary, #ff2442);
  font-weight: 700;
  flex-shrink: 0;
}

/* 教程卡片 */
.tutorial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.tutorial-card {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tutorial-card:hover {
  border-color: var(--primary, #ff2442);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 36, 66, 0.15);
}

.tutorial-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.tutorial-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.tutorial-card p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.tutorial-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.completed {
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
}

.start-btn {
  color: var(--primary, #ff2442);
  font-weight: 600;
  font-size: 14px;
}

/* 使用指南 */
.guide-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.guide-item {
  display: flex;
  gap: 20px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 16px;
  padding: 24px;
}

.guide-number {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary, #ff2442) 0%, #ff6b6b 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.guide-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.guide-content p {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
}

/* 常见问题 */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
}

.faq-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.faq-item p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* 支持卡片 */
.support-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.support-card h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.support-card p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 24px;
}

.support-links {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.support-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 100px;
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.support-link:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .usage-flow {
    flex-direction: column;
  }
  
  .flow-arrow {
    transform: rotate(90deg);
  }
  
  .tutorial-grid {
    grid-template-columns: 1fr;
  }
  
  .guide-item {
    flex-direction: column;
  }
}
</style>
