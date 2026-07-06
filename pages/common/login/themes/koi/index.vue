<template>
  <div class="koi-login-page">
    <el-row class="h-100%">
      <!-- 左侧背景装饰区 -->
      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="login-bg-side">
        <div class="login-background">
          <!-- 动态装饰光斑 -->
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>

          <!-- 毛玻璃覆盖层 -->
          <div class="glass-overlay"></div>

          <!-- 内容层 -->
          <div class="content-layer">
            <div class="brand-badge">
              <div class="login-logo-wrap">
                <div class="login-logo-placeholder">
                  <el-icon :size="28" color="#fff"><Monitor /></el-icon>
                </div>
              </div>
              <span class="brand-text">KOI-ADMIN</span>
            </div>
            <div class="science-placeholder">
              <div class="science-inner"></div>
            </div>
            <div class="welcome-title">欢迎回来</div>
            <div class="welcome-subtitle">KOI-ADMIN 管理系统</div>
            <div class="welcome-desc">高效管理，现代设计，安全可靠</div>
            <div class="feature-tags">
              <span class="feature-tag">
                <el-icon :size="14" class="feature-tag-icon"><Promotion /></el-icon>
                高效管理
              </span>
              <span class="feature-tag">
                <el-icon :size="14" class="feature-tag-icon"><Brush /></el-icon>
                现代设计
              </span>
              <span class="feature-tag">
                <el-icon :size="14" class="feature-tag-icon"><Lock /></el-icon>
                安全可靠
              </span>
            </div>
          </div>

          <!-- 备案号 -->
          <div class="bei-an-hao">
            <a href="https://beian.miit.gov.cn/" target="_blank">
              备案号：豫ICP备2022022094号-1
            </a>
          </div>
        </div>
      </el-col>

      <!-- 右侧表单区 -->
      <el-col
        :lg="8"
        :md="12"
        :sm="9"
        :xs="24"
        class="login-form-side"
      >
        <!-- 顶部工具栏 -->
        <slot name="toolbar"></slot>

        <div class="login-form-panel">
          <!-- 移动端 Logo -->
          <div class="login-mobile-brand">
            <div class="login-logo-wrap login-logo-wrap--mobile">
              <div class="login-logo-placeholder login-logo-placeholder--mobile">
                <el-icon :size="20" color="#409eff"><Monitor /></el-icon>
              </div>
            </div>
            <div class="mobile-brand-text">KOI-ADMIN</div>
          </div>

          <div class="form-header">
            <h3 class="form-title">账户登录</h3>
            <p class="form-subtitle">用户名 / 密码</p>
          </div>

          <!-- 表单插槽 -->
          <div class="form-wrapper">
            <slot name="form"></slot>
          </div>
        </div>

        <!-- 备案号 - 小屏 -->
        <div class="bei-an-hao bei-an-hao--mobile">
          <a href="https://beian.miit.gov.cn/" target="_blank">
            备案号：豫ICP备2022022094号-1
          </a>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { Monitor, Promotion, Brush, Lock } from "@element-plus/icons-vue";

defineOptions({
  name: "KoiLoginTheme",
});
</script>

<style lang="scss" scoped>
.koi-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

/* 左侧背景 */
.login-bg-side {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-background {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.10), transparent 65%),
    radial-gradient(350px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.08), transparent 60%),
    var(--el-bg-color-page, #F8F8F8);
}

/* 动态光斑 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  pointer-events: none;
  animation: bg-float 18s infinite ease-in-out;
  z-index: 0;

  &--1 {
    top: -5%;
    left: 10%;
    width: 400px;
    height: 400px;
    background: rgba(var(--el-color-primary-rgb), 0.35);
  }

  &--2 {
    bottom: 5%;
    right: 5%;
    width: 300px;
    height: 300px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, #a855f7 50%);
    animation-delay: -6s;
  }

  &--3 {
    top: 40%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, #06b6d4 50%);
    animation-delay: -12s;
  }
}

/* 毛玻璃覆盖层 */
.glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 1;
  pointer-events: none;
}

/* 内容层 */
.content-layer {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  padding: 0 40px;
  text-align: center;
}

.login-logo-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.22),
    0 0 0 2px rgba(255, 255, 255, 0.35);

  &--mobile {
    width: 40px;
    height: 40px;
    padding: 2px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.14);
  }
}

.login-logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 70%, #a855f7));
  border-radius: 12px;

  &--mobile {
    border-radius: 10px;
  }
}

.login-mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.mobile-brand-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.brand-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.science-placeholder {
  width: 260px;
  max-width: 500px;
  height: 260px;
  margin: 0 auto 40px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
  animation: float-picture 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(var(--el-color-primary-rgb), 0.15));
  overflow: hidden;

  .science-inner {
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle at 30% 30%, rgba(var(--el-color-primary-rgb), 0.2), transparent 60%),
      radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.15), transparent 50%);
    animation: pulse 4s ease-in-out infinite;
  }
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
  letter-spacing: 2px;
}

.welcome-subtitle {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.welcome-desc {
  font-size: 16px;
  font-weight: 400;
  color: var(--el-text-color-regular);
  opacity: 0.85;
  max-width: 420px;
  margin: 0 auto;
  line-height: 1.6;
}

.feature-tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  background: rgba(var(--el-color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.15);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  transition: all 0.3s;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.15);
    transform: translateY(-2px);
  }
}

.feature-tag-icon {
  color: var(--el-color-primary);
}

/* 右侧表单区 */
.login-form-side {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}

.login-form-panel {
  width: 100%;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.form-subtitle {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.form-wrapper {
  width: 100%;
  max-width: 300px;
}

/* 备案号 */
.bei-an-hao {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: normal;
  text-align: center;
  z-index: 10;
  white-space: nowrap;
  padding-bottom: 10px;
  width: 100%;

  a {
    font-size: 12px;
    color: var(--el-text-color-primary);
    opacity: 0.7;
    transition: opacity 0.3s;

    &:hover {
      opacity: 1;
    }
  }
}

@keyframes float-picture {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16px);
  }
}

@keyframes bg-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(15px, -10px) scale(1.05);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .login-bg-side {
    display: none;
  }

  .login-form-side {
    border-left: none;
  }

  .login-mobile-brand {
    display: flex;
  }

  .bei-an-hao--mobile {
    display: block;
  }
}

@media (min-width: 769px) {
  .login-mobile-brand {
    display: none;
  }

  .bei-an-hao--mobile {
    display: none;
  }
}
</style>
