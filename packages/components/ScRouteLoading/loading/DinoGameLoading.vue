<script setup lang="ts">
import { ref } from "vue";
import { useDinoClone } from "./useDinoClone";

interface Props {
  loadingText?: string;
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "正在唤醒恐龙小游戏...",
  showProgress: false
});

const emit = defineEmits<{
  (e: "scoreChange", score: number): void;
  (e: "highScoreChange", highScore: number): void;
  (e: "gameOver", payload: { score: number; highScore: number }): void;
}>();

const worldRef = ref<HTMLDivElement | null>(null);
const score = ref(0);
const highScore = ref(0);
const gameOver = ref(false);

useDinoClone(worldRef, {
  onScoreChange: (currentScore: number) => {
    score.value = currentScore;
    emit("scoreChange", currentScore);
    if (currentScore > highScore.value) {
      highScore.value = currentScore;
      emit("highScoreChange", highScore.value);
    }
  },
  onGameOver: (finalScore: number) => {
    gameOver.value = true;
    emit("gameOver", { score: finalScore, highScore: highScore.value });
  }
});
</script>

<template>
  <div class="cool-loading dino-intro-loading">
    <div ref="worldRef" class="dino-world" data-world />

    <div v-if="gameOver" class="dino-result-overlay">
      <div class="dino-result-card">
        <div class="dino-result-title">本局得分：{{ score }}</div>
        <div class="dino-result-sub">历史最高：{{ highScore }}</div>
        <div class="dino-result-hint">按空格键或点击重新开始</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dino-intro-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.dino-world {
  position: relative;
  background: #f7f7f7;
  overflow: hidden;
}

.dino-result-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.dino-result-card {
  min-width: 220px;
  padding: 16px 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
  color: #333;
  pointer-events: auto;
}

.dino-result-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.dino-result-sub {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.dino-result-hint {
  font-size: 12px;
  color: #999;
}
</style>

<!-- 小恐龙游戏元素样式，使用全局样式以兼容运行时动态创建的 DOM -->
<style>
.dino-world {
  position: relative;
  overflow: hidden;
  background-color: #f7f7f7;
}

.dino {
  position: absolute;
  left: 10%;
  height: 30%;
  bottom: var(--bottom);
  image-rendering: pixelated;
}

.ground {
  position: absolute;
  bottom: 0;
  left: calc(var(--left) * 1%);
  width: 300%;
  image-rendering: pixelated;
}

.cactus {
  position: absolute;
  bottom: 0;
  left: calc(var(--left) * 1%);
  height: 30%;
  image-rendering: pixelated;
}
</style>