<template>
  <div class="spring-festival-login-page">
    <!-- 春节背景 -->
    <div class="festival-background">
      <div class="lanterns-container">
        <div class="lantern lantern-left" v-for="i in 3" :key="`left-${i}`">
          <div class="lantern-body"></div>
          <div class="lantern-tassel"></div>
        </div>
        <div class="lantern lantern-right" v-for="i in 3" :key="`right-${i}`">
          <div class="lantern-body"></div>
          <div class="lantern-tassel"></div>
        </div>
      </div>
      <div class="fireworks-container">
        <div class="firework" v-for="i in 5" :key="i"></div>
      </div>
      <div class="snow-container">
        <div class="snowflake" v-for="i in 30" :key="i">❅</div>
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
              <IconifyIconOnline icon="noto:firecracker" class="icon-main" />
            </div>
            <h1 class="festival-title">新春快乐</h1>
            <p class="festival-greeting">恭贺新禧 · 万事如意</p>
            <div class="festival-elements">
              <div class="element-item">🧧</div>
              <div class="element-item">🏮</div>
              <div class="element-item">🎆</div>
              <div class="element-item">🐉</div>
            </div>
            <div class="blessing-text">
              <p>福</p>
            </div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <div class="form-decoration">
              <div class="cloud cloud-left"></div>
              <div class="cloud cloud-right"></div>
            </div>
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "SpringFestivalLoginTheme",
});
</script>

<style lang="scss" scoped>
.spring-festival-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 50%, #ffa07a 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;

  .lanterns-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .lantern {
      position: absolute;
      top: -50px;
      width: 40px;
      animation: lanternSwing 3s ease-in-out infinite;

      &.lantern-left {
        left: 10%;

        &:nth-child(1) {
          top: 50px;
          animation-delay: 0s;
        }
        &:nth-child(2) {
          top: 150px;
          left: 5%;
          animation-delay: 0.5s;
        }
        &:nth-child(3) {
          top: 250px;
          left: 15%;
          animation-delay: 1s;
        }
      }

      &.lantern-right {
        right: 10%;

        &:nth-child(1) {
          top: 80px;
          animation-delay: 0.3s;
        }
        &:nth-child(2) {
          top: 180px;
          right: 5%;
          animation-delay: 0.8s;
        }
        &:nth-child(3) {
          top: 280px;
          right: 15%;
          animation-delay: 1.3s;
        }
      }

      .lantern-body {
        width: 40px;
        height: 60px;
        background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        box-shadow: 0 0 20px rgba(255, 71, 87, 0.6),
          inset 0 -10px 20px rgba(0, 0, 0, 0.2);
        position: relative;

        &::before {
          content: "春";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffd700;
          font-size: 20px;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }

        &::after {
          content: "";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          background: #8b0000;
          border-radius: 50% 50% 0 0;
        }
      }

      .lantern-tassel {
        width: 4px;
        height: 30px;
        background: linear-gradient(to bottom, #ffd700 0%, #ff6348 100%);
        margin: 0 auto;
        position: relative;

        &::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #ffd700;
        }
      }
    }
  }

  .fireworks-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .firework {
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.8);
      animation: fireworkExplode 2s ease-out infinite;

      &:nth-child(1) {
        top: 20%;
        left: 20%;
        animation-delay: 0s;
      }
      &:nth-child(2) {
        top: 30%;
        right: 25%;
        animation-delay: 0.5s;
      }
      &:nth-child(3) {
        top: 50%;
        left: 30%;
        animation-delay: 1s;
      }
      &:nth-child(4) {
        top: 40%;
        right: 15%;
        animation-delay: 1.5s;
      }
      &:nth-child(5) {
        top: 60%;
        left: 50%;
        animation-delay: 2s;
      }
    }
  }

  .snow-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .snowflake {
      position: absolute;
      top: -10px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 20px;
      animation: snowFall 10s linear infinite;

      @for $i from 1 through 30 {
        &:nth-child(#{$i}) {
          left: random(100) * 1%;
          animation-delay: random(10) * 0.1s;
          font-size: (random(10) + 15) * 1px;
          animation-duration: (random(5) + 8) * 1s;
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
  border: 3px solid #ffd700;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(255, 71, 87, 0.3),
    0 0 40px rgba(255, 215, 0, 0.4);
  overflow: hidden;
  min-height: 600px;
  backdrop-filter: blur(10px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
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
        transparent 20px,
        rgba(255, 215, 0, 0.1) 20px,
        rgba(255, 215, 0, 0.1) 40px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 20px,
        rgba(255, 215, 0, 0.1) 20px,
        rgba(255, 215, 0, 0.1) 40px
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
        font-size: 100px;
        filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
        animation: iconBounce 2s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #ffd700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 215, 0, 0.8);
      letter-spacing: 4px;
    }

    .festival-greeting {
      font-size: 20px;
      margin-bottom: 40px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
      letter-spacing: 2px;
    }

    .festival-elements {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 40px;

      .element-item {
        font-size: 50px;
        animation: elementFloat 3s ease-in-out infinite;

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
        font-size: 120px;
        font-weight: 900;
        color: #ffd700;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3),
          0 0 30px rgba(255, 215, 0, 1);
        margin: 0;
        animation: blessingPulse 2s ease-in-out infinite;
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
  position: relative;
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
  position: relative;

  .form-decoration {
    .cloud {
      position: absolute;
      width: 80px;
      height: 30px;
      background: #ffd700;
      border-radius: 50px;
      opacity: 0.3;

      &::before,
      &::after {
        content: "";
        position: absolute;
        background: #ffd700;
        border-radius: 50%;
      }

      &::before {
        width: 40px;
        height: 40px;
        top: -15px;
        left: 10px;
      }

      &::after {
        width: 50px;
        height: 50px;
        top: -20px;
        right: 10px;
      }

      &.cloud-left {
        top: -40px;
        left: -20px;
        animation: cloudFloat 8s ease-in-out infinite;
      }

      &.cloud-right {
        bottom: -40px;
        right: -20px;
        animation: cloudFloat 8s ease-in-out infinite reverse;
      }
    }
  }
}

@keyframes lanternSwing {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
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
    transform: scale(20);
    opacity: 0;
  }
}

@keyframes snowFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
  }
}

@keyframes iconBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.1);
  }
}

@keyframes elementFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(10deg);
  }
}

@keyframes blessingPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes cloudFloat {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(20px);
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
        font-size: 70px;
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

      .blessing-text p {
        font-size: 80px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>
