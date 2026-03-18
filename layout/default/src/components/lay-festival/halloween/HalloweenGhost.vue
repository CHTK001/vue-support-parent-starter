<template>
  <div class="halloween-ghost-container">
    <div
      v-for="ghost in ghosts"
      :key="ghost.id"
      class="ghost"
      :style="{
        left: ghost.x + '%',
        animationDelay: ghost.delay + 's',
        animationDuration: ghost.duration + 's',
      }"
    >
      <div class="ghost-body">
        <div class="ghost-eyes">
          <div class="ghost-eye"></div>
          <div class="ghost-eye"></div>
        </div>
        <div class="ghost-mouth"></div>
      </div>
      <div class="ghost-tail">
        <div class="ghost-tail-part"></div>
        <div class="ghost-tail-part"></div>
        <div class="ghost-tail-part"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Ghost {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

// 生成随机幽灵
const ghosts = ref<Ghost[]>([
  { id: 1, x: 10, delay: 0, duration: 8 },
  { id: 2, x: 30, delay: 2, duration: 10 },
  { id: 3, x: 50, delay: 4, duration: 9 },
  { id: 4, x: 70, delay: 1, duration: 11 },
  { id: 5, x: 90, delay: 3, duration: 7 },
]);
</script>

<style scoped>
.halloween-ghost-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}

.ghost {
  position: absolute;
  top: -100px;
  width: 40px;
  height: 60px;
  animation: float-down linear infinite;
  opacity: 0.6;
}

.ghost-body {
  position: relative;
  width: 40px;
  height: 40px;
  background: rgba(155, 89, 182, 0.8);
  border-radius: 20px 20px 0 0;
}

.ghost-eyes {
  position: absolute;
  top: 12px;
  left: 8px;
  display: flex;
  gap: 12px;
}

.ghost-eye {
  width: 6px;
  height: 6px;
  background: #1a0f1f;
  border-radius: 50%;
}

.ghost-mouth {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 6px;
  border: 2px solid #1a0f1f;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.ghost-tail {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.ghost-tail-part {
  width: 12px;
  height: 20px;
  background: rgba(155, 89, 182, 0.8);
  border-radius: 0 0 6px 6px;
}

@keyframes float-down {
  0% {
    top: -100px;
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(20px) rotate(5deg);
  }
  50% {
    transform: translateX(-20px) rotate(-5deg);
  }
  75% {
    transform: translateX(10px) rotate(3deg);
  }
  100% {
    top: calc(100% + 100px);
    transform: translateX(0) rotate(0deg);
  }
}
</style>
