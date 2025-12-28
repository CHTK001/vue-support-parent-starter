<script setup lang="ts">
/**
 * 新春灯笼主题设置面板 - 深度定制版
 * 特色：对联风格、红木框架、灯笼装饰
 */
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="lunar-setting-wrapper">
    <!-- 对联装饰 - 左联 -->
    <div class="couplet left">
      <span>福</span>
      <span>如</span>
      <span>东</span>
      <span>海</span>
    </div>
    
    <!-- 对联装饰 - 右联 -->
    <div class="couplet right">
      <span>寿</span>
      <span>比</span>
      <span>南</span>
      <span>山</span>
    </div>
    
    <!-- 顶部灯笼装饰 -->
    <div class="top-lanterns">
      <div class="lantern"></div>
      <div class="lantern"></div>
    </div>
    
    <!-- 红木边框 -->
    <div class="wood-border top"></div>
    <div class="wood-border bottom"></div>
    <div class="wood-border left"></div>
    <div class="wood-border right"></div>
    
    <!-- 角装饰 -->
    <div class="corner-decor top-left"></div>
    <div class="corner-decor top-right"></div>
    <div class="corner-decor bottom-left"></div>
    <div class="corner-decor bottom-right"></div>
    
    <BaseSetting theme-class="lunar-setting" />
  </div>
</template>

<style lang="scss" scoped>
.lunar-setting-wrapper {
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, 
    #FFF8DC 0%,
    #FFFACD 30%,
    #FFF8E7 70%,
    #FFF8DC 100%
  );
  
  // 对联
  .couplet {
    position: absolute;
    top: 80px;
    width: 32px;
    background: linear-gradient(180deg, #DC143C 0%, #B22222 100%);
    border: 2px solid #FFD700;
    border-radius: 4px;
    padding: 12px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
    z-index: 10;
    
    span {
      font-size: 18px;
      font-weight: bold;
      color: #FFD700;
      font-family: 'STKaiti', 'KaiTi', serif;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      writing-mode: vertical-rl;
    }
    
    &.left { left: 8px; }
    &.right { right: 8px; }
  }
  
  // 顶部灯笼
  .top-lanterns {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 60px;
    z-index: 10;
    
    .lantern {
      width: 28px;
      height: 32px;
      background: linear-gradient(180deg, #FF4500, #DC143C, #8B0000);
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(255, 69, 0, 0.6);
      position: relative;
      animation: lantern-swing 3s ease-in-out infinite;
      
      &::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 6px;
        background: linear-gradient(180deg, #FFD700, #DAA520);
        border-radius: 3px 3px 0 0;
      }
      
      &::after {
        content: '福';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 14px;
        font-weight: bold;
        color: #FFD700;
        font-family: 'STKaiti', 'KaiTi', serif;
      }
      
      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.5s; }
    }
  }
  
  // 红木边框
  .wood-border {
    position: absolute;
    background: linear-gradient(90deg, 
      #5C3317 0%,
      #8B4513 30%,
      #CD853F 50%,
      #8B4513 70%,
      #5C3317 100%
    );
    z-index: 5;
    
    &.top, &.bottom {
      left: 0;
      right: 0;
      height: 8px;
    }
    &.top { top: 0; }
    &.bottom { bottom: 0; }
    
    &.left, &.right {
      top: 8px;
      bottom: 8px;
      width: 8px;
      background: linear-gradient(180deg, 
        #5C3317 0%,
        #8B4513 30%,
        #CD853F 50%,
        #8B4513 70%,
        #5C3317 100%
      );
    }
    &.left { left: 0; }
    &.right { right: 0; }
  }
  
  // 角装饰
  .corner-decor {
    position: absolute;
    width: 20px;
    height: 20px;
    background: #FFD700;
    z-index: 6;
    
    &.top-left {
      top: 0;
      left: 0;
      border-radius: 0 0 10px 0;
    }
    &.top-right {
      top: 0;
      right: 0;
      border-radius: 0 0 0 10px;
    }
    &.bottom-left {
      bottom: 0;
      left: 0;
      border-radius: 0 10px 0 0;
    }
    &.bottom-right {
      bottom: 0;
      right: 0;
      border-radius: 10px 0 0 0;
    }
  }
  
  // 主设置面板样式
  :deep(.lunar-setting) {
    background: transparent !important;
    padding: 16px 50px;
    
    // 标题样式
    .setting-title {
      color: #8B0000;
      font-family: 'STKaiti', 'KaiTi', serif;
      font-weight: bold;
      text-align: center;
      position: relative;
      
      &::before,
      &::after {
        content: '❀';
        color: #DC143C;
        margin: 0 8px;
      }
    }
    
    // 分组标题
    .setting-group-title {
      color: #DC143C;
      font-family: 'STKaiti', 'KaiTi', serif;
      border-bottom: 2px solid rgba(220, 20, 60, 0.3);
      padding-bottom: 8px;
    }
    
    // 按钮样式
    .el-button {
      background: linear-gradient(180deg, #DC143C, #B22222);
      border: 1px solid #FFD700;
      color: #FFD700;
      
      &:hover {
        background: linear-gradient(180deg, #FF4500, #DC143C);
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }
    }
    
    // 开关样式
    .el-switch.is-checked {
      .el-switch__core {
        background: linear-gradient(90deg, #DC143C, #FF4500);
        border-color: #FFD700;
      }
    }
  }
}

@keyframes lantern-swing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

// 深色模式
html.dark .lunar-setting-wrapper {
  background: linear-gradient(180deg, 
    #3D2415 0%,
    #4A2C1A 30%,
    #3D2415 70%,
    #2D1810 100%
  );
  
  .couplet span {
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  }
  
  :deep(.lunar-setting) {
    .setting-title {
      color: #FFD700;
    }
    
    .setting-group-title {
      color: #FFA500;
    }
  }
}
</style>
