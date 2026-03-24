<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "ServerErrorStyle",
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
  <div class="server-error-container">
    <!-- 电路背景 -->
    <div class="circuit-bg"></div>

    <!-- 故障闪烁效果 -->
    <div class="glitch-overlay"></div>

    <!-- 主要内容 -->
    <div class="server-error-content">
      <!-- 服务器图标 -->
      <div class="server-rack">
        <div class="server-unit">
          <div class="server-lights">
            <span class="light red blink"></span>
            <span class="light red blink delay-1"></span>
            <span class="light red blink delay-2"></span>
          </div>
          <div class="server-slots">
            <div class="slot"></div>
            <div class="slot"></div>
            <div class="slot"></div>
          </div>
        </div>
        <div class="server-unit">
          <div class="server-lights">
            <span class="light yellow"></span>
            <span class="light off"></span>
            <span class="light off"></span>
          </div>
          <div class="server-slots">
            <div class="slot"></div>
            <div class="slot"></div>
            <div class="slot"></div>
          </div>
        </div>
        <div class="server-unit crashed">
          <div class="server-lights">
            <span class="light off"></span>
            <span class="light off"></span>
            <span class="light off"></span>
          </div>
          <div class="server-slots">
            <div class="slot"></div>
            <div class="slot"></div>
            <div class="slot"></div>
          </div>
          <div class="smoke">
            <span>💨</span>
            <span>💨</span>
            <span>💨</span>
          </div>
        </div>
        <!-- 警告标志 -->
        <div class="warning-badge">⚠️</div>
      </div>

      <!-- 错误代码 -->
      <div class="error-code">
        <div class="code-glitch" data-text="500">
          <span v-for="(digit, index) in String(code).split('')" :key="index" class="digit">
            {{ digit }}
          </span>
        </div>
        <div class="code-label">INTERNAL SERVER ERROR</div>
      </div>

      <!-- 错误信息 -->
      <div class="error-info">
        <h1 class="error-title">
          <span class="crash-icon">💥</span>
          {{ title }}
        </h1>
        <p class="error-desc">{{ description }}</p>

        <!-- 状态提示 -->
        <div class="status-panel">
          <div class="status-item">
            <span class="status-icon">🔧</span>
            <span>{{ t("error.serverMaintenance") || "服务器正在维护中" }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="server-btn primary" @click="emit('goHome')">
          <span class="btn-icon">🏠</span>
          <span>{{ t("error.goHome") }}</span>
        </button>
        <button class="server-btn secondary" @click="emit('goBack')">
          <span class="btn-icon">🔄</span>
          <span>{{ t("error.retry") || "重试" }}</span>
        </button>
      </div>
    </div>

    <!-- 代码雨效果 -->
    <div class="code-rain">
      <span v-for="i in 20" :key="i" class="rain-drop" :style="{ left: `${i * 5}%`, animationDelay: `${i * 0.1}s` }">
        {{ Math.random() > 0.5 ? '0' : '1' }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.server-error-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 电路背景
.circuit-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v20M30 40v20M0 30h20M40 30h20' stroke='%23333' stroke-width='1' fill='none'/%3E%3Ccircle cx='30' cy='30' r='3' fill='%23444'/%3E%3C/svg%3E");
  background-size: 60px 60px;
  opacity: 0.3;
}

// 故障闪烁
.glitch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.03);
  animation: glitch-flash 3s infinite;
  pointer-events: none;
}

// 主要内容
.server-error-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 40px 20px;
}

// 服务器机架
.server-rack {
  position: relative;
  background: #2d2d2d;
  border: 3px solid #444;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.server-unit {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  background: #1a1a1a;
  border-radius: 4px;
  margin-bottom: 8px;

  &:last-of-type {
    margin-bottom: 0;
  }

  &.crashed {
    position: relative;
    background: #2a1a1a;
    border: 1px solid #e74c3c;
    animation: shake 0.5s infinite;
  }
}

.server-lights {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.light {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #333;

  &.red {
    background: #e74c3c;
    box-shadow: 0 0 10px #e74c3c;
  }
  &.yellow {
    background: #f39c12;
    box-shadow: 0 0 10px #f39c12;
  }
  &.green {
    background: #2ecc71;
    box-shadow: 0 0 10px #2ecc71;
  }
  &.off {
    background: #333;
  }
  &.blink {
    animation: blink-light 0.5s infinite;
  }
  &.delay-1 {
    animation-delay: 0.1s;
  }
  &.delay-2 {
    animation-delay: 0.2s;
  }
}

.server-slots {
  display: flex;
  gap: 5px;
}

.slot {
  width: 40px;
  height: 6px;
  background: #333;
  border-radius: 2px;
}

.smoke {
  position: absolute;
  top: -20px;
  right: 10px;
  display: flex;
  gap: 5px;

  span {
    animation: rise 1s infinite;
    opacity: 0.7;

    &:nth-child(2) {
      animation-delay: 0.3s;
    }
    &:nth-child(3) {
      animation-delay: 0.6s;
    }
  }
}

.warning-badge {
  position: absolute;
  top: -15px;
  right: -15px;
  font-size: 2rem;
  animation: pulse 1s infinite;
}

// 错误代码
.error-code {
  text-align: center;
}

.code-glitch {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 10px;

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    opacity: 0.8;
  }

  &::before {
    color: #ff0000;
    animation: glitch-1 2s infinite;
  }

  &::after {
    color: #00ffff;
    animation: glitch-2 2s infinite;
  }
}

.digit {
  font-size: 5rem;
  font-weight: 900;
  color: #e74c3c;
  text-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
  font-family: "Courier New", monospace;
}

.code-label {
  font-size: 0.9rem;
  color: #e74c3c;
  letter-spacing: 4px;
  margin-top: 10px;
  font-weight: 600;
  font-family: "Courier New", monospace;
}

// 错误信息
.error-info {
  text-align: center;
  color: #fff;
}

.error-title {
  font-size: 1.8rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  .crash-icon {
    animation: shake 0.3s infinite;
  }
}

.error-desc {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 20px;
  max-width: 400px;
}

.status-panel {
  padding: 20px;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;

  .status-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 15px;
    color: #f39c12;

    .status-icon {
      animation: rotate 2s linear infinite;
    }
  }
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin: 0 auto;
}

.progress-fill {
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f39c12);
  border-radius: 3px;
  animation: progress 2s ease-in-out infinite;
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.server-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: "Courier New", monospace;

  &.primary {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: #fff;
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(231, 76, 60, 0.6);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 2px solid rgba(255, 255, 255, 0.3);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }
  }
}

// 代码雨
.code-rain {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.rain-drop {
  position: absolute;
  top: -20px;
  color: rgba(46, 204, 113, 0.3);
  font-family: "Courier New", monospace;
  font-size: 1rem;
  animation: rain-fall 3s linear infinite;
}

// 动画
@keyframes glitch-flash {
  0%,
  95%,
  100% {
    opacity: 0;
  }
  96% {
    opacity: 1;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

@keyframes blink-light {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes rise {
  0% {
    transform: translateY(0);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-20px);
    opacity: 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes glitch-1 {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
  }
  40% {
    transform: translateX(3px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@keyframes glitch-2 {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(3px);
  }
  40% {
    transform: translateX(-3px);
  }
  60% {
    transform: translateX(3px);
  }
  80% {
    transform: translateX(-3px);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 80%;
  }
  100% {
    width: 60%;
  }
}

@keyframes rain-fall {
  0% {
    transform: translateY(-20px);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
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

  .server-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
