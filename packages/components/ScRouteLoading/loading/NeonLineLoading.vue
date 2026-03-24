<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 是否显示进度数值 */
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "数据加载中...",
  showProgress: true
});

const progress = ref(0);
let timer: number | null = null;

onMounted(() => {
  if (!props.showProgress) {
    return;
  }
  timer = window.setInterval(() => {
    if (progress.value < 95) {
      progress.value += 1 + Math.random() * 4;
    } else if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }, 160);
});

onUnmounted(() => {
  if (timer !== null) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div class="cool-loading neon-loading">
    <div class="neon-wrapper">
      <div class="neon-title">
        {{ loadingText }}
        <span v-if="showProgress" class="percent">{{ Math.floor(progress) }}%</span>
      </div>
      <div class="neon-track">
        <div class="neon-bar" :style="{ width: showProgress ? progress + '%' : '40%' }" />
      </div>
      <div class="neon-lines">
        <span v-for="i in 5" :key="i" class="neon-line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.neon-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1f2937 0%, #020617 55%, #000 100%);
  color: #e5e7eb;
}

.neon-wrapper {
  min-width: 260px;
  max-width: 340px;
  padding: 24px 28px;
  border-radius: 16px;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent),
    radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.16), transparent),
    rgba(15, 23, 42, 0.96);
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.3),
    0 16px 40px rgba(15, 23, 42, 0.9),
    0 0 40px rgba(59, 130, 246, 0.35);
}

.neon-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #e5e7eb;
}

.percent {
  font-size: 12px;
  color: #a5b4fc;
}

.neon-track {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 1));
}

.neon-bar {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e, #22d3ee, #3b82f6, #a855f7);
  box-shadow:
    0 0 12px rgba(56, 189, 248, 0.9),
    0 0 4px rgba(129, 140, 248, 0.9);
  animation: glow-pulse 1.4s ease-in-out infinite;
}

.neon-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(248, 250, 252, 0.9) 40%,
    transparent 60%
  );
  mix-blend-mode: screen;
  animation: light-sweep 1.6s linear infinite;
}

.neon-lines {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.neon-line {
  flex: 1;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.9), transparent);
  opacity: 0.2;
  animation: scan 1.1s linear infinite;
}

.neon-line:nth-child(2) {
  animation-delay: 0.12s;
}

.neon-line:nth-child(3) {
  animation-delay: 0.24s;
}

.neon-line:nth-child(4) {
  animation-delay: 0.36s;
}

.neon-line:nth-child(5) {
  animation-delay: 0.48s;
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes light-sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(160%);
  }
}

@keyframes scan {
  0% {
    opacity: 0.2;
    transform: scaleX(0.6);
  }
  50% {
    opacity: 0.9;
    transform: scaleX(1);
  }
  100% {
    opacity: 0.2;
    transform: scaleX(0.6);
  }
}

@media (max-width: 480px) {
  .neon-wrapper {
    width: 88%;
    padding: 18px 16px;
  }
}
</style>


