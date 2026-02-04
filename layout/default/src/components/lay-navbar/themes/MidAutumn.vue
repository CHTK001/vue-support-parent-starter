<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 满月光晕
const moonPhase = ref(0);

// 星星闪烁动画
const stars = ref<{ left: string; top: string; delay: string; duration: string; size: string }[]>([]);

onMounted(() => {
  for (let i = 0; i < 25; i++) {
    stars.value.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: `${1 + Math.random() * 2}px`
    });
  }
});
</script>

<template>
  <div class="mid-autumn-wrapper">
    <!-- 夜空背景层 -->
    <div class="night-sky-layer"></div>
    
    <!-- 中秋装饰元素 -->
    <div class="mid-autumn-decorations">
      <!-- 巨大的月亮背景（模糊） -->
      <div class="moon-bg"></div>
      
      <!-- 星星 -->
      <span 
        v-for="(star, index) in stars" 
        :key="index"
        class="star"
        :style="{ 
          left: star.left, 
          top: star.top,
          width: star.size,
          height: star.size,
          animationDelay: star.delay, 
          animationDuration: star.duration 
        }"
      ></span>
      
      <!-- 飘动的云 -->
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
    </div>
    
    <BaseNavbar theme-class="mid-autumn-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.mid-autumn-wrapper {
  --ma-blue-dark: #0a1128;
  --ma-blue-light: #1c2e4a;
  --ma-gold: #ffd700;
  --ma-moon-glow: rgba(255, 215, 0, 0.2);
  
  width: 100%;
  position: relative;
  overflow: hidden;
  
  .night-sky-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, var(--ma-blue-dark) 0%, var(--ma-blue-light) 100%);
    z-index: 0;
  }
  
  .mid-autumn-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
    
    .moon-bg {
      position: absolute;
      right: 10%;
      top: -20px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #fffbe6, #ffd700);
      box-shadow: 0 0 40px var(--ma-moon-glow), 0 0 80px var(--ma-moon-glow);
      opacity: 0.8;
      filter: blur(2px);
    }
    
    .star {
      position: absolute;
      background: #fff;
      border-radius: 50%;
      animation: twinkle ease-in-out infinite;
      box-shadow: 0 0 4px #fff;
    }
    
    .cloud {
      position: absolute;
      width: 120px;
      height: 40px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      filter: blur(8px);
      
      &.cloud-1 { top: 20px; left: 20%; animation: float 20s linear infinite; }
      &.cloud-2 { top: 60%; right: 30%; width: 180px; animation: float 30s linear infinite reverse; }
    }
  }

  :deep(.mid-autumn-navbar) {
    background: transparent !important;
    border-bottom: 1px solid rgba(255, 215, 0, 0.15) !important;
    position: relative;
    z-index: 10;
    
    // 强制内部颜色
    .el-button, .el-dropdown, .breadcrumb-item, .breadcrumb-link {
      color: #e0e0e0 !important;
      
      &:hover {
        color: var(--ma-gold) !important;
      }
    }
    
    .search-wrapper {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 215, 0, 0.2);
      color: #fff;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes float {
  0% { transform: translateX(0); }
  50% { transform: translateX(20px); }
  100% { transform: translateX(0); }
}
</style>
