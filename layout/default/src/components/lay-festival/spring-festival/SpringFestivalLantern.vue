<template>
  <div class="spring-festival-lantern">
    <svg
      v-for="(lantern, index) in lanterns"
      :key="index"
      :class="['lantern', `lantern-${index}`]"
      :style="getLanternStyle(index)"
      viewBox="0 0 100 150"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 顶部挂绳 -->
      <line x1="50" y1="0" x2="50" y2="15" stroke="#8B4513" stroke-width="1" />
      
      <!-- 灯笼主体 -->
      <ellipse cx="50" cy="25" rx="20" ry="8" :fill="lantern.color" opacity="0.8" />
      <rect x="30" y="25" width="40" height="50" :fill="lantern.color" rx="5" />
      <ellipse cx="50" cy="75" rx="20" ry="8" :fill="lantern.color" opacity="0.8" />
      
      <!-- 灯笼纹理 -->
      <line x1="30" y1="35" x2="70" y2="35" stroke="#8B0000" stroke-width="0.5" opacity="0.6" />
      <line x1="30" y1="50" x2="70" y2="50" stroke="#8B0000" stroke-width="0.5" opacity="0.6" />
      <line x1="30" y1="65" x2="70" y2="65" stroke="#8B0000" stroke-width="0.5" opacity="0.6" />
      
      <!-- 中间装饰 -->
      <circle cx="50" cy="50" r="12" fill="#FFD700" opacity="0.9" />
      <text x="50" y="55" text-anchor="middle" font-size="10" fill="#8B0000" font-weight="bold">福</text>
      
      <!-- 底部流苏 -->
      <g class="tassel">
        <line x1="50" y1="75" x2="50" y2="85" stroke="#FFD700" stroke-width="2" />
        <line x1="45" y1="85" x2="45" y2="95" stroke="#FFD700" stroke-width="1" />
        <line x1="50" y1="85" x2="50" y2="98" stroke="#FFD700" stroke-width="1" />
        <line x1="55" y1="85" x2="55" y2="95" stroke="#FFD700" stroke-width="1" />
      </g>
      
      <!-- 高光效果 -->
      <ellipse cx="45" cy="40" rx="8" ry="15" fill="white" opacity="0.2" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Lantern {
  color: string
  left: number
  top: number
  size: number
  delay: number
}

const lanterns = ref<Lantern[]>([
  { color: '#DC143C', left: 10, top: 5, size: 60, delay: 0 },
  { color: '#FF4500', left: 85, top: 5, size: 60, delay: 0.5 },
  { color: '#DC143C', left: 10, top: 85, size: 50, delay: 1 },
  { color: '#FF4500', left: 85, top: 85, size: 50, delay: 1.5 }
])

const getLanternStyle = (index: number) => {
  const lantern = lanterns.value[index]
  return {
    left: `${lantern.left}%`,
    top: `${lantern.top}%`,
    width: `${lantern.size}px`,
    height: `${lantern.size * 1.5}px`,
    animationDelay: `${lantern.delay}s`
  }
}

let animationFrame: number | null = null

const animate = () => {
  // 动画由 CSS 处理，这里预留扩展空间
  animationFrame = requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
})

onUnmounted(() => {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped lang="scss">
.spring-festival-lantern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  overflow: hidden;
}

.lantern {
  position: absolute;
  filter: drop-shadow(0 0 10px rgba(220, 20, 60, 0.6));
  animation: swing 3s ease-in-out infinite;
  transform-origin: 50% 0%;
}

@keyframes swing {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.tassel {
  animation: tassel-swing 2s ease-in-out infinite;
  transform-origin: 50% 75px;
}

@keyframes tassel-swing {
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}
</style>
