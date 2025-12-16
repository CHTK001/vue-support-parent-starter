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

// 横向圣诞树 SVG 背景图片 (base64)
$tree-svg-normal: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='treeGrad' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%231b5e20'/%3E%3Cstop offset='50%25' style='stop-color:%232e7d32'/%3E%3Cstop offset='100%25' style='stop-color:%231b5e20'/%3E%3C/linearGradient%3E%3C/defs%3E%3C!-- 树叶层 --%3E%3Cpath d='M0,20 L15,5 L20,15 L35,0 L45,12 L55,2 L140,2 L140,38 L55,38 L45,28 L35,40 L20,25 L15,35 L0,20 Z' fill='url(%23treeGrad)'/%3E%3C!-- 树干 --%3E%3Crect x='140' y='8' width='60' height='24' rx='2' fill='%238B4513'/%3E%3Crect x='140' y='10' width='60' height='20' rx='1' fill='%23A0522D'/%3E%3C!-- 装饰球 --%3E%3Ccircle cx='25' cy='20' r='4' fill='%23c62828'/%3E%3Ccircle cx='45' cy='12' r='3' fill='%23ffd700'/%3E%3Ccircle cx='45' cy='28' r='3' fill='%23c62828'/%3E%3Ccircle cx='70' cy='15' r='3.5' fill='%23ffd700'/%3E%3Ccircle cx='70' cy='25' r='3' fill='%23c62828'/%3E%3Ccircle cx='95' cy='10' r='3' fill='%23c62828'/%3E%3Ccircle cx='95' cy='30' r='3.5' fill='%23ffd700'/%3E%3Ccircle cx='120' cy='18' r='4' fill='%23ffd700'/%3E%3C!-- 星星 --%3E%3Cpolygon points='5,20 7,17 10,17 8,15 9,12 5,14 1,12 2,15 0,17 3,17' fill='%23ffd700'/%3E%3C/svg%3E");

$tree-svg-active: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='treeGrad' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%232e7d32'/%3E%3Cstop offset='50%25' style='stop-color:%2343a047'/%3E%3Cstop offset='100%25' style='stop-color:%232e7d32'/%3E%3C/linearGradient%3E%3ClinearGradient id='snowGrad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:white;stop-opacity:0'/%3E%3Cstop offset='60%25' style='stop-color:white;stop-opacity:0.7'/%3E%3Cstop offset='100%25' style='stop-color:white;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3C!-- 树叶层 --%3E%3Cpath d='M0,20 L15,5 L20,15 L35,0 L45,12 L55,2 L140,2 L140,38 L55,38 L45,28 L35,40 L20,25 L15,35 L0,20 Z' fill='url(%23treeGrad)'/%3E%3C!-- 树干 --%3E%3Crect x='140' y='8' width='60' height='24' rx='2' fill='%238B4513'/%3E%3Crect x='140' y='10' width='60' height='20' rx='1' fill='%23A0522D'/%3E%3C!-- 装饰球 --%3E%3Ccircle cx='25' cy='20' r='4' fill='%23c62828'%3E%3Canimate attributeName='opacity' values='1;0.6;1' dur='2s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='45' cy='12' r='3' fill='%23ffd700'%3E%3Canimate attributeName='opacity' values='0.6;1;0.6' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='45' cy='28' r='3' fill='%23c62828'/%3E%3Ccircle cx='70' cy='15' r='3.5' fill='%23ffd700'%3E%3Canimate attributeName='opacity' values='1;0.5;1' dur='2.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='70' cy='25' r='3' fill='%23c62828'/%3E%3Ccircle cx='95' cy='10' r='3' fill='%23c62828'%3E%3Canimate attributeName='opacity' values='0.7;1;0.7' dur='1.8s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='95' cy='30' r='3.5' fill='%23ffd700'/%3E%3Ccircle cx='120' cy='18' r='4' fill='%23ffd700'%3E%3Canimate attributeName='opacity' values='1;0.6;1' dur='2.2s' repeatCount='indefinite'/%3E%3C/circle%3E%3C!-- 星星 --%3E%3Cpolygon points='5,20 7,17 10,17 8,15 9,12 5,14 1,12 2,15 0,17 3,17' fill='%23ffd700'%3E%3Canimate attributeName='transform' attributeType='XML' type='scale' values='1;1.2;1' dur='1s' repeatCount='indefinite' additive='sum'/%3E%3CanimateTransform attributeName='transform' type='translate' values='0,0;0,-1;0,0' dur='1s' repeatCount='indefinite'/%3E%3C/polygon%3E%3C!-- 底部雪地 --%3E%3Crect x='0' y='32' width='200' height='8' fill='url(%23snowGrad)'/%3E%3C!-- 雪花闪烁 --%3E%3Ctext x='30' y='38' font-size='6' fill='white' opacity='0.8'%3E%E2%9C%A8%3Canimate attributeName='opacity' values='0.4;1;0.4' dur='1.5s' repeatCount='indefinite'/%3E%3C/text%3E%3Ctext x='80' y='37' font-size='5' fill='white' opacity='0.6'%3E%E2%9C%A8%3Canimate attributeName='opacity' values='1;0.3;1' dur='2s' repeatCount='indefinite'/%3E%3C/text%3E%3Ctext x='130' y='38' font-size='6' fill='white' opacity='0.7'%3E%E2%9C%A8%3Canimate attributeName='opacity' values='0.5;1;0.5' dur='1.8s' repeatCount='indefinite'/%3E%3C/text%3E%3C/svg%3E");

.christmas-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $xmas-white !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: none !important;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    
    // 横向圣诞树 SVG 背景
    background: $tree-svg-normal !important;
    background-size: 100% 100% !important;
    background-repeat: no-repeat !important;
    
    &:hover {
      transform: translateX(4px);
      filter: brightness(1.1);
      box-shadow: 
        0 4px 12px rgba($xmas-green, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .el-icon, .sub-menu-icon svg {
      color: $xmas-gold !important;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
    }
    
    span, div {
      color: inherit !important;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }
    
    &.is-active {
      background: $tree-svg-active !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($xmas-green, 0.5),
        0 0 15px rgba($xmas-gold, 0.3);
      
      .el-icon, .sub-menu-icon svg {
        color: $xmas-gold !important;
        filter: drop-shadow(0 0 4px rgba($xmas-gold, 0.6));
      }
      
      span, div {
        color: $xmas-white !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
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

// 激活状态的雪地已经在 SVG 背景中实现，不需要额外装饰
.snow-ground-decoration {
  display: none;
}
</style>
