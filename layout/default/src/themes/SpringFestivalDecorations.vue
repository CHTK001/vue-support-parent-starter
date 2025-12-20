<template>
  <div v-if="isSpringFestival" class="spring-festival-decorations">
    <!-- 左侧灯笼 -->
    <div class="lanterns-container lanterns-left">
      <div v-for="i in 2" :key="`left-${i}`" class="lantern">
        <div class="lantern-body">
          <div class="lantern-light"></div>
        </div>
        <div class="lantern-tassel"></div>
      </div>
    </div>

    <!-- 右侧灯笼 -->
    <div class="lanterns-container lanterns-right">
      <div v-for="i in 2" :key="`right-${i}`" class="lantern">
        <div class="lantern-body">
          <div class="lantern-light"></div>
        </div>
        <div class="lantern-tassel"></div>
      </div>
    </div>

    <!-- 烟火效果 -->
    <div class="fireworks-container">
      <div v-for="i in 3" :key="`firework-${i}`" class="firework"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 春节装饰组件
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 */

import { computed } from "vue";
import { useGlobal } from "@pureadmin/utils";

//@ts-ignore
const { $storage } = useGlobal<GlobalPropertiesApi>();

/**
 * 是否为春节主题
 */
const isSpringFestival = computed(
  () => $storage?.configure?.systemTheme === "spring-festival"
);
</script>

<style scoped lang="scss">
.spring-festival-decorations {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

// ==================== 灯笼样式 ====================

.lanterns-container {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  pointer-events: none;

  &.lanterns-left {
    left: 0;
  }

  &.lanterns-right {
    right: 0;
  }
}

.lantern {
  position: absolute;
  width: 50px;
  height: 70px;
  top: 20px;
  animation: lanternSwing 3s ease-in-out infinite;

  &:nth-child(1) {
    left: 5%;
    animation-delay: 0s;
  }

  &:nth-child(2) {
    left: 15%;
    animation-delay: 0.5s;
  }

  .lanterns-right & {
    &:nth-child(1) {
      right: 5%;
      left: auto;
    }

    &:nth-child(2) {
      right: 15%;
      left: auto;
    }
  }
}

.lantern-body {
  position: relative;
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #ff4444 0%, #ff6666 50%, #ff4444 100%);
  border-radius: 50% 50% 40% 40%;
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.6), inset 0 0 10px rgba(255, 100, 100, 0.4);
  border: 2px solid #cc0000;

  &::before,
  &::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 4px;
    background: #ffd700;
    left: 0;
  }

  &::before {
    top: 8px;
    border-radius: 50%;
  }

  &::after {
    bottom: 8px;
    border-radius: 50%;
  }
}

.lantern-light {
  position: absolute;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #ffff00, #ff8800);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px #ffff00, 0 0 30px rgba(255, 255, 0, 0.5);
  animation: lanternGlow 2s ease-in-out infinite;
}

.lantern-tassel {
  position: absolute;
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #ffd700, #ff8800);
  left: 50%;
  top: 60px;
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);

  &::before,
  &::after {
    content: "";
    position: absolute;
    width: 2px;
    height: 8px;
    background: #ffd700;
    left: 1px;
    bottom: -8px;
    border-radius: 1px;
  }

  &::before {
    transform: rotate(-20deg);
  }

  &::after {
    transform: rotate(20deg);
  }
}

// ==================== 烟火效果 ====================

.fireworks-container {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.firework {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  pointer-events: none;

  &:nth-child(1) {
    left: 20%;
    top: 30%;
    background: #ff4444;
    animation: fireworkBurst 1.5s ease-out infinite;
    animation-delay: 0s;
  }

  &:nth-child(2) {
    left: 50%;
    top: 20%;
    background: #ffd700;
    animation: fireworkBurst 1.5s ease-out infinite;
    animation-delay: 0.5s;
  }

  &:nth-child(3) {
    left: 80%;
    top: 35%;
    background: #ff6666;
    animation: fireworkBurst 1.5s ease-out infinite;
    animation-delay: 1s;
  }
}

// ==================== 动画定义 ====================

@keyframes lanternSwing {
  0%, 100% {
    transform: translateX(0) rotateZ(-8deg);
  }

  50% {
    transform: translateX(15px) rotateZ(8deg);
  }
}

@keyframes lanternGlow {
  0%, 100% {
    box-shadow: 0 0 15px #ffff00, 0 0 30px rgba(255, 255, 0, 0.5);
  }

  50% {
    box-shadow: 0 0 25px #ffff00, 0 0 50px rgba(255, 255, 0, 0.8);
  }
}

@keyframes fireworkBurst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }

  100% {
    transform: translate(
      calc(cos(var(--angle)) * 100px),
      calc(sin(var(--angle)) * 100px)
    ) scale(0);
    opacity: 0;
  }
}

// ==================== 暗色模式适配 ====================

:global(.dark) {
  .lantern-body {
    background: linear-gradient(135deg, #cc3333 0%, #dd5555 50%, #cc3333 100%);
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.4), inset 0 0 10px rgba(255, 100, 100, 0.2);
  }

  .lantern-light {
    box-shadow: 0 0 12px #ffff00, 0 0 25px rgba(255, 255, 0, 0.3);
  }
}
</style>
