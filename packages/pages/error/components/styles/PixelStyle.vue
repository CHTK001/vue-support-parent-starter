<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "PixelStyle",
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
  <div class="pixel-error-container">
    <!-- 游戏场景 -->
    <div class="game-scene">
      <!-- 云朵背景 -->
      <div class="clouds">
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        <div class="cloud cloud-3"></div>
      </div>

      <!-- 像素恐龙 - 伤心状态 -->
      <div class="dino-wrapper">
        <div class="pixel-dino sad">
          <div class="dino-body"></div>
          <div class="dino-eye"></div>
          <div class="dino-tear"></div>
          <div class="dino-leg dino-leg-left"></div>
          <div class="dino-leg dino-leg-right"></div>
        </div>
        <!-- 问号气泡 -->
        <div class="speech-bubble">?</div>
      </div>

      <!-- 错误代码像素数字 -->
      <div class="pixel-code">
        <span class="pixel-digit" v-for="(digit, index) in String(code).split('')" :key="index">
          {{ digit }}
        </span>
      </div>

      <!-- 障碍物（代表错误） -->
      <div class="obstacles">
        <div class="cactus error-cactus"></div>
        <div class="warning-sign">!</div>
      </div>

      <!-- 地面 -->
      <div class="ground">
        <div class="ground-line"></div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div class="error-info">
      <h1 class="error-title">{{ title }}</h1>
      <p class="error-desc">{{ description }}</p>

      <!-- 操作按钮 - 游戏风格 -->
      <div class="action-buttons">
        <button class="pixel-btn primary" @click="emit('goHome')">
          <span class="btn-icon">🏠</span>
          <span>{{ t("error.goHome") }}</span>
        </button>
        <button class="pixel-btn secondary" @click="emit('goBack')">
          <span class="btn-icon">↩</span>
          <span>{{ t("error.goBack") }}</span>
        </button>
      </div>

      <!-- 提示文字 -->
      <p class="hint-text">{{ t("error.pressToRetry") }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pixel-error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 40px 20px;
  font-family: "Press Start 2P", "Courier New", monospace;
}

// 游戏场景
.game-scene {
  position: relative;
  width: 500px;
  height: 280px;
  max-width: 100%;
}

// 云朵
.clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
}

.cloud {
  position: absolute;
  background: #c9c9c9;
  border-radius: 4px;

  :global(.dark) & {
    background: #4a4a6a;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    background: inherit;
    border-radius: 50%;
  }
}

.cloud-1 {
  top: 20px;
  right: 80px;
  width: 50px;
  height: 14px;
  animation: cloud-drift 15s linear infinite;

  &::before {
    top: -10px;
    left: 10px;
    width: 20px;
    height: 20px;
  }
  &::after {
    top: -6px;
    left: 26px;
    width: 14px;
    height: 14px;
  }
}

.cloud-2 {
  top: 45px;
  right: 200px;
  width: 36px;
  height: 10px;
  animation: cloud-drift 20s linear infinite;
  animation-delay: -5s;

  &::before {
    top: -8px;
    left: 8px;
    width: 14px;
    height: 14px;
  }
  &::after {
    top: -4px;
    left: 20px;
    width: 10px;
    height: 10px;
  }
}

.cloud-3 {
  top: 30px;
  right: 350px;
  width: 28px;
  height: 8px;
  animation: cloud-drift 18s linear infinite;
  animation-delay: -10s;

  &::before {
    top: -6px;
    left: 6px;
    width: 12px;
    height: 12px;
  }
}

// 恐龙
.dino-wrapper {
  position: absolute;
  bottom: 50px;
  left: 60px;
}

.pixel-dino {
  position: relative;
  width: 60px;
  height: 64px;

  &.sad {
    animation: dino-sad 2s ease-in-out infinite;
  }
}

.dino-body {
  position: absolute;
  width: 50px;
  height: 54px;
  background: #535353;
  border-radius: 6px 6px 0 0;

  :global(.dark) & {
    background: #a0a0a0;
  }

  // 头部
  &::before {
    content: "";
    position: absolute;
    top: -16px;
    right: -12px;
    width: 42px;
    height: 32px;
    background: inherit;
    border-radius: 6px 10px 0 0;
  }

  // 尾巴
  &::after {
    content: "";
    position: absolute;
    bottom: 10px;
    left: -22px;
    width: 26px;
    height: 16px;
    background: inherit;
    border-radius: 6px 0 0 6px;
  }
}

.dino-eye {
  position: absolute;
  top: -8px;
  right: 4px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  z-index: 2;

  :global(.dark) & {
    background: #1a1a2e;
  }

  // 眼珠 - 向下看表示伤心
  &::after {
    content: "";
    position: absolute;
    bottom: 1px;
    right: 2px;
    width: 5px;
    height: 5px;
    background: #000;
    border-radius: 50%;
  }
}

.dino-tear {
  position: absolute;
  top: 4px;
  right: 2px;
  width: 4px;
  height: 8px;
  background: #6eb5ff;
  border-radius: 0 0 50% 50%;
  animation: tear-drop 1.5s ease-in-out infinite;
  z-index: 3;
}

.dino-leg {
  position: absolute;
  bottom: -10px;
  width: 10px;
  height: 20px;
  background: #535353;

  :global(.dark) & {
    background: #a0a0a0;
  }
}

.dino-leg-left {
  left: 10px;
}

.dino-leg-right {
  left: 28px;
}

// 问号气泡
.speech-bubble {
  position: absolute;
  top: -50px;
  right: -30px;
  width: 40px;
  height: 40px;
  background: #fff;
  border: 3px solid #535353;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #535353;
  animation: bubble-bounce 2s ease-in-out infinite;

  :global(.dark) & {
    background: #2a2a4a;
    border-color: #a0a0a0;
    color: #a0a0a0;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 10px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 10px solid #535353;

    :global(.dark) & {
      border-top-color: #a0a0a0;
    }
  }
}

// 像素错误代码
.pixel-code {
  position: absolute;
  top: 60px;
  right: 40px;
  display: flex;
  gap: 8px;
}

.pixel-digit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 72px;
  background: linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 100%);
  color: #fff;
  font-size: 36px;
  font-weight: bold;
  border-radius: 8px;
  box-shadow: 0 4px 0 #c44;
  animation: digit-bounce 0.6s ease-in-out infinite;
  font-family: "Press Start 2P", monospace;

  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.1s;
  }
  &:nth-child(3) {
    animation-delay: 0.2s;
  }
}

// 障碍物
.obstacles {
  position: absolute;
  bottom: 50px;
  right: 60px;
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.error-cactus {
  width: 20px;
  height: 50px;
  background: #535353;
  border-radius: 6px 6px 0 0;
  position: relative;

  :global(.dark) & {
    background: #a0a0a0;
  }

  &::before {
    content: "";
    position: absolute;
    top: 12px;
    left: -12px;
    width: 12px;
    height: 24px;
    background: inherit;
    border-radius: 6px 0 0 0;
  }

  &::after {
    content: "";
    position: absolute;
    top: 18px;
    right: -10px;
    width: 10px;
    height: 18px;
    background: inherit;
    border-radius: 0 6px 0 0;
  }
}

.warning-sign {
  width: 36px;
  height: 36px;
  background: #ffd93d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  transform: rotate(45deg);
  animation: warning-pulse 1s ease-in-out infinite;

  &::before {
    content: "!";
    transform: rotate(-45deg);
  }
}

// 地面
.ground {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  height: 3px;
  background: #535353;

  :global(.dark) & {
    background: #a0a0a0;
  }
}

.ground-line {
  position: absolute;
  top: 6px;
  left: 0;
  width: 200%;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 12px,
    #535353 12px,
    #535353 24px
  );

  :global(.dark) & {
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 12px,
      #a0a0a0 12px,
      #a0a0a0 24px
    );
  }
}

// 错误信息
.error-info {
  text-align: center;
  max-width: 400px;
}

.error-title {
  font-size: 1.5rem;
  color: #535353;
  margin-bottom: 12px;
  letter-spacing: 2px;

  :global(.dark) & {
    color: #e0e0e0;
  }
}

.error-desc {
  font-size: 0.75rem;
  color: #757575;
  margin-bottom: 32px;
  line-height: 1.8;
  font-family: inherit;

  :global(.dark) & {
    color: #a0a0a0;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.pixel-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: inherit;
  font-size: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s;
  box-shadow: 0 4px 0 currentColor;

  &:hover {
    transform: translateY(2px);
    box-shadow: 0 2px 0 currentColor;
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }

  &.primary {
    background: #4ade80;
    color: #166534;
    box-shadow: 0 4px 0 #166534;
  }

  &.secondary {
    background: #fbbf24;
    color: #92400e;
    box-shadow: 0 4px 0 #92400e;
  }

  .btn-icon {
    font-size: 1rem;
  }
}

.hint-text {
  font-size: 0.6rem;
  color: #999;
  animation: blink 1s step-end infinite;

  :global(.dark) & {
    color: #666;
  }
}

// 动画
@keyframes cloud-drift {
  0% {
    transform: translateX(100px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(-500px);
    opacity: 0;
  }
}

@keyframes dino-sad {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes tear-drop {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
    transform: translateY(20px);
  }
}

@keyframes bubble-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.05);
  }
}

@keyframes digit-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes warning-pulse {
  0%,
  100% {
    transform: rotate(45deg) scale(1);
  }
  50% {
    transform: rotate(45deg) scale(1.1);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

// 响应式
@media (max-width: 600px) {
  .game-scene {
    width: 100%;
    height: 220px;
  }

  .pixel-digit {
    width: 40px;
    height: 52px;
    font-size: 24px;
  }

  .dino-wrapper {
    left: 20px;
  }

  .obstacles {
    right: 20px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
