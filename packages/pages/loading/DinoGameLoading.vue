<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 占位兼容 */
  showProgress?: boolean;
}

withDefaults(defineProps<Props>(), {
  loadingText: "正在唤醒恐龙小游戏...",
  showProgress: false
});

const dinoY = ref(0);
const velocity = ref(0);
const isJumping = ref(false);
const gravity = 1.6;

const cactusX = ref(-140);
const speed = ref(6);
const score = ref(0);
const gameOver = ref(false);
const started = ref(false);

const isIntroActive = ref(true);
const isSpacePressed = ref(false);

let frameId = 0;
let introTimer = 0;
let spaceTimer = 0;

const resetGame = () => {
  dinoY.value = 0;
  velocity.value = 0;
  isJumping.value = false;
  cactusX.value = -140;
  speed.value = 6;
  score.value = 0;
  gameOver.value = false;
  started.value = false;
  isIntroActive.value = true;
};

const startRun = () => {
  if (!started.value) {
    started.value = true;
  }
};

const jump = () => {
  if (gameOver.value) {
    resetGame();
    startRun();
    return;
  }
  startRun();
  if (!isJumping.value) {
    isJumping.value = true;
    velocity.value = 18;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === "Space" || event.key === " ") {
    event.preventDefault();
    jump();
    if (!isSpacePressed.value) {
      isSpacePressed.value = true;
      if (spaceTimer > 0) {
        window.clearTimeout(spaceTimer);
      }
      spaceTimer = window.setTimeout(() => {
        isSpacePressed.value = false;
      }, 160);
    }
  }
};

const loop = () => {
  if (started.value && !gameOver.value) {
    if (isJumping.value || dinoY.value > 0) {
      velocity.value -= gravity;
      dinoY.value += velocity.value;
      if (dinoY.value <= 0) {
        dinoY.value = 0;
        isJumping.value = false;
        velocity.value = 0;
      }
    }

    cactusX.value += speed.value;
    if (cactusX.value > 640) {
      cactusX.value = -60 - Math.random() * 140;
      score.value += 1;
      if (score.value % 5 === 0 && speed.value < 14) {
        speed.value += 1;
      }
    }

    const cactusScreenX = 600 - 80 - cactusX.value;
    const hitX = cactusScreenX < 120 && cactusScreenX > 70;
    const hitY = dinoY.value < 28;

    if (hitX && hitY) {
      gameOver.value = true;
      isIntroActive.value = false;
    }
  }

  frameId = window.requestAnimationFrame(loop);
};

onMounted(() => {
  resetGame();
  window.addEventListener("keydown", handleKeydown);
  frameId = window.requestAnimationFrame(loop);
  // 保证初始 2-3 秒有稳定节奏，之后根据加载时长自行循环
  introTimer = window.setTimeout(() => {
    isIntroActive.value = false;
  }, 2400);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (frameId) {
    window.cancelAnimationFrame(frameId);
  }
  if (introTimer > 0) {
    window.clearTimeout(introTimer);
  }
  if (spaceTimer > 0) {
    window.clearTimeout(spaceTimer);
  }
});
</script>

<template>
  <div class="cool-loading dino-intro-loading" @click="jump">
    <div class="pixel-frame">
      <div
        class="dino-scene"
        :class="{
          'is-active': isIntroActive,
          'space-pressed': isSpacePressed
        }"
      >
        <div class="dino-shadow" />
        <div class="dino">
          <div class="dino-body" />
          <div class="dino-head">
            <div class="dino-eye" />
          </div>
          <div class="dino-leg dino-leg-front" />
          <div class="dino-leg dino-leg-back" />
          <div class="dino-tail" />
        </div>
        <div class="ground" />
        <div class="ground-detail" />
        <div class="cactus" :style="{ right: cactusX + 'px' }" />
        <div v-if="gameOver" class="game-over">
          <span>游戏结束 · 按空格重新开始</span>
        </div>
      </div>
      <div class="bottom-bar">
        <div class="loading-text">
          {{ loadingText }}（得分：{{ score }}）
        </div>
        <div class="space-hint">
          按空格键开始
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dino-intro-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

.pixel-frame {
  width: 600px;
  height: 150px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background: #f7f7f7;
  box-shadow:
    0 0 0 1px #ffffff,
    0 10px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 16px 10px;
  box-sizing: border-box;
}

.dino-scene {
  position: relative;
  width: 100%;
  height: 90px;
  image-rendering: pixelated;
}

.dino {
  position: absolute;
  left: 70px;
  bottom: 24px;
  width: 48px;
  height: 44px;
  transform-origin: center bottom;
  transition: bottom 0.05s linear;
}

.dino-body {
  position: absolute;
  inset: 14px 16px 8px 6px;
  background: #535353;
  box-shadow:
    0 0 0 2px #535353,
    0 -4px 0 0 #ffffff;
}

.dino-head {
  position: absolute;
  right: -4px;
  top: 6px;
  width: 24px;
  height: 20px;
  background: #535353;
  box-shadow: 0 -2px 0 0 #ffffff;
}

.dino-eye {
  position: absolute;
  width: 3px;
  height: 3px;
  right: 4px;
  top: 6px;
  background: #ffffff;
}

.dino-leg {
  position: absolute;
  width: 8px;
  height: 10px;
  bottom: 0;
  background: #535353;
}

.dino-leg-front {
  right: 6px;
}

.dino-leg-back {
  left: 4px;
}

.dino-tail {
  position: absolute;
  left: -10px;
  bottom: 16px;
  width: 16px;
  height: 8px;
  background: #535353;
  clip-path: polygon(0 50%, 100% 0, 100% 100%);
}

.dino-shadow {
  position: absolute;
  left: 66px;
  bottom: 20px;
  width: 52px;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  filter: blur(1px);
}

.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 24px;
  height: 2px;
  background: #535353;
  overflow: hidden;
}

.ground::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    to right,
    #ffffff 0,
    #ffffff 4px,
    transparent 4px,
    transparent 8px
  );
  background-position-x: 0;
}

.ground-detail {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  height: 8px;
  background-image: radial-gradient(
    circle at 0 6px,
    #535353 0,
    #535353 1px,
    transparent 1px
  );
  background-repeat: repeat-x;
  background-size: 20px 8px;
  opacity: 0.8;
}

.cactus {
  position: absolute;
  bottom: 22px;
  right: 0;
  width: 14px;
  height: 32px;
  background: #535353;
  box-shadow:
    -6px 8px 0 0 #535353,
    6px 8px 0 0 #535353,
    0 -4px 0 0 #ffffff;
}

.game-over {
  position: absolute;
  right: 16px;
  top: 10px;
  padding: 2px 6px;
  background: rgba(247, 247, 247, 0.9);
  border: 1px solid #d1d5db;
  font-size: 10px;
  color: #535353;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #535353;
}

.loading-text {
  letter-spacing: 0.02em;
}

.space-hint {
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  animation: blink 1s steps(2, start) infinite;
}

.dino-scene.is-active .ground::before {
  animation: ground-scroll 2s linear infinite;
}

.dino-scene.is-active .dino {
  animation: dino-jump 0.8s ease-in-out infinite;
}

.dino-scene.is-active .dino-leg-front {
  animation: leg-front 0.8s steps(2, end) infinite;
}

.dino-scene.is-active .dino-leg-back {
  animation: leg-back 0.8s steps(2, end) infinite;
}

.dino-scene.space-pressed .space-hint,
.dino-intro-loading.space-pressed .space-hint {
  transform: scale(1.02);
}

@keyframes ground-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-40px);
  }
}

@keyframes dino-jump {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-18px);
  }
  60% {
    transform: translateY(-22px);
  }
}

@keyframes leg-front {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(2px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes leg-back {
  0% {
    transform: translateY(2px);
  }
  50% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(2px);
  }
}

@keyframes blink {
  0%,
  40% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.2;
  }
}
</style>

 