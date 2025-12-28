<script setup lang="ts">
/**
 * 新春灯笼主题菜单项 - 红木卷轴风格
 */
import { provide } from 'vue';
import type { MenuType } from "@repo/core";
import type { PropType } from "vue";
import BaseSidebarItem from '../BaseSidebarItem.vue';

const props = defineProps({
  item: {
    type: Object as PropType<MenuType>,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: "",
  },
});

// 提供自身作为主题 SidebarItem（用于子菜单递归）
import LunarSpringFestivalSidebarItem from './LunarSpringFestivalSidebarItem.vue';
provide('themeSidebarItem', LunarSpringFestivalSidebarItem);
</script>

<template>
  <div class="lunar-sidebar-item-wrapper">
    <!-- 红木边框装饰 -->
    <div class="wood-frame-left"></div>
    <div class="wood-frame-right"></div>
    
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    />
  </div>
</template>

<style lang="scss" scoped>
.lunar-sidebar-item-wrapper {
  position: relative;
  
  // 红木边框
  .wood-frame-left,
  .wood-frame-right {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, 
      #8B4513 0%, 
      #A0522D 30%, 
      #CD853F 50%,
      #A0522D 70%, 
      #8B4513 100%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .wood-frame-left { left: 0; }
  .wood-frame-right { right: 0; }
  
  &:hover {
    .wood-frame-left,
    .wood-frame-right {
      opacity: 0.6;
    }
  }
  
  // 菜单项样式
  :deep(.sidebar-menu-item) {
    position: relative;
    color: #FFE4B5;
    background: transparent;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
    overflow: hidden;
    
    // 卷轴纹理背景
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 3px,
        rgba(139, 69, 19, 0.05) 3px,
        rgba(139, 69, 19, 0.05) 4px
      );
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    // 左侧灯笼装饰
    &::after {
      content: '🏮';
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%) scale(0);
      font-size: 14px;
      opacity: 0;
      transition: all 0.3s;
    }
    
    &:hover {
      background: linear-gradient(135deg, 
        rgba(139, 0, 0, 0.3) 0%,
        rgba(178, 34, 34, 0.2) 100%
      );
      transform: translateX(4px);
      box-shadow: 
        0 2px 8px rgba(139, 0, 0, 0.3),
        inset 0 0 20px rgba(255, 215, 0, 0.05);
      
      &::before {
        opacity: 1;
      }
    }
    
    // 图标样式
    .el-icon, svg {
      color: #FFD700;
      transition: all 0.3s;
    }
    
    // 文字样式
    span, .menu-title {
      color: #FFE4B5;
      font-family: 'STKaiti', 'KaiTi', serif;
      transition: all 0.3s;
    }
    
    // 激活状态 - 金色灯笼效果
    &.is-active {
      background: linear-gradient(135deg, 
        #8B0000 0%,
        #DC143C 50%,
        #B22222 100%
      );
      box-shadow: 
        0 4px 16px rgba(220, 20, 60, 0.4),
        inset 0 0 20px rgba(255, 215, 0, 0.15);
      border: 1px solid rgba(255, 215, 0, 0.3);
      
      &::after {
        transform: translateY(-50%) scale(1);
        opacity: 1;
      }
      
      .el-icon, svg {
        color: #FFD700;
        filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
      }
      
      span, .menu-title, div {
        color: #FFD700;
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
        font-weight: 600;
        padding-left: 20px; // 给灯笼留空间
      }
    }
  }
  
  // 子菜单样式
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: #FFE4B5;
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, 
          rgba(139, 0, 0, 0.2) 0%,
          rgba(178, 34, 34, 0.15) 100%
        );
        transform: translateX(4px);
      }
      
      .el-icon, svg {
        color: #FFD700;
      }
      
      span {
        color: #FFE4B5;
        font-family: 'STKaiti', 'KaiTi', serif;
      }
      
      // 展开箭头
      .el-sub-menu__icon-arrow {
        color: #FFD700;
      }
    }
    
    // 子菜单展开时
    &.is-opened {
      > .el-sub-menu__title {
        background: linear-gradient(135deg, 
          rgba(139, 0, 0, 0.25) 0%,
          rgba(178, 34, 34, 0.2) 100%
        );
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #FFD700, #FFA500);
          border-radius: 0 2px 2px 0;
        }
      }
    }
    
    // 子菜单内容区域
    .el-menu {
      background: linear-gradient(180deg, 
        rgba(60, 30, 15, 0.5) 0%,
        rgba(80, 40, 20, 0.3) 100%
      );
      border-left: 2px solid rgba(255, 215, 0, 0.2);
      margin-left: 20px;
      border-radius: 0 0 8px 8px;
    }
  }
}

// 深色模式
html.dark .lunar-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    &.is-active {
      background: linear-gradient(135deg, 
        #5C0000 0%,
        #8B0000 50%,
        #6B0000 100%
      );
    }
  }
}
</style>
