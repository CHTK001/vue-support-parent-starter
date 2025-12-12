<template>
  <div class="christmas-login-page">
    <!-- 圣诞背景 -->
    <div class="festival-background">
      <div class="snow-container">
        <div class="snowflake" v-for="i in 50" :key="i">❅</div>
      </div>
      <div class="lights-container">
        <div class="light" v-for="i in 20" :key="i"></div>
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
              <IconifyIconOnline icon="noto:christmas-tree" class="icon-main" />
            </div>
            <h1 class="festival-title">Merry Christmas</h1>
            <p class="festival-greeting">圣诞快乐 · 新年快乐</p>
            <div class="festival-elements">
              <div class="element-item">🎄</div>
              <div class="element-item">🎅</div>
              <div class="element-item">🎁</div>
              <div class="element-item">⛄</div>
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
  name: "ChristmasLoginTheme",
});
</script>

<style lang="scss" scoped>
.christmas-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #1a472a 0%, #2d5a3d 50%, #3d6a4d 100%);
}

.festival-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .snow-container {
    position: absolute;
    width: 100%;
    height: 100%;

    .snowflake {
      position: absolute;
      top: -10px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 20px;
      animation: snowFall 10s linear infinite;

      @for $i from 1 through 50 {
        &:nth-child(#{$i}) {
          left: random(100) * 1%;
          animation-delay: random(10) * 0.1s;
          font-size: (random(10) + 15) * 1px;
          animation-duration: (random(5) + 8) * 1s;
        }
      }
    }
  }

  .lights-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: space-around;
    align-items: center;

    .light {
      width: 15px;
      height: 25px;
      border-radius: 50% 50% 40% 40%;
      animation: lightBlink 2s ease-in-out infinite;

      @for $i from 1 through 20 {
        &:nth-child(#{$i}) {
          $colors: #ff0000, #00ff00, #0000ff, #ffff00, #ff00ff;
          background: nth($colors, ($i % 5) + 1);
          box-shadow: 0 0 20px nth($colors, ($i % 5) + 1);
          animation-delay: ($i * 0.1s);
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
  border: 3px solid #c41e3a;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(196, 30, 58, 0.3),
    0 0 40px rgba(0, 128, 0, 0.2);
  overflow: hidden;
  min-height: 600px;
  backdrop-filter: blur(10px);
}

.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%);
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
        rgba(255, 255, 255, 0.1) 20px,
        rgba(255, 255, 255, 0.1) 40px
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
        animation: treeShake 3s ease-in-out infinite;
      }
    }

    .festival-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #fff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 255, 255, 0.5);
      letter-spacing: 2px;
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

      .element-item {
        font-size: 60px;
        animation: elementSwing 2s ease-in-out infinite;

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

@keyframes snowFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
  }
}

@keyframes lightBlink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.9);
  }
}

@keyframes treeShake {
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

@keyframes elementSwing {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(10deg);
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
          font-size: 45px;
        }
      }
    }
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>
