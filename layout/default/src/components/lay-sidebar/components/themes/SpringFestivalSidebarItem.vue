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
import SpringFestivalSidebarItem from './SpringFestivalSidebarItem.vue';
provide('themeSidebarItem', SpringFestivalSidebarItem);
</script>

<template>
  <div class="spring-festival-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <!-- 灯笼装饰插槽 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="spring-festival-decoration">
          <span class="lantern">🏮</span>
          <div class="gold-line"></div>
          <span class="sparkle">✨</span>
        </div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
// 春节主题颜色变量
$spring-red: #dc143c;
$spring-red-light: #ff4d4f;
$spring-red-dark: #a52a2a;
$spring-gold: #ffd700;
$spring-gold-light: #ffeb3b;
$spring-white: #ffffff;
$spring-border: rgba(255, 215, 0, 0.5);

.spring-festival-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $spring-gold !important;
    background: linear-gradient(135deg, rgba($spring-red-dark, 0.8), rgba($spring-red, 0.7)) !important;
    margin: 4px 8px;
    border-radius: 8px;
    border: 1.5px solid rgba($spring-gold, 0.4) !important;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      background: linear-gradient(135deg, rgba($spring-red, 0.9), rgba($spring-red-light, 0.8)) !important;
      color: $spring-white !important;
      border-color: $spring-gold !important;
      transform: translateX(4px) scale(1.02);
      box-shadow: 
        0 4px 16px rgba($spring-red, 0.4),
        0 0 20px rgba($spring-gold, 0.2);
    }
    
    .el-icon, svg {
      color: $spring-gold !important;
    }
    
    span, div {
      color: inherit !important;
    }
    
    &.is-active {
      background: linear-gradient(135deg, $spring-red 0%, $spring-red-light 100%) !important;
      color: $spring-white !important;
      border: 2px solid $spring-gold !important;
      font-weight: 700;
      box-shadow: 
        0 4px 20px rgba($spring-red, 0.5),
        0 0 30px rgba($spring-gold, 0.3),
        inset 0 0 20px rgba($spring-gold, 0.1);
      
      .el-icon, svg, span, div {
        color: $spring-white !important;
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
        background: linear-gradient(to bottom, $spring-gold, $spring-gold-light, $spring-gold);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba($spring-gold, 0.8);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $spring-gold !important;
      background: linear-gradient(135deg, rgba($spring-red-dark, 0.8), rgba($spring-red, 0.7)) !important;
      margin: 4px 8px;
      border-radius: 8px;
      border: 1.5px solid rgba($spring-gold, 0.4) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: linear-gradient(135deg, rgba($spring-red, 0.9), rgba($spring-red-light, 0.8)) !important;
        color: $spring-white !important;
        border-color: $spring-gold !important;
        transform: translateX(4px) scale(1.02);
      }
      
      .el-icon, svg {
        color: $spring-gold !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: $spring-white !important;
      background: linear-gradient(135deg, rgba($spring-red, 0.9), rgba($spring-red-light, 0.8)) !important;
      border-color: $spring-gold !important;
      font-weight: 700;
      
      .el-icon, svg {
        color: $spring-white !important;
      }
    }
    
    .el-menu {
      background: rgba($spring-red-dark, 0.9) !important;
      
      .el-menu-item {
        color: $spring-gold !important;
        background: linear-gradient(135deg, rgba($spring-red-dark, 0.8), rgba($spring-red, 0.7)) !important;
        border: 1.5px solid rgba($spring-gold, 0.4) !important;
        border-radius: 8px;
        margin: 4px 8px !important;
        
        &:hover {
          background: linear-gradient(135deg, rgba($spring-red, 0.9), rgba($spring-red-light, 0.8)) !important;
          color: $spring-white !important;
          border-color: $spring-gold !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, $spring-red, $spring-red-light) !important;
          color: $spring-white !important;
          border: 2px solid $spring-gold !important;
        }
        
        .el-icon, svg {
          color: $spring-gold !important;
        }
      }
    }
  }
}

// 灯笼装饰样式
.spring-festival-decoration {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  
  .lantern {
    font-size: 16px;
    animation: lanternSwing 2s ease-in-out infinite;
    transform-origin: top center;
    filter: drop-shadow(0 2px 4px rgba(220, 20, 60, 0.5));
  }
  
  .gold-line {
    position: absolute;
    left: -20px;
    width: 16px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ffd700, transparent);
    animation: goldShimmer 1.5s ease-in-out infinite;
  }
  
  .sparkle {
    position: absolute;
    font-size: 8px;
    top: -4px;
    right: -4px;
    animation: sparkleFloat 2s ease-in-out infinite;
  }
}

@keyframes lanternSwing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

@keyframes goldShimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes sparkleFloat {
  0%, 100% { opacity: 0.6; transform: translateY(0) scale(1); }
  50% { opacity: 1; transform: translateY(-2px) scale(1.2); }
}
</style>
