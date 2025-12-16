<script setup lang="ts">
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
import MidAutumnSidebarItem from './MidAutumnSidebarItem.vue';
provide('themeSidebarItem', MidAutumnSidebarItem);
</script>

<template>
  <div class="mid-autumn-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <!-- 月亮装饰插槽 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="mid-autumn-decoration">
          <div class="moon-glow"></div>
          <span class="moon">🌕</span>
          <span class="star star-1">✨</span>
          <span class="star star-2">⭐</span>
        </div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
// 中秋主题颜色变量
$mid-autumn-navy: #1a237e;
$mid-autumn-navy-light: #283593;
$mid-autumn-gold: #ffd54f;
$mid-autumn-gold-light: #ffeb3b;
$mid-autumn-orange: #ff8f00;
$mid-autumn-white: #ffffff;
$mid-autumn-border: rgba(255, 213, 79, 0.4);

// 月光 SVG 背景
$moon-normal: url('./assets/mid-autumn-menu-normal.svg');
$moon-active: url('./assets/mid-autumn-menu-active.svg');

.mid-autumn-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $mid-autumn-gold !important;
    background: $moon-normal !important;
    background-size: 100% 100% !important;
    background-repeat: no-repeat !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: none !important;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      transform: translateX(2px);
      filter: brightness(1.1);
      box-shadow: 0 4px 12px rgba($mid-autumn-navy, 0.4);
    }
    
    .el-icon, svg {
      color: $mid-autumn-gold !important;
      position: relative;
      z-index: 2;
    }
    
    span, div {
      color: inherit !important;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    &.is-active {
      background: $moon-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      color: $mid-autumn-navy !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($mid-autumn-gold, 0.5),
        0 0 20px rgba($mid-autumn-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: $mid-autumn-navy !important;
        text-shadow: 0 1px 2px rgba($mid-autumn-gold, 0.5);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $mid-autumn-gold !important;
      background: $moon-normal !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      margin: 4px 8px;
      border-radius: 4px;
      border: none !important;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateX(2px);
        filter: brightness(1.1);
      }
      
      .el-icon, svg {
        color: $mid-autumn-gold !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      background: $moon-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      color: $mid-autumn-navy !important;
      font-weight: 700;
      
      .el-icon, svg {
        color: $mid-autumn-navy !important;
      }
    }
    
    .el-menu {
      background: rgba(darken($mid-autumn-navy, 5%), 0.95) !important;
      
      .el-menu-item {
        color: $mid-autumn-gold !important;
        background: $moon-normal !important;
        background-size: 100% 100% !important;
        background-repeat: no-repeat !important;
        border: none !important;
        border-radius: 4px;
        margin: 4px 8px !important;
        
        &:hover {
          filter: brightness(1.1);
        }
        
        &.is-active {
          background: $moon-active !important;
          background-size: 100% 100% !important;
          background-repeat: no-repeat !important;
          color: $mid-autumn-navy !important;
        }
        
        .el-icon, svg {
          color: $mid-autumn-gold !important;
        }
        
        &.is-active .el-icon,
        &.is-active svg {
          color: $mid-autumn-navy !important;
        }
      }
    }
  }
}

// 月亮装饰样式
.mid-autumn-decoration {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .moon-glow {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 213, 79, 0.6) 0%, transparent 70%);
    animation: moonGlow 3s ease-in-out infinite;
  }
  
  .moon {
    font-size: 16px;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.8));
    animation: moonFloat 4s ease-in-out infinite;
  }
  
  .star {
    position: absolute;
    font-size: 8px;
    animation: starTwinkle 2s ease-in-out infinite;
    
    &.star-1 {
      top: -6px;
      right: -4px;
      animation-delay: 0.3s;
    }
    
    &.star-2 {
      bottom: -6px;
      left: -4px;
      animation-delay: 0.8s;
    }
  }
}

@keyframes moonGlow {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.6; 
  }
  50% { 
    transform: scale(1.3); 
    opacity: 0.9; 
  }
}

@keyframes moonFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}
</style>
