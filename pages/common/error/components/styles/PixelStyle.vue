<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, ref, onMounted, onUnmounted } from "vue";

defineOptions({
  name: "PixelStyle",
});

const props = defineProps<{
  code: number | string;
  title: string;
  description: string;
}>();

const emit = defineEmits<{
  goHome: [];
  goBack: [];
}>();

const { t } = useI18n();

// 获取错误码字符串
const errorCode = computed(() => String(props.code));

// 404场景：数字捉迷藏动画
const hidingDigit = ref(0);
let hideTimer: number | null = null;

onMounted(() => {
  if (errorCode.value === "404") {
    hideTimer = window.setInterval(() => {
      hidingDigit.value = (hidingDigit.value + 1) % 3;
    }, 2000);
  }
});

onUnmounted(() => {
  if (hideTimer) {
    clearInterval(hideTimer);
  }
});
</script>

<template>
  <div class="pixel-error-container" :class="'scene-' + errorCode">
    <!-- 扫描线效果 -->
    <div class="scanlines"></div>
    
    <!-- ==================== 403 禁止访问场景：恐龙被栅栏挡住 ==================== -->
    <div v-if="errorCode === '403'" class="game-scene scene-403">
      <div class="pixel-clouds">
        <div class="pixel-cloud cloud-1"></div>
        <div class="pixel-cloud cloud-2"></div>
      </div>
      
      <!-- 禁止标志 -->
      <div class="forbidden-sign">
        <div class="sign-post"></div>
        <div class="sign-board">🚫</div>
      </div>
      
      <!-- 栅栏 -->
      <div class="fence">
        <div class="fence-post" v-for="i in 5" :key="i"></div>
        <div class="fence-bar top"></div>
        <div class="fence-bar bottom"></div>
      </div>
      
      <!-- 恐龙在栅栏后面张望 -->
      <div class="dino-wrapper behind-fence">
        <div class="pixel-dino"></div>
        <div class="pixel-bubble">😤</div>
      </div>
      
      <!-- 错误码 - 被锁链缠绕 -->
      <div class="pixel-code locked">
        <div class="chain"></div>
        <div class="pixel-digit" v-for="(digit, index) in errorCode.split('')" :key="index">
          <span class="digit-inner">{{ digit }}</span>
        </div>
        <div class="padlock">🔒</div>
      </div>
      
      <div class="pixel-ground"></div>
    </div>
    
    <!-- ==================== 404 找不到场景：迷宫寻宝 ==================== -->
    <div v-else-if="errorCode === '404'" class="game-scene scene-404">
      <!-- 迷宫背景 -->
      <div class="maze-bg">
        <div class="maze-wall w1"></div>
        <div class="maze-wall w2"></div>
        <div class="maze-wall w3"></div>
        <div class="maze-wall w4"></div>
      </div>
      
      <!-- 问号路标 -->
      <div class="signpost">
        <div class="post"></div>
        <div class="arrow left">← ???</div>
        <div class="arrow right">??? →</div>
      </div>
      
      <!-- 恐龙拿着地图迷路了 -->
      <div class="dino-wrapper lost">
        <div class="pixel-dino"></div>
        <div class="map">🗺️</div>
        <div class="pixel-bubble">❓</div>
        <div class="sweat">💦</div>
      </div>
      
      <!-- 404 藏在不同地方 -->
      <div class="pixel-code scattered">
        <div class="pixel-digit hiding-spot spot1">
          <span class="digit-inner">4</span>
          <span class="peek">👀</span>
        </div>
        <div class="pixel-digit hiding-spot spot2">
          <span class="digit-inner">0</span>
          <span class="peek">👀</span>
        </div>
        <div class="pixel-digit hiding-spot spot3">
          <span class="digit-inner">4</span>
          <span class="peek">👀</span>
        </div>
      </div>
      
      <!-- 宝箱（代表要找的页面） -->
      <div class="treasure">📦</div>
      
      <div class="pixel-ground maze"></div>
    </div>
    
    <!-- ==================== 500 施工场景 ==================== -->
    <div v-else-if="errorCode === '500'" class="game-scene scene-500">
      <!-- 施工背景 -->
      <div class="construction-bg">
        <div class="warning-stripe"></div>
      </div>
      
      <!-- 施工标志 -->
      <div class="construction-sign">
        <div class="sign-stand"></div>
        <div class="sign-board">🚧</div>
      </div>
      
      <!-- 施工锥 -->
      <div class="traffic-cones">
        <span class="cone">🔶</span>
        <span class="cone">🔶</span>
        <span class="cone">🔶</span>
      </div>
      
      <!-- 恐龙戴着安全帽在施工 -->
      <div class="dino-wrapper worker">
        <div class="hard-hat">⛑️</div>
        <div class="pixel-dino"></div>
        <div class="pixel-bubble">🔧</div>
        <div class="tool">🔨</div>
      </div>
      
      <!-- 500 被施工围栏遮挡 -->
      <div class="pixel-code under-construction">
        <div class="barrier-tape top"></div>
        <div class="pixel-digit" v-for="(digit, index) in errorCode.split('')" :key="index">
          <span class="digit-inner">{{ digit }}</span>
        </div>
        <div class="barrier-tape bottom"></div>
        <div class="fixing-text">修复中...</div>
      </div>
      
      <!-- 工具箱 -->
      <div class="toolbox">🧰</div>
      
      <div class="pixel-ground construction"></div>
    </div>
    
    <!-- ==================== 默认场景：经典像素恐龙 ==================== -->
    <div v-else class="game-scene scene-default">
      <div class="pixel-clouds">
        <div class="pixel-cloud cloud-1"></div>
        <div class="pixel-cloud cloud-2"></div>
      </div>
      
      <div class="dino-wrapper">
        <div class="pixel-dino sad"></div>
        <div class="pixel-bubble">😢</div>
        <div class="pixel-tear"></div>
      </div>
      
      <div class="obstacles">
        <div class="pixel-cactus"></div>
        <div class="pixel-cactus small"></div>
      </div>
      
      <div class="pixel-code">
        <div class="pixel-digit" v-for="(digit, index) in errorCode.split('')" :key="index">
          <span class="digit-inner">{{ digit }}</span>
        </div>
      </div>
      
      <div class="pixel-ground"></div>
    </div>

    <!-- 错误信息 -->
    <div class="error-info">
      <h1 class="error-title pixel-text">{{ title }}</h1>
      <p class="error-desc pixel-text">{{ description }}</p>

      <!-- 趣味提示 -->
      <p class="fun-hint pixel-text" v-if="errorCode === '403'">
        🚧 此区域需要特殊权限才能进入
      </p>
      <p class="fun-hint pixel-text" v-else-if="errorCode === '404'">
        🔍 小恐龙正在努力寻找页面...
      </p>
      <p class="fun-hint pixel-text" v-else-if="errorCode === '500'">
        🔧 服务器正在抢救中，请稍候...
      </p>

      <!-- 像素风格按钮 -->
      <div class="action-buttons">
        <button class="pixel-btn primary" @click="emit('goHome')">
          <span>▶ {{ t("error.goHome") }}</span>
        </button>
        <button class="pixel-btn secondary" @click="emit('goBack')">
          <span>◀ {{ t("error.goBack") }}</span>
        </button>
      </div>
    </div>
    
    <!-- 像素边框装饰 -->
    <div class="pixel-border top-left"></div>
    <div class="pixel-border top-right"></div>
    <div class="pixel-border bottom-left"></div>
    <div class="pixel-border bottom-right"></div>
  </div>
</template>

<style lang="scss" scoped>
// 像素单位大小
$pixel: 4px;
$dino-color: #535353;
$dino-color-dark: #a0a0a0;

.pixel-error-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 40px 20px;
  min-height: 100vh;
  background: #f7f7f7;
  image-rendering: pixelated;
  
  :global(.dark) & {
    background: #1a1a2e;
  }
}

// CRT扫描线效果
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03),
    rgba(0, 0, 0, 0.03) 1px,
    transparent 1px,
    transparent 2px
  );
  z-index: 100;
}

// 像素边框装饰
.pixel-border {
  position: absolute;
  width: 32px;
  height: 32px;
  
  &::before, &::after {
    content: "";
    position: absolute;
    background: $dino-color;
    
    :global(.dark) & {
      background: $dino-color-dark;
    }
  }
  
  &.top-left {
    top: 20px;
    left: 20px;
    &::before { width: 32px; height: $pixel; top: 0; left: 0; }
    &::after { width: $pixel; height: 32px; top: 0; left: 0; }
  }
  &.top-right {
    top: 20px;
    right: 20px;
    &::before { width: 32px; height: $pixel; top: 0; right: 0; }
    &::after { width: $pixel; height: 32px; top: 0; right: 0; }
  }
  &.bottom-left {
    bottom: 20px;
    left: 20px;
    &::before { width: 32px; height: $pixel; bottom: 0; left: 0; }
    &::after { width: $pixel; height: 32px; bottom: 0; left: 0; }
  }
  &.bottom-right {
    bottom: 20px;
    right: 20px;
    &::before { width: 32px; height: $pixel; bottom: 0; right: 0; }
    &::after { width: $pixel; height: 32px; bottom: 0; right: 0; }
  }
}

// 游戏场景 - 全屏宽度
.game-scene {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

// 像素云朵 - 使用box-shadow绘制
.pixel-clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
}

.pixel-cloud {
  position: absolute;
  width: $pixel;
  height: $pixel;
  background: transparent;
  
  // 使用box-shadow绘制像素云朵
  box-shadow:
    // 第一层
    0 0 0 $pixel $dino-color,
    #{$pixel} 0 0 $pixel $dino-color,
    #{$pixel * 2} 0 0 $pixel $dino-color,
    #{$pixel * 3} 0 0 $pixel $dino-color,
    #{$pixel * 4} 0 0 $pixel $dino-color,
    #{$pixel * 5} 0 0 $pixel $dino-color,
    #{$pixel * 6} 0 0 $pixel $dino-color,
    #{$pixel * 7} 0 0 $pixel $dino-color,
    #{$pixel * 8} 0 0 $pixel $dino-color,
    // 第二层
    #{-$pixel} #{-$pixel} 0 $pixel $dino-color,
    0 #{-$pixel} 0 $pixel $dino-color,
    #{$pixel} #{-$pixel} 0 $pixel $dino-color,
    #{$pixel * 2} #{-$pixel} 0 $pixel $dino-color,
    #{$pixel * 6} #{-$pixel} 0 $pixel $dino-color,
    #{$pixel * 7} #{-$pixel} 0 $pixel $dino-color,
    #{$pixel * 8} #{-$pixel} 0 $pixel $dino-color,
    #{$pixel * 9} #{-$pixel} 0 $pixel $dino-color;
    
  :global(.dark) & {
    box-shadow:
      0 0 0 $pixel $dino-color-dark,
      #{$pixel} 0 0 $pixel $dino-color-dark,
      #{$pixel * 2} 0 0 $pixel $dino-color-dark,
      #{$pixel * 3} 0 0 $pixel $dino-color-dark,
      #{$pixel * 4} 0 0 $pixel $dino-color-dark,
      #{$pixel * 5} 0 0 $pixel $dino-color-dark,
      #{$pixel * 6} 0 0 $pixel $dino-color-dark,
      #{$pixel * 7} 0 0 $pixel $dino-color-dark,
      #{$pixel * 8} 0 0 $pixel $dino-color-dark,
      #{-$pixel} #{-$pixel} 0 $pixel $dino-color-dark,
      0 #{-$pixel} 0 $pixel $dino-color-dark,
      #{$pixel} #{-$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{-$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 6} #{-$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{-$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{-$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{-$pixel} 0 $pixel $dino-color-dark;
  }
  
  &.cloud-1 {
    top: 30px;
    right: 100px;
    animation: cloud-drift 15s linear infinite;
  }
  &.cloud-2 {
    top: 50px;
    right: 250px;
    transform: scale(0.7);
    animation: cloud-drift 20s linear infinite;
    animation-delay: -5s;
  }
  &.cloud-3 {
    top: 20px;
    right: 400px;
    transform: scale(0.5);
    animation: cloud-drift 18s linear infinite;
    animation-delay: -10s;
  }
}

// 像素恐龙 - Chrome风格
.dino-wrapper {
  position: absolute;
  bottom: 60px;
  left: 80px;
}

.pixel-dino {
  width: $pixel;
  height: $pixel;
  background: transparent;
  animation: dino-run 0.2s steps(1) infinite;
  
  // Chrome恐龙像素画
  box-shadow:
    // 头部顶端
    #{$pixel * 8} 0 0 $pixel $dino-color,
    #{$pixel * 9} 0 0 $pixel $dino-color,
    #{$pixel * 10} 0 0 $pixel $dino-color,
    #{$pixel * 11} 0 0 $pixel $dino-color,
    #{$pixel * 12} 0 0 $pixel $dino-color,
    #{$pixel * 13} 0 0 $pixel $dino-color,
    // 头部第二行
    #{$pixel * 7} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 10} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 11} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 12} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 13} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 14} #{$pixel} 0 $pixel $dino-color,
    // 头部第三行（眼睛）
    #{$pixel * 7} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 10} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 11} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 12} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 13} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 14} #{$pixel * 2} 0 $pixel $dino-color,
    // 头部第四行
    #{$pixel * 7} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 10} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 11} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 12} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 13} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 14} #{$pixel * 3} 0 $pixel $dino-color,
    // 脖子
    #{$pixel * 7} #{$pixel * 4} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 4} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 4} 0 $pixel $dino-color,
    // 身体开始
    #{$pixel * 4} #{$pixel * 5} 0 $pixel $dino-color,
    #{$pixel * 7} #{$pixel * 5} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 5} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 5} 0 $pixel $dino-color,
    // 身体
    #{$pixel * 3} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 5} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 6} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 7} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 10} #{$pixel * 6} 0 $pixel $dino-color,
    // 身体+小手
    #{$pixel * 2} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 3} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 5} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 6} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 7} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 10} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 11} #{$pixel * 7} 0 $pixel $dino-color,
    // 身体
    #{$pixel * 1} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 3} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 5} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 6} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 7} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 8} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 8} 0 $pixel $dino-color,
    // 尾巴+身体
    0 #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 1} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 3} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 5} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 6} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 7} #{$pixel * 9} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 9} 0 $pixel $dino-color,
    // 腿部
    #{$pixel * 5} #{$pixel * 10} 0 $pixel $dino-color,
    #{$pixel * 6} #{$pixel * 10} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 10} 0 $pixel $dino-color,
    #{$pixel * 5} #{$pixel * 11} 0 $pixel $dino-color,
    #{$pixel * 8} #{$pixel * 11} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 12} 0 $pixel $dino-color,
    #{$pixel * 9} #{$pixel * 12} 0 $pixel $dino-color;
    
  :global(.dark) & {
    box-shadow:
      #{$pixel * 8} 0 0 $pixel $dino-color-dark,
      #{$pixel * 9} 0 0 $pixel $dino-color-dark,
      #{$pixel * 10} 0 0 $pixel $dino-color-dark,
      #{$pixel * 11} 0 0 $pixel $dino-color-dark,
      #{$pixel * 12} 0 0 $pixel $dino-color-dark,
      #{$pixel * 13} 0 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 10} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 11} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 12} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 13} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 14} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 10} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 11} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 12} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 13} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 14} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 10} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 11} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 12} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 13} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 14} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 5} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 5} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 5} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 5} 0 $pixel $dino-color-dark,
      #{$pixel * 3} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 5} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 6} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 10} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 3} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 5} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 6} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 10} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 11} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 1} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 3} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 5} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 6} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 8} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 8} 0 $pixel $dino-color-dark,
      0 #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 1} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 3} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 5} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 6} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 7} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 9} 0 $pixel $dino-color-dark,
      #{$pixel * 5} #{$pixel * 10} 0 $pixel $dino-color-dark,
      #{$pixel * 6} #{$pixel * 10} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 10} 0 $pixel $dino-color-dark,
      #{$pixel * 5} #{$pixel * 11} 0 $pixel $dino-color-dark,
      #{$pixel * 8} #{$pixel * 11} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 12} 0 $pixel $dino-color-dark,
      #{$pixel * 9} #{$pixel * 12} 0 $pixel $dino-color-dark;
  }
}

// 像素问号气泡
.pixel-bubble {
  position: absolute;
  top: -40px;
  left: 60px;
  width: 32px;
  height: 32px;
  background: #fff;
  border: $pixel solid $dino-color;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Press Start 2P", monospace;
  font-size: 16px;
  color: $dino-color;
  animation: bubble-float 2s ease-in-out infinite;
  
  :global(.dark) & {
    background: #2a2a4a;
    border-color: $dino-color-dark;
    color: $dino-color-dark;
  }
  
  &::after {
    content: "";
    position: absolute;
    bottom: -12px;
    left: 8px;
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-top-color: $dino-color;
    
    :global(.dark) & {
      border-top-color: $dino-color-dark;
    }
  }
}

// 像素眼泪
.pixel-tear {
  position: absolute;
  top: 20px;
  left: 105px;
  width: $pixel;
  height: $pixel;
  background: #6eb5ff;
  box-shadow:
    0 #{$pixel} 0 0 #6eb5ff,
    0 #{$pixel * 2} 0 0 #6eb5ff;
  animation: tear-fall 1s ease-in infinite;
}

// 像素错误代码
.pixel-code {
  position: absolute;
  top: 50px;
  right: 50px;
  display: flex;
  gap: 8px;
}

.pixel-digit {
  width: 48px;
  height: 64px;
  background: #ff4444;
  border: $pixel solid #cc0000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: digit-jump 0.5s ease-in-out infinite;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.2s; }
  
  .digit-inner {
    font-family: "Press Start 2P", monospace;
    font-size: 28px;
    color: #fff;
    text-shadow: 2px 2px 0 #cc0000;
  }
}

// 像素仙人掌
.obstacles {
  position: absolute;
  bottom: 60px;
  right: 80px;
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.pixel-cactus {
  width: $pixel;
  height: $pixel;
  background: transparent;
  
  box-shadow:
    #{$pixel * 2} 0 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 2} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 3} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 4} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 5} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 7} 0 $pixel $dino-color,
    #{$pixel * 2} #{$pixel * 8} 0 $pixel $dino-color,
    0 #{$pixel * 2} 0 $pixel $dino-color,
    0 #{$pixel * 3} 0 $pixel $dino-color,
    0 #{$pixel * 4} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 4} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 5} 0 $pixel $dino-color,
    #{$pixel * 4} #{$pixel * 6} 0 $pixel $dino-color,
    #{$pixel} #{$pixel * 4} 0 $pixel $dino-color,
    #{$pixel * 3} #{$pixel * 6} 0 $pixel $dino-color;
    
  :global(.dark) & {
    box-shadow:
      #{$pixel * 2} 0 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 2} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 3} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 5} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 7} 0 $pixel $dino-color-dark,
      #{$pixel * 2} #{$pixel * 8} 0 $pixel $dino-color-dark,
      0 #{$pixel * 2} 0 $pixel $dino-color-dark,
      0 #{$pixel * 3} 0 $pixel $dino-color-dark,
      0 #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 5} 0 $pixel $dino-color-dark,
      #{$pixel * 4} #{$pixel * 6} 0 $pixel $dino-color-dark,
      #{$pixel} #{$pixel * 4} 0 $pixel $dino-color-dark,
      #{$pixel * 3} #{$pixel * 6} 0 $pixel $dino-color-dark;
  }
  
  &.small {
    transform: scale(0.6);
  }
}

// 像素地面
.pixel-ground {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  height: $pixel;
  background: $dino-color;
  
  :global(.dark) & {
    background: $dino-color-dark;
  }
  
  &::after {
    content: "";
    position: absolute;
    top: $pixel * 2;
    left: 0;
    right: 0;
    height: $pixel;
    background: repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent #{$pixel * 3},
      $dino-color #{$pixel * 3},
      $dino-color #{$pixel * 4}
    );
    
    :global(.dark) & {
      background: repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent #{$pixel * 3},
        $dino-color-dark #{$pixel * 3},
        $dino-color-dark #{$pixel * 4}
      );
    }
  }
}

// 错误信息
.error-info {
  text-align: center;
  max-width: 400px;
  z-index: 10;
}

.pixel-text {
  font-family: "Press Start 2P", "Courier New", monospace;
  image-rendering: pixelated;
}

.error-title {
  font-size: 1.2rem;
  color: $dino-color;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  :global(.dark) & {
    color: #e0e0e0;
  }
}

.error-desc {
  font-size: 0.65rem;
  color: #757575;
  margin-bottom: 32px;
  line-height: 2;
  
  :global(.dark) & {
    color: #a0a0a0;
  }
}

// 像素按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.pixel-btn {
  font-family: "Press Start 2P", monospace;
  font-size: 0.7rem;
  padding: 16px 24px;
  border: $pixel solid;
  cursor: pointer;
  transition: transform 0.1s;
  position: relative;
  
  &::after {
    content: "";
    position: absolute;
    bottom: -$pixel * 2;
    left: $pixel;
    right: $pixel;
    height: $pixel * 2;
    background: inherit;
    filter: brightness(0.7);
  }
  
  &:hover {
    transform: translateY(2px);
    &::after {
      height: $pixel;
      bottom: -$pixel;
    }
  }
  
  &:active {
    transform: translateY($pixel * 2);
    &::after {
      display: none;
    }
  }
  
  &.primary {
    background: #4ade80;
    border-color: #166534;
    color: #166534;
  }
  
  &.secondary {
    background: #fbbf24;
    border-color: #92400e;
    color: #92400e;
  }
}

.hint-text {
  font-size: 0.55rem;
  color: #999;
  animation: blink 1s step-end infinite;
  
  :global(.dark) & {
    color: #666;
  }
}

.fun-hint {
  font-size: 0.6rem;
  color: #888;
  margin-bottom: 20px;
  animation: blink 2s ease-in-out infinite;
}

// ==================== 403 禁止访问场景样式 ====================
.scene-403 {
  .forbidden-sign {
    position: absolute;
    top: 20px;
    right: 80px;
    z-index: 20;
    
    .sign-post {
      width: 8px;
      height: 80px;
      background: #8B4513;
      margin: 0 auto;
    }
    
    .sign-board {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2.5rem;
      animation: sign-swing 2s ease-in-out infinite;
    }
  }
  
  .fence {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    z-index: 15;
    
    .fence-post {
      width: 12px;
      height: 60px;
      background: linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
      border-radius: 2px 2px 0 0;
    }
    
    .fence-bar {
      position: absolute;
      left: -10px;
      right: -10px;
      height: 8px;
      background: #8B4513;
      
      &.top { top: 15px; }
      &.bottom { top: 40px; }
    }
  }
  
  .behind-fence {
    left: 40px !important;
    z-index: 10;
    opacity: 0.8;
    animation: peek-fence 3s ease-in-out infinite;
  }
  
  .pixel-code.locked {
    position: relative;
    
    .chain {
      position: absolute;
      top: -10px;
      left: 0;
      right: 0;
      height: 20px;
      background: repeating-linear-gradient(
        90deg,
        #666 0px,
        #888 5px,
        #666 10px
      );
      border-radius: 10px;
    }
    
    .padlock {
      position: absolute;
      right: -40px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 2rem;
      animation: lock-shake 0.5s ease-in-out infinite;
    }
    
    .pixel-digit {
      opacity: 0.6;
      filter: grayscale(0.5);
    }
  }
}

// ==================== 404 迷宫寻宝场景样式 ====================
.scene-404 {
  .maze-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, #e8f4f8 0%, #d4e8ed 100%);
    border-radius: 8px;
    overflow: hidden;
    
    :global(.dark) & {
      background: linear-gradient(180deg, #1a2a3a 0%, #0d1a24 100%);
    }
    
    .maze-wall {
      position: absolute;
      background: #8B7355;
      border: 2px solid #6B5344;
      
      :global(.dark) & {
        background: #4a4a6a;
        border-color: #3a3a5a;
      }
      
      &.w1 { top: 30px; left: 20px; width: 80px; height: 12px; }
      &.w2 { top: 60px; right: 40px; width: 100px; height: 12px; }
      &.w3 { top: 20px; right: 100px; width: 12px; height: 60px; }
      &.w4 { bottom: 80px; left: 100px; width: 12px; height: 50px; }
    }
  }
  
  .signpost {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    
    .post {
      width: 8px;
      height: 60px;
      background: #8B4513;
      margin: 0 auto;
    }
    
    .arrow {
      position: absolute;
      font-family: "Press Start 2P", monospace;
      font-size: 0.4rem;
      color: #fff;
      background: #8B4513;
      padding: 4px 8px;
      white-space: nowrap;
      
      &.left {
        top: 10px;
        right: 8px;
        transform: rotate(-5deg);
      }
      &.right {
        top: 30px;
        left: 8px;
        transform: rotate(5deg);
      }
    }
  }
  
  .lost {
    animation: look-around 3s ease-in-out infinite;
    
    .map {
      position: absolute;
      top: 0;
      right: -25px;
      font-size: 1.2rem;
      animation: flip-map 2s ease-in-out infinite;
    }
    
    .sweat {
      position: absolute;
      top: -5px;
      right: 10px;
      font-size: 0.8rem;
      animation: sweat-drop 1s ease-in-out infinite;
    }
  }
  
  .pixel-code.scattered {
    position: absolute;
    top: 50px;
    right: 30px;
    display: flex;
    gap: 15px;
    
    .hiding-spot {
      position: relative;
      
      .peek {
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.8rem;
        animation: peek-boo 2s ease-in-out infinite;
      }
      
      &.spot1 {
        transform: rotate(-10deg) translateY(10px);
        animation: wiggle 3s ease-in-out infinite;
      }
      &.spot2 {
        transform: rotate(5deg) translateY(-5px);
        animation: wiggle 3s ease-in-out infinite 0.5s;
      }
      &.spot3 {
        transform: rotate(-5deg) translateY(15px);
        animation: wiggle 3s ease-in-out infinite 1s;
      }
    }
  }
  
  .treasure {
    position: absolute;
    bottom: 60px;
    right: 60px;
    font-size: 2rem;
    animation: treasure-glow 2s ease-in-out infinite;
    filter: drop-shadow(0 0 10px gold);
  }
  
  .pixel-ground.maze {
    background: #A0926B !important;
    
    :global(.dark) & {
      background: #3a3a5a !important;
    }
  }
}

// ==================== 500 施工场景样式 ====================
.scene-500 {
  .construction-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, #87CEEB 0%, #B0C4DE 100%);
    border-radius: 8px;
    overflow: hidden;
    
    :global(.dark) & {
      background: linear-gradient(180deg, #1a2a3a 0%, #2a3a4a 100%);
    }
    
    .warning-stripe {
      position: absolute;
      bottom: 50px;
      left: 0;
      right: 0;
      height: 20px;
      background: repeating-linear-gradient(
        45deg,
        #FFD700,
        #FFD700 10px,
        #000 10px,
        #000 20px
      );
    }
  }
  
  .construction-sign {
    position: absolute;
    top: 10px;
    right: 60px;
    z-index: 15;
    
    .sign-stand {
      width: 8px;
      height: 70px;
      background: #666;
      margin: 0 auto;
    }
    
    .sign-board {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2.5rem;
      animation: sign-sway 2s ease-in-out infinite;
    }
  }
  
  .traffic-cones {
    position: absolute;
    bottom: 55px;
    left: 30px;
    display: flex;
    gap: 40px;
    z-index: 10;
    
    .cone {
      font-size: 1.5rem;
      animation: cone-bounce 1s ease-in-out infinite;
      
      &:nth-child(2) { animation-delay: 0.3s; }
      &:nth-child(3) { animation-delay: 0.6s; }
    }
  }
  
  .worker {
    left: 80px !important;
    z-index: 20;
    animation: work-action 2s ease-in-out infinite;
    
    .hard-hat {
      position: absolute;
      top: -20px;
      left: 20px;
      font-size: 1.5rem;
      z-index: 25;
    }
    
    .tool {
      position: absolute;
      bottom: 20px;
      right: -15px;
      font-size: 1.2rem;
      animation: hammer-swing 0.5s ease-in-out infinite;
    }
  }
  
  .pixel-code.under-construction {
    position: absolute;
    top: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    
    .barrier-tape {
      position: absolute;
      left: -20px;
      right: -20px;
      height: 12px;
      background: repeating-linear-gradient(
        90deg,
        #FFD700,
        #FFD700 15px,
        #000 15px,
        #000 30px
      );
      
      &.top { top: -15px; transform: rotate(-3deg); }
      &.bottom { bottom: -15px; transform: rotate(3deg); }
    }
    
    .pixel-digit {
      background: #FF8C00 !important;
      border-color: #CC7000 !important;
    }
    
    .fixing-text {
      position: absolute;
      bottom: -35px;
      left: 50%;
      transform: translateX(-50%);
      font-family: "Press Start 2P", monospace;
      font-size: 0.5rem;
      color: #FF8C00;
      animation: blink 1s step-end infinite;
      white-space: nowrap;
    }
  }
  
  .toolbox {
    position: absolute;
    bottom: 55px;
    right: 100px;
    font-size: 2rem;
  }
  
  .pixel-ground.construction {
    background: #808080 !important;
    
    &::after {
      display: none;
    }
  }
}

// ==================== 场景动画 ====================
@keyframes sign-swing {
  0%, 100% { transform: translateX(-50%) rotate(-5deg); }
  50% { transform: translateX(-50%) rotate(5deg); }
}

@keyframes peek-fence {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px) translateY(-5px); }
}

@keyframes lock-shake {
  0%, 100% { transform: translateY(-50%) rotate(0deg); }
  25% { transform: translateY(-50%) rotate(-10deg); }
  75% { transform: translateY(-50%) rotate(10deg); }
}

@keyframes sun-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 30px #FFD700, 0 0 60px #FFA500; }
  50% { transform: scale(1.1); box-shadow: 0 0 40px #FFD700, 0 0 80px #FFA500; }
}

@keyframes search-look {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-10px) rotate(-5deg); }
  75% { transform: translateX(10px) rotate(5deg); }
}

@keyframes eyes-peek {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes footprint-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes smoke-rise {
  0% { transform: translateY(0) scale(1); opacity: 0.7; }
  100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
}

@keyframes door-close {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-20px); }
}

@keyframes warning-flash {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px #ff4444; }
  50% { opacity: 0.3; box-shadow: none; }
}

@keyframes tail-wiggle {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(10deg); }
}

@keyframes help-shake {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

@keyframes glitch {
  0%, 100% { transform: translateX(0); filter: none; }
  25% { transform: translateX(-2px); filter: hue-rotate(90deg); }
  75% { transform: translateX(2px); filter: hue-rotate(-90deg); }
}

@keyframes spark {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

// 404 迷宫场景动画
@keyframes look-around {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg) translateX(-5px); }
  75% { transform: rotate(10deg) translateX(5px); }
}

@keyframes flip-map {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

@keyframes sweat-drop {
  0%, 100% { opacity: 1; transform: translateY(0); }
  50% { opacity: 0; transform: translateY(10px); }
}

@keyframes peek-boo {
  0%, 100% { opacity: 1; transform: translateX(-50%) translateY(0); }
  50% { opacity: 0.5; transform: translateX(-50%) translateY(-5px); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-10deg) translateY(10px); }
  50% { transform: rotate(-5deg) translateY(8px); }
}

@keyframes treasure-glow {
  0%, 100% { filter: drop-shadow(0 0 10px gold); transform: scale(1); }
  50% { filter: drop-shadow(0 0 20px gold); transform: scale(1.1); }
}

// 500 施工场景动画
@keyframes sign-sway {
  0%, 100% { transform: translateX(-50%) rotate(-3deg); }
  50% { transform: translateX(-50%) rotate(3deg); }
}

@keyframes cone-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes work-action {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes hammer-swing {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-30deg); }
}

// 动画
@keyframes cloud-drift {
  0% { transform: translateX(100px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(-600px); opacity: 0; }
}

@keyframes dino-run {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes bubble-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes tear-fall {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}

@keyframes digit-jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// 响应式
@media (max-width: 600px) {
  .game-scene {
    transform: scale(0.7);
    transform-origin: center;
  }
  
  .error-title {
    font-size: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .pixel-btn {
    width: 100%;
  }
}
</style>
