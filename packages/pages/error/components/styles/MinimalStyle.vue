<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "MinimalStyle",
});

defineProps<{
  code: number | string;
  title: string;
  description: string;
}>();

const emit = defineEmits<{
  goHome: [];
  goBack: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="minimal-error-container">
    <!-- 动态背景 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 主要内容 -->
    <div class="minimal-content">
      <!-- 错误码动画 -->
      <div class="error-code-wrapper">
        <div class="glitch-wrapper">
          <span class="error-code" :data-text="code">{{ code }}</span>
        </div>
        <div class="code-underline"></div>
      </div>

      <!-- 图标 -->
      <div class="error-icon">
        <template v-if="String(code) === '404'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M8 11h6" stroke-linecap="round" />
          </svg>
        </template>
        <template v-else-if="String(code) === '403'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </template>
        <template v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </template>
      </div>

      <!-- 标题和描述 -->
      <h1 class="error-title">{{ title }}</h1>
      <p class="error-desc">{{ description }}</p>

      <!-- 分隔线 -->
      <div class="divider">
        <span class="divider-dot"></span>
        <span class="divider-dot"></span>
        <span class="divider-dot"></span>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="minimal-btn primary" @click="emit('goHome')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>{{ t("error.goHome") }}</span>
        </button>
        <button class="minimal-btn secondary" @click="emit('goBack')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{{ t("error.goBack") }}</span>
        </button>
      </div>

      <!-- 装饰元素 -->
      <div class="decorative-lines">
        <div class="line line-1"></div>
        <div class="line line-2"></div>
        <div class="line line-3"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.minimal-error-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  overflow: hidden;

  :global(.dark) & {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
}

// 背景形状
.bg-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;

  :global(.dark) & {
    opacity: 0.05;
  }
}

.shape-1 {
  top: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: float-shape 20s ease-in-out infinite;
}

.shape-2 {
  bottom: -30%;
  left: -15%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: float-shape 25s ease-in-out infinite reverse;
}

.shape-3 {
  top: 40%;
  left: 50%;
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  animation: float-shape 15s ease-in-out infinite;
  animation-delay: -5s;
}

// 主要内容
.minimal-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 40px 20px;
  max-width: 500px;
}

// 错误码
.error-code-wrapper {
  margin-bottom: 30px;
}

.glitch-wrapper {
  position: relative;
  display: inline-block;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  letter-spacing: -5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  animation: glitch 3s infinite;

  :global(.dark) & {
    background: linear-gradient(135deg, #a0a0ff 0%, #c0a0ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
  }

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: inherit;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &::before {
    animation: glitch-1 0.3s infinite linear alternate-reverse;
    clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  }

  &::after {
    animation: glitch-2 0.3s infinite linear alternate-reverse;
    clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  }
}

.code-underline {
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  margin: 10px auto 0;
  border-radius: 2px;
  animation: pulse-width 2s ease-in-out infinite;

  :global(.dark) & {
    background: linear-gradient(90deg, transparent, #a0a0ff, transparent);
  }
}

// 图标
.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 30px;
  color: #667eea;
  animation: bounce-in 0.6s ease-out;

  :global(.dark) & {
    color: #a0a0ff;
  }

  svg {
    width: 100%;
    height: 100%;
    animation: icon-float 3s ease-in-out infinite;
  }
}

// 标题和描述
.error-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 12px;
  animation: fade-up 0.6s ease-out 0.2s both;

  :global(.dark) & {
    color: #e2e8f0;
  }
}

.error-desc {
  font-size: 1rem;
  color: #718096;
  line-height: 1.6;
  margin-bottom: 30px;
  animation: fade-up 0.6s ease-out 0.3s both;

  :global(.dark) & {
    color: #a0aec0;
  }
}

// 分隔线
.divider {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 30px;
  animation: fade-up 0.6s ease-out 0.4s both;
}

.divider-dot {
  width: 8px;
  height: 8px;
  background: #cbd5e0;
  border-radius: 50%;
  animation: dot-pulse 1.5s ease-in-out infinite;

  :global(.dark) & {
    background: #4a5568;
  }

  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fade-up 0.6s ease-out 0.5s both;
}

.minimal-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  .btn-icon {
    width: 20px;
    height: 20px;
    transition: transform 0.3s;
  }

  &:hover .btn-icon {
    transform: scale(1.1);
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  &.secondary {
    background: #fff;
    color: #667eea;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

    :global(.dark) & {
      background: #2d3748;
      color: #a0a0ff;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

// 装饰线条
.decorative-lines {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.line {
  width: 40px;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  animation: line-grow 1.5s ease-in-out infinite;

  :global(.dark) & {
    background: #4a5568;
  }

  &-1 {
    animation-delay: 0s;
  }
  &-2 {
    animation-delay: 0.2s;
    width: 60px;
  }
  &-3 {
    animation-delay: 0.4s;
  }
}

// 动画
@keyframes float-shape {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(20px, -20px) rotate(5deg);
  }
  50% {
    transform: translate(0, -40px) rotate(0deg);
  }
  75% {
    transform: translate(-20px, -20px) rotate(-5deg);
  }
}

@keyframes glitch {
  0%,
  90%,
  100% {
    transform: translate(0);
  }
  92% {
    transform: translate(2px, 2px);
  }
  94% {
    transform: translate(-2px, -2px);
  }
  96% {
    transform: translate(2px, -2px);
  }
  98% {
    transform: translate(-2px, 2px);
  }
}

@keyframes glitch-1 {
  0% {
    transform: translate(-2px, 0);
  }
  100% {
    transform: translate(2px, 0);
  }
}

@keyframes glitch-2 {
  0% {
    transform: translate(2px, 0);
  }
  100% {
    transform: translate(-2px, 0);
  }
}

@keyframes pulse-width {
  0%,
  100% {
    width: 120px;
    opacity: 0.5;
  }
  50% {
    width: 180px;
    opacity: 1;
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes icon-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes fade-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@keyframes line-grow {
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleX(1.2);
    opacity: 1;
  }
}

// 响应式
@media (max-width: 600px) {
  .error-code {
    font-size: 5rem;
  }

  .error-icon {
    width: 60px;
    height: 60px;
  }

  .error-title {
    font-size: 1.4rem;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    padding: 0 20px;
  }

  .minimal-btn {
    width: 100%;
    justify-content: center;
  }

  .decorative-lines {
    display: none;
  }
}
</style>
