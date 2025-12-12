<template>
  <div class="business-login-page">
    <!-- 商务背景 -->
    <div class="business-background">
      <div class="business-pattern"></div>
      <div class="business-overlay"></div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="business-content-box">
        <!-- 左侧品牌区域 -->
        <div class="brand-section">
          <div class="brand-content">
            <div class="brand-logo">
              <IconifyIconOnline icon="ri:building-4-line" class="logo-icon" />
            </div>
            <h1 class="brand-title">企业管理平台</h1>
            <p class="brand-slogan">专业 · 高效 · 安全</p>
            <div class="brand-features">
              <div class="feature-item">
                <IconifyIconOnline icon="ri:shield-check-line" />
                <span>安全可靠</span>
              </div>
              <div class="feature-item">
                <IconifyIconOnline icon="ri:speed-line" />
                <span>高效便捷</span>
              </div>
              <div class="feature-item">
                <IconifyIconOnline icon="ri:customer-service-2-line" />
                <span>专业服务</span>
              </div>
            </div>
            <div class="brand-stats">
              <div class="stat-item">
                <div class="stat-value">10K+</div>
                <div class="stat-label">企业用户</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">99.9%</div>
                <div class="stat-label">系统稳定性</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">24/7</div>
                <div class="stat-label">技术支持</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <div class="form-header">
              <h2 class="form-title">欢迎登录</h2>
              <p class="form-subtitle">请输入您的账号信息</p>
            </div>
            <slot name="form"></slot>
            <div class="form-footer">
              <div class="footer-links">
                <a href="#" class="footer-link">忘记密码?</a>
                <span class="footer-divider">|</span>
                <a href="#" class="footer-link">联系支持</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="business-footer">
      <div class="footer-content">
        <p class="copyright">© 2025 企业管理平台. All rights reserved.</p>
        <div class="footer-links-bottom">
          <a href="#">隐私政策</a>
          <a href="#">服务条款</a>
          <a href="#">帮助中心</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "BusinessLoginTheme",
});
</script>

<style lang="scss" scoped>
.business-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.business-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .business-pattern {
    width: 100%;
    height: 100%;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 35px,
        rgba(0, 0, 0, 0.02) 35px,
        rgba(0, 0, 0, 0.02) 70px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 35px,
        rgba(0, 0, 0, 0.02) 35px,
        rgba(0, 0, 0, 0.02) 70px
      );
  }

  .business-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(245, 247, 250, 0.95) 100%
    );
  }
}

.login-main-container {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.business-content-box {
  width: 100%;
  max-width: 1100px;
  display: flex;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-height: 600px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #ffffff;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    animation: brandRotate 30s linear infinite;
  }

  .brand-content {
    position: relative;
    z-index: 1;
    text-align: center;
    width: 100%;
  }

  .brand-logo {
    margin-bottom: 30px;

    .logo-icon {
      font-size: 80px;
      color: #ffffff;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }
  }

  .brand-title {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 15px;
    letter-spacing: 1px;
  }

  .brand-slogan {
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 40px;
    opacity: 0.9;
    letter-spacing: 2px;
  }

  .brand-features {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-bottom: 50px;
    flex-wrap: wrap;

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      opacity: 0.9;

      :deep(.iconify) {
        font-size: 32px;
      }
    }
  }

  .brand-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    padding: 30px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 12px;
        opacity: 0.8;
      }
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #ffffff;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;

  .form-header {
    margin-bottom: 40px;
    text-align: center;

    .form-title {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .form-subtitle {
      font-size: 14px;
      color: #7f8c8d;
    }
  }

  .form-footer {
    margin-top: 30px;

    .footer-links {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      font-size: 14px;

      .footer-link {
        color: var(--el-color-primary);
        text-decoration: none;
        transition: all 0.3s ease;

        &:hover {
          color: var(--el-color-primary-light-3);
          text-decoration: underline;
        }
      }

      .footer-divider {
        color: #dcdfe6;
      }
    }
  }
}

.business-footer {
  position: relative;
  z-index: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  .footer-content {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;

    .copyright {
      font-size: 13px;
      color: #7f8c8d;
      margin: 0;
    }

    .footer-links-bottom {
      display: flex;
      gap: 20px;

      a {
        font-size: 13px;
        color: #7f8c8d;
        text-decoration: none;
        transition: color 0.3s ease;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

@keyframes brandRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .business-content-box {
    flex-direction: column;
    min-height: auto;
  }

  .brand-section {
    padding: 40px 20px;

    .brand-logo .logo-icon {
      font-size: 60px;
    }

    .brand-title {
      font-size: 28px;
    }

    .brand-slogan {
      font-size: 16px;
    }

    .brand-features {
      gap: 20px;
    }

    .brand-stats {
      flex-direction: column;
      gap: 15px;

      .stat-divider {
        width: 60px;
        height: 1px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }

  .business-footer .footer-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
