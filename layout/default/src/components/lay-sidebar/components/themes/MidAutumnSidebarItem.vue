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

.mid-autumn-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $mid-autumn-gold !important;
    background: linear-gradient(135deg, rgba($mid-autumn-navy, 0.9), rgba($mid-autumn-navy-light, 0.8)) !important;
    margin: 4px 8px;
    border-radius: 8px;
    border: 1.5px solid $mid-autumn-border !important;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      background: linear-gradient(135deg, rgba($mid-autumn-navy-light, 0.95), rgba(#3949ab, 0.85)) !important;
      color: $mid-autumn-white !important;
      border-color: $mid-autumn-gold !important;
      transform: translateX(4px) scale(1.02);
      box-shadow: 
        0 4px 16px rgba($mid-autumn-navy, 0.4),
        0 0 20px rgba($mid-autumn-gold, 0.2);
    }
    
    .el-icon, svg {
      color: $mid-autumn-gold !important;
    }
    
    span, div {
      color: inherit !important;
    }
    
    &.is-active {
      background: linear-gradient(135deg, $mid-autumn-navy-light 0%, #3949ab 100%) !important;
      color: $mid-autumn-white !important;
      border: 2px solid $mid-autumn-gold !important;
      font-weight: 700;
      box-shadow: 
        0 4px 20px rgba($mid-autumn-navy, 0.5),
        0 0 30px rgba($mid-autumn-gold, 0.3),
        inset 0 0 20px rgba($mid-autumn-gold, 0.1);
      
      .el-icon, svg, span, div {
        color: $mid-autumn-white !important;
      }
      
      // 左侧金色装饰条
      &::after {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 70%;
        background: linear-gradient(to bottom, $mid-autumn-gold, $mid-autumn-gold-light, $mid-autumn-gold);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba($mid-autumn-gold, 0.8);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $mid-autumn-gold !important;
      background: linear-gradient(135deg, rgba($mid-autumn-navy, 0.9), rgba($mid-autumn-navy-light, 0.8)) !important;
      margin: 4px 8px;
      border-radius: 8px;
      border: 1.5px solid $mid-autumn-border !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: linear-gradient(135deg, rgba($mid-autumn-navy-light, 0.95), rgba(#3949ab, 0.85)) !important;
        color: $mid-autumn-white !important;
        border-color: $mid-autumn-gold !important;
        transform: translateX(4px) scale(1.02);
      }
      
      .el-icon, svg {
        color: $mid-autumn-gold !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: $mid-autumn-white !important;
      background: linear-gradient(135deg, rgba($mid-autumn-navy-light, 0.95), rgba(#3949ab, 0.85)) !important;
      border-color: $mid-autumn-gold !important;
      font-weight: 700;
      
      .el-icon, svg {
        color: $mid-autumn-white !important;
      }
    }
    
    .el-menu {
      background: rgba(darken($mid-autumn-navy, 5%), 0.95) !important;
      
      .el-menu-item {
        color: $mid-autumn-gold !important;
        background: linear-gradient(135deg, rgba($mid-autumn-navy, 0.9), rgba($mid-autumn-navy-light, 0.8)) !important;
        border: 1.5px solid $mid-autumn-border !important;
        border-radius: 8px;
        margin: 4px 8px !important;
        
        &:hover {
          background: linear-gradient(135deg, rgba($mid-autumn-navy-light, 0.95), rgba(#3949ab, 0.85)) !important;
          color: $mid-autumn-white !important;
          border-color: $mid-autumn-gold !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, $mid-autumn-navy-light, #3949ab) !important;
          color: $mid-autumn-white !important;
          border: 2px solid $mid-autumn-gold !important;
        }
        
        .el-icon, svg {
          color: $mid-autumn-gold !important;
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
