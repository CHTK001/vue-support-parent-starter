<template>
  <div class="mc-login-page">
    <!-- 动态背景 -->
    <div class="background-container">
      <div class="dirt-bg"></div>
      <div class="vignette"></div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="mc-content-box">
        <!-- 标题 -->
        <div class="mc-header">
          <div class="mc-title">MINECRAFT LOGIN</div>
          <div class="mc-subtitle">Java Edition</div>
        </div>

        <!-- 表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <slot name="form"></slot>
          </div>
        </div>

        <div class="mc-footer">
          <p>Copyright Mojang AB. Do not distribute!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "McLoginTheme",
});
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.mc-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'VT323', 'Courier New', monospace;
  color: #fff;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: #1a1a1a;

  .dirt-bg {
    width: 100%;
    height: 100%;
    // 简化的泥土纹理模拟
    background-color: #5d4037;
    background-image: 
      repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px),
      repeating-linear-gradient(-45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px);
    opacity: 0.8;
  }
  
  .vignette {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 100%);
  }
}

.login-main-container {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  flex-direction: column;
}

.mc-content-box {
  width: 400px;
  max-width: 90vw;
  text-align: center;
  
  .mc-header {
    margin-bottom: 40px;
    
    .mc-title {
      font-size: 48px;
      color: #dcdcdc;
      text-shadow: 4px 4px 0 #3f3f3f;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .mc-subtitle {
      font-size: 24px;
      color: #f1c40f;
      text-shadow: 2px 2px 0 #3f3f3f;
      animation: bounce 2s infinite;
    }
  }

  .form-section {
    background: rgba(0, 0, 0, 0.5);
    padding: 20px;
    border: 2px solid #a0a0a0;
    border-top-color: #a0a0a0;
    border-left-color: #a0a0a0;
    border-bottom-color: #333;
    border-right-color: #333;
    margin-bottom: 20px;
  }
  
  .mc-footer {
    color: #aaaaaa;
    font-size: 14px;
    text-shadow: 1px 1px 0 #000;
  }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

:deep(.el-input__wrapper) {
  background-color: #000 !important;
  border: 2px solid #a0a0a0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 5px !important;
  
  input {
    color: #fff !important;
    font-family: 'VT323', monospace !important;
    font-size: 18px !important;
    
    &::placeholder {
      color: #aaa !important;
    }
  }
  
  &.is-focus {
    border-color: #fff !important;
  }
}

:deep(.el-button) {
  width: 100%;
  height: 40px;
  background: #7d7d7d url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E") !important;
  border: 2px solid #000 !important;
  border-top-color: #a0a0a0 !important;
  border-left-color: #a0a0a0 !important;
  border-bottom-color: #222 !important;
  border-right-color: #222 !important;
  border-radius: 0 !important;
  color: #fff !important;
  font-family: 'VT323', monospace !important;
  font-size: 20px !important;
  text-shadow: 2px 2px 0 #3f3f3f;
  margin-top: 10px;
  
  &:hover {
    background-color: #8e8e8e !important;
    border-color: #fff !important;
  }
  
  &:active {
    background-color: #555 !important;
    border-top-color: #222 !important;
    border-left-color: #222 !important;
    border-bottom-color: #a0a0a0 !important;
    border-right-color: #a0a0a0 !important;
  }
}

:deep(.el-form-item__label) {
  color: #dcdcdc !important;
  font-family: 'VT323', monospace !important;
  text-shadow: 1px 1px 0 #000;
}
</style>
