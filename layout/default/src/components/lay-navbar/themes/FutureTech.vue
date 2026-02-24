<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 科技感粒子效果
const particles = ref<{ left: string; delay: string; duration: string; size: string; opacity: number; top: string }[]>([]);

onMounted(() => {
  for (let i = 0; i < 20; i++) {
    particles.value.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${2 + Math.random() * 3}px`,
      opacity: 0.1 + Math.random() * 0.4
    });
  }
});
</script>

<template>
  <div class="future-tech-navbar-wrapper">
    <!-- 背景层：深色渐变 + 网格纹理 -->
    <div class="ft-bg-layer"></div>
    
    <!-- 装饰层：科技粒子 -->
    <div class="ft-decorations">
      <span 
        v-for="(p, index) in particles" 
        :key="index"
        class="particle"
        :style="{ 
          left: p.left, 
          top: p.top,
          animationDelay: p.delay, 
          animationDuration: p.duration,
          width: p.size,
          height: p.size,
          opacity: p.opacity
        }"
      ></span>
    </div>

    <BaseNavbar theme-class="future-tech-navbar lay-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.future-tech-navbar-wrapper {
  --ft-cyan: #00ffff;
  --ft-cyan-light: #4dfdfd;
  --ft-cyan-dark: #00cccc;
  --ft-bg-dark: #050a1f;
  --ft-bg-darker: #0a1a3a;
  --ft-border: rgba(0, 255, 255, 0.4);
  
  width: 100%;
  position: relative;
  overflow: hidden;
  
  .ft-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, var(--ft-bg-dark) 0%, var(--ft-bg-darker) 50%, var(--ft-bg-dark) 100%);
    z-index: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    
    // 网格纹理
    &::before {
      content: '';
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
    
    // 顶部静态高亮线，保留科技感但不做循环动画
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
  }

  :deep(.future-tech-navbar) {
    background: linear-gradient(135deg, rgba(5, 10, 31, 0.9), rgba(10, 26, 58, 0.85)) !important;
    border-bottom: 2px solid var(--ft-border) !important;
    position: relative;
    z-index: 10;
    backdrop-filter: blur(10px);
    box-shadow: 
      0 0 20px rgba(0, 255, 255, 0.15),
      inset 0 -1px 0 rgba(0, 255, 255, 0.2) !important;
    
    // 文字颜色调整
    .el-button, .el-dropdown, .breadcrumb-item {
      color: var(--ft-cyan-light) !important;
      
      &:hover {
        color: var(--ft-cyan) !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
      }
    }
    
    .search-wrapper {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.3) !important;
      color: var(--ft-cyan) !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.2) !important;
      
      &::placeholder {
        color: rgba(0, 255, 255, 0.5);
      }
      
      &:focus {
        border-color: var(--ft-cyan) !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.4) !important;
      }
    }
    
    // 面包屑样式
    .breadcrumb-container {
      :deep(.el-breadcrumb__inner) {
        color: var(--ft-cyan-light) !important;
        
        &:hover {
          color: var(--ft-cyan) !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
        }
      }
      
      :deep(.el-breadcrumb__separator) {
        color: rgba(0, 255, 255, 0.5) !important;
      }
    }
  }
  
  .ft-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    
    .particle {
      position: absolute;
      background: var(--ft-cyan);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--ft-cyan);
    }
  }
}


// 深色模式适配
:global(html.dark) {
  .future-tech-navbar-wrapper {
    --ft-bg-dark: #000000;
    --ft-bg-darker: #0a0a0a;
    
    .ft-bg-layer {
      background: #050a1f !important;
      
      &::before {
        opacity: 0.2;
      }
    }
  }
}
</style>

