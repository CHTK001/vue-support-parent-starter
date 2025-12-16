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
      <!-- 圣诞树背景装饰插槽 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="christmas-tree-bg">
          <!-- 左侧圣诞树 -->
          <svg class="tree tree-left" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <polygon points="20,0 40,40 30,40 20,50 10,40 0,40" fill="#2e7d32" opacity="0.9"/>
            <polygon points="20,8 35,35 28,35 20,45 12,35 5,35" fill="#388e3c"/>
            <circle cx="15" cy="25" r="3" fill="#c62828"/>
            <circle cx="25" cy="20" r="2.5" fill="#ffd700"/>
            <circle cx="20" cy="32" r="2" fill="#c62828"/>
            <polygon points="20,0 22,6 26,6 23,9 24,13 20,10 16,13 17,9 14,6 18,6" fill="#ffd700" class="star"/>
          </svg>
          <!-- 右侧圣诞树 -->
          <svg class="tree tree-right" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <polygon points="20,0 40,40 30,40 20,50 10,40 0,40" fill="#2e7d32" opacity="0.9"/>
            <polygon points="20,8 35,35 28,35 20,45 12,35 5,35" fill="#388e3c"/>
            <circle cx="25" cy="25" r="3" fill="#ffd700"/>
            <circle cx="15" cy="20" r="2.5" fill="#c62828"/>
            <circle cx="20" cy="32" r="2" fill="#ffd700"/>
            <polygon points="20,0 22,6 26,6 23,9 24,13 20,10 16,13 17,9 14,6 18,6" fill="#ffd700" class="star"/>
          </svg>
          <!-- 中间雪花装饰 -->
          <div class="snow-particles">
            <span class="snow">❄</span>
            <span class="snow">❄</span>
            <span class="snow">❄</span>
          </div>
          <!-- 底部雪地 -->
          <div class="snow-ground"></div>
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
      background: transparent !important;
      color: $xmas-white !important;
      border: 2px solid $xmas-gold !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($xmas-green, 0.5),
        0 0 20px rgba($xmas-gold, 0.3);
      overflow: hidden;
      
      .sub-menu-icon, .el-icon {
        position: relative;
        z-index: 2;
      }
      
      .el-icon, svg {
        color: $xmas-gold !important;
      }
      
      span, div {
        color: $xmas-white !important;
        position: relative;
        z-index: 2;
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

// 圣诞树背景装饰样式
.christmas-tree-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  border-radius: 6px;
  background: linear-gradient(135deg, 
    rgba(27, 94, 32, 0.95) 0%, 
    rgba(46, 125, 50, 0.9) 50%,
    rgba(27, 94, 32, 0.95) 100%
  );
  
  // 圣诞树
  .tree {
    position: absolute;
    bottom: -5px;
    height: 42px;
    width: auto;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    
    &.tree-left {
      left: 2px;
      animation: treeSwayLeft 3s ease-in-out infinite;
    }
    
    &.tree-right {
      right: 2px;
      animation: treeSwayRight 3s ease-in-out infinite;
    }
    
    .star {
      animation: starTwinkle 1.5s ease-in-out infinite;
    }
  }
  
  // 雪花粒子
  .snow-particles {
    position: absolute;
    inset: 0;
    
    .snow {
      position: absolute;
      color: rgba(255, 255, 255, 0.8);
      font-size: 8px;
      animation: snowFall 4s linear infinite;
      
      &:nth-child(1) {
        left: 20%;
        animation-delay: 0s;
      }
      &:nth-child(2) {
        left: 50%;
        animation-delay: 1.5s;
        font-size: 6px;
      }
      &:nth-child(3) {
        left: 75%;
        animation-delay: 3s;
        font-size: 10px;
      }
    }
  }
  
  // 底部雪地
  .snow-ground {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(to top, 
      rgba(255, 255, 255, 0.9) 0%, 
      rgba(255, 255, 255, 0.4) 60%,
      transparent 100%
    );
    border-radius: 0 0 6px 6px;
  }
}

@keyframes treeSwayLeft {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes treeSwayRight {
  0%, 100% { transform: rotate(2deg); }
  50% { transform: rotate(-2deg); }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

@keyframes snowFall {
  0% { 
    top: -10px; 
    opacity: 0;
    transform: translateX(0);
  }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { 
    top: 100%; 
    opacity: 0;
    transform: translateX(10px);
  }
}
</style>
