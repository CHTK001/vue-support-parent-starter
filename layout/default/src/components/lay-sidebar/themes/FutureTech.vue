<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
import DefaultSidebarItem from '../components/themes/DefaultSidebarItem.vue';
import { ref, onMounted } from 'vue';

// 科技感粒子效果
const particles = ref<{ left: string; top: string; size: string; opacity: number; delay: string; duration: string }[]>([]);

onMounted(() => {
  for (let i = 0; i < 15; i++) {
    particles.value.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 3}px`,
      opacity: 0.1 + Math.random() * 0.3,
      delay: `${Math.random() * 5}s`,
      duration: `${10 + Math.random() * 15}s`
    });
  }
});
</script>

<template>
  <div class="future-tech-sidebar-wrapper">
    <!-- 背景装饰层 -->
    <div class="sidebar-bg-decor">
      <!-- 网格背景 -->
      <div class="grid-overlay"></div>
      
      <!-- 科技粒子 -->
      <span 
        v-for="(p, index) in particles" 
        :key="index"
        class="particle"
        :style="{ 
          left: p.left, 
          top: p.top,
          width: p.size,
          height: p.size,
          opacity: p.opacity,
          animationDelay: p.delay,
          animationDuration: p.duration
        }"
      ></span>
    </div>

    <BaseSidebar 
      theme-class="future-tech-sidebar" 
      :sidebar-item-component="DefaultSidebarItem" 
    />
  </div>
</template>

<style lang="scss" scoped>
.future-tech-sidebar-wrapper {
  --ft-cyan: #00ffff;
  --ft-cyan-light: #4dfdfd;
  --ft-cyan-dark: #00cccc;
  --ft-bg-dark: #050a1f;
  --ft-bg-darker: #0a1a3a;
  --ft-border: rgba(0, 255, 255, 0.4);
  
  height: 100%;
  position: relative;
  overflow: hidden;
  
  .sidebar-bg-decor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    
    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.3;
    }
    
    .particle {
      position: absolute;
      background: var(--ft-cyan);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--ft-cyan);
    }
  }

  :deep(.future-tech-sidebar) {
    background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
    border-right: 2px solid var(--ft-border) !important;
    position: relative;
    z-index: 1;
    backdrop-filter: blur(10px);
    box-shadow: 
      inset -10px 0 30px rgba(0, 255, 255, 0.1),
      0 0 40px rgba(0, 255, 255, 0.15) !important;
    
    .sidebar-logo-container {
      background: rgba(0, 0, 0, 0.2) !important;
      border-bottom: 1px solid var(--ft-border) !important;
      position: relative;
      
      // 顶部静态高亮线，去掉扫描动画
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--ft-cyan), transparent);
        opacity: 0.6;
      }
      
      .sidebar-logo-link .sidebar-title {
        color: var(--ft-cyan) !important;
        text-shadow: 
          0 0 10px rgba(0, 255, 255, 0.8),
          0 0 20px rgba(0, 255, 255, 0.4) !important;
        font-family: 'Courier New', 'Monaco', monospace;
        letter-spacing: 2px;
      }
    }
    
    .el-menu {
      background: transparent !important;
      border-right: none !important;
      
      .el-menu-item {
        color: rgba(0, 255, 255, 0.7) !important;
        border-left: 3px solid transparent;
        transition: all 0.3s ease;
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--ft-cyan);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: var(--ft-cyan) !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
          
          &::before {
            opacity: 1;
          }
        }
        
        &.is-active {
          background: rgba(0, 255, 255, 0.15) !important;
          color: var(--ft-cyan) !important;
          text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.4) !important;
          border-left-color: var(--ft-cyan) !important;
          
          &::before {
            opacity: 1;
            box-shadow: 0 0 10px var(--ft-cyan);
          }
        }
      }
      
      .el-sub-menu {
        .el-sub-menu__title {
          color: rgba(0, 255, 255, 0.7) !important;
          
          &:hover {
            background: rgba(0, 255, 255, 0.1) !important;
            color: var(--ft-cyan) !important;
            text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
          }
        }
        
        &.is-opened .el-sub-menu__title {
          color: var(--ft-cyan) !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
      }
    }
    
    .left-collapse {
      background: rgba(0, 0, 0, 0.3) !important;
      border-top: 1px solid var(--ft-border) !important;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-top-color: var(--ft-cyan) !important;
        box-shadow: 0 -2px 10px rgba(0, 255, 255, 0.3);
      }
      
      &.collapsed-state {
        background: rgba(0, 255, 255, 0.15) !important;
        border-top: 2px solid var(--ft-cyan) !important;
        box-shadow: 0 -2px 15px rgba(0, 255, 255, 0.4);
      }
      
      svg {
        color: var(--ft-cyan) !important;
        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
      }
    }
    
    .center-collapse {
      background: rgba(0, 0, 0, 0.3) !important;
      border-color: var(--ft-border) !important;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
      
      &:hover {
        border-color: var(--ft-cyan) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
      }
      
      svg {
        color: var(--ft-cyan) !important;
        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
      }
    }
  }
}

// 深色模式适配
:global(html.dark) {
  .future-tech-sidebar-wrapper {
    --ft-bg-dark: #000000;
    --ft-bg-darker: #0a0a0a;
    
    :deep(.future-tech-sidebar) {
      background: linear-gradient(180deg, rgba(5, 10, 31, 0.98), rgba(10, 26, 58, 0.95)) !important;
    }
  }
}
</style>

<style lang="scss">
// 二级导航弹出层全局样式（teleport 到 body）
html[data-skin='future-tech'] {
  $ft-cyan: #00ffff;
  $ft-bg: #050a1f;
  $ft-bg-light: #0a1a3a;
  $ft-border: rgba(0, 255, 255, 0.3);

  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: linear-gradient(135deg, rgba($ft-bg, 0.98) 0%, rgba($ft-bg-light, 0.98) 100%) !important;
    border: 2px solid $ft-border !important;
    border-radius: 8px !important;
    box-shadow:
      0 0 25px rgba($ft-cyan, 0.2),
      0 15px 40px rgba(0, 0, 0, 0.6) !important;
    overflow: hidden !important;
    padding: 6px !important;
    position: relative;

    // 顶部青色装饰线
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, $ft-cyan 20%, rgba(0, 255, 255, 0.5) 50%, $ft-cyan 80%, transparent);
      z-index: 1;
      box-shadow: 0 0 10px rgba($ft-cyan, 0.8);
    }

    .el-menu-item {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: rgba($ft-bg, 0.7) !important;
      border: 1.5px solid rgba($ft-cyan, 0.25) !important;
      color: rgba($ft-cyan, 0.7) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;

      &:hover {
        background: rgba($ft-bg-light, 0.9) !important;
        color: $ft-cyan !important;
        border-color: rgba($ft-cyan, 0.5) !important;
        transform: translateX(4px) !important;
        text-shadow: 0 0 8px rgba($ft-cyan, 0.6);
        box-shadow:
          0 4px 12px rgba($ft-cyan, 0.25),
          0 2px 8px rgba($ft-bg, 0.4) !important;
      }

      .el-icon, svg, .sub-menu-icon {
        color: rgba($ft-cyan, 0.7) !important;
        margin-right: 8px;
        filter: drop-shadow(0 0 3px rgba($ft-cyan, 0.5));
      }

      span, .el-text {
        color: inherit !important;
      }

      &.is-active {
        background: linear-gradient(135deg, rgba($ft-cyan, 0.2) 0%, rgba($ft-cyan, 0.1) 100%) !important;
        color: $ft-cyan !important;
        border: 2px solid $ft-cyan !important;
        font-weight: 700;
        text-shadow: 0 0 8px rgba($ft-cyan, 0.8);
        box-shadow:
          0 4px 16px rgba($ft-cyan, 0.5),
          0 0 20px rgba($ft-cyan, 0.3) !important;

        .el-icon, svg, .sub-menu-icon, span, .el-text {
          color: $ft-cyan !important;
          filter: drop-shadow(0 0 5px rgba($ft-cyan, 0.8));
        }

        &::after {
          content: '';
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 70%;
          background: linear-gradient(to bottom, $ft-cyan, rgba(0, 255, 255, 0.5), $ft-cyan);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba($ft-cyan, 0.8);
        }
      }
    }

    .el-sub-menu__title {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 8px !important;
      background: rgba($ft-bg, 0.7) !important;
      border: 1.5px solid rgba($ft-cyan, 0.25) !important;
      color: rgba($ft-cyan, 0.7) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: rgba($ft-bg-light, 0.9) !important;
        color: $ft-cyan !important;
        border-color: rgba($ft-cyan, 0.5) !important;
        transform: translateX(4px) !important;
        text-shadow: 0 0 8px rgba($ft-cyan, 0.6);
      }

      .el-icon, svg {
        color: rgba($ft-cyan, 0.7) !important;
        filter: drop-shadow(0 0 3px rgba($ft-cyan, 0.5));
      }

      .el-sub-menu__icon-arrow {
        color: rgba($ft-cyan, 0.7) !important;
        filter: drop-shadow(0 0 3px rgba($ft-cyan, 0.5));
      }
    }
  }
}
</style>

