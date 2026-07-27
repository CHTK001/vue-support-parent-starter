<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 是否显示进度条 */
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "组件加载中...",
  showProgress: true,
});

const progress = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!props.showProgress) {
    return;
  }
  intervalId = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10;
    } else if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }, 200);
});

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});
</script>

<template>
  <div class="cool-loading default-loading">
    <div class="loading-container">
      <!-- 旋转轨道 + 主题色光点 -->
      <div class="loading-orbit">
        <div class="orbit-ring orbit-ring--outer" />
        <div class="orbit-ring orbit-ring--inner" />
        <div class="orbit-dot orbit-dot--a" />
        <div class="orbit-dot orbit-dot--b" />
        <div class="orbit-dot orbit-dot--c" />
      </div>

      <!-- 中心脉冲核心 -->
      <div class="loading-core">
        <div class="core-inner" />
      </div>

      <!-- 加载文案 -->
      <div class="loading-text">
        <span class="text-gradient">{{ loadingText }}</span>
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.default-loading {
  background:
    radial-gradient(ellipse 600px 450px at 50% 30%, rgba(var(--el-color-primary-rgb), 0.18), transparent 70%),
    radial-gradient(500px circle at 50% 80%, rgba(var(--el-color-primary-rgb), 0.12), transparent 65%),
    var(--el-bg-color-page, #0c0c0c);
  display: flex;
  justify-content: center;
  align-items: center;
}

html:not(.dark) .default-loading {
  background:
    radial-gradient(ellipse 600px 450px at 50% 30%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    radial-gradient(500px circle at 50% 80%, rgba(var(--el-color-primary-rgb), 0.08), transparent 65%),
    #f5f7fa;
}

.loading-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
}

/* 旋转轨道 */
.loading-orbit {
  position: relative;
  width: 120px;
  height: 120px;
}

.orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--el-color-primary-rgb), 0.18);
  animation: orbit-spin 2.4s linear infinite;
}

.orbit-ring--outer {
  inset: 0;
  border-top-color: var(--el-color-primary);
  border-right-color: rgba(var(--el-color-primary-rgb), 0.5);
}

.orbit-ring--inner {
  inset: 18%;
  border-bottom-color: var(--el-color-primary);
  border-left-color: rgba(var(--el-color-primary-rgb), 0.5);
  animation-direction: reverse;
  animation-duration: 1.8s;
}

/* 主题色光点（沿轨道运动） */
.orbit-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: var(--el-color-primary);
  box-shadow: 0 0 12px var(--el-color-primary), 0 0 24px rgba(var(--el-color-primary-rgb), 0.6);
}

.orbit-dot--a {
  animation: orbit-a 2.4s linear infinite;
}

.orbit-dot--b {
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  animation: orbit-b 1.8s linear infinite;
}

.orbit-dot--c {
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  opacity: 0.7;
  animation: orbit-a 2.4s linear infinite reverse;
}

@keyframes orbit-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes orbit-a {
  0% {
    transform: rotate(0deg) translateX(60px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(60px) rotate(-360deg);
  }
}

@keyframes orbit-b {
  0% {
    transform: rotate(0deg) translateX(36px) rotate(0deg);
  }
  100% {
    transform: rotate(-360deg) translateX(36px) rotate(360deg);
  }
}

/* 中心脉冲核心 */
.loading-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.core-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-primary), rgba(var(--el-color-primary-rgb), 0.6));
  box-shadow: 0 0 20px rgba(var(--el-color-primary-rgb), 0.7);
  animation: core-pulse 1.4s ease-in-out infinite;
}

@keyframes core-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.75;
  }
}

/* 加载文案 */
.loading-text {
  font-size: 1.05rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
}

.text-gradient {
  background: linear-gradient(90deg, var(--el-color-primary), rgba(var(--el-color-primary-rgb), 0.6), var(--el-color-primary));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: var(--el-color-primary);
  animation: text-flow 2.5s linear infinite;
}

@keyframes text-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* 进度条 */
.progress-bar {
  width: 220px;
  height: 3px;
  background: rgba(var(--el-color-primary-rgb), 0.12);
  border-radius: 999px;
  overflow: hidden;
}

html.dark .progress-bar {
  background: rgba(255, 255, 255, 0.08);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary), rgba(var(--el-color-primary-rgb), 0.7));
  border-radius: 999px;
  transition: width 0.3s ease;
  position: relative;
  box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.5);
}

.progress-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (max-width: 768px) {
  .loading-orbit {
    width: 90px;
    height: 90px;
  }

  .loading-text {
    font-size: 0.95rem;
  }

  .progress-bar {
    width: 160px;
  }

  @keyframes orbit-a {
    0% { transform: rotate(0deg) translateX(45px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(45px) rotate(-360deg); }
  }

  @keyframes orbit-b {
    0% { transform: rotate(0deg) translateX(27px) rotate(0deg); }
    100% { transform: rotate(-360deg) translateX(27px) rotate(360deg); }
  }
}
</style>
