<template>
  <div class="mc-login-page mc-world-bg">
    <!-- 翻书加载动画 -->
    <div v-if="loading && loadingType === 'book'" class="mc-loading-overlay">
      <div class="loading-background">
        <div class="loading-bg-image"></div>
        <div class="loading-vignette"></div>
      </div>
      
      <div class="loading-content">
        <div class="loading-book-container">
          <!-- 3D 书本区域 -->
          <div class="book-visualization">
            <!-- 粒子效果 -->
            <div class="particle particle-1"></div>
            <div class="particle particle-2"></div>
            <div class="particle particle-3"></div>
            <div class="particle particle-4"></div>
            
            <!-- 主书本容器 -->
            <div class="book-main">
              <!-- 发光光晕 -->
              <div class="book-glow"></div>
              <!-- 书本图片 -->
              <div class="book-image"></div>
              <!-- 浮动符文 -->
              <div class="rune rune-1">⍙⎍⌇⊑</div>
              <div class="rune rune-2">☊⍀⏃⎎⏃</div>
            </div>
          </div>
          
          <!-- 文本和进度区域 -->
          <div class="loading-text-section">
            <div class="loading-title-block">
              <h1 class="loading-title">附魔世界...</h1>
              <p class="loading-subtitle">正在收集魔法粒子</p>
            </div>
            
            <!-- 经验条进度 -->
            <div class="loading-progress-section">
              <div class="progress-bar-container">
                <div class="progress-bar-filled" :style="{ width: `${loadingProgress}%` }">
                  <div class="progress-gloss-top"></div>
                  <div class="progress-gloss-bottom"></div>
                </div>
                <div class="progress-segments">
                  <div class="segment" v-for="i in 10" :key="i"></div>
                </div>
              </div>
              
              <div class="progress-info">
                <span class="progress-label">加载资源</span>
                <div class="progress-level">
                  <span class="material-symbols-outlined level-icon">bolt</span>
                  <span class="level-value">30</span>
                </div>
                <span class="progress-percent">{{ loadingProgress }}%</span>
              </div>
            </div>
          </div>
          
          <!-- 提示信息 -->
          <div class="loading-tips">
            <div class="tips-icon">
              <span class="material-symbols-outlined">auto_stories</span>
            </div>
            <div class="tips-content">
              <p class="tips-title">你知道吗？</p>
              <p class="tips-text">钻石镐最适合挖掘黑曜石。结合效率 IV 附魔，可在下界获得最大挖掘速度。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 方块旋转加载动画 -->
    <div v-if="loading && loadingType === 'block'" class="mc-loading-overlay block-loading">
      <div class="block-loading-background">
        <div class="block-bg-gradient"></div>
        <div class="block-vignette"></div>
      </div>
      
      <div class="block-loading-content">
        <!-- 3D 方块容器 -->
        <div class="block-container-3d">
          <!-- 旋转的方块 -->
          <div class="rotating-block">
            <div class="block-face block-front">
              <div class="block-pattern diamond"></div>
            </div>
            <div class="block-face block-back">
              <div class="block-pattern diamond"></div>
            </div>
            <div class="block-face block-right">
              <div class="block-pattern diamond"></div>
            </div>
            <div class="block-face block-left">
              <div class="block-pattern diamond"></div>
            </div>
            <div class="block-face block-top">
              <div class="block-pattern diamond"></div>
            </div>
            <div class="block-face block-bottom">
              <div class="block-pattern diamond"></div>
            </div>
          </div>
          
          <!-- 环绕粒子 -->
          <div class="orbit-particle" v-for="i in 8" :key="i" :style="{ '--index': i }"></div>
          
          <!-- 发光效果 -->
          <div class="block-glow-effect"></div>
        </div>
        
        <!-- 加载文本 -->
        <div class="block-loading-text">
          <h2 class="block-loading-title">正在加载世界...</h2>
          <p class="block-loading-subtitle">生成区块中</p>
        </div>
        
        <!-- 进度条 -->
        <div class="block-progress-wrapper">
          <div class="block-progress-bar">
            <div class="block-progress-fill" :style="{ width: `${loadingProgress}%` }">
              <div class="block-progress-shine"></div>
            </div>
            <div class="block-progress-text">{{ loadingProgress }}%</div>
          </div>
        </div>
        
        <!-- 方块图标装饰 -->
        <div class="block-decorations">
          <div class="decoration-block" v-for="i in 5" :key="i" :style="{ '--delay': i * 0.2 + 's' }">
            <div class="mini-block"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 背景元素 -->
    <div class="background-container">
      <!-- 云朵 -->
      <div class="mc-cloud cloud-1"></div>
      <div class="mc-cloud cloud-2"></div>
      <div class="mc-cloud cloud-3"></div>
      
      <!-- 山丘 -->
      <div class="mc-hill mc-hill-back"></div>
      
      <!-- 树木 -->
      <div class="mc-tree" style="bottom: 35vh; left: 10%;">
        <div class="mc-leaves"></div>
        <div class="mc-log"></div>
      </div>
      <div class="mc-tree" style="bottom: 38vh; right: 25%;">
        <div class="mc-leaves"></div>
        <div class="mc-log"></div>
      </div>
      
      <!-- 前景山丘 -->
      <div class="mc-hill mc-hill-front"></div>
      
      <!-- 浮空方块 -->
      <div class="mc-float-block" style="top: 30%; left: 15%;"></div>
      <div class="mc-float-block" style="top: 40%; right: 10%;"></div>
      
      <!-- 动物 -->
      <div class="mc-mob mc-pig">
        <div class="mc-pig-head">
          <div class="mc-pig-snout"></div>
        </div>
        <div class="mc-pig-leg" style="left: 4px;"></div>
        <div class="mc-pig-leg" style="right: 4px;"></div>
      </div>
      <div class="mc-mob mc-sheep">
        <div class="mc-sheep-head"></div>
        <div class="mc-sheep-wool-head"></div>
        <div class="mc-pig-leg" style="left: 4px; background: #d9c8bf;"></div>
        <div class="mc-pig-leg" style="right: 4px; background: #d9c8bf;"></div>
      </div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="mc-content-box">

        <!-- 表单区域 -->
        <div class="mc-gui-container">
          <div class="form-wrapper">
            <slot name="form"></slot>
          </div>
        </div>

        <!-- 页脚 -->
        <div class="mc-footer">
          <p>v1.20.1 - Java Edition</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "McLoginTheme",
});

// 加载状态和进度
withDefaults(defineProps<{
  loading?: boolean;
  loadingProgress?: number;
  loadingType?: 'book' | 'block';
}>(), {
  loading: false,
  loadingProgress: 0,
  loadingType: 'book',
});
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700;900&family=Noto+Sans:wght@400;700&display=swap');

:root {
  --mc-dirt-side: #79553a;
  --mc-grass-top: #5d9e3f;
  --mc-sky-blue: #c6e6ff;
}

.mc-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'VT323', monospace;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.mc-world-bg {
  background-color: var(--mc-sky-blue);
  position: relative;
  overflow: hidden;
}

// 云朵样式
.mc-cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  width: 120px;
  height: 40px;
  z-index: 1;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: inherit;
  }
  
  &.cloud-1 {
    top: 10%;
    left: 10%;
    width: 160px;
    height: 48px;
    
    &::before {
      width: 80px;
      height: 48px;
      top: -24px;
      left: 24px;
    }
  }
  
  &.cloud-2 {
    top: 20%;
    right: 15%;
    width: 200px;
    height: 56px;
    
    &::before {
      width: 100px;
      height: 56px;
      top: -32px;
      left: 40px;
    }
  }
  
  &.cloud-3 {
    top: 50%;
    left: 5%;
    width: 140px;
    height: 40px;
    opacity: 0.7;
  }
}

// 山丘样式
.mc-hill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: var(--mc-grass-top);
  z-index: 2;
  border-top: 8px solid #6eb949;
  
  &.mc-hill-back {
    height: 40vh;
    background-color: #4a8232;
    border-top: 8px solid #58963c;
    clip-path: polygon(
      0 20%, 20% 10%, 40% 25%, 60% 15%, 80% 30%, 100% 20%, 
      100% 100%, 0 100%
    );
  }
  
  &.mc-hill-front {
    height: 25vh;
    z-index: 3;
    background: linear-gradient(
      to bottom, 
      var(--mc-grass-top) 0%, 
      var(--mc-grass-top) 20px, 
      var(--mc-dirt-side) 20px
    );
    clip-path: polygon(
      0% 10%, 10% 10%, 10% 0%, 25% 0%, 25% 15%, 
      40% 15%, 40% 5%, 55% 5%, 55% 20%, 
      70% 20%, 70% 0%, 85% 0%, 85% 10%, 
      100% 10%, 100% 100%, 0% 100%
    );
  }
}

// 树木样式
.mc-tree {
  position: absolute;
  z-index: 2;
  
  .mc-log {
    width: 24px;
    height: 80px;
    background-color: #4b3621;
    border-left: 4px solid #362616;
    border-right: 4px solid #5e442a;
    margin: 0 auto;
  }
  
  .mc-leaves {
    width: 100px;
    height: 80px;
    background-color: #3a5f22;
    border: 4px solid #2e4b1b;
    position: relative;
    top: -20px;
    image-rendering: pixelated;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
  }
}

// 动物样式
.mc-mob {
  position: absolute;
  z-index: 4;
  
  &.mc-pig {
    bottom: 18vh;
    left: 15%;
    width: 50px;
    height: 30px;
    background: #f0a5a5;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
    
    .mc-pig-head {
      position: absolute;
      width: 24px;
      height: 24px;
      background: #f0a5a5;
      left: -12px;
      top: -4px;
    }
    
    .mc-pig-snout {
      position: absolute;
      width: 8px;
      height: 6px;
      background: #d68787;
      left: -4px;
      top: 10px;
    }
    
    .mc-pig-leg {
      position: absolute;
      width: 10px;
      height: 12px;
      background: #f0a5a5;
      bottom: -12px;
    }
  }
  
  &.mc-sheep {
    bottom: 22vh;
    right: 18%;
    width: 54px;
    height: 36px;
    background: #ffffff;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
    
    .mc-sheep-head {
      position: absolute;
      width: 24px;
      height: 24px;
      background: #d9c8bf;
      left: -10px;
      top: -2px;
    }
    
    .mc-sheep-wool-head {
      position: absolute;
      width: 26px;
      height: 26px;
      background: #ffffff;
      left: -12px;
      top: -4px;
      z-index: -1;
    }
  }
}

// 浮空方块
.mc-float-block {
  position: absolute;
  width: 60px;
  height: 60px;
  background: linear-gradient(
    to bottom, 
    var(--mc-grass-top) 0%, 
    var(--mc-grass-top) 30%, 
    var(--mc-dirt-side) 30%
  );
  border: 2px solid rgba(0, 0, 0, 0.2);
  z-index: 4;
  box-shadow: 10px 20px 0 rgba(0, 0, 0, 0.1);
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-main-container {
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  flex-direction: column;
  padding: 20px;
}

.mc-content-box {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mc-logo-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 2rem;
}

.mc-logo {
  filter: drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.5));
  max-width: 400px;
  width: 100%;
  height: auto;
}

.mc-gui-container {
  background-color: #c6c6c6;
  border: 4px solid #000000;
  box-shadow: 
    inset -4px -4px 0px #555555, 
    inset 4px 4px 0px #ffffff;
  image-rendering: pixelated;
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 2rem;
  
  .form-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
}

.mc-footer {
  margin-top: 2rem;
  color: #fff;
  font-size: 1.125rem;
  font-weight: bold;
  text-shadow: 2px 2px #000;
  line-height: 1.6;
}

// Element Plus 组件样式覆盖 - Minecraft GUI 风格
:deep(.el-input__wrapper) {
  background-color: #000000 !important;
  border: 2px solid #a0a0a0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 12px 10px !important;
  margin-top: 1rem;
  
  input {
    color: #ffffff !important;
    font-family: 'VT323', monospace !important;
    font-size: 1.25rem !important;
    letter-spacing: 0.5px;
    
    &::placeholder {
      color: #666 !important;
    }
  }
  
  &:hover {
    border-color: #b0b0b0 !important;
  }
  
  &.is-focus {
    border-color: #ffffff !important;
    box-shadow: 0 0 0 1px #ffffff !important;
  }
}

:deep(.el-button) {
  background-color: #6a6a6a !important;
  border: 2px solid #000000 !important;
  border-radius: 0 !important;
  box-shadow: 
    inset -3px -3px 0px #373737, 
    inset 3px 3px 0px #aeaeae !important;
  color: #e0e0e0 !important;
  text-shadow: 2px 2px #3f3f3f !important;
  transition: all 0.1s !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px !important;
  width: 100%;
  font-family: 'VT323', monospace !important;
  font-size: 1.5rem !important;
  margin-top: 12px;
  
  &:hover {
    background-color: #7a7a7a !important;
    border-color: #ffffff !important;
    color: #ffffa0 !important;
  }
  
  &:active {
    box-shadow: 
      inset 3px 3px 0px #373737, 
      inset -3px -3px 0px #aeaeae !important;
    padding-top: 14px !important;
    padding-bottom: 10px !important;
  }
}

:deep(.el-form-item__label) {
  color: #333 !important;
  font-family: 'VT323', monospace !important;
  font-size: 1.25rem !important;
  letter-spacing: 0.5px;
  margin-bottom: 1.25rem;
  display: block;
}

:deep(.el-form-item) {
  margin-bottom: 0;
  
  &:not(:last-child) {
    margin-bottom: 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .mc-content-box {
    max-width: 95vw;
  }
  
  .mc-logo {
    max-width: 300px;
  }
  
  .mc-gui-container {
    padding: 1.5rem;
  }
  
  .mc-cloud {
    &.cloud-1,
    &.cloud-2,
    &.cloud-3 {
      opacity: 0.5;
    }
  }
  
  .mc-tree {
    display: none;
  }
  
  .mc-mob {
    display: none;
  }
}

// 翻书加载动画样式
.mc-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  
  .loading-bg-image {
    width: 100%;
    height: 100%;
    background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-f9Wj6d8QM17c1LyUM_VCxA-P_MPXis3DuT0VTEtjvCMjsS0pa_5rKkFHwIYa7s7KcHS1wlkQBCGCXof5yVb-RfCqt1apstcyfPWXrWcEJdfm2zL-RyEaRp7wal67gQ-nPxLR90gfhv3z_pNF1Mq6036rnP4le9GoL4OeDIyBHY2CuoXhoah0P7F1mJgn3_NrO5xLudZvqIls5jZdv0zcVqkit46SZqABpkss3zGW_wfyk7Rcp5h0KV5VpOJLS4jCY4C_sLrTLrsp');
    background-size: cover;
    background-position: center;
    opacity: 0.4;
    filter: blur(4px);
  }
  
  .loading-vignette {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, #102216, rgba(16, 34, 22, 0.8), transparent);
  }
}

.loading-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 64rem;
  padding: 1.5rem;
  gap: 2rem;
}

.loading-book-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 2rem;
}

// 3D 书本可视化区域
.book-visualization {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

// 粒子效果
.particle {
  position: absolute;
  border-radius: 2px;
  opacity: 0.6;
  
  &.particle-1 {
    width: 4px;
    height: 4px;
    top: 40%;
    left: 30%;
    background: #a855f7;
    box-shadow: 0 0 10px #a855f7;
    animation: float 4s infinite reverse;
  }
  
  &.particle-2 {
    width: 6px;
    height: 6px;
    top: 60%;
    left: 70%;
    background: #c084fc;
    box-shadow: 0 0 15px #c084fc;
    animation: float 5s infinite 1s;
  }
  
  &.particle-3 {
    width: 3px;
    height: 8px;
    top: 30%;
    left: 60%;
    background: #d946ef;
    box-shadow: 0 0 8px #d946ef;
    animation: float 3s infinite 0.5s;
  }
  
  &.particle-4 {
    width: 5px;
    height: 5px;
    top: 70%;
    left: 20%;
    background: #9333ea;
    box-shadow: 0 0 12px #9333ea;
    animation: float 6s infinite 2s;
  }
}

// 主书本容器
.book-main {
  width: 16rem;
  height: 20rem;
  position: relative;
  
  @media (min-width: 768px) {
    width: 20rem;
    height: 24rem;
  }
  
  .book-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    background: rgba(168, 85, 247, 0.2);
    filter: blur(3rem);
    border-radius: 50%;
  }
  
  .book-image {
    width: 100%;
    height: 100%;
    background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAD7gn2Z7ZS_o7yFFECPPapxgccCRhE-_KmoN20G-ObH_FK0hiR-TP0wp68qeeDaljZdjkS3qOy8AZqS3Zr1Is8HVMUbeh5fneTEjNNAxuWuKntjhYeoKlf7x0_zbWt42c1zcob69kOkXQzguQQzld6c6QzxutWiyIQy6cqcsYWpU7IwEKMuhLPhi_8eiplZTuJDA5yzGweUk2MdzXf8uEGwLgMaycDMY3IBYi2zhEEWNhLHvic-JQBgfAge2N01MrnMr1y4j3w4zJZ');
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    filter: drop-shadow(0 20px 20px rgba(0, 0, 0, 0.5));
    transform: rotate(-5deg);
    transition: transform 0.7s;
    
    &:hover {
      transform: rotate(0deg);
    }
  }
}

// 浮动符文
.rune {
  position: absolute;
  color: #c084fc;
  font-family: monospace;
  font-size: 1.25rem;
  opacity: 0.6;
  user-select: none;
  letter-spacing: 4px;
  
  &.rune-1 {
    top: -2.5rem;
    right: 0;
    font-size: 1.25rem;
    animation: bounce 2s infinite;
  }
  
  &.rune-2 {
    bottom: 2.5rem;
    left: -2.5rem;
    font-size: 1.125rem;
    animation: pulse 2s infinite;
  }
}

// 文本和进度区域
.loading-text-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.loading-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  .loading-title {
    color: #ffffff;
    font-size: 2.5rem;
    font-weight: bold;
    line-height: 1.2;
    letter-spacing: -0.025em;
    text-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    font-family: 'Space Grotesk', sans-serif;
    
    @media (min-width: 768px) {
      font-size: 3rem;
    }
  }
  
  .loading-subtitle {
    color: #cbd5e1;
    font-size: 1.125rem;
    font-weight: normal;
    letter-spacing: 0.025em;
    opacity: 0.8;
    animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    font-family: 'Noto Sans', sans-serif;
  }
}

// 进度条区域
.loading-progress-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar-container {
  position: relative;
  height: 1rem;
  width: 100%;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #475569;
  border-radius: 0.125rem;
  overflow: hidden;
  backdrop-filter: blur(4px);
}

.progress-bar-filled {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #13ec5b;
  display: flex;
  align-items: center;
  box-shadow: 0 0 10px #13ec5b;
  
  .progress-gloss-top {
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.4);
    position: absolute;
    top: 0;
  }
  
  .progress-gloss-bottom {
    width: 100%;
    height: 2px;
    background: rgba(0, 0, 0, 0.1);
    position: absolute;
    bottom: 0;
  }
}

.progress-segments {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  
  .segment {
    width: 2px;
    height: 100%;
    background: rgba(18, 16, 22, 0.3);
  }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  
  .progress-label,
  .progress-percent {
    color: #13ec5b;
    font-size: 0.875rem;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  .progress-level {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    .level-icon {
      color: #13ec5b;
      font-size: 0.875rem;
    }
    
    .level-value {
      color: #13ec5b;
      font-size: 1.25rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
    }
  }
}

// 提示信息
.loading-tips {
  margin-top: 2rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 32rem;
  width: 100%;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  
  .tips-icon {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.25rem;
    flex-shrink: 0;
    
    .material-symbols-outlined {
      color: #c084fc;
    }
  }
  
  .tips-content {
    .tips-title {
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .tips-text {
      color: #94a3b8;
      font-size: 0.75rem;
      line-height: 1.6;
    }
  }
}

// 动画定义
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .loading-content {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .loading-title {
    font-size: 2rem !important;
  }
  
  .book-main {
    width: 12rem;
    height: 15rem;
  }
}

// ========== 方块旋转加载动画样式 ==========
.block-loading {
  .block-loading-background {
    position: absolute;
    inset: 0;
    z-index: 0;
    
    .block-bg-gradient {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      opacity: 0.95;
    }
    
    .block-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
    }
  }
  
  .block-loading-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 3rem;
  }
  
  // 3D 方块容器
  .block-container-3d {
    position: relative;
    width: 200px;
    height: 200px;
    perspective: 1000px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  // 旋转的方块
  .rotating-block {
    position: relative;
    width: 120px;
    height: 120px;
    transform-style: preserve-3d;
    animation: blockRotate 3s linear infinite;
  }
  
  // 方块面
  .block-face {
    position: absolute;
    width: 120px;
    height: 120px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .block-pattern {
      width: 100%;
      height: 100%;
      background-size: 40px 40px;
      background-repeat: repeat;
      opacity: 0.9;
      
      &.diamond {
        background-image: 
          linear-gradient(45deg, #55c3ff 25%, transparent 25%),
          linear-gradient(-45deg, #55c3ff 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #55c3ff 75%),
          linear-gradient(-45deg, transparent 75%, #55c3ff 75%);
        background-position: 0 0, 0 20px, 20px -20px, -20px 0px;
        background-color: #4a9eff;
        box-shadow: inset 0 0 20px rgba(85, 195, 255, 0.5);
      }
    }
    
    &.block-front {
      transform: rotateY(0deg) translateZ(60px);
      background: linear-gradient(135deg, #4a9eff 0%, #55c3ff 100%);
    }
    
    &.block-back {
      transform: rotateY(180deg) translateZ(60px);
      background: linear-gradient(135deg, #4a9eff 0%, #55c3ff 100%);
    }
    
    &.block-right {
      transform: rotateY(90deg) translateZ(60px);
      background: linear-gradient(135deg, #3d8eef 0%, #4a9eff 100%);
    }
    
    &.block-left {
      transform: rotateY(-90deg) translateZ(60px);
      background: linear-gradient(135deg, #3d8eef 0%, #4a9eff 100%);
    }
    
    &.block-top {
      transform: rotateX(90deg) translateZ(60px);
      background: linear-gradient(135deg, #55c3ff 0%, #6dd5ff 100%);
    }
    
    &.block-bottom {
      transform: rotateX(-90deg) translateZ(60px);
      background: linear-gradient(135deg, #3d8eef 0%, #2d7edf 100%);
    }
  }
  
  // 环绕粒子
  .orbit-particle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: radial-gradient(circle, #55c3ff 0%, transparent 70%);
    border-radius: 50%;
    box-shadow: 0 0 10px #55c3ff;
    animation: orbitRotate 4s linear infinite;
    animation-delay: calc(var(--index) * 0.5s);
    transform-origin: 100px 100px;
    
    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: inherit;
      border-radius: inherit;
      animation: particlePulse 2s ease-in-out infinite;
      animation-delay: calc(var(--index) * 0.3s);
    }
  }
  
  // 发光效果
  .block-glow-effect {
    position: absolute;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(85, 195, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: glowPulse 2s ease-in-out infinite;
    filter: blur(20px);
  }
  
  // 加载文本
  .block-loading-text {
    text-align: center;
    color: #e2e8f0;
    
    .block-loading-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #55c3ff 0%, #ffffff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: textShimmer 2s ease-in-out infinite;
      font-family: 'Space Grotesk', sans-serif;
    }
    
    .block-loading-subtitle {
      font-size: 1.125rem;
      color: #94a3b8;
      font-family: 'Noto Sans', sans-serif;
      opacity: 0.8;
    }
  }
  
  // 进度条
  .block-progress-wrapper {
    width: 100%;
    max-width: 400px;
    padding: 0 2rem;
  }
  
  .block-progress-bar {
    position: relative;
    width: 100%;
    height: 24px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(85, 195, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .block-progress-fill {
    position: relative;
    height: 100%;
    background: linear-gradient(90deg, #4a9eff 0%, #55c3ff 50%, #6dd5ff 100%);
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(85, 195, 255, 0.6);
    
    .block-progress-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
      animation: progressShine 2s infinite;
    }
  }
  
  .block-progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.875rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-family: 'Space Grotesk', sans-serif;
  }
  
  // 装饰方块
  .block-decorations {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }
  
  .decoration-block {
    animation: decorationFloat 2s ease-in-out infinite;
    animation-delay: var(--delay);
    
    .mini-block {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #4a9eff 0%, #55c3ff 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 8px rgba(85, 195, 255, 0.4);
      transform: rotate(45deg);
    }
  }
}

// 方块旋转动画
@keyframes blockRotate {
  0% {
    transform: rotateX(0deg) rotateY(0deg);
  }
  100% {
    transform: rotateX(360deg) rotateY(360deg);
  }
}

// 环绕旋转动画
@keyframes orbitRotate {
  0% {
    transform: rotate(0deg) translateX(100px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(100px) rotate(-360deg);
  }
}

// 粒子脉冲动画
@keyframes particlePulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.6;
  }
}

// 发光脉冲动画
@keyframes glowPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

// 文本闪烁动画
@keyframes textShimmer {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// 进度条闪光动画
@keyframes progressShine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// 装饰浮动动画
@keyframes decorationFloat {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

// 方块加载动画响应式
@media (max-width: 768px) {
  .block-loading {
    .block-container-3d {
      width: 150px;
      height: 150px;
    }
    
    .rotating-block {
      width: 90px;
      height: 90px;
    }
    
    .block-face {
      width: 90px;
      height: 90px;
      
      &.block-front {
        transform: rotateY(0deg) translateZ(45px);
      }
      
      &.block-back {
        transform: rotateY(180deg) translateZ(45px);
      }
      
      &.block-right {
        transform: rotateY(90deg) translateZ(45px);
      }
      
      &.block-left {
        transform: rotateY(-90deg) translateZ(45px);
      }
      
      &.block-top {
        transform: rotateX(90deg) translateZ(45px);
      }
      
      &.block-bottom {
        transform: rotateX(-90deg) translateZ(45px);
      }
    }
    
    .block-loading-text .block-loading-title {
      font-size: 1.75rem;
    }
    
    .block-progress-wrapper {
      max-width: 300px;
      padding: 0 1rem;
    }
  }
}
</style>

