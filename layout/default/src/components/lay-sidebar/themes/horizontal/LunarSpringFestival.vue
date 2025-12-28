<script setup lang="ts">
/**
 * 新春灯笼主题侧边栏（横向布局）- 深度定制版
 * 特色：横向卷轴、悬挂灯笼、祥云点缀
 */
import BaseHorizontal from './BaseHorizontal.vue';
</script>

<template>
  <div class="lunar-horizontal-wrapper">
    <!-- 顶部金色边框 -->
    <div class="gold-border top"></div>
    
    <!-- 悬挂灯笼装饰 -->
    <div class="hanging-lanterns">
      <div class="tiny-lantern" v-for="i in 5" :key="i" :style="{ animationDelay: `${i * 0.2}s` }"></div>
    </div>
    
    <!-- 主内容 -->
    <BaseHorizontal theme-class="lunar-horizontal" />
    
    <!-- 底部金色边框 -->
    <div class="gold-border bottom"></div>
  </div>
</template>

<style lang="scss" scoped>
.lunar-horizontal-wrapper {
  position: relative;
  width: 100%;
  background: linear-gradient(90deg, 
    #8B0000 0%,
    #DC143C 20%,
    #B22222 50%,
    #DC143C 80%,
    #8B0000 100%
  );
  
  // 金色边框
  .gold-border {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent 0%,
      #FFD700 10%,
      #FFA500 30%,
      #FFD700 50%,
      #FFA500 70%,
      #FFD700 90%,
      transparent 100%
    );
    z-index: 10;
    
    &.top { top: 0; }
    &.bottom { bottom: 0; }
  }
  
  // 悬挂灯笼
  .hanging-lanterns {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    pointer-events: none;
    z-index: 5;
    
    .tiny-lantern {
      width: 10px;
      height: 12px;
      background: linear-gradient(180deg, #FF4500, #DC143C, #8B0000);
      border-radius: 50%;
      margin-top: 3px;
      animation: tiny-swing 3s ease-in-out infinite;
      box-shadow: 0 0 6px rgba(255, 69, 0, 0.5);
      
      &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 2px;
        background: #FFD700;
      }
    }
  }
  
  // 主横向菜单样式
  :deep(.lunar-horizontal) {
    background: transparent !important;
    
    .el-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: #FFE4B5 !important;
        font-family: 'STKaiti', 'KaiTi', serif;
        transition: all 0.3s;
        
        &:hover {
          background: rgba(139, 0, 0, 0.4) !important;
          color: #FFD700 !important;
        }
        
        .el-icon {
          color: #FFD700;
        }
      }
      
      .el-menu-item.is-active {
        background: linear-gradient(180deg, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.2)) !important;
        color: #FFD700 !important;
        border-bottom: 2px solid #FFD700;
      }
    }
  }
}

@keyframes tiny-swing {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

html.dark .lunar-horizontal-wrapper {
  background: linear-gradient(90deg, 
    #5C0000 0%,
    #8B0000 20%,
    #6B0000 50%,
    #8B0000 80%,
    #5C0000 100%
  );
}
</style>
