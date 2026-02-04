<script setup lang="ts">
/**
 * 元旦主题导航栏 - 冰雪蓝白清新现代风
 * 设计理念：清透玻璃感、轻盈纯净
 */
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 冰晶闪烁效果
const sparkles = ref<{ left: string; top: string; size: string; delay: string }[]>([]);

onMounted(() => {
  for (let i = 0; i < 15; i++) {
    sparkles.value.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 4}px`,
      delay: `${Math.random() * 3}s`
    });
  }
});
</script>

<template>
  <div class="new-year-navbar-wrapper">
    <!-- 冰霜背景层 -->
    <div class="ice-bg-layer"></div>
    
    <!-- 闪烁冰晶 -->
    <div class="sparkle-layer">
      <span 
        v-for="(s, index) in sparkles" 
        :key="index"
        class="sparkle"
        :style="{ 
          left: s.left, 
          top: s.top,
          width: s.size,
          height: s.size,
          animationDelay: s.delay
        }"
      ></span>
    </div>

    <BaseNavbar theme-class="new-year-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.new-year-navbar-wrapper {
  --ice-bg: rgba(245, 251, 255, 0.85);
  --ice-primary: #4EA8DE;
  --ice-border: rgba(124, 194, 232, 0.3);
  --ice-text: #1E5F8C;
  
  width: 100%;
  position: relative;
  overflow: hidden;
  
  .ice-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--ice-bg);
    backdrop-filter: blur(15px) saturate(180%);
    border-bottom: 1px solid var(--ice-border);
    z-index: 0;
  }
  
  .sparkle-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    
    .sparkle {
      position: absolute;
      background: white;
      border-radius: 50%;
      box-shadow: 0 0 4px #fff, 0 0 8px var(--ice-primary);
      animation: twinkle 3s infinite ease-in-out;
      opacity: 0;
    }
  }

  :deep(.new-year-navbar) {
    background: transparent !important;
    border-bottom: none !important;
    position: relative;
    z-index: 10;
    
    // 强制内部颜色适配冰雪主题
    .el-breadcrumb__inner, .breadcrumb-link {
      color: var(--ice-text) !important;
      font-weight: 500;
    }
    
    .el-breadcrumb__item:last-child .el-breadcrumb__inner {
      color: var(--ice-primary) !important;
      font-weight: 600;
    }
    
    .navbar-btn, .tool-item svg {
      color: var(--ice-primary) !important;
    }
    
    .search-wrapper {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid var(--ice-border);
      color: var(--ice-text);
      
      &::placeholder {
        color: rgba(30, 95, 140, 0.5);
      }
    }
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

:global(.dark) .new-year-navbar-wrapper {
  --ice-bg: rgba(20, 30, 48, 0.85); // 深蓝夜色
  --ice-text: #B8E0F2;
  --ice-primary: #7CC2E8;
  --ice-border: rgba(124, 194, 232, 0.15);
}
</style>
