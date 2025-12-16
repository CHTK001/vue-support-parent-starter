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

// 春联 SVG 背景
$couplet-normal: url('./assets/spring-couplet-menu-normal.svg');
$couplet-active: url('./assets/spring-couplet-menu-active.svg');

.spring-festival-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $spring-gold !important;
    background: $couplet-normal !important;
    background-size: 100% 100% !important;
    background-repeat: no-repeat !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: none !important;
    font-weight: 600;
    font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      transform: translateX(2px);
      filter: brightness(1.1);
      box-shadow: 0 4px 12px rgba($spring-red, 0.3);
    }
    
    .el-icon, svg {
      color: $spring-gold !important;
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
      background: $couplet-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      color: #8B0000 !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($spring-gold, 0.5),
        0 0 20px rgba($spring-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: #8B0000 !important;
        text-shadow: 0 1px 2px rgba(255, 215, 0, 0.5);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $spring-gold !important;
      background: $couplet-normal !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      margin: 4px 8px;
      border-radius: 4px;
      border: none !important;
      font-weight: 600;
      font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateX(2px);
        filter: brightness(1.1);
      }
      
      .el-icon, svg {
        color: $spring-gold !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      background: $couplet-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      color: #8B0000 !important;
      font-weight: 700;
      
      .el-icon, svg {
        color: #8B0000 !important;
      }
    }
    
    .el-menu {
      background: rgba($spring-red-dark, 0.9) !important;
      
      .el-menu-item {
        color: $spring-gold !important;
        background: $couplet-normal !important;
        background-size: 100% 100% !important;
        background-repeat: no-repeat !important;
        border: none !important;
        border-radius: 4px;
        margin: 4px 8px !important;
        font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
        
        &:hover {
          filter: brightness(1.1);
        }
        
        &.is-active {
          background: $couplet-active !important;
          background-size: 100% 100% !important;
          background-repeat: no-repeat !important;
          color: #8B0000 !important;
        }
        
        .el-icon, svg {
          color: $spring-gold !important;
        }
        
        &.is-active .el-icon,
        &.is-active svg {
          color: #8B0000 !important;
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
