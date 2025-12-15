<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 雪花
const snowflakes = ref<{ left: string; delay: string; duration: string }[]>([]);

onMounted(() => {
  // 生成随机雪花
  for (let i = 0; i < 15; i++) {
    snowflakes.value.push({
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`
    });
  }
});
</script>

<template>
  <div class="christmas-wrapper">
    <!-- 圣诞装饰元素 -->
    <div class="christmas-decorations">
      <!-- 雪花 -->
      <span 
        v-for="(snow, index) in snowflakes" 
        :key="index"
        class="snowflake"
        :style="{ left: snow.left, animationDelay: snow.delay, animationDuration: snow.duration }"
      >❄️</span>
      
      <!-- 中间装饰 -->
      <div class="center-decoration">
        <span class="tree">🎄</span>
      </div>
      
      <!-- 两侧铃铛 -->
      <span class="bell bell-left">🔔</span>
      <span class="bell bell-right">🔔</span>
    </div>
    
    <BaseNavbar theme-class="christmas-navbar" />
  </div>
</template>

<style lang="scss" scoped>
$xmas-green: #1b5e20;
$xmas-red: #c62828;
$xmas-gold: #ffd700;

.christmas-wrapper {
  width: 100%;
  position: relative;
  
  :deep(.christmas-navbar) {
    background: linear-gradient(180deg, $xmas-green 0%, darken($xmas-green, 5%) 100%) !important;
    border-bottom: 2px solid rgba($xmas-gold, 0.4) !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
  }
  
  .christmas-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    overflow: hidden;
    
    // 雪花
    .snowflake {
      position: absolute;
      top: 6px;
      font-size: 12px;
      animation: snow-fall 3s ease-in-out infinite;
      opacity: 0.9;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
    }
    
    // 中间装饰
    .center-decoration {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      
      .tree {
        font-size: 30px;
        animation: tree-glow 2s ease-in-out infinite;
        filter: drop-shadow(0 0 8px rgba($xmas-green, 0.6)) drop-shadow(0 0 15px rgba($xmas-gold, 0.4));
      }
    }
    
    // 铃铛
    .bell {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      
      &.bell-left {
        left: 25%;
        animation: bell-swing 1.5s ease-in-out infinite;
      }
      
      &.bell-right {
        right: 25%;
        animation: bell-swing 1.5s ease-in-out infinite 0.3s;
      }
    }
  }
}

// 动画
@keyframes snow-fall {
  0%, 100% { opacity: 0.5; transform: translateY(0) rotate(0deg); }
  50% { opacity: 1; transform: translateY(3px) rotate(180deg); }
}

@keyframes tree-glow {
  0%, 100% { 
    transform: scale(1); 
    filter: drop-shadow(0 0 8px rgba($xmas-green, 0.6)) drop-shadow(0 0 15px rgba($xmas-gold, 0.4));
  }
  50% { 
    transform: scale(1.05); 
    filter: drop-shadow(0 0 12px rgba($xmas-green, 0.8)) drop-shadow(0 0 20px rgba($xmas-gold, 0.6));
  }
}

@keyframes bell-swing {
  0%, 100% { transform: translateY(-50%) rotate(-10deg); }
  50% { transform: translateY(-50%) rotate(10deg); }
}
</style>
