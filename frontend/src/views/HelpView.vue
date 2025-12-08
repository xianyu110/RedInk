<template>
  <div class="container help-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">帮助中心</h1>
        <p class="page-subtitle">快速上手 RedInk，了解所有功能</p>
      </div>
    </div>

    <div class="help-content">
      <!-- 新用户引导横幅 -->
      <section class="welcome-banner">
        <div class="banner-content">
          <div class="banner-icon">🎉</div>
          <div class="banner-text">
            <h3>欢迎使用 RedInk！</h3>
            <p>第一次使用？让我们带你快速了解所有功能</p>
          </div>
          <button class="banner-btn" @click="startWelcomeTour">
            开始新手引导
          </button>
        </div>
      </section>

      <!-- 快速开始 -->
      <section class="help-section">
        <div class="section-icon">🚀</div>
        <h2>快速开始</h2>
        <div class="tutorial-grid">
          <div
            v-for="tutorial in quickStartTutorials"
            :key="tutorial.id"
            class="tutorial-card"
            @click="startTutorial(tutorial.id)"
          >
            <div class="card-header">
              <span class="card-icon">{{ tutorial.icon }}</span>
              <span v-if="isCompleted(tutorial.id)" class="completed-badge">✓</span>
            </div>
            <h3>{{ tutorial.title }}</h3>
            <p>{{ tutorial.description }}</p>
            <button class="start-btn">
              {{ isCompleted(tutorial.id) ? '重新学习' : '开始学习' }}
            </button>
          </div>
        </div>
      </section>

      <!-- 常见问题 -->
      <section class="help-section">
        <div class="section-icon">❓</div>
        <h2>常见问题</h2>
        <div class="faq-list">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="faq-item"
            :class="{ active: activeFaq === index }"
            @click="toggleFaq(index)"
          >
            <div class="faq-question">
              <span>{{ faq.question }}</span>
              <span class="faq-icon">{{ activeFaq === index ? '−' : '+' }}</span>
            </div>
            <div v-if="activeFaq === index" class="faq-answer">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </section>

      <!-- 功能说明 -->
      <section class="help-section">
        <div class="section-icon">📚</div>
        <h2>功能说明</h2>
        <div class="feature-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </section>

      <!-- 联系支持 -->
      <section class="help-section">
        <div class="section-icon">💬</div>
        <h2>需要帮助？</h2>
        <div class="contact-grid">
          <a href="https://github.com/HisMax/RedInk/issues" target="_blank" class="contact-card">
            <div class="contact-icon">🐙</div>
            <h3>GitHub Issues</h3>
            <p>报告问题或提出建议</p>
          </a>
          <div class="contact-card">
            <div class="contact-icon">📧</div>
            <h3>邮件联系</h3>
            <p>histonemax@gmail.com</p>
          </div>
          <div class="contact-card">
            <div class="contact-icon">💬</div>
            <h3>微信</h3>
            <p>Histone2024</p>
          </div>
        </div>
      </section>

      <!-- 重置引导 -->
      <section class="help-section">
        <div class="reset-section">
          <h3>重置所有引导</h3>
          <p>如果你想重新体验所有功能引导，可以点击下方按钮重置</p>
          <button class="reset-btn" @click="resetAllTutorials">
            重置所有引导
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalConfigStore } from '@/stores/localConfig'

const router = useRouter()
const localConfigStore = useLocalConfigStore()
const activeFaq = ref<number | null>(null)

const quickStartTutorials = [
  {
    id: 'welcome',
    icon: '👋',
    title: '欢迎使用',
    description: '了解 RedInk 的核心功能和使用流程'
  },
  {
    id: 'home-guide',
    icon: '🏠',
    title: '首页功能',
    description: '学习如何输入主题和上传参考图片'
  },
  {
    id: 'outline-guide',
    icon: '📝',
    title: '大纲编辑',
    description: '掌握大纲编辑和页面管理技巧'
  },
  {
    id: 'result-guide',
    icon: '🎨',
    title: '结果页面',
    description: '了解如何下载和重新生成图片'
  }
]

const faqs = [
  {
    question: '图片生成失败怎么办？',
    answer: '请检查：1) API Key 是否正确配置 2) 是否存在 CORS 跨域问题（建议使用代理服务）3) 网络连接是否正常。详细解决方案请查看 CORS_SOLUTION.md 文档。'
  },
  {
    question: '为什么历史记录中没有图片？',
    answer: '由于 localStorage 存储限制（5-10MB），纯前端版本无法保存图片。建议生成完成后立即下载图片。未来版本将集成 Supabase 实现云端存储。'
  },
  {
    question: '如何配置 API Key？',
    answer: '进入"系统设置"页面，配置文本生成和图片生成的 API 信息。推荐使用支持 CORS 的代理服务，如 API2D 或 OpenRouter。'
  },
  {
    question: '支持哪些 AI 模型？',
    answer: '文本生成支持：GPT-4o、Gemini 2.0 Flash 等 OpenAI 兼容模型。图片生成支持：DALL-E 3、Gemini 3 Pro Image 等。'
  },
  {
    question: '可以商业使用吗？',
    answer: '个人使用采用 CC BY-NC-SA 4.0 协议。商业使用需要联系作者获取授权。详见 README.md 中的开源协议说明。'
  }
]

const features = [
  {
    icon: '✨',
    title: '智能大纲生成',
    description: 'AI 自动生成 5-8 页的小红书图文大纲，包含封面、内容页和总结'
  },
  {
    icon: '🎨',
    title: '图片自动生成',
    description: '基于大纲内容自动生成配图，支持单张重新生成和批量生成'
  },
  {
    icon: '📝',
    title: '大纲自由编辑',
    description: '可以编辑每一页的内容、调整页面顺序、添加或删除页面'
  },
  {
    icon: '🖼️',
    title: '参考图片上传',
    description: '上传品牌参考图片，保持视觉风格一致性'
  },
  {
    icon: '💾',
    title: '历史记录管理',
    description: '保存创作历史，随时查看和重用之前的大纲'
  },
  {
    icon: '⚙️',
    title: '灵活配置',
    description: '支持多种 AI 模型，可自定义 API 服务商和参数'
  }
]

const isCompleted = (tutorialId: string): boolean => {
  return localConfigStore.preferences.completedTutorials?.includes(tutorialId) || false
}

const startTutorial = (tutorialId: string) => {
  // 触发教程
  window.dispatchEvent(new CustomEvent('start-tutorial', { detail: tutorialId }))
  
  // 根据教程 ID 跳转到对应页面
  const routeMap: Record<string, string> = {
    'welcome': '/',
    'home-guide': '/',
    'outline-guide': '/outline',
    'result-guide': '/result'
  }
  
  const targetRoute = routeMap[tutorialId]
  if (targetRoute && router.currentRoute.value.path !== targetRoute) {
    router.push(targetRoute)
  }
}

const toggleFaq = (index: number) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const resetAllTutorials = () => {
  if (confirm('确定要重置所有引导吗？下次访问时将重新显示所有教程。')) {
    localConfigStore.resetTutorials()
    alert('已重置所有引导！')
  }
}

const startWelcomeTour = () => {
  // 触发欢迎引导
  window.dispatchEvent(new CustomEvent('start-tutorial', { detail: 'welcome' }))
  // 跳转到首页
  router.push('/')
}
</script>

<style scoped>
.help-view {
  max-width: 1200px;
  margin: 0 auto;
}

.help-content {
  padding-bottom: 60px;
}

.help-section {
  margin-bottom: 60px;
}

.section-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.help-section h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #1a1a1a;
}

/* 教程卡片网格 */
.tutorial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.tutorial-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tutorial-card:hover {
  border-color: var(--primary, #ff2442);
  box-shadow: 0 8px 24px rgba(255, 36, 66, 0.12);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 40px;
}

.completed-badge {
  width: 24px;
  height: 24px;
  background: var(--primary, #ff2442);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.tutorial-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.tutorial-card p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.start-btn {
  width: 100%;
  padding: 10px;
  background: var(--primary, #ff2442);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* FAQ 列表 */
.faq-list {
  max-width: 800px;
}

.faq-item {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.faq-item.active {
  border-color: var(--primary, #ff2442);
}

.faq-question {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #1a1a1a;
}

.faq-icon {
  font-size: 24px;
  color: var(--primary, #ff2442);
  font-weight: 300;
}

.faq-answer {
  padding: 0 24px 20px;
  color: #666;
  line-height: 1.8;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 功能卡片网格 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  border-color: rgba(255, 36, 66, 0.2);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.08);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1a1a;
}

.feature-card p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* 联系卡片网格 */
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

.contact-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
  display: block;
}

.contact-card:hover {
  border-color: var(--primary, #ff2442);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.08);
  transform: translateY(-2px);
}

.contact-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.contact-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.contact-card p {
  font-size: 14px;
  color: #666;
}

/* 重置区域 */
.reset-section {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.reset-section h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1a1a;
}

.reset-section p {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
}

.reset-btn {
  padding: 12px 32px;
  background: white;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #f5f5f5;
  border-color: rgba(0, 0, 0, 0.15);
  color: #333;
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, var(--primary, #ff2442) 0%, #ff6b6b 100%);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 48px;
  box-shadow: 0 8px 32px rgba(255, 36, 66, 0.2);
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.welcome-banner::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.banner-icon {
  font-size: 64px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.banner-text {
  flex: 1;
  color: white;
}

.banner-text h3 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: white;
}

.banner-text p {
  font-size: 16px;
  opacity: 0.95;
  margin: 0;
}

.banner-btn {
  padding: 14px 32px;
  background: white;
  color: var(--primary, #ff2442);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.banner-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.banner-btn:active {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-banner {
    padding: 24px;
  }

  .banner-content {
    flex-direction: column;
    text-align: center;
  }

  .banner-icon {
    font-size: 48px;
  }

  .banner-text h3 {
    font-size: 22px;
  }

  .banner-text p {
    font-size: 14px;
  }

  .banner-btn {
    width: 100%;
  }
}
</style>
