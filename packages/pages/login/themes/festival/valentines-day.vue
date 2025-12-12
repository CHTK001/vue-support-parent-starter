<template>
  <div class="valentines-day-login-page">
    <!-- 情人节背景 -->
    <div class="festival-background">
      <div class="hearts-container">
        <div class="heart" v-for="i in 20" :key="i">💗</div>
      </div>
      <div class="roses-container">
        <div class="rose" v-for="i in 5" :key="i">🌹</div>
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
              <IconifyIconOnline icon="noto:red-heart" class="icon-main" />
            </div>
            <h1 class="festival-title">情人节快乐</h1>
            <p class="festival-greeting">Happy Valentine's Day</p>
            <div class="festival-elements">
              <div class="element-item">💕</div>
              <div class="element-item">🌹</div>
              <div class="element-item">💝</div>
              <div class="element-item">💖</div>
            </div>
            <div class="love-text">
              <p>Love is in the air</p>
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
  name: "ValentinesDayLoginTheme",
});
</script>

<style lang="scss" scoped>
.valentines-day-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #ff6b9d 0%, #c06c84 50%, #f67280 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .hearts-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .heart {
      position: absolute;
      font-size: 30px;
      animation: heartFloat 8s ease-in-out infinite;

      @for $i from 1 through 20 {
        &:nth-child(#{$i}) {
          left: random(100) * 1%;
          top: random(100) * 1%;
          animation-delay: random(80) * 0.1s;
          animation-duration: (random(40) + 60) * 0.1s;
          font-size: (random(20) + 20) * 1px;
          opacity: random(50) * 0.01 + 0.3;
        }
      }
    }
  }

  .roses-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .rose {
      position: absolute;
      font-size: 50px;
      animation: roseRotate 10s linear infinite;

      &:nth-child(1) {
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }
      &:nth-child(2) {
        top: 20%;
        right: 15%;
        animation-delay: 2s;
      }
      &:nth-child(3) {
        bottom: 20%;
        left: 15%;
        animation-delay: 4s;
      }
      &:nth-child(4) {
        bottom: 15%;
        right: 10%;
        animation-delay: 6s;
      }
      &:nth-child(5) {
        top: 50%;
        left: 5%;
        animation-delay: 8s;
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
  border: 3px solid #ff6b9d;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(255, 107, 157, 0.3),
    0 0 40px rgba(192, 108, 132, 0.3);
  overflow: hidden;
  min-height: 600px;
  backdrop-filter: blur(10px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%);
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
    background-image: repeating-radial-gradient(
      circle at 20% 30%,
      transparent 0,
      rgba(255, 255, 255, 0.1) 20px,
      transparent 40px
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
        animation: heartBeat 1.5s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #fff;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(255, 255, 255, 0.5);
      letter-spacing: 3px;
    }

    .festival-greeting {
      font-size: 22px;
      margin-bottom: 40px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
      letter-spacing: 2px;
      font-style: italic;
    }

    .festival-elements {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 40px;

      .element-item {
        font-size: 55px;
        animation: elementPulse 2s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }
        &:nth-child(2) {
          animation-delay: 0.3s;
        }
        &:nth-child(3) {
          animation-delay: 0.6s;
        }
        &:nth-child(4) {
          animation-delay: 0.9s;
        }
      }
    }

    .love-text {
      p {
        font-size: 26px;
        font-weight: 300;
        font-style: italic;
        letter-spacing: 2px;
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

@keyframes heartFloat {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes roseRotate {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes heartBeat {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.15);
  }
}

@keyframes elementPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
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
        font-size: 36px;
      }

      .festival-greeting {
        font-size: 16px;
      }

      .festival-elements {
        gap: 20px;

        .element-item {
          font-size: 40px;
        }
      }

      .love-text p {
        font-size: 20px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>
