<script setup lang="ts">
/**
 * 新春灯笼主题侧边栏（悬浮布局）- 深度定制版
 * 特色：悬浮灯笼效果、金色边框
 */
import BaseHover from './BaseHover.vue';
import LunarSpringFestivalSidebarItem from '../../components/themes/LunarSpringFestivalSidebarItem.vue';
</script>

<template>
  <div class="lunar-hover-wrapper">
    <!-- 悬浮灯笼指示器 -->
    <div class="hover-indicator">
      <div class="indicator-lantern"></div>
    </div>
    
    <!-- 红木边框 -->
    <div class="wood-frame"></div>
    
    <BaseHover 
      theme-class="lunar-hover"
      :sidebar-item-component="LunarSpringFestivalSidebarItem"
    />
  </div>
</template>

<style lang="scss" scoped>
.lunar-hover-wrapper {
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, 
    #2D1810 0%,
    #3D2415 50%,
    #2D1810 100%
  );
  
  // 悬浮指示器
  .hover-indicator {
    position: absolute;
    top: 50%;
    right: -20px;
    transform: translateY(-50%);
    z-index: 100;
    
    .indicator-lantern {
      width: 24px;
      height: 28px;
      background: linear-gradient(180deg, #FF4500, #DC143C, #8B0000);
      border-radius: 50%;
      box-shadow: 
        0 0 15px rgba(255, 69, 0, 0.8),
        0 0 30px rgba(255, 215, 0, 0.4);
      animation: indicator-glow 2s ease-in-out infinite;
      
      &::before {
        content: '';
        position: absolute;
        top: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 5px;
        background: linear-gradient(180deg, #FFD700, #DAA520);
        border-radius: 3px 3px 0 0;
      }
      
      &::after {
        content: '福';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        font-weight: bold;
        color: #FFD700;
        font-family: 'STKaiti', 'KaiTi', serif;
      }
    }
  }
  
  // 红木边框
  .wood-frame {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, 
      #8B4513 0%,
      #CD853F 50%,
      #8B4513 100%
    );
    border-left: 1px solid rgba(255, 215, 0, 0.3);
  }
  
  :deep(.lunar-hover) {
    background: transparent !important;
    
    .el-menu {
      background: transparent !important;
    }
  }
}

@keyframes indicator-glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(255, 69, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 69, 0, 1), 0 0 50px rgba(255, 215, 0, 0.6);
  }
}

html.dark .lunar-hover-wrapper {
  background: linear-gradient(180deg, 
    #1A0F0A 0%,
    #2D1810 50%,
    #1A0F0A 100%
  );
}
</style>
