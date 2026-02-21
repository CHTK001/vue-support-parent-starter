<template>
  <div class="halloween-login-page">
    <!-- 动态背景 -->
    <div class="background-container">
      <div class="moon"></div>
      <div class="bats">
        <div class="bat"></div>
        <div class="bat"></div>
        <div class="bat"></div>
      </div>
      <div class="trees"></div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="halloween-content-box">
        <!-- 左侧插图区域 -->
        <div class="illustration-section">
          <div class="illustration-content">
            <div class="pumpkin-container">
              <div class="pumpkin">
                <div class="eyes">
                  <div class="eye left"></div>
                  <div class="eye right"></div>
                </div>
                <div class="mouth"></div>
              </div>
              <div class="halloween-text">HAPPY HALLOWEEN</div>
            </div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <div class="spider-web"></div>
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "HalloweenLoginTheme",
});
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');

.halloween-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #1a0526;
  font-family: 'Creepster', cursive, sans-serif;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(to bottom, #0f0216 0%, #2d0e38 100%);
  
  .moon {
    position: absolute;
    top: 50px;
    right: 100px;
    width: 100px;
    height: 100px;
    background: #ffecb3;
    border-radius: 50%;
    box-shadow: 0 0 40px #ffecb3;
  }
  
  .bats {
    .bat {
      position: absolute;
      width: 40px;
      height: 20px;
      background: #000;
      border-radius: 50% 50% 0 0;
      animation: fly 10s infinite linear;
      
      &::before, &::after {
        content: '';
        position: absolute;
        top: 0;
        width: 20px;
        height: 20px;
        background: #000;
        border-radius: 50%;
      }
      &::before { left: -10px; }
      &::after { right: -10px; }
      
      &:nth-child(1) { top: 20%; left: -10%; animation-duration: 15s; }
      &:nth-child(2) { top: 40%; left: -10%; animation-duration: 12s; animation-delay: 2s; }
      &:nth-child(3) { top: 15%; left: -10%; animation-duration: 18s; animation-delay: 5s; }
    }
  }
}

@keyframes fly {
  0% { transform: translateX(0) translateY(0) scale(0.5); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(110vw) translateY(-50px) scale(0.8); opacity: 0; }
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

.halloween-content-box {
  display: flex;
  width: 900px;
  max-width: 90vw;
  background: rgba(45, 14, 56, 0.8);
  border: 2px solid #ff6b00;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(255, 107, 0, 0.3);
  backdrop-filter: blur(10px);

  .illustration-section {
    flex: 1;
    background: linear-gradient(135deg, #ff6b00 0%, #ff9e00 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    
    .pumpkin-container {
      text-align: center;
      
      .pumpkin {
        width: 150px;
        height: 120px;
        background: #d35400;
        border-radius: 45% 45% 40% 40%;
        position: relative;
        margin: 0 auto;
        box-shadow: inset -10px -10px 20px rgba(0,0,0,0.3);
        
        // Stem
        &::before {
          content: '';
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 25px;
          background: #2e7d32;
          border-radius: 5px;
        }
        
        .eyes {
          display: flex;
          justify-content: space-between;
          padding: 30px 25px 0;
          
          .eye {
            width: 30px;
            height: 30px;
            background: #fff; // Yellow light
            clip-path: polygon(0 100%, 50% 0, 100% 100%);
            background: #ffe082;
            box-shadow: 0 0 10px #ffe082;
          }
        }
        
        .mouth {
          width: 80px;
          height: 30px;
          background: #ffe082;
          margin: 10px auto 0;
          clip-path: polygon(0 0, 20% 100%, 40% 0, 60% 100%, 80% 0, 100% 100%, 0 100%);
          box-shadow: 0 0 10px #ffe082;
        }
      }
      
      .halloween-text {
        font-family: 'Creepster', cursive;
        font-size: 32px;
        color: #2d0e38;
        margin-top: 20px;
        text-shadow: 2px 2px 0 #ffecb3;
      }
    }
  }

  .form-section {
    flex: 1;
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    
    .spider-web {
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle at 100% 0%, transparent 60%, rgba(255,255,255,0.2) 61%, transparent 62%),
                  conic-gradient(from 270deg at 100% 0%, rgba(255,255,255,0.2) 0deg, transparent 5deg, transparent 40deg, rgba(255,255,255,0.2) 45deg, transparent 50deg);
    }

    .form-wrapper {
      width: 100%;
      max-width: 400px;
    }
  }
}

// 适配移动端
@media (max-width: 768px) {
  .halloween-content-box {
    flex-direction: column;
    width: 100%;
    
    .illustration-section {
      display: none;
    }
  }
}

:deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid #ff6b00 !important;
  box-shadow: none !important;
  
  input {
    color: #ffecb3 !important;
    &::placeholder {
      color: rgba(255, 236, 179, 0.5) !important;
    }
  }
  
  &.is-focus {
    box-shadow: 0 0 10px rgba(255, 107, 0, 0.5) !important;
  }
}

:deep(.el-button) {
  background: #ff6b00 !important;
  border: none !important;
  color: #2d0e38 !important;
  font-family: 'Creepster', cursive !important;
  font-size: 20px !important;
  letter-spacing: 2px;
  
  &:hover {
    background: #ff9e00 !important;
    transform: scale(1.05);
  }
}
</style>
