<script setup lang="ts">
/**
 * 新春灯笼主题侧边栏（混合布局）- 深度定制版
 * 特色：红木框架、灯笼装饰
 */
import BaseMix from './BaseMix.vue';
</script>

<template>
  <div class="lunar-mix-wrapper">
    <!-- 金色边框 -->
    <div class="gold-frame top"></div>
    <div class="gold-frame bottom"></div>
    
    <!-- 两侧灯笼 -->
    <div class="side-lantern left">
      <div class="lantern-body"></div>
    </div>
    <div class="side-lantern right">
      <div class="lantern-body"></div>
    </div>
    
    <BaseMix theme-class="lunar-mix" />
  </div>
</template>

<style lang="scss" scoped>
.lunar-mix-wrapper {
  position: relative;
  width: 100%;
  background: linear-gradient(90deg, 
    #8B0000 0%,
    #DC143C 30%,
    #B22222 70%,
    #8B0000 100%
  );
  
  // 金色边框
  .gold-frame {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      #FFD700 0%,
      #FFA500 50%,
      #FFD700 100%
    );
    z-index: 10;
    
    &.top { top: 0; }
    &.bottom { bottom: 0; }
  }
  
  // 两侧灯笼
  .side-lantern {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    
    &.left { left: 8px; }
    &.right { right: 8px; }
    
    .lantern-body {
      width: 14px;
      height: 16px;
      background: linear-gradient(180deg, #FF4500, #DC143C, #8B0000);
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(255, 69, 0, 0.6);
      animation: lantern-glow 2s ease-in-out infinite;
      
      &::before {
        content: '';
        position: absolute;
        top: -3px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 3px;
        background: #FFD700;
        border-radius: 2px 2px 0 0;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 4px;
        background: #FFD700;
      }
    }
  }
  
  :deep(.lunar-mix) {
    background: transparent !important;
    
    .el-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: #FFE4B5 !important;
        font-family: 'STKaiti', 'KaiTi', serif;
        
        &:hover {
          background: rgba(139, 0, 0, 0.3) !important;
          color: #FFD700 !important;
        }
        
        .el-icon {
          color: #FFD700;
        }
      }
      
      .el-menu-item.is-active {
        background: rgba(255, 215, 0, 0.2) !important;
        color: #FFD700 !important;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 2px;
          background: #FFD700;
        }
      }
    }
  }
}

@keyframes lantern-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 69, 0, 0.6); }
  50% { box-shadow: 0 0 16px rgba(255, 69, 0, 0.9); }
}

html.dark .lunar-mix-wrapper {
  background: linear-gradient(90deg, 
    #5C0000 0%,
    #8B0000 30%,
    #6B0000 70%,
    #5C0000 100%
  );
}
</style>
