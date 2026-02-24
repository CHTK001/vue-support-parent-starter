<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
import { ref, onMounted } from 'vue';

// 科技感粒子效果
const particles = ref<{ left: string; delay: string; duration: string; size: string; opacity: number; top: string }[]>([]);

onMounted(() => {
  for (let i = 0; i < 10; i++) {
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
  <div class="future-tech-breadcrumb-wrapper">
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

    <BaseBreadcrumb theme-class="future-tech-breadcrumb" />
  </div>
</template>

<style lang="scss">
.future-tech-breadcrumb-wrapper {
  --ft-cyan: #00ffff;
  --ft-cyan-light: #4dfdfd;
  --ft-cyan-dark: #00cccc;
  --ft-bg-dark: #050a1f;
  --ft-bg-darker: #0a1a3a;
  --ft-border: rgba(0, 255, 255, 0.4);
  
  position: relative;
  width: 100%;
  overflow: hidden;
  
  .ft-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9));
    z-index: 0;
    
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
    
    // 顶部静态高亮线，关闭扫描动画以提高性能
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

  .ft-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    
    .particle {
      position: absolute;
      background: var(--ft-cyan);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--ft-cyan);
    }
  }

  .future-tech-breadcrumb {
    position: relative;
    z-index: 10;
    background: transparent !important;
    border: 1px solid var(--ft-border) !important;
    border-radius: 8px !important;
    padding: 0 12px !important;
    backdrop-filter: blur(10px);
    box-shadow: 
      0 0 20px rgba(0, 255, 255, 0.15),
      inset 0 -1px 0 rgba(0, 255, 255, 0.2) !important;

    .home-icon {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid var(--ft-border) !important;
      color: var(--ft-cyan-light) !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.2) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: var(--ft-cyan) !important;
        color: var(--ft-cyan) !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.4) !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.8) !important;
        transform: translateY(-2px) !important;
      }

      &:active {
        transform: translateY(0) !important;
      }
    }

    .breadcrumb-divider {
      color: rgba(0, 255, 255, 0.5) !important;
    }

    .breadcrumb-link {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      color: var(--ft-cyan-light) !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.1) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: var(--ft-cyan) !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
        transform: translateY(-2px) !important;

        .breadcrumb-text {
          color: var(--ft-cyan) !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8) !important;
        }

        .breadcrumb-icon {
          color: var(--ft-cyan) !important;
          filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.8)) !important;
        }
      }

      &.is-current {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 204, 204, 0.15)) !important;
        border-color: var(--ft-cyan) !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.4),
          inset 0 0 20px rgba(0, 255, 255, 0.1) !important;
        cursor: default;
        pointer-events: none;

        .breadcrumb-text {
          color: var(--ft-cyan) !important;
          font-weight: 600 !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8) !important;
        }

        .breadcrumb-icon {
          color: var(--ft-cyan) !important;
          filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.8)) !important;
        }
      }
    }

    .breadcrumb-separator {
      color: rgba(0, 255, 255, 0.5) !important;
    }

    .breadcrumb-text {
      color: var(--ft-cyan-light) !important;
    }

    .breadcrumb-icon {
      color: var(--ft-cyan-light) !important;
    }
  }
}

// 动画
@keyframes scanLine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes float {
  0% {
    transform: translateY(100vh) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(20px);
    opacity: 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .future-tech-breadcrumb-wrapper {
    .future-tech-breadcrumb {
      padding: 0 8px !important;
      
      .home-icon {
        width: 28px !important;
        height: 28px !important;
        font-size: 14px !important;
      }

      .breadcrumb-link {
        padding: 4px 8px !important;
        
        .breadcrumb-text {
          font-size: 11px !important;
          max-width: 70px !important;
        }

        .breadcrumb-icon {
          font-size: 13px !important;
        }
      }
    }
  }
}
</style>

