<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import HalloweenSidebarItem from '../components/themes/HalloweenSidebarItem.vue';
import { ref, onMounted } from 'vue';

// 漂浮的蝙蝠或幽灵装饰
const floatItems = ref<{ left: string; top: string; size: string; opacity: number; type: string; animationDuration: string }[]>([]);
const types = ['bat', 'ghost'];

onMounted(() => {
  for (let i = 0; i < 8; i++) {
    floatItems.value.push({
      left: `${Math.random() * 90}%`,
      top: `${Math.random() * 90}%`,
      size: `${10 + Math.random() * 15}px`,
      opacity: 0.1 + Math.random() * 0.15,
      type: types[Math.floor(Math.random() * types.length)],
      animationDuration: `${10 + Math.random() * 20}s`
    });
  }
});
</script>

<template>
  <div class="halloween-sidebar-wrapper">
    <!-- 背景装饰 -->
    <div class="sidebar-bg-decor">
      <div 
        v-for="(item, index) in floatItems" 
        :key="index"
        :class="['bg-item', item.type]"
        :style="{ 
          left: item.left, 
          top: item.top, 
          width: item.size,
          height: item.size,
          opacity: item.opacity,
          animationDuration: item.animationDuration
        }"
      ></div>
    </div>

    <BaseSidebar 
      theme-class="halloween-sidebar" 
      :sidebar-item-component="HalloweenSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
.halloween-sidebar-wrapper {
  --hw-pumpkin: #ff7518;
  --hw-purple: #2c003e;
  --hw-purple-dark: #1a0026;
  --hw-purple-light: #4a148c;
  --hw-text: #b39ddb;
  
  --sidebar-bg-color: linear-gradient(180deg, var(--hw-purple) 0%, var(--hw-purple-dark) 100%);
  --sidebar-text-color: var(--hw-text);
  --sidebar-active-bg: rgba(255, 117, 24, 0.1);
  --sidebar-hover-bg: rgba(74, 20, 140, 0.3);
  --sidebar-border-color: #4a148c;

  height: 100%;
  position: relative;
  
  .sidebar-bg-decor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    
    .bg-item {
      position: absolute;
      background-repeat: no-repeat;
      background-size: contain;
      animation: float-around infinite linear;
      filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));

      &.bat {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234a148c'%3E%3Cpath d='M2,12c0,0,2-3,6-3c0,0,2,2,4,2s4-2,4-2c4,0,6,3,6,3s-2,4-7,4c-1,0-2-1-3-1s-2,1-3,1C4,16,2,12,2,12z'/%3E%3C/svg%3E");
      }

      &.ghost {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b39ddb'%3E%3Cpath d='M12,2C8,2,5,5,5,9v11l3.5-3.5L12,20l3.5-3.5L19,20V9C19,5,16,2,12,2z M9,9c0-0.83,0.67-1.5,1.5-1.5S12,8.17,12,9s-0.67,1.5-1.5,1.5S9,9.83,9,9z M15,9c0-0.83,0.67-1.5,1.5-1.5S18,8.17,18,9s-0.67,1.5-1.5,1.5S15,9.83,15,9z'/%3E%3C/svg%3E");
      }
    }

    @keyframes float-around {
      0% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(10deg); }
      66% { transform: translate(-20px, 20px) rotate(-10deg); }
      100% { transform: translate(0, 0) rotate(0deg); }
    }
  }

  :deep(.halloween-sidebar) {
    background: var(--sidebar-bg-color) !important;
    border-right: 1px solid var(--sidebar-border-color) !important;
    position: relative;
    z-index: 1;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
    
    // Logo
    .sidebar-logo-container {
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--sidebar-border-color);
      
      .sidebar-logo-link .sidebar-title {
        color: var(--hw-pumpkin) !important;
        text-shadow: 0 0 5px rgba(255, 117, 24, 0.4);
        font-family: 'Creepster', 'cursive', sans-serif;
      }
    }
    
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .left-collapse, .center-collapse {
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--sidebar-border-color);
      color: var(--hw-pumpkin);
      
      &:hover {
        background: var(--hw-purple-light);
        color: var(--hw-green);
        text-shadow: 0 0 5px var(--hw-green);
      }
    }
  }
}
</style>
