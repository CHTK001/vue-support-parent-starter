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
import CyberpunkSidebarItem from './CyberpunkSidebarItem.vue';
provide('themeSidebarItem', CyberpunkSidebarItem);
</script>

<template>
  <div class="cyberpunk-sidebar-item-wrapper">
    <BaseSidebarItem
      :item="item"
      :is-nest="isNest"
      :base-path="basePath"
    >
      <!-- 霓虹装饰插槽 -->
      <template #activeDecoration="{ isActive }">
        <div v-if="isActive" class="cyberpunk-decoration">
          <div class="neon-line"></div>
          <div class="scan-line"></div>
          <div class="glitch-effect"></div>
        </div>
      </template>
    </BaseSidebarItem>
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-dark: #0a0a0f;
$cyber-dark-light: #1a1a2e;
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-yellow: #ffff00;
$cyber-pink: #ff0080;
$cyber-white: #ffffff;
$cyber-border: rgba(0, 255, 255, 0.4);

.cyberpunk-sidebar-item-wrapper {
  :deep(.sidebar-menu-item) {
    color: $cyber-cyan !important;
    background: linear-gradient(135deg, rgba($cyber-dark, 0.95), rgba($cyber-dark-light, 0.9)) !important;
    margin: 4px 8px;
    border-radius: 4px;
    border: 1px solid $cyber-border !important;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
    font-family: 'Orbitron', 'Courier New', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    
    &:hover {
      background: linear-gradient(135deg, rgba($cyber-dark-light, 0.95), rgba(#16213e, 0.9)) !important;
      color: $cyber-white !important;
      border-color: $cyber-cyan !important;
      box-shadow: 
        0 0 10px rgba($cyber-cyan, 0.5),
        0 0 20px rgba($cyber-cyan, 0.3),
        inset 0 0 10px rgba($cyber-cyan, 0.1);
      transform: translateX(2px);
    }
    
    .el-icon, svg {
      color: $cyber-cyan !important;
    }
    
    span, div {
      color: inherit !important;
    }
    
    &.is-active {
      background: linear-gradient(135deg, rgba($cyber-dark-light, 0.98), rgba(#16213e, 0.95)) !important;
      color: $cyber-white !important;
      border: 2px solid $cyber-cyan !important;
      font-weight: 700;
      box-shadow: 
        0 0 15px rgba($cyber-cyan, 0.6),
        0 0 30px rgba($cyber-magenta, 0.3),
        inset 0 0 15px rgba($cyber-cyan, 0.15);
      animation: neonFlicker 3s ease-in-out infinite;
      
      .el-icon, svg, span, div {
        color: $cyber-white !important;
        text-shadow: 0 0 8px rgba($cyber-cyan, 0.8);
      }
      
      // 左侧霓虹装饰条
      &::after {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 80%;
        background: linear-gradient(to bottom, $cyber-cyan, $cyber-magenta, $cyber-cyan);
        border-radius: 2px;
        box-shadow: 
          0 0 8px $cyber-cyan,
          0 0 15px rgba($cyber-magenta, 0.5);
        animation: neonPulse 2s ease-in-out infinite;
      }
    }
  }
  
  :deep(.sidebar-sub-menu) {
    .el-sub-menu__title {
      color: $cyber-cyan !important;
      background: linear-gradient(135deg, rgba($cyber-dark, 0.95), rgba($cyber-dark-light, 0.9)) !important;
      margin: 4px 8px;
      border-radius: 4px;
      border: 1px solid $cyber-border !important;
      font-weight: 500;
      transition: all 0.2s ease;
      font-family: 'Orbitron', 'Courier New', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      
      &:hover {
        background: linear-gradient(135deg, rgba($cyber-dark-light, 0.95), rgba(#16213e, 0.9)) !important;
        color: $cyber-white !important;
        border-color: $cyber-cyan !important;
        box-shadow: 
          0 0 10px rgba($cyber-cyan, 0.5),
          0 0 20px rgba($cyber-cyan, 0.3);
        transform: translateX(2px);
      }
      
      .el-icon, svg {
        color: $cyber-cyan !important;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: $cyber-white !important;
      background: linear-gradient(135deg, rgba($cyber-dark-light, 0.95), rgba(#16213e, 0.9)) !important;
      border-color: $cyber-cyan !important;
      font-weight: 700;
      box-shadow: 
        0 0 10px rgba($cyber-cyan, 0.5),
        0 0 20px rgba($cyber-cyan, 0.3);
      
      .el-icon, svg {
        color: $cyber-white !important;
      }
    }
    
    .el-menu {
      background: rgba(darken($cyber-dark, 2%), 0.98) !important;
      border-left: 1px solid rgba($cyber-cyan, 0.2);
      
      .el-menu-item {
        color: $cyber-cyan !important;
        background: transparent !important;
        border: none !important;
        margin: 2px 8px !important;
        
        &:hover {
          background: rgba($cyber-dark-light, 0.6) !important;
          color: $cyber-white !important;
          box-shadow: 0 0 8px rgba($cyber-cyan, 0.3);
        }
        
        &.is-active {
          background: linear-gradient(135deg, rgba($cyber-dark-light, 0.9), rgba(#16213e, 0.85)) !important;
          color: $cyber-white !important;
          border-left: 3px solid $cyber-cyan !important;
          box-shadow: 
            0 0 10px rgba($cyber-cyan, 0.4),
            inset 0 0 8px rgba($cyber-cyan, 0.1);
        }
        
        .el-icon, svg {
          color: $cyber-cyan !important;
        }
      }
    }
  }
}

// 霓虹装饰样式
.cyberpunk-decoration {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
  width: 24px;
  height: 16px;
  
  .neon-line {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff);
    border-radius: 2px;
    box-shadow: 
      0 0 4px #00ffff,
      0 0 8px rgba(0, 255, 255, 0.5),
      0 0 12px rgba(255, 0, 255, 0.3);
    animation: neonPulse 2s ease-in-out infinite;
  }
  
  .scan-line {
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, transparent, #00ffff, transparent);
    animation: scanMove 1.5s linear infinite;
  }
  
  .glitch-effect {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(0, 255, 255, 0.1) 50%, 
      transparent 100%
    );
    animation: glitchFlicker 0.3s ease-in-out infinite;
  }
}

@keyframes neonFlicker {
  0%, 100% { 
    box-shadow: 
      0 0 15px rgba(0, 255, 255, 0.6),
      0 0 30px rgba(255, 0, 255, 0.3),
      inset 0 0 15px rgba(0, 255, 255, 0.15);
  }
  50% { 
    box-shadow: 
      0 0 20px rgba(0, 255, 255, 0.8),
      0 0 40px rgba(255, 0, 255, 0.5),
      inset 0 0 20px rgba(0, 255, 255, 0.2);
  }
}

@keyframes neonPulse {
  0%, 100% { 
    opacity: 0.8;
    box-shadow: 
      0 0 4px #00ffff,
      0 0 8px rgba(0, 255, 255, 0.5),
      0 0 12px rgba(255, 0, 255, 0.3);
  }
  50% { 
    opacity: 1;
    box-shadow: 
      0 0 8px #00ffff,
      0 0 16px rgba(0, 255, 255, 0.7),
      0 0 24px rgba(255, 0, 255, 0.5);
  }
}

@keyframes scanMove {
  0% { left: -4px; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: calc(100% + 4px); opacity: 0; }
}

@keyframes glitchFlicker {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.3; }
}
</style>
