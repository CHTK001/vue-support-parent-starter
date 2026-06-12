<template>
  <div class="under-construction">
    <!-- 背景装饰网格 -->
    <div class="uc-grid" />

    <!-- 旋转几何装饰 -->
    <div class="uc-geo">
      <svg viewBox="0 0 200 200" class="uc-hexagon">
        <polygon
          points="100 10, 190 55, 190 145, 100 190, 10 145, 10 55"
          fill="none"
          stroke="rgba(0, 246, 255, 0.15)"
          stroke-width="1"
        />
        <polygon
          points="100 30, 170 65, 170 135, 100 170, 30 135, 30 65"
          fill="none"
          stroke="rgba(0, 246, 255, 0.25)"
          stroke-width="1"
        />
        <polygon
          points="100 50, 150 75, 150 125, 100 150, 50 125, 50 75"
          fill="rgba(0, 246, 255, 0.05)"
          stroke="rgba(0, 246, 255, 0.4)"
          stroke-width="1"
        />
      </svg>
      <svg viewBox="0 0 160 160" class="uc-ring">
        <circle
          cx="80" cy="80" r="70"
          fill="none"
          stroke="rgba(0, 246, 255, 0.1)"
          stroke-width="1"
          stroke-dasharray="10 6"
        />
        <circle
          cx="80" cy="80" r="50"
          fill="none"
          stroke="rgba(0, 246, 255, 0.15)"
          stroke-width="1"
          stroke-dasharray="4 8"
        />
        <circle
          cx="80" cy="80" r="30"
          fill="none"
          stroke="rgba(0, 246, 255, 0.2)"
          stroke-width="1"
          stroke-dasharray="2 4"
        />
      </svg>
    </div>

    <!-- 装饰光线 -->
    <div class="uc-lines">
      <div class="uc-line uc-line--1" />
      <div class="uc-line uc-line--2" />
      <div class="uc-line uc-line--3" />
    </div>

    <!-- 中央内容 -->
    <div class="uc-content">
      <div class="uc-icon">
        <svg viewBox="0 0 64 64" class="uc-icon-svg">
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0, 246, 255, 0.3)" stroke-width="1" />
          <path
            d="M20 24 L32 16 L44 24 L44 40 L32 48 L20 40 Z"
            fill="none"
            stroke="rgba(0, 246, 255, 0.6)"
            stroke-width="1.5"
          />
          <line x1="32" y1="16" x2="32" y2="48" stroke="rgba(0, 246, 255, 0.2)" stroke-width="1" />
          <line x1="20" y1="24" x2="44" y2="24" stroke="rgba(0, 246, 255, 0.2)" stroke-width="1" />
          <line x1="20" y1="40" x2="44" y2="40" stroke="rgba(0, 246, 255, 0.2)" stroke-width="1" />
          <circle cx="32" cy="32" r="4" fill="rgba(0, 246, 255, 0.5)" />
          <circle cx="32" cy="32" r="8" fill="none" stroke="rgba(0, 246, 255, 0.2)" stroke-width="1" stroke-dasharray="3 3">
            <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <h1 class="uc-title">数据大屏</h1>
      <p class="uc-subtitle">正在建设中...</p>
      <div class="uc-bar">
        <div class="uc-bar__fill" />
      </div>
      <p class="uc-hint">请提供大屏配置 GUID 参数进行预览</p>
    </div>

    <!-- 角标装饰 -->
    <div class="uc-corners">
      <div class="uc-corner uc-corner--tl" />
      <div class="uc-corner uc-corner--tr" />
      <div class="uc-corner uc-corner--bl" />
      <div class="uc-corner uc-corner--br" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.under-construction {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a1628;
  overflow: hidden;
}

/* 背景网格 */
.uc-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 246, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 246, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* 旋转几何装饰 */
.uc-geo {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.uc-hexagon {
  width: 200px;
  height: 200px;
  animation: uc-spin-slow 20s linear infinite;
  opacity: 0.6;
}

.uc-ring {
  width: 160px;
  height: 160px;
  position: absolute;
  animation: uc-spin-reverse 15s linear infinite;
  opacity: 0.5;
}

@keyframes uc-spin-slow {
  to { transform: rotate(360deg); }
}

@keyframes uc-spin-reverse {
  to { transform: rotate(-360deg); }
}

/* 装饰光线 */
.uc-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.uc-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 246, 255, 0.15), transparent);
  animation: uc-scan 4s ease-in-out infinite;

  &--1 {
    top: 30%;
    width: 60%;
    left: 20%;
    animation-delay: 0s;
  }

  &--2 {
    top: 50%;
    width: 80%;
    left: 10%;
    animation-delay: 1.3s;
  }

  &--3 {
    top: 70%;
    width: 50%;
    left: 25%;
    animation-delay: 2.6s;
  }
}

@keyframes uc-scan {
  0% { opacity: 0; transform: scaleX(0.3); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(0.3); }
}

/* 中央内容 */
.uc-content {
  position: relative;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.uc-icon {
  margin-bottom: 8px;
}

.uc-icon-svg {
  width: 64px;
  height: 64px;
  animation: uc-pulse 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(0, 246, 255, 0.3));
}

@keyframes uc-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}

.uc-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(0, 246, 255, 0.85);
  letter-spacing: 8px;
  margin: 0;
  text-shadow: 0 0 30px rgba(0, 246, 255, 0.3), 0 0 60px rgba(0, 246, 255, 0.1);
  animation: uc-glow 3s ease-in-out infinite;
}

@keyframes uc-glow {
  0%, 100% { text-shadow: 0 0 30px rgba(0, 246, 255, 0.3), 0 0 60px rgba(0, 246, 255, 0.1); }
  50% { text-shadow: 0 0 40px rgba(0, 246, 255, 0.5), 0 0 80px rgba(0, 246, 255, 0.2); }
}

.uc-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 4px;
  margin: 0;
}

/* 进度条 */
.uc-bar {
  width: 160px;
  height: 2px;
  background: rgba(0, 246, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.uc-bar__fill {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(0, 246, 255, 0.6), transparent);
  border-radius: 2px;
  animation: uc-bar 2.5s ease-in-out infinite;
}

@keyframes uc-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.uc-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  margin: 0;
  letter-spacing: 1px;
}

/* 角标装饰 */
.uc-corners {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.uc-corner {
  position: absolute;
  width: 30px;
  height: 30px;

  &--tl {
    top: 20px; left: 20px;
    border-top: 1px solid rgba(0, 246, 255, 0.2);
    border-left: 1px solid rgba(0, 246, 255, 0.2);
  }

  &--tr {
    top: 20px; right: 20px;
    border-top: 1px solid rgba(0, 246, 255, 0.2);
    border-right: 1px solid rgba(0, 246, 255, 0.2);
  }

  &--bl {
    bottom: 20px; left: 20px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    border-left: 1px solid rgba(0, 246, 255, 0.2);
  }

  &--br {
    bottom: 20px; right: 20px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    border-right: 1px solid rgba(0, 246, 255, 0.2);
  }
}
</style>
