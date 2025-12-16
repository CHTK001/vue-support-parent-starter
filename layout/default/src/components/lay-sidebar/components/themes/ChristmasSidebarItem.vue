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
import ChristmasSidebarItem from './ChristmasSidebarItem.vue';
provide('themeSidebarItem', ChristmasSidebarItem);
</script>

<template>
  <div class="christmas-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <!-- 选中状态底部雪地装饰 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="snow-ground-decoration"></div>
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
    margin: 4px 8px;
    border-radius: 0 !important;
    border: none !important;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: visible;
    
    // 横向圣诞树背景 - 使用 clip-path 裁剪成树形
    background: linear-gradient(90deg, 
      darken($xmas-green, 8%) 0%,
      $xmas-green 30%,
      $xmas-green-light 60%,
      $xmas-green 100%
    ) !important;
    clip-path: polygon(
      0% 50%,      /* 左侧尖端 */
      8% 20%,      /* 第一层上 */
      15% 50%,     /* 第一层中 */
      15% 10%,     /* 第二层上 */
      30% 50%,     /* 第二层中 */
      30% 0%,      /* 第三层上 */
      85% 0%,      /* 树干上 */
      85% 25%,     /* 树干右上 */
      100% 25%,    /* 树干右上角 */
      100% 75%,    /* 树干右下角 */
      85% 75%,     /* 树干右下 */
      85% 100%,    /* 树干下 */
      30% 100%,    /* 第三层下 */
      30% 50%,     /* 第三层中 */
      15% 90%,     /* 第二层下 */
      15% 50%,     /* 第二层中 */
      8% 80%,      /* 第一层下 */
      0% 50%       /* 回到左侧尖端 */
    );
    
    // 装饰球和星星用伪元素
    &::before {
      content: '⭐';
      position: absolute;
      left: 2px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      z-index: 3;
      animation: starTwinkle 2s ease-in-out infinite;
    }
    
    &:hover {
      background: linear-gradient(90deg, 
        darken($xmas-green, 5%) 0%,
        $xmas-green-light 30%,
        lighten($xmas-green-light, 5%) 60%,
        $xmas-green-light 100%
      ) !important;
      transform: translateX(4px);
      box-shadow: 
        0 4px 12px rgba($xmas-green, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .el-icon, .sub-menu-icon svg {
      color: $xmas-gold !important;
      position: relative;
      z-index: 2;
    }
    
    span, div {
      color: inherit !important;
      position: relative;
      z-index: 2;
    }
    
    &.is-active {
      background: linear-gradient(90deg, 
        darken($xmas-green, 5%) 0%,
        $xmas-green 30%,
        $xmas-green-light 60%,
        $xmas-green 100%
      ) !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($xmas-green, 0.5),
        0 0 15px rgba($xmas-gold, 0.3);
      
      .el-icon, .sub-menu-icon svg {
        color: $xmas-gold !important;
      }
      
      span, div {
        color: $xmas-white !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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

// 选中状态底部雪地装饰
.snow-ground-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  pointer-events: none;
  z-index: 5;
  background: linear-gradient(to top, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 255, 255, 0.7) 40%,
    rgba(255, 255, 255, 0.3) 70%,
    transparent 100%
  );
  
  // 雪地上的闪烁效果
  &::before {
    content: '✨';
    position: absolute;
    left: 20%;
    bottom: 2px;
    font-size: 6px;
    animation: snowSparkle 2s ease-in-out infinite;
  }
  
  &::after {
    content: '✨';
    position: absolute;
    right: 30%;
    bottom: 1px;
    font-size: 5px;
    animation: snowSparkle 2s ease-in-out infinite 0.7s;
  }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
  50% { opacity: 0.6; transform: translateY(-50%) scale(1.2); }
}

@keyframes snowSparkle {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
</style>
