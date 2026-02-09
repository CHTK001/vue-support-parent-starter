<script setup lang="ts">
import BaseNavbar from './BaseNavbar.vue';
import { ref, onMounted } from 'vue';

// 幽灵/蝙蝠粒子
const particles = ref<{ left: string; delay: string; duration: string; size: string; opacity: number; top: string }[]>([]);

onMounted(() => {
  for (let i = 0; i < 15; i++) {
    particles.value.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${6 + Math.random() * 8}s`,
      size: `${3 + Math.random() * 5}px`,
      opacity: 0.2 + Math.random() * 0.6
    });
  }
});
</script>

<template>
  <div class="halloween-wrapper">
    <!-- 背景层：紫色渐变 + 蜘蛛网纹理 -->
    <div class="hw-bg-layer"></div>
    
    <!-- 装饰层 -->
    <div class="hw-decorations">
      <!-- 南瓜 -->
      <div class="pumpkin left">
        <div class="pumpkin-stem"></div>
        <div class="pumpkin-body">
          <div class="eyes left-eye"></div>
          <div class="eyes right-eye"></div>
          <div class="mouth"></div>
        </div>
      </div>
      <div class="pumpkin right">
        <div class="pumpkin-stem"></div>
        <div class="pumpkin-body">
           <div class="eyes left-eye"></div>
          <div class="eyes right-eye"></div>
          <div class="mouth"></div>
        </div>
      </div>
      
      <!-- 漂浮粒子 -->
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

    <BaseNavbar theme-class="halloween-navbar lay-navbar" />
  </div>
</template>

<style lang="scss" scoped>
.halloween-wrapper {
  --hw-purple: #2c003e;
  --hw-purple-light: #4a148c;
  --hw-orange: #ff7518;
  --hw-orange-light: #ffab40;
  --hw-black: #121212;
  --hw-green: #76ff03;
  --hw-text: #ffffff;
  --hw-border: #76ff03;
  
  width: 100%;
  position: relative;
  overflow: hidden;
  
  .hw-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, var(--hw-purple) 0%, var(--hw-black) 50%, var(--hw-purple) 100%);
    z-index: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    
    // 纹理 (CSS 模拟)
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 50% 50%, transparent 10px, rgba(255, 117, 24, 0.05) 11px, transparent 12px);
      background-size: 50px 50px;
      opacity: 0.3;
    }
  }

  :deep(.halloween-navbar) {
    background: transparent !important;
    // 修复：增强底部分界线 (用户反馈点 2)
    border-bottom: 2px solid var(--hw-border) !important;
    position: relative;
    z-index: 10;
    
    // 文字颜色调整
    .el-button, .el-dropdown, .breadcrumb-item {
      color: var(--hw-orange-light) !important;
      
      &:hover {
        color: var(--hw-green) !important;
        text-shadow: 0 0 5px var(--hw-green);
      }
    }
    
    .search-wrapper {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(118, 255, 3, 0.3);
      color: var(--hw-orange);
      
      &::placeholder {
        color: rgba(255, 117, 24, 0.5);
      }
    }
  }
  
  .hw-decorations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    
    .pumpkin {
      position: absolute;
      top: 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      &.left { left: 40px; animation: float 4s ease-in-out infinite; }
      &.right { right: 40px; animation: float 5s ease-in-out infinite reverse; }
      
      .pumpkin-body {
        width: 40px;
        height: 30px;
        background: radial-gradient(circle at 30% 30%, #ff9e80, #e65100);
        border-radius: 15px;
        box-shadow: 0 0 10px rgba(255, 117, 24, 0.4);
        position: relative;
        z-index: 2;
        
        .eyes {
          position: absolute;
          top: 8px;
          width: 8px;
          height: 8px;
          background: #3e2723;
          border-radius: 50%;
          
          &.left-eye { left: 8px; }
          &.right-eye { right: 8px; }
        }

        .mouth {
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 6px;
          background: #3e2723;
          border-radius: 0 0 10px 10px;
        }
      }
      
      .pumpkin-stem {
        width: 6px;
        height: 8px;
        background: #2e7d32;
        margin-bottom: -4px;
        border-radius: 2px;
        z-index: 1;
      }
    }
    
    .particle {
      position: absolute;
      background: var(--hw-green);
      border-radius: 50%;
      box-shadow: 0 0 5px var(--hw-green);
      animation: drift linear infinite;
    }
  }
}

// 暗黑模式适配 (用户反馈点 3 & 4)
// 优化深色风格下的配色，避免“反人类”的高饱和度
:global(html.dark) {
  .halloween-wrapper {
    // 降低饱和度，使用更深的背景
    --hw-purple: #1a1a1a; 
    --hw-black: #000000;
    --hw-purple-light: #333333;
    --hw-orange: #d86b15; // 稍微暗一点的橙色
    --hw-orange-light: #e0e0e0; // 字体改为浅灰/白，保证可读性
    --hw-green: #4caf50; // 更自然的绿色
    --hw-border: #333333; // 边框颜色调暗
    
    .hw-bg-layer {
      // 纯黑/深灰背景，移除过于花哨的渐变
      background: #121212 !important;
      
      &::before {
        opacity: 0.1; // 纹理更淡
      }
    }
    
    :deep(.halloween-navbar) {
      border-bottom: 1px solid #333 !important; // 边框更细
      
      .el-button, .el-dropdown, .breadcrumb-item {
        color: #e0e0e0 !important; // 字体颜色正常化
        
        &:hover {
          color: var(--hw-orange) !important;
          text-shadow: none; // 移除发光，减少视觉疲劳
        }
      }
      
      .search-wrapper {
        background: #222;
        border-color: #444;
        color: #fff;
        
        &::placeholder {
          color: #666;
        }
      }
    }
    
    // 隐藏过于卡通的装饰，或者调暗
    .hw-decorations {
      opacity: 0.3;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes drift {
  0% { transform: translate(0, 0); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translate(20px, -20px); opacity: 0; }
}
</style>
