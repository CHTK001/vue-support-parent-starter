<script setup lang="ts">
/**
 * 全屏加载遮罩组件
 * 支持多种加载动画风格，可通过配置文件控制
 * @author CH
 * @since 2024-12-07
 * @version 1.0.0
 */
import { computed, ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  /**
   * 是否显示加载遮罩
   */
  modelValue: {
    type: Boolean,
    default: true
  },
  /**
   * 加载动画风格
   * - spinner: 简单旋转圈
   * - clock: 动态时钟
   * - pixel: 像素恐龙
   * - cube: 3D立方体
   * - dots: 波浪圆点
   * - pulse: 脉冲圆环
   */
  style: {
    type: String,
    default: "spinner",
    validator: (val: string) => ["spinner", "clock", "pixel", "cube", "dots", "pulse"].includes(val)
  },
  /**
   * 加载提示文字
   */
  text: {
    type: String,
    default: "系统初始化中..."
  },
  /**
   * 是否显示进度条
   */
  showProgress: {
    type: Boolean,
    default: false
  },
  /**
   * 背景模糊程度
   */
  blur: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(["update:modelValue"]);

// 时钟相关状态
const currentTime = ref(new Date());
const clockTimer = ref<number | null>(null);

// 时钟指针角度计算
const secondRotation = computed(() => currentTime.value.getSeconds() * 6);
const minuteRotation = computed(() => {
  const minutes = currentTime.value.getMinutes();
  const seconds = currentTime.value.getSeconds();
  return minutes * 6 + seconds * 0.1;
});
const hourRotation = computed(() => {
  const hours = currentTime.value.getHours() % 12;
  const minutes = currentTime.value.getMinutes();
  return hours * 30 + minutes * 0.5;
});

// 启动时钟
const startClock = () => {
  if (props.style === "clock") {
    clockTimer.value = window.setInterval(() => {
      currentTime.value = new Date();
    }, 1000);
  }
};

// 停止时钟
const stopClock = () => {
  if (clockTimer.value) {
    clearInterval(clockTimer.value);
    clockTimer.value = null;
  }
};

onMounted(() => {
  startClock();
});

onUnmounted(() => {
  stopClock();
});

/**
 * 关闭加载遮罩
 */
const close = () => {
  emit("update:modelValue", false);
};

defineExpose({
  close
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="sc-fullscreen-loading" :style="{ '--blur': blur + 'px' }">
        <!-- Spinner 风格 - 简单旋转圈 -->
        <div v-if="style === 'spinner'" class="loading-wrapper">
          <div class="spinner-container">
            <div class="spinner"></div>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>

        <!-- Clock 风格 - 动态时钟 -->
        <div v-else-if="style === 'clock'" class="loading-wrapper loading-clock">
          <div class="clock-container">
            <svg viewBox="0 0 100 100" class="clock-svg">
              <!-- 外圈 -->
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
              <!-- 刻度 -->
              <g class="clock-marks">
                <line v-for="i in 12" :key="i" 
                  x1="50" y1="10" x2="50" :y2="i % 3 === 0 ? 16 : 14"
                  :transform="`rotate(${i * 30} 50 50)`"
                  stroke="currentColor" 
                  :stroke-width="i % 3 === 0 ? 2 : 1"
                  :opacity="i % 3 === 0 ? 0.6 : 0.3"
                />
              </g>
              <!-- 时针 -->
              <line class="clock-hand"
                x1="50" y1="50" x2="50" y2="28"
                stroke="currentColor" stroke-width="3" stroke-linecap="round"
                :transform="`rotate(${hourRotation} 50 50)`"
              />
              <!-- 分针 -->
              <line class="clock-hand"
                x1="50" y1="50" x2="50" y2="18"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                :transform="`rotate(${minuteRotation} 50 50)`"
              />
              <!-- 秒针 -->
              <line class="second-hand"
                x1="50" y1="55" x2="50" y2="14"
                stroke="var(--el-color-primary, #409eff)" stroke-width="1" stroke-linecap="round"
                :transform="`rotate(${secondRotation} 50 50)`"
              />
              <!-- 中心点 -->
              <circle cx="50" cy="50" r="4" fill="currentColor"/>
              <circle cx="50" cy="50" r="2" fill="var(--el-color-primary, #409eff)"/>
            </svg>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>

        <!-- Pixel 风格 - 像素恐龙 -->
        <div v-else-if="style === 'pixel'" class="loading-wrapper loading-pixel">
          <div class="pixel-scene">
            <!-- 云朵 -->
            <div class="pixel-clouds">
              <div class="pixel-cloud cloud-1"></div>
              <div class="pixel-cloud cloud-2"></div>
            </div>
            <!-- 恐龙 -->
            <div class="dino-container">
              <div class="pixel-dino">
                <div class="dino-sprite"></div>
              </div>
            </div>
            <!-- 仙人掌 -->
            <div class="cactus-container">
              <div class="pixel-cactus"></div>
            </div>
            <!-- 地面 -->
            <div class="pixel-ground"></div>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>

        <!-- Cube 风格 - 3D立方体 -->
        <div v-else-if="style === 'cube'" class="loading-wrapper loading-cube">
          <div class="cube-container">
            <div class="cube">
              <div class="cube-face front"></div>
              <div class="cube-face back"></div>
              <div class="cube-face right"></div>
              <div class="cube-face left"></div>
              <div class="cube-face top"></div>
              <div class="cube-face bottom"></div>
            </div>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>

        <!-- Dots 风格 - 波浪圆点 -->
        <div v-else-if="style === 'dots'" class="loading-wrapper loading-dots">
          <div class="dots-container">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>

        <!-- Pulse 风格 - 脉冲圆环 -->
        <div v-else-if="style === 'pulse'" class="loading-wrapper loading-pulse">
          <div class="pulse-container">
            <div class="pulse-ring"></div>
            <div class="pulse-ring"></div>
            <div class="pulse-ring"></div>
            <div class="pulse-core"></div>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>

        <!-- 进度条 -->
        <div v-if="showProgress" class="progress-container">
          <div class="progress-track">
            <div class="progress-bar"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.sc-fullscreen-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.9));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(var(--blur));
  
  :global(.dark) & {
    background: rgba(20, 20, 30, 0.95);
  }
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  :global(.dark) & {
    background: rgba(30, 30, 50, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
  letter-spacing: 2px;
  
  :global(.dark) & {
    color: #e0e0e0;
  }
}

// ==================== Spinner 风格 ====================
.spinner-container {
  width: 48px;
  height: 48px;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 4px solid #e5e7eb;
  border-top: 4px solid var(--el-color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  :global(.dark) & {
    border-color: #4a4a6a;
    border-top-color: var(--el-color-primary, #3b82f6);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ==================== Clock 风格 ====================
.clock-container {
  width: 80px;
  height: 80px;
  color: #333;
  
  :global(.dark) & {
    color: #e0e0e0;
  }
}

.clock-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.clock-hand {
  transition: transform 0.1s cubic-bezier(0.4, 2.08, 0.55, 0.44);
  transform-origin: 50px 50px;
}

.second-hand {
  transition: transform 0.1s linear;
  transform-origin: 50px 50px;
}

// ==================== Pixel 风格 ====================
.loading-pixel {
  background: #f7f7f7 !important;
  
  :global(.dark) & {
    background: #1a1a2e !important;
  }
}

.pixel-scene {
  position: relative;
  width: 300px;
  height: 120px;
  overflow: hidden;
}

.pixel-clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
}

.pixel-cloud {
  --pixel: 3px;
  --color: #c0c0c0;
  position: absolute;
  width: var(--pixel);
  height: var(--pixel);
  background: var(--color);
  box-shadow:
    calc(var(--pixel) * 1) 0 var(--color),
    calc(var(--pixel) * 2) 0 var(--color),
    calc(var(--pixel) * 3) 0 var(--color),
    calc(var(--pixel) * 4) 0 var(--color),
    calc(var(--pixel) * 5) 0 var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * -1) var(--color),
    0 calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * -1) var(--color);

  :global(.dark) & {
    --color: #4a4a6a;
  }
}

.cloud-1 {
  top: 15px;
  right: 60px;
  animation: cloud-move 10s linear infinite;
}

.cloud-2 {
  top: 35px;
  right: 150px;
  transform: scale(0.7);
  animation: cloud-move 14s linear infinite;
  animation-delay: -5s;
}

.dino-container {
  position: absolute;
  bottom: 20px;
  left: 40px;
  z-index: 10;
}

.pixel-dino {
  animation: dino-jump 0.6s ease-in-out infinite;
}

.dino-sprite {
  --pixel: 3px;
  --color: #535353;
  position: relative;
  width: var(--pixel);
  height: var(--pixel);
  background: transparent;
  box-shadow:
    calc(var(--pixel) * 4) 0 var(--color),
    calc(var(--pixel) * 5) 0 var(--color),
    calc(var(--pixel) * 6) 0 var(--color),
    calc(var(--pixel) * 7) 0 var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 8) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 2) #f7f7f7,
    calc(var(--pixel) * 7) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 8) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 3) var(--color),
    0 calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * 5) var(--color),
    0 calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * -2) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * -3) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 7) var(--color);
    
  :global(.dark) & {
    --color: #b0b0b0;
  }
}

.cactus-container {
  position: absolute;
  bottom: 16px;
  right: 0;
  animation: cactus-run 2s linear infinite;
}

.pixel-cactus {
  --pixel: 3px;
  --color: #535353;
  position: relative;
  width: var(--pixel);
  height: var(--pixel);
  background: var(--color);
  box-shadow:
    0 calc(var(--pixel) * -1) var(--color),
    0 calc(var(--pixel) * -2) var(--color),
    0 calc(var(--pixel) * -3) var(--color),
    0 calc(var(--pixel) * -4) var(--color),
    0 calc(var(--pixel) * -5) var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * -2) var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * -3) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * -3) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * -4) var(--color);
    
  :global(.dark) & {
    --color: #b0b0b0;
  }
}

.pixel-ground {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  height: 3px;
  background: #535353;
  
  :global(.dark) & {
    background: #b0b0b0;
  }
}

@keyframes dino-jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes cloud-move {
  0% { transform: translateX(80px); opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { transform: translateX(-350px); opacity: 0; }
}

@keyframes cactus-run {
  0% { transform: translateX(100px); }
  100% { transform: translateX(-400px); }
}

// ==================== Cube 风格 ====================
.cube-container {
  width: 60px;
  height: 60px;
  perspective: 200px;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: cube-rotate 2s ease-in-out infinite;
}

.cube-face {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(64, 158, 255, 0.4);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.1));
  backdrop-filter: blur(5px);
  
  &.front  { transform: rotateY(0deg) translateZ(30px); }
  &.back   { transform: rotateY(180deg) translateZ(30px); }
  &.right  { transform: rotateY(90deg) translateZ(30px); }
  &.left   { transform: rotateY(-90deg) translateZ(30px); }
  &.top    { transform: rotateX(90deg) translateZ(30px); }
  &.bottom { transform: rotateX(-90deg) translateZ(30px); }
  
  :global(.dark) & {
    border-color: rgba(64, 158, 255, 0.6);
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(103, 194, 58, 0.2));
  }
}

@keyframes cube-rotate {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(90deg) rotateY(90deg); }
  50% { transform: rotateX(180deg) rotateY(180deg); }
  75% { transform: rotateX(270deg) rotateY(270deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

// ==================== Dots 风格 ====================
.dots-container {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-primary, #409eff), #67c23a);
  animation: dot-wave 1.4s ease-in-out infinite;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.2s; }
  &:nth-child(4) { animation-delay: 0.3s; }
  &:nth-child(5) { animation-delay: 0.4s; }
}

@keyframes dot-wave {
  0%, 100% { 
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% { 
    transform: translateY(-16px) scale(1.2);
    opacity: 1;
  }
}

// ==================== Pulse 风格 ====================
.pulse-container {
  position: relative;
  width: 80px;
  height: 80px;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid var(--el-color-primary, #409eff);
  border-radius: 50%;
  animation: pulse-expand 1.5s ease-out infinite;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.5s; }
  &:nth-child(3) { animation-delay: 1s; }
}

.pulse-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: var(--el-color-primary, #409eff);
  border-radius: 50%;
  animation: pulse-core 1.5s ease-in-out infinite;
}

@keyframes pulse-expand {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  100% {
    width: 80px;
    height: 80px;
    opacity: 0;
  }
}

@keyframes pulse-core {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(0.8); }
}

// ==================== 进度条 ====================
.progress-container {
  position: absolute;
  bottom: 60px;
  width: 240px;
}

.progress-track {
  position: relative;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
  
  :global(.dark) & {
    background: rgba(255, 255, 255, 0.1);
  }
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, var(--el-color-primary, #409eff), var(--el-color-primary-light-3, #79bbff));
  border-radius: 2px;
  animation: progress-slide 2s ease-in-out infinite;
}

@keyframes progress-slide {
  0% { left: -30%; width: 30%; }
  50% { width: 50%; }
  100% { left: 100%; width: 30%; }
}

// ==================== 过渡动画 ====================
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
