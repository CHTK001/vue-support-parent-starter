<template>
  <div class="new-year-login-page">
    <!-- 冰雪背景 -->
    <div class="festival-background">
      <!-- 雪花容器 -->
      <div class="snowflakes-container">
        <div class="snowflake" v-for="i in 40" :key="i"></div>
      </div>
      <!-- 冰晶光晕 -->
      <div class="ice-glow glow-1"></div>
      <div class="ice-glow glow-2"></div>
      <div class="ice-glow glow-3"></div>
      <!-- 年份数字 -->
      <div class="numbers-container">
        <div class="number">2</div>
        <div class="number">0</div>
        <div class="number">2</div>
        <div class="number">6</div>
      </div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="festival-content-box">
        <!-- 左侧装饰区域 -->
        <div class="decoration-section">
          <div class="decoration-content">
            <div class="festival-icon">
              <span class="icon-snowflake">❄</span>
            </div>
            <h1 class="festival-title">新年快乐</h1>
            <p class="festival-greeting">Happy New Year 2026</p>
            <div class="festival-elements">
              <div class="element-item">❄️</div>
              <div class="element-item">✨</div>
              <div class="element-item">💎</div>
              <div class="element-item">⭐</div>
            </div>
            <div class="countdown-text">
              <p>新的一年</p>
              <p>新的希望</p>
            </div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "NewYearLoginTheme",
});
</script>

<style lang="scss" scoped>
@use "sass:math";
@use "sass:list";

// 冰雪色板
$ice-lightest: #F5FBFF;
$ice-lighter: #E8F4FC;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-purple: #E0E7F5;

.new-year-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, $ice-lightest 0%, $ice-lighter 30%, $ice-light 60%, $ice-medium 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;

  // 雪花容器
  .snowflakes-container {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;

    .snowflake {
      position: absolute;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      top: -20px;
      animation: snowfall linear infinite;
      text-shadow: 0 0 8px rgba($ice-primary, 0.5);

      &::before {
        content: '❄';
      }

      @for $i from 1 through 40 {
        &:nth-child(#{$i}) {
          left: math.random(100) * 1%;
          font-size: (math.random(12) + 8) * 1px;
          opacity: math.random(50) / 100 + 0.5;
          animation-duration: (math.random(15) + 10) * 1s;
          animation-delay: math.random(100) * 0.1s;
        }
      }
    }
  }

  // 冰晶光晕效果
  .ice-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: glowPulse 6s ease-in-out infinite;

    &.glow-1 {
      width: 400px;
      height: 400px;
      top: 10%;
      left: 10%;
      background: radial-gradient(circle, rgba($ice-primary, 0.4), transparent);
      animation-delay: 0s;
    }

    &.glow-2 {
      width: 500px;
      height: 500px;
      bottom: 10%;
      right: 5%;
      background: radial-gradient(circle, rgba($ice-medium, 0.35), transparent);
      animation-delay: 2s;
    }

    &.glow-3 {
      width: 300px;
      height: 300px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba($frost-purple, 0.3), transparent);
      animation-delay: 4s;
    }
  }

  .numbers-container {
    position: absolute;
    top: 12%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 24px;
    opacity: 0.1;

    .number {
      font-size: 140px;
      font-weight: 900;
      color: $ice-deep;
      text-shadow: 0 0 60px rgba($ice-primary, 0.4);
      animation: numberFloat 5s ease-in-out infinite;

      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.3s; }
      &:nth-child(3) { animation-delay: 0.6s; }
      &:nth-child(4) { animation-delay: 0.9s; }
    }
  }
}

.login-main-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.festival-content-box {
  width: 100%;
  max-width: 1100px;
  display: flex;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba($ice-medium, 0.25);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba($ice-deep, 0.15),
    0 0 40px rgba($ice-primary, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  min-height: 580px;
  backdrop-filter: blur(20px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, $ice-primary 0%, $ice-medium 50%, $ice-light 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  position: relative;
  overflow: hidden;

  // 冰晶纹理背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 35%);
  }

  // 雪花装饰
  &::after {
    content: '❄';
    position: absolute;
    bottom: 30px;
    right: 30px;
    font-size: 80px;
    opacity: 0.15;
    color: #fff;
    animation: snowflakeRotate 20s linear infinite;
  }

  .decoration-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;

    .festival-icon {
      margin-bottom: 24px;

      .icon-snowflake {
        font-size: 100px;
        display: inline-block;
        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
        animation: snowflakeFloat 4s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #fff;
      text-shadow: 
        0 2px 4px rgba($ice-darker, 0.3),
        0 0 40px rgba(255, 255, 255, 0.5);
      letter-spacing: 6px;
    }

    .festival-greeting {
      font-size: 20px;
      margin-bottom: 36px;
      text-shadow: 0 1px 2px rgba($ice-darker, 0.2);
      letter-spacing: 3px;
      font-weight: 300;
      opacity: 0.9;
    }

    .festival-elements {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 36px;

      .element-item {
        font-size: 44px;
        animation: elementFloat 3s ease-in-out infinite;
        filter: drop-shadow(0 2px 8px rgba($ice-darker, 0.2));

        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.3s; }
        &:nth-child(3) { animation-delay: 0.6s; }
        &:nth-child(4) { animation-delay: 0.9s; }
      }
    }

    .countdown-text {
      p {
        font-size: 22px;
        font-weight: 300;
        margin: 8px 0;
        letter-spacing: 4px;
        text-shadow: 0 1px 2px rgba($ice-darker, 0.2);
        opacity: 0.95;
      }
    }
  }
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  background: rgba(255, 255, 255, 0.98);
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

// 动画定义
@keyframes snowfall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@keyframes numberFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes snowflakeFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-8px) rotate(10deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  75% {
    transform: translateY(-5px) rotate(-10deg);
  }
}

@keyframes snowflakeRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes elementFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

// 响应式
@media (max-width: 768px) {
  .festival-content-box {
    flex-direction: column;
    min-height: auto;
    max-width: 500px;
  }

  .decoration-section {
    padding: 40px 24px;

    .decoration-content {
      .festival-icon .icon-snowflake {
        font-size: 70px;
      }

      .festival-title {
        font-size: 36px;
        letter-spacing: 4px;
      }

      .festival-greeting {
        font-size: 16px;
        margin-bottom: 28px;
      }

      .festival-elements {
        gap: 18px;

        .element-item {
          font-size: 36px;
        }
      }

      .countdown-text p {
        font-size: 18px;
      }
    }
  }

  .form-section {
    padding: 40px 24px;
  }

  .numbers-container {
    .number {
      font-size: 70px;
    }
  }
}
</style>
