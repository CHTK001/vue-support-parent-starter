<template>
  <div class="mid-autumn-login-page">
    <!-- 中秋背景 -->
    <div class="festival-background">
      <div class="moon-container">
        <div class="moon">
          <div class="moon-crater" v-for="i in 5" :key="i"></div>
        </div>
        <div class="moon-glow"></div>
      </div>
      <div class="stars-container">
        <div class="star" v-for="i in 50" :key="i">✦</div>
      </div>
      <div class="clouds-container">
        <div class="cloud" v-for="i in 3" :key="i"></div>
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
              <IconifyIconOnline icon="noto:full-moon" class="icon-main" />
            </div>
            <h1 class="festival-title">中秋佳节</h1>
            <p class="festival-greeting">月圆人团圆 · 阖家欢乐</p>
            <div class="festival-elements">
              <div class="element-item">🥮</div>
              <div class="element-item">🌕</div>
              <div class="element-item">🏮</div>
              <div class="element-item">🐰</div>
            </div>
            <div class="poem-text">
              <p>但愿人长久</p>
              <p>千里共婵娟</p>
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
  name: "MidAutumnLoginTheme",
});
</script>

<style lang="scss" scoped>
.mid-autumn-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #0a1128 0%, #1a2a4a 50%, #2a3a5a 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .moon-container {
    position: absolute;
    top: 10%;
    right: 15%;
    width: 200px;
    height: 200px;

    .moon {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, #fff9e6 0%, #ffe4b3 100%);
      border-radius: 50%;
      box-shadow: 0 0 60px rgba(255, 249, 230, 0.8),
        inset -20px -20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
      animation: moonFloat 6s ease-in-out infinite;

      .moon-crater {
        position: absolute;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;

        &:nth-child(1) {
          width: 30px;
          height: 30px;
          top: 20%;
          left: 30%;
        }
        &:nth-child(2) {
          width: 20px;
          height: 20px;
          top: 40%;
          right: 25%;
        }
        &:nth-child(3) {
          width: 25px;
          height: 25px;
          bottom: 30%;
          left: 20%;
        }
        &:nth-child(4) {
          width: 15px;
          height: 15px;
          top: 60%;
          right: 30%;
        }
        &:nth-child(5) {
          width: 18px;
          height: 18px;
          bottom: 20%;
          right: 20%;
        }
      }
    }

    .moon-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 250px;
      height: 250px;
      background: radial-gradient(
        circle,
        rgba(255, 249, 230, 0.3) 0%,
        transparent 70%
      );
      animation: moonGlow 4s ease-in-out infinite;
    }
  }

  .stars-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .star {
      position: absolute;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      animation: starTwinkle 3s ease-in-out infinite;

      @for $i from 1 through 50 {
        &:nth-child(#{$i}) {
          top: random(100) * 1%;
          left: random(100) * 1%;
          animation-delay: random(30) * 0.1s;
          font-size: (random(8) + 8) * 1px;
        }
      }
    }
  }

  .clouds-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .cloud {
      position: absolute;
      width: 100px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50px;
      animation: cloudDrift 20s linear infinite;

      &::before,
      &::after {
        content: "";
        position: absolute;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
      }

      &::before {
        width: 50px;
        height: 50px;
        top: -20px;
        left: 15px;
      }

      &::after {
        width: 60px;
        height: 60px;
        top: -25px;
        right: 15px;
      }

      &:nth-child(1) {
        top: 20%;
        left: -100px;
        animation-duration: 25s;
      }

      &:nth-child(2) {
        top: 50%;
        left: -100px;
        animation-duration: 30s;
        animation-delay: 5s;
      }

      &:nth-child(3) {
        top: 70%;
        left: -100px;
        animation-duration: 35s;
        animation-delay: 10s;
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
  border: 2px solid #ffe4b3;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(255, 249, 230, 0.3),
    0 0 40px rgba(255, 228, 179, 0.4);
  overflow: hidden;
  min-height: 600px;
  backdrop-filter: blur(10px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #1a2a4a 0%, #2a3a5a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;

  .decoration-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;

    .festival-icon {
      margin-bottom: 30px;

      .icon-main {
        font-size: 100px;
        filter: drop-shadow(0 0 20px rgba(255, 249, 230, 0.8));
        animation: iconFloat 3s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #ffe4b3;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 228, 179, 0.8);
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
        animation: elementBounce 2s ease-in-out infinite;

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

    .poem-text {
      p {
        font-size: 24px;
        font-weight: 300;
        color: #ffe4b3;
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

@keyframes moonFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes moonGlow {
  0%,
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes starTwinkle {
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

@keyframes cloudDrift {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(100vw + 200px));
  }
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes elementBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
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

      .poem-text p {
        font-size: 18px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>
