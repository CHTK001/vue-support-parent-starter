<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 金粉粒子
const particles = ref<{ left: string; delay: string; duration: string; size: string; opacity: number }[]>([]);

onMounted(() => {
  for (let i = 0; i < 20; i++) {
    particles.value.push({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${4 + Math.random() * 6}s`,
      size: `${2 + Math.random() * 4}px`,
      opacity: 0.3 + Math.random() * 0.7
    });
  }
});
</script>

<template>
  <div class="spring-festival-wrapper">
    <!-- 背景层：红色渐变 + 云纹 -->
    <div class="sf-bg-layer"></div>
    
    <!-- 装饰层 -->
    <div class="sf-decorations">
      <!-- 灯笼 -->
      <div class="lantern left">
        <div class="lantern-body">福</div>
        <div class="lantern-tassel"></div>
      </div>
      <div class="lantern right">
        <div class="lantern-body">春</div>
        <div class="lantern-tassel"></div>
      </div>
      
      <!-- 金粉粒子 -->
      <span 
        v-for="(p, index) in particles" 
        :key="index"
        class="particle"
        :style="{ 
          left: p.left, 
          animationDelay: p.delay, 
          animationDuration: p.duration,
          width: p.size,
          height: p.size,
          opacity: p.opacity
        }"
      ></span>
    </div>

    <BaseNavbar theme-class="spring-festival-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-wrapper {
  --sf-red: #b31217;
  --sf-red-light: #d71920;
  --sf-gold: #ffcf40;
  --sf-gold-light: #ffe082;
  
  width: 100%;
  position: relative;
  overflow: hidden;
  
  .sf-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, var(--sf-red) 0%, var(--sf-red-light) 50%, var(--sf-red) 100%);
    z-index: 0;
    box-shadow: 0 4px 12px rgba(179, 18, 23, 0.3);
    
    // 云纹纹理 (CSS 模拟)
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 100% 100%, transparent 10px, rgba(255, 207, 64, 0.05) 11px, transparent 12px),
        radial-gradient(circle at 0% 100%, transparent 10px, rgba(255, 207, 64, 0.05) 11px, transparent 12px);
      background-size: 40px 40px;
      opacity: 0.5;
    }
  }

  :deep(.spring-festival-navbar) {
    background: transparent !important;
    border-bottom: 1px solid rgba(255, 207, 64, 0.3) !important;
    position: relative;
    z-index: 10;
    
    // 文字颜色调整
    .el-button, .el-dropdown, .breadcrumb-item {
      color: var(--sf-gold-light) !important;
      
      &:hover {
        color: #fff !important;
      }
    }
    
    .search-wrapper {
      background: rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 207, 64, 0.2);
      color: var(--sf-gold-light);
      
      &::placeholder {
        color: rgba(255, 207, 64, 0.5);
      }
    }
  }
  
  .sf-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    
    .lantern {
      position: absolute;
      top: -5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      &.left { left: 40px; animation: swing 4s ease-in-out infinite; }
      &.right { right: 40px; animation: swing 4.5s ease-in-out infinite reverse; }
      
      .lantern-body {
        width: 36px;
        height: 30px;
        background: radial-gradient(circle at 30% 30%, #ff5252, #b71c1c);
        border-radius: 10px;
        border-top: 4px solid var(--sf-gold);
        border-bottom: 4px solid var(--sf-gold);
        color: var(--sf-gold);
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 2;
        
        &::after { // 灯笼穗连接点
          content: '';
          position: absolute;
          top: -10px;
          width: 2px;
          height: 10px;
          background: var(--sf-gold);
        }
      }
      
      .lantern-tassel {
        width: 4px;
        height: 20px;
        background: var(--sf-gold);
        margin-top: 0;
        position: relative;
        
        &::after { // 穗
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 15px;
          background: repeating-linear-gradient(90deg, var(--sf-red), var(--sf-red) 2px, transparent 2px, transparent 3px);
        }
      }
    }
    
    .particle {
      position: absolute;
      bottom: -10px;
      background: var(--sf-gold);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--sf-gold);
      animation: rise linear infinite;
    }
  }
}

@keyframes swing {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

:global(.dark) .spring-festival-wrapper {
  --sf-red: #6a0a0e;
  --sf-red-light: #8e1218;
  
  .sf-bg-layer {
     background: linear-gradient(90deg, var(--sf-red) 0%, var(--sf-red-light) 50%, var(--sf-red) 100%);
  }
}
</style>
