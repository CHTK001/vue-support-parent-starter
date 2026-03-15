<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "ForbiddenStyle",
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
  <div class="forbidden-container">
    <!-- 背景网格 -->
    <div class="grid-bg"></div>

    <!-- 警告条纹 -->
    <div class="warning-stripes top"></div>
    <div class="warning-stripes bottom"></div>

    <!-- 主要内容 -->
    <div class="forbidden-content">
      <!-- 大锁图标 -->
      <div class="lock-wrapper">
        <div class="lock">
          <div class="lock-top">
            <div class="lock-hook"></div>
          </div>
          <div class="lock-body">
            <div class="keyhole"></div>
          </div>
        </div>
        <!-- 禁止标志 -->
        <div class="forbidden-sign">
          <div class="sign-circle">
            <div class="sign-line"></div>
          </div>
        </div>
      </div>

      <!-- 错误代码 -->
      <div class="error-code">
        <span class="code-prefix">ERROR</span>
        <div class="code-number">
          <span
            v-for="(digit, index) in String(code).split('')"
            :key="index"
            class="digit"
          >
            {{ digit }}
          </span>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="error-info">
        <h1 class="error-title">
          <span class="shield-icon">🛡️</span>
          {{ title }}
        </h1>
        <p class="error-desc">{{ description }}</p>

        <!-- 权限提示 -->
        <div class="permission-hint">
          <div class="hint-icon">🔐</div>
          <span>{{ t("error.noPermission") || "您没有访问此页面的权限" }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="forbidden-btn primary" @click="emit('goHome')">
          <span class="btn-icon">🏠</span>
          <span>{{ t("error.goHome") }}</span>
        </button>
        <button class="forbidden-btn secondary" @click="emit('goBack')">
          <span class="btn-icon">↩️</span>
          <span>{{ t("error.goBack") }}</span>
        </button>
      </div>
    </div>

    <!-- 安全盾牌装饰 -->
    <div class="shield-decor shield-1"></div>
    <div class="shield-decor shield-2"></div>
  </div>
</template>

<style lang="scss" scoped>
.forbidden-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 背景网格
.grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

// 警告条纹
.warning-stripes {
  position: absolute;
  left: 0;
  right: 0;
  height: 20px;
  background: repeating-linear-gradient(
    45deg,
    #e74c3c,
    #e74c3c 10px,
    #2c3e50 10px,
    #2c3e50 20px
  );

  &.top {
    top: 0;
  }
  &.bottom {
    bottom: 0;
  }
}

// 主要内容
.forbidden-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 40px 20px;
}

// 锁图标
.lock-wrapper {
  position: relative;
  width: 120px;
  height: 150px;
}

.lock {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.lock-top {
  width: 60px;
  height: 40px;
  margin: 0 auto;
}

.lock-hook {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 8px solid #e74c3c;
  border-bottom: none;
  border-radius: 20px 20px 0 0;
  animation: shake 2s ease-in-out infinite;
}

.lock-body {
  width: 70px;
  height: 50px;
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
  border-radius: 8px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
}

.keyhole {
  width: 12px;
  height: 20px;
  background: #1a1a2e;
  border-radius: 50% 50% 5px 5px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 12px;
    background: #1a1a2e;
  }
}

// 禁止标志
.forbidden-sign {
  position: absolute;
  top: -10px;
  right: -10px;
  animation: pulse 2s ease-in-out infinite;
}

.sign-circle {
  width: 40px;
  height: 40px;
  border: 4px solid #e74c3c;
  border-radius: 50%;
  position: relative;
  background: rgba(231, 76, 60, 0.2);
}

.sign-line {
  position: absolute;
  top: 50%;
  left: -2px;
  right: -2px;
  height: 4px;
  background: #e74c3c;
  transform: rotate(-45deg);
}

// 错误代码
.error-code {
  text-align: center;
}

.code-prefix {
  display: block;
  font-size: 0.9rem;
  color: #e74c3c;
  letter-spacing: 4px;
  margin-bottom: 10px;
  font-weight: 600;
}

.code-number {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.digit {
  font-size: 5rem;
  font-weight: 900;
  color: #fff;
  text-shadow:
    0 0 30px rgba(231, 76, 60, 0.5),
    0 4px 0 #c0392b;
  animation: glitch 3s infinite;

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

  .shield-icon {
    font-size: 1.5rem;
  }
}

.error-desc {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 20px;
  max-width: 400px;
}

.permission-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 25px;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  color: #e74c3c;
  font-size: 0.9rem;

  .hint-icon {
    font-size: 1.2rem;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.forbidden-btn {
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

// 盾牌装饰
.shield-decor {
  position: absolute;
  width: 100px;
  height: 120px;
  opacity: 0.1;
  background: linear-gradient(180deg, #e74c3c 0%, transparent 100%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);

  &.shield-1 {
    top: 10%;
    left: 10%;
    animation: float 6s ease-in-out infinite;
  }
  &.shield-2 {
    bottom: 15%;
    right: 10%;
    animation: float 6s ease-in-out infinite reverse;
  }
}

// 动画
@keyframes shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes glitch {
  0%,
  100% {
    transform: translateX(0);
  }
  98% {
    transform: translateX(0);
  }
  99% {
    transform: translateX(-2px);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
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

  .forbidden-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
