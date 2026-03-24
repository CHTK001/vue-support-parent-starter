<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "SpaceStyle",
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
  <div class="space-error-container">
    <!-- 星空背景 -->
    <div class="stars">
      <div class="star" v-for="i in 50" :key="i"></div>
    </div>

    <!-- 流星 -->
    <div class="meteors">
      <div class="meteor meteor-1"></div>
      <div class="meteor meteor-2"></div>
      <div class="meteor meteor-3"></div>
    </div>

    <!-- 主要内容 -->
    <div class="space-content">
      <!-- 宇航员 -->
      <div class="astronaut-wrapper">
        <div class="astronaut">
          <!-- 头盔 -->
          <div class="helmet">
            <div class="helmet-glass">
              <div class="helmet-reflection"></div>
            </div>
            <div class="face">
              <div class="eye eye-left"></div>
              <div class="eye eye-right"></div>
              <div class="mouth"></div>
            </div>
          </div>
          <!-- 身体 -->
          <div class="body">
            <div class="chest-light"></div>
          </div>
          <!-- 背包 -->
          <div class="backpack"></div>
          <!-- 手臂 -->
          <div class="arm arm-left"></div>
          <div class="arm arm-right"></div>
          <!-- 腿 -->
          <div class="leg leg-left"></div>
          <div class="leg leg-right"></div>
        </div>
        <!-- 连接线 -->
        <svg class="tether" viewBox="0 0 200 100">
          <path
            d="M100,10 Q50,50 100,90"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
        </svg>
      </div>

      <!-- 行星 -->
      <div class="planet">
        <div class="planet-ring"></div>
        <div class="planet-surface">
          <div class="crater crater-1"></div>
          <div class="crater crater-2"></div>
          <div class="crater crater-3"></div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="error-content">
        <div class="error-code">
          <span v-for="(digit, index) in String(code).split('')" :key="index" class="digit">
            {{ digit }}
          </span>
        </div>
        <h1 class="error-title">{{ title }}</h1>
        <p class="error-desc">{{ description }}</p>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="space-btn primary" @click="emit('goHome')">
            <span class="btn-icon">🚀</span>
            <span>{{ t("error.goHome") }}</span>
          </button>
          <button class="space-btn secondary" @click="emit('goBack')">
            <span class="btn-icon">🛸</span>
            <span>{{ t("error.goBack") }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 飞船 -->
    <div class="spaceship">
      <div class="ship-body"></div>
      <div class="ship-window"></div>
      <div class="ship-flame"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:math";

.space-error-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 50%, #2d1b4e 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 星星背景
.stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;

  @for $i from 1 through 50 {
    &:nth-child(#{$i}) {
      top: math.random(100) * 1%;
      left: math.random(100) * 1%;
      animation-delay: math.random(30) * 0.1s;
      opacity: math.random(10) * 0.1;
    }
  }
}

// 流星
.meteors {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.meteor {
  position: absolute;
  width: 2px;
  height: 80px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff);
  transform: rotate(-45deg);
  animation: meteor-fall 3s linear infinite;
  opacity: 0;

  &-1 {
    top: 10%;
    left: 20%;
    animation-delay: 0s;
  }
  &-2 {
    top: 5%;
    left: 60%;
    animation-delay: 1.5s;
  }
  &-3 {
    top: 15%;
    left: 80%;
    animation-delay: 3s;
  }
}

// 主要内容
.space-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  z-index: 10;
  padding: 40px 20px;
}

// 宇航员
.astronaut-wrapper {
  position: relative;
  width: 150px;
  height: 200px;
  animation: float 6s ease-in-out infinite;
}

.astronaut {
  position: relative;
  width: 100px;
  height: 150px;
  margin: 0 auto;
}

.helmet {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background: #e8e8e8;
  border-radius: 50%;
  border: 4px solid #c0c0c0;
  overflow: hidden;
}

.helmet-glass {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 12px;
  background: linear-gradient(135deg, #1a3a5c 0%, #0a1a2c 100%);
  border-radius: 50% 50% 45% 45%;
  overflow: hidden;
}

.helmet-reflection {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 15px;
  height: 15px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.face {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 25px;
}

.eye {
  position: absolute;
  top: 0;
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: blink 4s infinite;

  &-left {
    left: 4px;
  }
  &-right {
    right: 4px;
  }
}

.mouth {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 5px;
  border: 2px solid #fff;
  border-top: none;
  border-radius: 0 0 10px 10px;
}

.body {
  position: absolute;
  top: 55px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 55px;
  background: #e8e8e8;
  border-radius: 15px 15px 10px 10px;
  border: 3px solid #c0c0c0;
}

.chest-light {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse-light 2s ease-in-out infinite;
  box-shadow: 0 0 10px #4ade80;
}

.backpack {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%) translateX(-35px);
  width: 20px;
  height: 40px;
  background: #c0c0c0;
  border-radius: 5px;
}

.arm {
  position: absolute;
  top: 60px;
  width: 15px;
  height: 40px;
  background: #e8e8e8;
  border: 2px solid #c0c0c0;
  border-radius: 8px;

  &-left {
    left: 5px;
    transform: rotate(20deg);
    animation: wave-left 3s ease-in-out infinite;
  }
  &-right {
    right: 5px;
    transform: rotate(-20deg);
    animation: wave-right 3s ease-in-out infinite;
  }
}

.leg {
  position: absolute;
  top: 105px;
  width: 18px;
  height: 35px;
  background: #e8e8e8;
  border: 2px solid #c0c0c0;
  border-radius: 8px 8px 10px 10px;

  &-left {
    left: 18px;
    transform: rotate(10deg);
  }
  &-right {
    right: 18px;
    transform: rotate(-10deg);
  }
}

.tether {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 100px;
  animation: tether-sway 4s ease-in-out infinite;
}

// 行星
.planet {
  position: absolute;
  bottom: -100px;
  right: -150px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 50%, #c44536 100%);
  box-shadow: inset -30px -30px 60px rgba(0, 0, 0, 0.4);
  animation: planet-rotate 60s linear infinite;

  @media (max-width: 768px) {
    width: 200px;
    height: 200px;
    bottom: -80px;
    right: -100px;
  }
}

.planet-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotateX(75deg);
  width: 400px;
  height: 400px;
  border: 15px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;

  @media (max-width: 768px) {
    width: 280px;
    height: 280px;
    border-width: 10px;
  }
}

.planet-surface {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.crater {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);

  &-1 {
    top: 30%;
    left: 20%;
    width: 40px;
    height: 40px;
  }
  &-2 {
    top: 50%;
    left: 60%;
    width: 25px;
    height: 25px;
  }
  &-3 {
    top: 70%;
    left: 35%;
    width: 30px;
    height: 30px;
  }
}

// 错误内容
.error-content {
  text-align: center;
  color: #fff;
  z-index: 20;
}

.error-code {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.digit {
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(180deg, #fff 0%, #a0a0ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(160, 160, 255, 0.5);
  animation: glow 2s ease-in-out infinite alternate;

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

.error-title {
  font-size: 1.8rem;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.error-desc {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 30px;
  max-width: 400px;
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.space-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }
  }

  .btn-icon {
    font-size: 1.2rem;
  }
}

// 飞船
.spaceship {
  position: absolute;
  top: 15%;
  right: 10%;
  animation: ship-fly 20s linear infinite;
}

.ship-body {
  width: 40px;
  height: 20px;
  background: linear-gradient(180deg, #c0c0c0 0%, #808080 100%);
  border-radius: 50% 50% 30% 30%;
  position: relative;
}

.ship-window {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 15px;
  height: 10px;
  background: #6eb5ff;
  border-radius: 50%;
  box-shadow: 0 0 10px #6eb5ff;
}

.ship-flame {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 20px solid #ff6b35;
  animation: flame-flicker 0.1s infinite;
}

// 动画
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes meteor-fall {
  0% {
    opacity: 0;
    transform: rotate(-45deg) translateY(-100px);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(-45deg) translateY(1000px);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes wave-left {
  0%,
  100% {
    transform: rotate(20deg);
  }
  50% {
    transform: rotate(40deg);
  }
}

@keyframes wave-right {
  0%,
  100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(-40deg);
  }
}

@keyframes blink {
  0%,
  90%,
  100% {
    opacity: 1;
  }
  95% {
    opacity: 0;
  }
}

@keyframes pulse-light {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 10px #4ade80;
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 20px #4ade80;
  }
}

@keyframes tether-sway {
  0%,
  100% {
    transform: translateX(-50%) rotate(-5deg);
  }
  50% {
    transform: translateX(-50%) rotate(5deg);
  }
}

@keyframes planet-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  0% {
    filter: drop-shadow(0 0 20px rgba(160, 160, 255, 0.5));
  }
  100% {
    filter: drop-shadow(0 0 40px rgba(160, 160, 255, 0.8));
  }
}

@keyframes ship-fly {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-50px, 30px);
  }
  50% {
    transform: translate(-100px, 0);
  }
  75% {
    transform: translate(-50px, -30px);
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes flame-flicker {
  0%,
  100% {
    opacity: 1;
    border-top-color: #ff6b35;
  }
  50% {
    opacity: 0.8;
    border-top-color: #ffd93d;
  }
}

// 响应式
@media (max-width: 600px) {
  .digit {
    font-size: 3rem;
  }

  .error-title {
    font-size: 1.4rem;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    padding: 0 20px;
  }

  .space-btn {
    width: 100%;
    justify-content: center;
  }

  .spaceship {
    display: none;
  }
}
</style>
