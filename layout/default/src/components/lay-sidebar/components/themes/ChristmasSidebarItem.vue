<script setup lang="ts">
import { provide, useRoute, computed } from 'vue';
import type { MenuType } from "@repo/core";
import type { PropType } from "vue";
import BaseSidebarItem from '../BaseSidebarItem.vue';
import { resolvePath as configResolvePath } from "@repo/config";

const route = useRoute();

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
import ChristmasSidebarItem from './ChristmasSidebarItem.vue';
provide('themeSidebarItem', ChristmasSidebarItem);

// 计算路径
function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath)) {
    return routePath || props.basePath;
  }
  return configResolvePath(props.basePath, routePath);
}

// 计算当前菜单项是否激活
const isMenuActive = computed(() => {
  const currentPath = route.path;
  const itemPath = resolvePath(props.item?.path || '');
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
});
</script>

<template>
  <div class="christmas-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <!-- 圣诞树装饰插槽 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="christmas-decoration">
          <svg class="christmas-tree" viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
            <!-- 树干 -->
            <rect x="14" y="12" width="4" height="4" fill="#8B4513"/>
            <!-- 树叶层 -->
            <polygon points="16,0 24,6 20,6 26,10 22,10 28,14 4,14 10,10 6,10 12,6 8,6" fill="#1b5e20"/>
            <!-- 装饰球 -->
            <circle cx="12" cy="10" r="1.5" fill="#c62828"/>
            <circle cx="20" cy="8" r="1.5" fill="#ffd700"/>
            <circle cx="16" cy="12" r="1.5" fill="#c62828"/>
            <circle cx="18" cy="6" r="1" fill="#ffd700"/>
            <!-- 星星 -->
            <polygon points="16,0 17,3 20,3 17.5,5 18.5,8 16,6 13.5,8 14.5,5 12,3 15,3" fill="#ffd700" class="tree-star"/>
          </svg>
          <span class="sparkle sparkle-1">✨</span>
          <span class="sparkle sparkle-2">⭐</span>
        </div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
// 圣诞主题颜色变量
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-red-light: #e53935;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;
$xmas-border: rgba(255, 215, 0, 0.4);

.christmas-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $xmas-white !important;
    background: rgba(darken($xmas-green, 5%), 0.6) !important;
    margin: 4px 8px;
    border-radius: 8px;
    border: 1.5px solid rgba($xmas-gold, 0.25) !important;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
      color: $xmas-white !important;
      border-color: rgba($xmas-gold, 0.5) !important;
      transform: translateX(4px) scale(1.02);
      box-shadow: 
        0 4px 12px rgba($xmas-red, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .el-icon, svg {
      color: $xmas-gold !important;
    }
    
    span, div {
      color: inherit !important;
    }
    
    &.is-active {
      background: linear-gradient(135deg, $xmas-red 0%, $xmas-red-light 100%) !important;
      color: $xmas-white !important;
      border: 2px solid $xmas-gold !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($xmas-red, 0.5),
        0 0 20px rgba($xmas-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: $xmas-white !important;
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
        background: linear-gradient(to bottom, $xmas-gold, #ffeb3b, $xmas-gold);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba($xmas-gold, 0.8);
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $xmas-white !important;
      background: rgba(darken($xmas-green, 5%), 0.6) !important;
      margin: 4px 8px;
      border-radius: 8px;
      border: 1.5px solid rgba($xmas-gold, 0.25) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
        color: $xmas-white !important;
        border-color: rgba($xmas-gold, 0.5) !important;
        transform: translateX(4px) scale(1.02);
        box-shadow: 
          0 4px 12px rgba($xmas-red, 0.3),
          0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .el-icon, svg {
        color: $xmas-gold !important;
      }
      
      span, div {
        color: inherit !important;
      }
    }
    
    // 当子菜单项选中时，父级菜单显示激活样式
    &.is-active > .el-sub-menu__title {
      color: $xmas-white !important;
      background: linear-gradient(135deg, rgba($xmas-red, 0.8), rgba($xmas-red-light, 0.7)) !important;
      border-color: rgba($xmas-gold, 0.5) !important;
      font-weight: 700;
      box-shadow: 
        0 4px 12px rgba($xmas-red, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.2) !important;
      
      .el-icon, svg {
        color: $xmas-white !important;
      }
    }
    
    // 子菜单容器
    .el-menu {
      background: rgba(darken($xmas-green, 8%), 0.8) !important;
      
      .el-menu-item {
        color: $xmas-white !important;
        background: transparent !important;
        border: none !important;
        margin: 2px 8px !important;
        
        &:hover {
          background: rgba($xmas-red, 0.6) !important;
          color: $xmas-white !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
          color: $xmas-white !important;
          border-left: 3px solid $xmas-gold !important;
          
          .el-icon, svg, span, div {
            color: $xmas-white !important;
          }
        }
        
        .el-icon, svg {
          color: $xmas-gold !important;
        }
        
        span, div {
          color: inherit !important;
        }
      }
    }
  }
}

// 圣诞树装饰样式
.christmas-decoration {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  
  .christmas-tree {
    width: 28px;
    height: 14px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    animation: treeGlow 2s ease-in-out infinite;
    
    .tree-star {
      animation: starTwinkle 1.5s ease-in-out infinite;
    }
  }
  
  .sparkle {
    position: absolute;
    font-size: 8px;
    animation: sparkleFloat 2s ease-in-out infinite;
    
    &.sparkle-1 {
      top: -4px;
      right: -2px;
      animation-delay: 0s;
    }
    
    &.sparkle-2 {
      bottom: -4px;
      left: -2px;
      animation-delay: 0.5s;
    }
  }
}

@keyframes treeGlow {
  0%, 100% {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 4px rgba(255, 215, 0, 0.3));
  }
  50% {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

@keyframes sparkleFloat {
  0%, 100% { opacity: 0.6; transform: translateY(0) scale(1); }
  50% { opacity: 1; transform: translateY(-2px) scale(1.2); }
}
</style>
