<template>
  <div class="national-day-login-page">
    <!-- 国庆背景 -->
    <div class="festival-background">
      <div class="stars-container">
        <div class="star" v-for="i in 5" :key="i">⭐</div>
      </div>
      <div class="flag-container">
        <div class="flag-wave"></div>
      </div>
      <div class="fireworks-container">
        <div class="firework" v-for="i in 6" :key="i"></div>
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
              <IconifyIconOnline icon="twemoji:flag-china" class="icon-main" />
            </div>
            <h1 class="festival-title">国庆快乐</h1>
            <p class="festival-greeting">祝福祖国繁荣昌盛</p>
            <div class="festival-elements">
              <div class="element-item">🇨🇳</div>
              <div class="element-item">🎆</div>
              <div class="element-item">🎉</div>
              <div class="element-item">🏮</div>
            </div>
            <div class="blessing-text">
              <p>庆祝中华人民共和国</p>
              <p>成立76周年</p>
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
  name: "NationalDayLoginTheme",
});
</script>

<style lang="scss" scoped>
.national-day-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #de2910 0%, #ff4444 50%, #de2910 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .stars-container {
    position: absolute;
    top: 10%;
    left: 10%;

    .star {
      position: absolute;
      font-size: 40px;
      color: #ffde00;
      filter: drop-shadow(0 0 10px #ffde00);
      animation: starTwinkle 2s ease-in-out infinite;

      &:nth-child(1) {
        top: 0;
        left: 0;
        font-size: 60px;
      }
      &:nth-child(2) {
        top: -20px;
        left: 80px;
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        top: 20px;
        left: 100px;
        animation-delay: 0.4s;
      }
      &:nth-child(4) {
        top: 60px;
        left: 80px;
        animation-delay: 0.6s;
      }
      &:nth-child(5) {
        top: 80px;
        left: 20px;
        animation-delay: 0.8s;
      }
    }
  }

  .flag-container {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.1;

    .flag-wave {
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 50px,
        rgba(255, 222, 0, 0.3) 50px,
        rgba(255, 222, 0, 0.3) 100px
      );
      animation: waveMove 20s linear infinite;
    }
  }

  .fireworks-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .firework {
      position: absolute;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #ffde00;
      box-shadow: 0 0 20px #ffde00;
      animation: fireworkExplode 2.5s ease-out infinite;

      @for $i from 1 through 6 {
        &:nth-child(#{$i}) {
          top: random(50) + 10%;
          left: random(80) + 10%;
          animation-delay: ($i * 0.5s);
        }
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
  border: 3px solid #ffde00;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(222, 41, 16, 0.3),
    0 0 40px rgba(255, 222, 0, 0.4);
  overflow: hidden;
  min-height: 600px;
  backdrop-filter: blur(10px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #de2910 0%, #ff4444 100%);
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
        0deg,
        transparent,
        transparent 40px,
        rgba(255, 222, 0, 0.1) 40px,
        rgba(255, 222, 0, 0.1) 80px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 40px,
        rgba(255, 222, 0, 0.1) 40px,
        rgba(255, 222, 0, 0.1) 80px
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
        animation: iconWave 3s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 56px;
      font-weight: 900;
      margin-bottom: 15px;
      color: #ffde00;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5),
        0 0 30px rgba(255, 222, 0, 1);
      letter-spacing: 8px;
    }

    .festival-greeting {
      font-size: 24px;
      margin-bottom: 40px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      letter-spacing: 3px;
    }

    .festival-elements {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 40px;

      .element-item {
        font-size: 60px;
        animation: elementFloat 2s ease-in-out infinite;

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

    .blessing-text {
      p {
        font-size: 20px;
        font-weight: 300;
        margin: 8px 0;
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

@keyframes starTwinkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 0.7;
  }
}

@keyframes waveMove {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100px);
  }
}

@keyframes fireworkExplode {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(25);
    opacity: 0;
  }
}

@keyframes iconWave {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes elementFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
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

      .blessing-text p {
        font-size: 16px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>
