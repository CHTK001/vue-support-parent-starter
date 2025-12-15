<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted, onUnmounted } from 'vue';

// 星星闪烁动画
const stars = ref<{ left: string; delay: string; duration: string }[]>([]);

onMounted(() => {
  // 生成随机星星
  for (let i = 0; i < 12; i++) {
    stars.value.push({
      left: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${1.5 + Math.random() * 2}s`
    });
  }
});
</script>

<template>
  <div class="mid-autumn-wrapper">
    <!-- 中秋装饰元素 -->
    <div class="mid-autumn-decorations">
      <!-- 星星 -->
      <span 
        v-for="(star, index) in stars" 
        :key="index"
        class="star"
        :style="{ left: star.left, animationDelay: star.delay, animationDuration: star.duration }"
      >✨</span>
      
      <!-- 中间装饰组 -->
      <div class="center-decoration">
        <span class="rabbit">🐰</span>
        <span class="moon">🌕</span>
        <span class="mooncake">🥮</span>
      </div>
      
      <!-- 云朵 -->
      <span class="cloud cloud-left">☁️</span>
      <span class="cloud cloud-right">☁️</span>
    </div>
    
    <BaseNavbar theme-class="mid-autumn-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.mid-autumn-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.mid-autumn-navbar) {
    background: linear-gradient(180deg, #0d1b42 0%, #1a237e 50%, #283593 100%) !important;
    border-bottom: 2px solid rgba(255, 213, 79, 0.4) !important;
    box-shadow: 0 2px 10px rgba(26, 35, 126, 0.5) !important;
  }
  
  .mid-autumn-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    overflow: hidden;
    
    // 星星
    .star {
      position: absolute;
      top: 8px;
      font-size: 10px;
      animation: twinkle 2s ease-in-out infinite;
      opacity: 0.8;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
    }
    
    // 中间装饰组
    .center-decoration {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 16px;
      
      .rabbit {
        font-size: 20px;
        animation: hop 2s ease-in-out infinite;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
      }
      
      .moon {
        font-size: 28px;
        animation: glow 3s ease-in-out infinite;
        filter: drop-shadow(0 0 15px rgba(255, 213, 79, 0.8)) drop-shadow(0 0 30px rgba(255, 213, 79, 0.4));
      }
      
      .mooncake {
        font-size: 20px;
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.5));
      }
    }
    
    // 云朵
    .cloud {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      opacity: 0.4;
      filter: blur(0.5px);
      
      &.cloud-left {
        left: 20%;
        animation: drift-left 20s linear infinite;
      }
      
      &.cloud-right {
        right: 20%;
        animation: drift-right 25s linear infinite;
      }
    }
  }
}

// 动画
@keyframes twinkle {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes glow {
  0%, 100% { 
    transform: scale(1); 
    filter: drop-shadow(0 0 15px rgba(255, 213, 79, 0.8)) drop-shadow(0 0 30px rgba(255, 213, 79, 0.4));
  }
  50% { 
    transform: scale(1.1); 
    filter: drop-shadow(0 0 20px rgba(255, 213, 79, 1)) drop-shadow(0 0 40px rgba(255, 213, 79, 0.6));
  }
}

@keyframes hop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(5deg); }
}

@keyframes drift-left {
  0% { transform: translateY(-50%) translateX(0); opacity: 0.4; }
  50% { opacity: 0.6; }
  100% { transform: translateY(-50%) translateX(-30px); opacity: 0.4; }
}

@keyframes drift-right {
  0% { transform: translateY(-50%) translateX(0); opacity: 0.4; }
  50% { opacity: 0.6; }
  100% { transform: translateY(-50%) translateX(30px); opacity: 0.4; }
}
</style>
