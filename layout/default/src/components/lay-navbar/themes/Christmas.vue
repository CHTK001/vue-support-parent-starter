<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 雪花
const snowflakes = ref<{ left: string; delay: string; duration: string; size: string; opacity: number }[]>([]);

onMounted(() => {
  // 生成随机雪花，增加数量和随机性
  for (let i = 0; i < 30; i++) {
    snowflakes.value.push({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      size: `${8 + Math.random() * 8}px`,
      opacity: 0.4 + Math.random() * 0.6
    });
  }
});
</script>

<template>
  <div class="christmas-wrapper">
    <!-- 圣诞装饰背景层 -->
    <div class="christmas-bg-layer"></div>

    <!-- 圣诞装饰元素 -->
    <div class="christmas-decorations">
      <!-- 雪花 -->
      <span 
        v-for="(snow, index) in snowflakes" 
        :key="index"
        class="snowflake"
        :style="{ 
          left: snow.left, 
          animationDelay: snow.delay, 
          animationDuration: snow.duration,
          fontSize: snow.size,
          opacity: snow.opacity
        }"
      >❄️</span>
      
      <!-- 顶部挂饰线 -->
      <div class="garland-line"></div>

      <!-- 铃铛 (调整位置和动画) -->
      <div class="bell-container left">
        <span class="bell-string"></span>
        <span class="bell">🔔</span>
      </div>
      <div class="bell-container right">
        <span class="bell-string"></span>
        <span class="bell">🔔</span>
      </div>
    </div>
    
    <BaseNavbar theme-class="christmas-navbar" />
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

// 圣诞主题变量
.christmas-wrapper {
  --xmas-green: #144923; /* 更深邃的绿色 */
  --xmas-red: #d32f2f;
  --xmas-gold: #ffb300;
  --xmas-white: #ffffff;
  --navbar-height: 50px; // 假设高度，具体根据 BaseNavbar 调整

  width: 100%;
  position: relative;
  overflow: hidden;

  // 背景层 - 磨砂玻璃
  .christmas-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg, 
      rgba(20, 73, 35, 0.95) 0%, 
      rgba(27, 94, 32, 0.9) 100%
    );
    backdrop-filter: blur(10px);
    z-index: 0;
    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  // 覆盖 BaseNavbar 样式
  :deep(.christmas-navbar) {
    background: transparent !important; // 让背景层透出来
    border-bottom: none !important;
    box-shadow: none !important;
    position: relative;
    z-index: 10;
    
    // 强制修改内部文字颜色为浅色
    .el-button, .el-dropdown, .breadcrumb-item {
      color: var(--xmas-white) !important;
    }
    
    // 搜索框等背景适配
    .search-wrapper {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--xmas-white);
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }
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
    
    // 顶部金色线条
    .garland-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: repeating-linear-gradient(
        45deg,
        var(--xmas-red),
        var(--xmas-red) 10px,
        var(--xmas-white) 10px,
        var(--xmas-white) 20px,
        var(--xmas-green) 20px,
        var(--xmas-green) 30px
      );
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    // 雪花
    .snowflake {
      position: absolute;
      top: -20px;
      color: var(--xmas-white);
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
      animation: snow-fall linear infinite;
    }
    
    // 铃铛容器
    .bell-container {
      position: absolute;
      top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));

      &.left { left: 15%; animation: swing 3s ease-in-out infinite; }
      &.right { right: 15%; animation: swing 3.5s ease-in-out infinite reverse; }

      .bell-string {
        width: 2px;
        height: 15px; // 绳子长度
        background: var(--xmas-gold);
      }

      .bell {
        font-size: 20px;
        margin-top: -5px;
        transform-origin: top center;
      }
    }
  }
}

// 动画
@keyframes snow-fall {
  0% { transform: translateY(-20px) rotate(0deg); }
  100% { transform: translateY(60px) rotate(360deg); } // 飘落距离
}

@keyframes swing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

// 深色模式适配 (虽然圣诞本身就是深色，但可以微调)
:global(.dark) .christmas-wrapper {
  --xmas-green: #0a2f15;
  
  .christmas-bg-layer {
    background: linear-gradient(
      180deg, 
      rgba(10, 47, 21, 0.95) 0%, 
      rgba(15, 60, 25, 0.9) 100%
    );
  }
}
</style>
