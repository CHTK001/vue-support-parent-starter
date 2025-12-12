<template>
  <div class="new-year-login-page">
    <!-- 元旦背景 -->
    <div class="festival-background">
      <div class="fireworks-container">
        <div class="firework" v-for="i in 8" :key="i"></div>
      </div>
      <div class="confetti-container">
        <div class="confetti" v-for="i in 50" :key="i"></div>
      </div>
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
              <IconifyIconOnline icon="noto:party-popper" class="icon-main" />
            </div>
            <h1 class="festival-title">新年快乐</h1>
            <p class="festival-greeting">Happy New Year 2026</p>
            <div class="festival-elements">
              <div class="element-item">🎉</div>
              <div class="element-item">🎊</div>
              <div class="element-item">🥂</div>
              <div class="element-item">🎆</div>
            </div>
            <div class="countdown-text">
              <p>新的一年</p>
              <p>新的开始</p>
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
.new-year-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .fireworks-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .firework {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      animation: fireworkBurst 3s ease-out infinite;

      @for $i from 1 through 8 {
        &:nth-child(#{$i}) {
          top: random(60) + 10%;
          left: random(80) + 10%;
          animation-delay: ($i * 0.5s);
          background: hsl(random(360), 100%, 60%);
          box-shadow: 0 0 30px currentColor;
        }
      }
    }
  }

  .confetti-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      top: -10px;
      animation: confettiFall 5s linear infinite;

      @for $i from 1 through 50 {
        &:nth-child(#{$i}) {
          left: random(100) * 1%;
          animation-delay: random(50) * 0.1s;
          animation-duration: (random(30) + 30) * 0.1s;
          $colors: #ff6b6b, #4ecdc4, #45b7d1, #f7b731, #5f27cd, #00d2d3;
          background: nth($colors, ($i % 6) + 1);
          transform: rotate(random(360) * 1deg);
        }
      }
    }
  }

  .numbers-container {
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    opacity: 0.15;

    .number {
      font-size: 150px;
      font-weight: 900;
      color: white;
      text-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
      animation: numberFloat 4s ease-in-out infinite;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
      &:nth-child(4) {
        animation-delay: 0.6s;
      }
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
  max-width: 1200px;
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3),
    0 0 40px rgba(118, 75, 162, 0.3);
  overflow: hidden;
  min-height: 600px;
  backdrop-filter: blur(10px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 30px,
        rgba(255, 255, 255, 0.05) 30px,
        rgba(255, 255, 255, 0.05) 60px
      );
  }

  .decoration-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;

    .festival-icon {
      margin-bottom: 30px;

      .icon-main {
        font-size: 120px;
        filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.6));
        animation: iconSpin 3s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 56px;
      font-weight: 900;
      margin-bottom: 15px;
      color: #fff;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(255, 255, 255, 0.5);
      letter-spacing: 4px;
      animation: titlePulse 2s ease-in-out infinite;
    }

    .festival-greeting {
      font-size: 24px;
      margin-bottom: 40px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
      letter-spacing: 2px;
      font-weight: 300;
    }

    .festival-elements {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 40px;

      .element-item {
        font-size: 60px;
        animation: elementBounce 1.5s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
        &:nth-child(4) {
          animation-delay: 0.6s;
        }
      }
    }

    .countdown-text {
      p {
        font-size: 28px;
        font-weight: 300;
        margin: 10px 0;
        letter-spacing: 3px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
  }
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #fff;
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
}

@keyframes fireworkBurst {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(30);
    opacity: 0;
  }
}

@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
  }
}

@keyframes numberFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
}

@keyframes iconSpin {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(10deg) scale(1.1);
  }
}

@keyframes titlePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes elementBounce {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(15deg);
  }
}

@media (max-width: 768px) {
  .festival-content-box {
    flex-direction: column;
    min-height: auto;
  }

  .decoration-section {
    padding: 40px 20px;

    .decoration-content {
      .festival-icon .icon-main {
        font-size: 80px;
      }

      .festival-title {
        font-size: 40px;
      }

      .festival-greeting {
        font-size: 18px;
      }

      .festival-elements {
        gap: 20px;

        .element-item {
          font-size: 45px;
        }
      }

      .countdown-text p {
        font-size: 20px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }

  .numbers-container {
    .number {
      font-size: 80px;
    }
  }
}
</style>
