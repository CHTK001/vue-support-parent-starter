<template>
  <div class="spring-console-login-page">
    <!-- 装饰性背景元素 -->
    <div class="login-bg-shapes">
      <div class="login-bg-shape login-bg-shape--1" />
      <div class="login-bg-shape login-bg-shape--2" />
      <div class="login-bg-shape login-bg-shape--3" />
    </div>

    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <div class="login-brand__logo">
          <span class="login-brand__logo-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </span>
        </div>
        <h1 class="login-brand__title">{{ eyebrow || "Spring Console" }}</h1>
        <p class="login-brand__desc">{{ description || "输入控制台账号密码后进入页面。" }}</p>

        <div class="login-brand__features">
          <div class="login-brand__feature">
            <span class="login-brand__feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </span>
            <span>服务器实时监控</span>
          </div>
          <div class="login-brand__feature">
            <span class="login-brand__feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <path d="M6 6h.01M6 18h.01" />
              </svg>
            </span>
            <span>资源与进程管理</span>
          </div>
          <div class="login-brand__feature">
            <span class="login-brand__feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>安全保障与预警</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="login-form-wrap">
        <div class="login-card">
          <div class="login-card__header">
            <h2 class="login-card__title">{{ title || "Spring Console" }}</h2>
            <p class="login-card__subtitle">请登录以继续</p>
          </div>

          <div class="login-card__body">
            <div class="login-field">
              <label class="login-field__label">用户名</label>
              <div class="login-field__input-wrap">
                <span class="login-field__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <el-input
                  v-model="username"
                  placeholder="请输入用户名"
                  size="large"
                  class="login-input"
                  @keyup.enter="handleLogin"
                />
              </div>
            </div>

            <div class="login-field">
              <label class="login-field__label">密码</label>
              <div class="login-field__input-wrap">
                <span class="login-field__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <el-input
                  v-model="password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  class="login-input"
                  @keyup.enter="handleLogin"
                />
              </div>
            </div>

            <el-button
              type="primary"
              size="large"
              class="login-btn"
              @click="handleLogin"
            >
              <span class="login-btn__text">登 录</span>
            </el-button>
          </div>

          <div class="login-card__footer">
            <span class="login-card__footer-text">Spring Support API Starter</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  title?: string;
  description?: string;
  eyebrow?: string;
  authBasePath?: string;
}>();

const username = ref("");
const password = ref("");

const handleLogin = () => {
  window.location.href = "./";
};
</script>

<style scoped lang="scss">
.spring-console-login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(14, 165, 233, 0.10), transparent 50%),
    radial-gradient(ellipse at 100% 0%, rgba(99, 102, 241, 0.08), transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(245, 158, 11, 0.06), transparent 50%),
    linear-gradient(180deg, #f0f4f9 0%, #f8fafc 50%, #f1f5f9 100%);
  overflow: hidden;
}

// ── 装饰性背景形状 ───────────────────────────
.login-bg-shapes {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.login-bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;

  &--1 {
    width: 600px;
    height: 600px;
    top: -200px;
    right: -150px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.20), transparent 70%);
    animation: loginFloat 20s ease-in-out infinite;
  }

  &--2 {
    width: 400px;
    height: 400px;
    bottom: -100px;
    left: -100px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%);
    animation: loginFloat 25s ease-in-out infinite reverse;
  }

  &--3 {
    width: 300px;
    height: 300px;
    top: 50%;
    left: 60%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.10), transparent 70%);
    animation: loginFloat 18s ease-in-out infinite 5s;
  }
}

@keyframes loginFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

// ── 容器 ─────────────────────────────────────
.login-container {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 960px;
  width: 100%;
  min-height: 560px;
  margin: 24px;
  border-radius: 32px;
  background:
    radial-gradient(circle at 0% 0%, rgba(255,255,255,0.9), transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(255,255,255,0.7), transparent 50%),
    rgba(255,255,255,0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow:
    0 32px 80px rgba(15, 23, 42, 0.10),
    0 12px 32px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255,255,255,0.8);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.04), transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.03), transparent 50%);
    pointer-events: none;
  }
}

// ── 左侧品牌区域 ────────────────────────────
.login-brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 10%;
    bottom: 10%;
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.2), transparent);
  }
}

.login-brand__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.login-brand__logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: white;
  box-shadow:
    0 12px 28px rgba(14, 165, 233, 0.25),
    inset 0 1px 0 rgba(255,255,255,0.2);
}

.login-brand__title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #0f172a, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-brand__desc {
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 36px;
}

.login-brand__features {
  display: grid;
  gap: 16px;
}

.login-brand__feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.login-brand__feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.08));
  color: #0ea5e9;
  flex-shrink: 0;
}

// ── 右侧登录表单 ────────────────────────────
.login-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

.login-card__header {
  text-align: center;
  margin-bottom: 32px;
}

.login-card__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.login-card__subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.login-card__body {
  display: grid;
  gap: 20px;
}

.login-field {
  display: grid;
  gap: 6px;
}

.login-field__label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.login-field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login-field__icon {
  position: absolute;
  left: 14px;
  z-index: 2;
  color: #94a3b8;
  display: flex;
  pointer-events: none;
  transition: color 0.2s ease;
}

// 输入框获得焦点时图标变色
.login-field__input-wrap:focus-within .login-field__icon {
  color: var(--el-color-primary);
}

:deep(.login-input) {
  .el-input__wrapper {
    padding-left: 44px;
    border-radius: 14px;
    height: 48px;
    background: rgba(248, 250, 252, 0.9);
    border: 1.5px solid rgba(148, 163, 184, 0.2);
    box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.03);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: rgba(148, 163, 184, 0.4);
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow:
        inset 0 2px 4px rgba(15, 23, 42, 0.03),
        0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    }
  }

  .el-input__inner {
    font-size: 14px;
    height: 48px;
  }
}

// ── 登录按钮 ──────────────────────────────────
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 4px;
  border: none;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow:
    0 8px 24px color-mix(in srgb, var(--el-color-primary) 30%, transparent);

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 12px 32px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-btn__text {
  letter-spacing: 0.05em;
}

// ── 底部 ──────────────────────────────────────
.login-card__footer {
  text-align: center;
  margin-top: 32px;
}

.login-card__footer-text {
  font-size: 12px;
  color: #cbd5e1;
}

// ── 响应式 ─────────────────────────────────────
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 440px;
  }

  .login-brand {
    padding: 32px 28px 24px;

    &::after {
      display: none;
    }
  }

  .login-brand__features {
    display: none;
  }

  .login-form-wrap {
    padding: 24px 28px 32px;
  }
}
</style>
