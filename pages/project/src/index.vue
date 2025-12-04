<template>
  <div class="project-home">
    <!-- 顶部欢迎区域 -->
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="title-gradient">项目中心</span>
          </h1>
          <p class="hero-subtitle">智能管理您的所有项目，提升工作效率</p>
        </div>
        <div class="hero-illustration">
          <IconifyIconOnline icon="ri:rocket-2-line" class="hero-icon" />
        </div>
      </div>
    </div>

    <!-- 功能卡片区域 -->
    <div class="cards-container">
      <div class="cards-grid">
        <!-- AI 大语言模型 -->
        <router-link to="/project/ai/llm/web" class="nav-card ai-card">
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:robot-2-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">大语言模型</h3>
            <p class="card-desc">智能对话、文本生成、代码助手</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 图像生成 -->
        <router-link to="/project/ai/vincent/web" class="nav-card image-card">
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:image-ai-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">图像生成</h3>
            <p class="card-desc">AI 绘画、图像编辑、风格转换</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 视频生成 -->
        <router-link to="/project/ai/video/web" class="nav-card video-card">
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:video-ai-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">视频生成</h3>
            <p class="card-desc">AI 视频创作、动画生成</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 人脸检测 -->
        <router-link
          to="/project/ai/face/detect/web"
          class="nav-card face-card"
        >
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:user-search-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">人脸检测</h3>
            <p class="card-desc">人脸识别、表情分析、年龄预测</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 图像上色 -->
        <router-link
          to="/project/ai/colorization/web"
          class="nav-card color-card"
        >
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:palette-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">图像上色</h3>
            <p class="card-desc">黑白照片智能上色、色彩增强</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 分辨率增强 -->
        <router-link
          to="/project/ai/resolution/web"
          class="nav-card resolution-card"
        >
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:hd-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">分辨率增强</h3>
            <p class="card-desc">图像超分辨率、细节增强</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 项目管理 -->
        <router-link to="/project/manage" class="nav-card manage-card">
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:folder-settings-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">项目管理</h3>
            <p class="card-desc">项目配置、资源管理、权限设置</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>

        <!-- 密钥管理 -->
        <router-link to="/project/secret" class="nav-card secret-card">
          <div class="card-glow"></div>
          <div class="card-icon">
            <IconifyIconOnline icon="ri:key-2-line" />
          </div>
          <div class="card-content">
            <h3 class="card-title">密钥管理</h3>
            <p class="card-desc">API 密钥、安全凭证管理</p>
          </div>
          <div class="card-arrow">
            <IconifyIconOnline icon="ri:arrow-right-line" />
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding-bottom: 40px;
}

/* 顶部英雄区域 */
.hero-section {
  position: relative;
  padding: 60px 40px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 50%,
    #667eea 100%
  );
  opacity: 0.95;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-text {
  flex: 1;
}

.hero-title {
  margin: 0 0 16px 0;
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -1px;
}

.title-gradient {
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.85) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.hero-illustration {
  flex-shrink: 0;
}

.hero-icon {
  font-size: 120px;
  color: rgba(255, 255, 255, 0.2);
  animation: float 4s ease-in-out infinite;
}

/* 卡片容器 */
.cards-container {
  max-width: 1400px;
  margin: -40px auto 0;
  padding: 0 40px;
  position: relative;
  z-index: 2;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* 导航卡片 */
.nav-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px;
  background: #fff;
  border-radius: 20px;
  text-decoration: none;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.12),
      0 8px 16px rgba(0, 0, 0, 0.08);

    .card-glow {
      opacity: 1;
    }

    .card-icon {
      transform: scale(1.1) rotate(-5deg);
    }

    .card-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  font-size: 28px;
  color: #fff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-desc {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.card-arrow {
  font-size: 20px;
  color: var(--el-text-color-placeholder);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
}

/* 不同卡片的主题色 */
.ai-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
  }
}

.image-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(236, 72, 153, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
    box-shadow: 0 8px 20px rgba(236, 72, 153, 0.3);
  }
}

.video-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
  }
}

.face-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(20, 184, 166, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
    box-shadow: 0 8px 20px rgba(20, 184, 166, 0.3);
  }
}

.color-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(245, 158, 11, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  }
}

.resolution-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(16, 185, 129, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  }
}

.manage-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  }
}

.secret-card {
  .card-glow {
    background: linear-gradient(
      135deg,
      rgba(107, 114, 128, 0.1) 0%,
      transparent 60%
    );
  }
  .card-icon {
    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
    box-shadow: 0 8px 20px rgba(107, 114, 128, 0.3);
  }
}

/* 动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-section {
    padding: 40px 20px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-icon {
    font-size: 80px;
  }

  .cards-container {
    padding: 0 20px;
    margin-top: -20px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .nav-card {
    padding: 20px;
  }
}
</style>
