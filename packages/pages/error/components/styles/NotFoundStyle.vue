<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "NotFoundStyle",
});

defineProps<{
  code: number | string;
  title: string;
  description: string;
}>();

const emit = defineEmits<{
  goHome: [];
  goBack: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="notfound-container">
    <!-- 沙漠背景 -->
    <div class="desert-bg">
      <div class="sun"></div>
      <div class="dune dune-1"></div>
      <div class="dune dune-2"></div>
      <div class="dune dune-3"></div>
    </div>

    <!-- 主要内容 -->
    <div class="notfound-content">
      <!-- 迷路的旅行者 -->
      <div class="traveler-scene">
        <!-- 路标 -->
        <div class="signpost">
          <div class="post"></div>
          <div class="sign sign-1">???</div>
          <div class="sign sign-2">HOME</div>
          <div class="sign sign-3">404</div>
        </div>

        <!-- 迷路的人 -->
        <div class="traveler">
          <div class="head">
            <div class="face">
              <div class="eye eye-left">?</div>
              <div class="eye eye-right">?</div>
            </div>
          </div>
          <div class="body"></div>
          <div class="arm arm-left"></div>
          <div class="arm arm-right"></div>
          <div class="leg leg-left"></div>
          <div class="leg leg-right"></div>
          <!-- 地图 -->
          <div class="map">🗺️</div>
        </div>

        <!-- 望远镜 -->
        <div class="telescope">🔭</div>
      </div>

      <!-- 错误代码 -->
      <div class="error-code">
        <div class="code-wrapper">
          <span class="digit digit-4-1">4</span>
          <span class="digit digit-0">
            <span class="magnifier">🔍</span>
          </span>
          <span class="digit digit-4-2">4</span>
        </div>
        <div class="code-label">PAGE NOT FOUND</div>
      </div>

      <!-- 错误信息 -->
      <div class="error-info">
        <h1 class="error-title">{{ title }}</h1>
        <p class="error-desc">{{ description }}</p>

        <!-- 搜索提示 -->
        <div class="search-hint">
          <span class="hint-icon">🧭</span>
          <span>{{ t("error.pageLost") || "页面似乎迷路了..." }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="notfound-btn primary" @click="emit('goHome')">
          <span class="btn-icon">🏠</span>
          <span>{{ t("error.goHome") }}</span>
        </button>
        <button class="notfound-btn secondary" @click="emit('goBack')">
          <span class="btn-icon">↩️</span>
          <span>{{ t("error.goBack") }}</span>
        </button>
      </div>
    </div>

    <!-- 漂浮的问号 -->
    <div class="floating-marks">
      <span class="mark mark-1">?</span>
      <span class="mark mark-2">?</span>
      <span class="mark mark-3">?</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notfound-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #87ceeb 0%, #f4a460 70%, #deb887 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 沙漠背景
.desert-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sun {
  position: absolute;
  top: 10%;
  right: 15%;
  width: 80px;
  height: 80px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 60px #ffd700, 0 0 100px rgba(255, 215, 0, 0.5);
  animation: pulse-sun 4s ease-in-out infinite;
}

.dune {
  position: absolute;
  bottom: 0;
  width: 100%;
  border-radius: 50% 50% 0 0;

  &-1 {
    height: 150px;
    background: #daa520;
    left: -20%;
    width: 60%;
  }
  &-2 {
    height: 120px;
    background: #cd853f;
    right: -10%;
    width: 50%;
  }
  &-3 {
    height: 80px;
    background: #d2691e;
    left: 30%;
    width: 70%;
  }
}

// 主要内容
.notfound-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 40px 20px;
}

// 旅行者场景
.traveler-scene {
  position: relative;
  width: 300px;
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 40px;
}

// 路标
.signpost {
  position: relative;
  height: 150px;
}

.post {
  width: 8px;
  height: 150px;
  background: #8b4513;
  margin: 0 auto;
  border-radius: 4px;
}

.sign {
  position: absolute;
  left: 8px;
  padding: 5px 15px;
  background: #deb887;
  border: 2px solid #8b4513;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #8b4513;
  white-space: nowrap;

  &-1 {
    top: 10px;
    transform: rotate(-10deg);
  }
  &-2 {
    top: 45px;
    transform: rotate(5deg);
  }
  &-3 {
    top: 80px;
    transform: rotate(-5deg);
    background: #e74c3c;
    color: #fff;
    border-color: #c0392b;
  }
}

// 迷路的人
.traveler {
  position: relative;
  width: 60px;
  height: 100px;
  animation: confused 2s ease-in-out infinite;
}

.traveler .head {
  width: 35px;
  height: 35px;
  background: #ffd7b5;
  border-radius: 50%;
  margin: 0 auto;
  position: relative;
}

.traveler .face {
  position: absolute;
  top: 10px;
  left: 5px;
  right: 5px;
  display: flex;
  justify-content: space-between;
}

.traveler .eye {
  font-size: 10px;
  animation: blink 3s infinite;
}

.traveler .body {
  width: 30px;
  height: 35px;
  background: #3498db;
  margin: 5px auto 0;
  border-radius: 5px 5px 0 0;
}

.traveler .arm {
  position: absolute;
  width: 10px;
  height: 30px;
  background: #3498db;
  top: 40px;
  border-radius: 5px;

  &-left {
    left: 0;
    transform: rotate(20deg);
  }
  &-right {
    right: 0;
    transform: rotate(-60deg);
    transform-origin: top;
    animation: scratch-head 2s ease-in-out infinite;
  }
}

.traveler .leg {
  position: absolute;
  width: 12px;
  height: 25px;
  background: #2c3e50;
  bottom: 0;
  border-radius: 0 0 5px 5px;

  &-left {
    left: 15px;
  }
  &-right {
    right: 15px;
  }
}

.map {
  position: absolute;
  bottom: 30px;
  left: -20px;
  font-size: 1.5rem;
  animation: rotate-map 3s ease-in-out infinite;
}

.telescope {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 2rem;
  animation: look-around 4s ease-in-out infinite;
}

// 错误代码
.error-code {
  text-align: center;
}

.code-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.digit {
  font-size: 5rem;
  font-weight: 900;
  color: #8b4513;
  text-shadow: 3px 3px 0 #deb887;

  &.digit-0 {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.magnifier {
  font-size: 4rem;
  animation: search 2s ease-in-out infinite;
}

.code-label {
  font-size: 1rem;
  color: #8b4513;
  letter-spacing: 4px;
  margin-top: 10px;
  font-weight: 600;
}

// 错误信息
.error-info {
  text-align: center;
  color: #5d4037;
}

.error-title {
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.error-desc {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 20px;
  max-width: 400px;
}

.search-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 25px;
  background: rgba(139, 69, 19, 0.1);
  border: 2px dashed #8b4513;
  border-radius: 8px;
  color: #8b4513;
  font-size: 0.9rem;

  .hint-icon {
    font-size: 1.5rem;
    animation: spin 4s linear infinite;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.notfound-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
    color: #fff;
    box-shadow: 0 4px 20px rgba(230, 126, 34, 0.4);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(230, 126, 34, 0.6);
    }
  }

  &.secondary {
    background: rgba(139, 69, 19, 0.1);
    color: #8b4513;
    border: 2px solid #8b4513;

    &:hover {
      background: rgba(139, 69, 19, 0.2);
      transform: translateY(-3px);
    }
  }
}

// 漂浮问号
.floating-marks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.mark {
  position: absolute;
  font-size: 3rem;
  color: rgba(139, 69, 19, 0.2);
  font-weight: bold;

  &-1 {
    top: 20%;
    left: 15%;
    animation: float 4s ease-in-out infinite;
  }
  &-2 {
    top: 30%;
    right: 20%;
    animation: float 5s ease-in-out infinite reverse;
  }
  &-3 {
    bottom: 30%;
    left: 25%;
    animation: float 6s ease-in-out infinite;
  }
}

// 动画
@keyframes pulse-sun {
  0%,
  100% {
    box-shadow: 0 0 60px #ffd700, 0 0 100px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 80px #ffd700, 0 0 120px rgba(255, 215, 0, 0.7);
  }
}

@keyframes confused {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes scratch-head {
  0%,
  100% {
    transform: rotate(-60deg);
  }
  50% {
    transform: rotate(-45deg);
  }
}

@keyframes rotate-map {
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
}

@keyframes look-around {
  0%,
  100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(20deg);
  }
}

@keyframes search {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-5px) rotate(-10deg);
  }
  75% {
    transform: translateX(5px) rotate(10deg);
  }
}

@keyframes blink {
  0%,
  90%,
  100% {
    opacity: 1;
  }
  95% {
    opacity: 0;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

// 响应式
@media (max-width: 600px) {
  .digit {
    font-size: 3rem;
  }

  .traveler-scene {
    transform: scale(0.8);
  }

  .error-title {
    font-size: 1.4rem;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    padding: 0 20px;
  }

  .notfound-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
