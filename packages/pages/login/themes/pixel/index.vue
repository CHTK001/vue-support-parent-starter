<template>
  <div class="pixel-login-page">
    <!-- 动态背景 -->
    <div class="background-container">
      <div class="pixel-stars"></div>
      <div class="pixel-grid"></div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="pixel-content-box">
        <!-- 左侧插图区域 -->
        <div class="illustration-section">
          <div class="illustration-content">
            <div class="pixel-art-container">
              <div class="pixel-character">
                <!-- 简单的像素人CSS实现 -->
                <div class="pixel-head"></div>
                <div class="pixel-body"></div>
              </div>
              <div class="pixel-text">PIXEL LOGIN</div>
            </div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <div class="pixel-form-header">
              <span class="pixel-title">START GAME</span>
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
  name: "PixelLoginTheme",
});
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pixel-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #2c3e50;
  font-family: 'Courier New', Courier, monospace; // Fallback
  // 尝试使用像素字体，实际项目中建议引入本地字体文件
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  z-index: 0;

  .pixel-grid {
    position: absolute;
    width: 200%;
    height: 200%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
    animation: grid-move 20s linear infinite;
  }
}

@keyframes grid-move {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(40px) translateZ(-200px); }
}

.login-main-container {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.pixel-content-box {
  display: flex;
  width: 1000px;
  max-width: 90vw;
  background: #fff;
  border: 4px solid #000;
  box-shadow: 8px 8px 0 #000;
  image-rendering: pixelated;

  .illustration-section {
    flex: 1;
    background: #4a90e2;
    display: flex;
    justify-content: center;
    align-items: center;
    border-right: 4px solid #000;
    position: relative;
    overflow: hidden;
    
    .pixel-art-container {
      text-align: center;
      color: #fff;
      
      .pixel-text {
        font-size: 24px;
        font-weight: bold;
        text-shadow: 4px 4px 0 #000;
        margin-top: 20px;
        letter-spacing: 4px;
      }
      
      .pixel-character {
        width: 100px;
        height: 100px;
        margin: 0 auto;
        position: relative;
        
        .pixel-head {
          width: 60px;
          height: 60px;
          background: #f1c40f;
          border: 4px solid #000;
          position: absolute;
          top: 0;
          left: 20px;
          box-shadow: inset -8px -8px 0 rgba(0,0,0,0.2);
          
          &::before, &::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            background: #000;
            top: 20px;
          }
          &::before { left: 12px; }
          &::after { right: 12px; }
        }
        
        .pixel-body {
          width: 40px;
          height: 30px;
          background: #e74c3c;
          border: 4px solid #000;
          position: absolute;
          bottom: 10px;
          left: 30px;
        }
      }
    }
  }

  .form-section {
    flex: 1;
    background: #f5f6fa;
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: center;

    .form-wrapper {
      width: 100%;
      max-width: 400px;
    }

    .pixel-form-header {
      text-align: center;
      margin-bottom: 30px;
      
      .pixel-title {
        font-size: 32px;
        font-weight: bold;
        color: #2c3e50;
        text-shadow: 2px 2px 0 #bdc3c7;
      }
    }
  }
}

// 适配移动端
@media (max-width: 768px) {
  .pixel-content-box {
    flex-direction: column;
    width: 100%;
    
    .illustration-section {
      display: none;
    }
  }
}

:deep(.el-input__wrapper) {
  border-radius: 0 !important;
  border: 2px solid #000 !important;
  box-shadow: none !important;
  background: #fff !important;
  transition: all 0.2s;
  
  &:hover, &.is-focus {
    box-shadow: 4px 4px 0 rgba(0,0,0,0.2) !important;
    transform: translate(-2px, -2px);
  }
}

:deep(.el-button) {
  border-radius: 0 !important;
  border: 2px solid #000 !important;
  box-shadow: 4px 4px 0 #000 !important;
  transition: all 0.1s !important;
  font-weight: bold;
  
  &:active {
    transform: translate(4px, 4px) !important;
    box-shadow: none !important;
  }
}
</style>
