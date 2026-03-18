<template>
  <div class="halloween-pumpkin-container">
    <svg
      v-for="pumpkin in pumpkins"
      :key="pumpkin.id"
      class="pumpkin"
      :style="{
        left: pumpkin.x + '%',
        top: pumpkin.y + '%',
        width: pumpkin.size + 'px',
        height: pumpkin.size + 'px',
      }"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 南瓜身体 -->
      <ellipse
        cx="50"
        cy="55"
        rx="40"
        ry="35"
        fill="#FF6B35"
        stroke="#E65F2F"
        stroke-width="2"
      />
      <!-- 南瓜纹理 -->
      <path
        d="M 30 30 Q 30 55 30 80"
        stroke="#E65F2F"
        stroke-width="2"
        fill="none"
      />
      <path
        d="M 50 25 Q 50 55 50 85"
        stroke="#E65F2F"
        stroke-width="2"
        fill="none"
      />
      <path
        d="M 70 30 Q 70 55 70 80"
        stroke="#E65F2F"
        stroke-width="2"
        fill="none"
      />
      <!-- 南瓜蒂 -->
      <rect x="45" y="15" width="10" height="15" fill="#2A5F2A" rx="2" />
      <!-- 左眼 -->
      <polygon points="30,45 35,50 30,55" fill="#1A0F1F" />
      <!-- 右眼 -->
      <polygon points="70,45 65,50 70,55" fill="#1A0F1F" />
      <!-- 嘴巴 -->
      <path
        d="M 25 65 Q 50 75 75 65"
        stroke="#1A0F1F"
        stroke-width="3"
        fill="none"
      />
      <rect x="30" y="63" width="5" height="8" fill="#1A0F1F" />
      <rect x="45" y="63" width="5" height="10" fill="#1A0F1F" />
      <rect x="60" y="63" width="5" height="8" fill="#1A0F1F" />
      <!-- 发光效果 -->
      <ellipse
        cx="50"
        cy="55"
        rx="40"
        ry="35"
        fill="url(#pumpkin-glow)"
        opacity="0.3"
      />
      <defs>
        <radialGradient id="pumpkin-glow">
          <stop offset="0%" stop-color="#FFD700" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Pumpkin {
  id: number;
  x: number;
  y: number;
  size: number;
}

// 生成随机南瓜装饰
const pumpkins = ref<Pumpkin[]>([
  { id: 1, x: 5, y: 10, size: 60 },
  { id: 2, x: 92, y: 15, size: 50 },
  { id: 3, x: 3, y: 85, size: 55 },
  { id: 4, x: 94, y: 80, size: 65 },
]);
</script>

<style scoped>
.halloween-pumpkin-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.pumpkin {
  position: absolute;
  filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.5));
  animation: pumpkin-glow 2s ease-in-out infinite;
}

@keyframes pumpkin-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 107, 53, 0.8));
  }
}
</style>
