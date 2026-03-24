<script setup lang="ts">
import { onMounted, ref } from "vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 是否显示进度条 */
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "组件加载中...",
  showProgress: true
});

const progress = ref(0);

const getParticleStyle = (index: number) => {
  const angle = (index * 18) % 360;
  const radius = 100 + Math.random() * 50;
  const delay = Math.random() * 2;
  return {
    "--angle": `${angle}deg`,
    "--radius": `${radius}px`,
    "--delay": `${delay}s`
  };
};

onMounted(() => {
  if (!props.showProgress) {
    return;
  }
  const interval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10;
    } else {
      clearInterval(interval);
    }
  }, 200);
});
</script>

<template>
  <div class="cool-loading default-loading">
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-ring" />
        <div class="spinner-ring" />
        <div class="spinner-ring" />
        <div class="spinner-ring" />
      </div>

      <div class="loading-text">
        <span class="text-gradient">{{ loadingText }}</span>
      </div>

      <div v-if="showProgress" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>

      <div class="particles">
        <div
          v-for="i in 20"
          :key="i"
          class="particle"
          :style="getParticleStyle(i)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.default-loading {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.loading-spinner {
  position: relative;
  width: 120px;
  height: 120px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #ff6b6b;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: #4ecdc4;
  animation-delay: 0.5s;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #45b7d1;
  animation-delay: 1s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(4) {
  border-left-color: #f9ca24;
  animation-delay: 1.5s;
  width: 70%;
  height: 70%;
  top: 15%;
  left: 15%;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.text-gradient {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.particles {
  position: absolute;
  width: 300px;
  height: 300px;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: float 3s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes float {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle))
      translateX(var(--radius)) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) rotate(var(--angle))
      translateX(var(--radius)) scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .loading-spinner {
    width: 80px;
    height: 80px;
  }

  .loading-text {
    font-size: 1.2rem;
  }

  .progress-bar {
    width: 150px;
  }

  .particles {
    width: 200px;
    height: 200px;
  }
}
</style>


