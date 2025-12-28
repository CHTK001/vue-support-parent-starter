<script setup lang="ts">
/**
 * 新春灯笼主题侧边栏 - 深度定制版
 * 特色：红木卷轴风格、灯笼装饰、金色边框
 */
import BaseSidebar from './BaseSidebar.vue';
import LunarSpringFestivalSidebarItem from '../components/themes/LunarSpringFestivalSidebarItem.vue';
</script>

<template>
  <div class="lunar-sidebar-wrapper">
    <!-- 顶部灯笼装饰 -->
    <div class="top-lanterns">
      <div class="mini-lantern"></div>
      <div class="mini-lantern"></div>
      <div class="mini-lantern"></div>
    </div>
    
    <!-- 红木边框 -->
    <div class="wood-border left"></div>
    <div class="wood-border right"></div>
    
    <!-- 卷轴纹理背景 -->
    <div class="scroll-texture"></div>
    
    <!-- 主侧边栏 -->
    <BaseSidebar 
      theme-class="lunar-sidebar"
      :sidebar-item-component="LunarSpringFestivalSidebarItem"
    />
    
    <!-- 底部祥云装饰 -->
    <div class="bottom-clouds">
      <svg viewBox="0 0 200 40" width="100%" height="40">
        <path 
          d="M0,30 Q20,20 40,30 Q50,25 60,30 Q80,20 100,30 Q120,25 140,30 Q160,20 180,30 Q190,25 200,30 L200,40 L0,40 Z" 
          fill="rgba(255, 215, 0, 0.1)"
        />
      </svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lunar-sidebar-wrapper {
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, 
    #2D1810 0%,
    #3D2415 30%,
    #4A2C1A 60%,
    #3D2415 100%
  );
  
  // 顶部迷你灯笼
  .top-lanterns {
    position: absolute;
    top: 8px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    padding: 0 20px;
    z-index: 20;
    pointer-events: none;
    
    .mini-lantern {
      width: 16px;
      height: 20px;
      background: linear-gradient(180deg, 
        #FF4500 0%, 
        #DC143C 50%, 
        #8B0000 100%
      );
      border-radius: 50%;
      position: relative;
      box-shadow: 0 0 8px rgba(255, 69, 0, 0.6);
      animation: mini-lantern-glow 2s ease-in-out infinite;
      
      // 灯笼顶
      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 4px;
        background: linear-gradient(180deg, #FFD700, #DAA520);
        border-radius: 2px 2px 0 0;
      }
      
      // 灯笼穗
      &::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 6px;
        background: linear-gradient(180deg, #FFD700, #FF6347);
      }
      
      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.3s; }
      &:nth-child(3) { animation-delay: 0.6s; }
    }
  }
  
  // 红木边框
  .wood-border {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 6px;
    background: linear-gradient(90deg, 
      #5C3317 0%,
      #8B4513 30%,
      #CD853F 50%,
      #8B4513 70%,
      #5C3317 100%
    );
    z-index: 15;
    
    &.left { 
      left: 0;
      border-right: 1px solid rgba(255, 215, 0, 0.3);
    }
    &.right { 
      right: 0;
      border-left: 1px solid rgba(255, 215, 0, 0.3);
    }
  }
  
  // 卷轴纹理
  .scroll-texture {
    position: absolute;
    top: 0;
    left: 6px;
    right: 6px;
    bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 8px,
      rgba(139, 69, 19, 0.1) 8px,
      rgba(139, 69, 19, 0.1) 9px
    );
    pointer-events: none;
    z-index: 5;
  }
  
  // 底部祥云
  .bottom-clouds {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    z-index: 15;
    pointer-events: none;
    opacity: 0.8;
  }
  
  // 主侧边栏样式
  :deep(.lunar-sidebar) {
    background: transparent !important;
    padding: 40px 6px 40px 6px;
    
    // 侧边栏Logo区域
    .sidebar-logo-container {
      background: linear-gradient(180deg, 
        rgba(139, 0, 0, 0.4) 0%,
        rgba(60, 30, 15, 0.6) 100%
      );
      border-bottom: 2px solid rgba(255, 215, 0, 0.3);
      margin: -40px -6px 16px -6px;
      padding: 16px;
      
      .sidebar-logo {
        filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
      }
      
      .sidebar-title {
        color: #FFD700 !important;
        font-family: 'STKaiti', 'KaiTi', serif;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }
    }
    
    // 滚动条
    .el-scrollbar {
      &__bar {
        &.is-vertical {
          .el-scrollbar__thumb {
            background: linear-gradient(180deg, #FFD700, #DAA520);
            border-radius: 4px;
            
            &:hover {
              background: linear-gradient(180deg, #FFA500, #FF8C00);
            }
          }
        }
      }
    }
    
    // 菜单基础样式
    .el-menu {
      background: transparent !important;
      border: none;
    }
  }
}

// 灯笼发光动画
@keyframes mini-lantern-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(255, 69, 0, 0.6);
  }
  50% {
    box-shadow: 0 0 16px rgba(255, 69, 0, 0.9), 0 0 24px rgba(255, 215, 0, 0.4);
  }
}

// 深色模式
html.dark .lunar-sidebar-wrapper {
  background: linear-gradient(180deg, 
    #1A0F0A 0%,
    #2D1810 30%,
    #3D2415 60%,
    #2D1810 100%
  );
}
</style>
