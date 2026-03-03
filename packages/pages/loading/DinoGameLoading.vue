<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

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

const iframeRef = ref<HTMLIFrameElement | null>(null);
const score = ref(0);
const highScore = ref(0);
const gameOver = ref(false);

const MESSAGE_SCORE = "dino-score";
const MESSAGE_GAME_OVER = "dino-gameover";
const MESSAGE_JUMP = "dino-jump";

const postToIframe = (payload: unknown): void => {
  const win = iframeRef.value?.contentWindow;
  if (!win) {
    return;
  }
  win.postMessage(payload, window.location.origin);
};

const handleMessage = (event: MessageEvent): void => {
  if (event.origin !== window.location.origin) {
    return;
  }
  const data = event.data as { type?: string; score?: number } | null;
  if (!data?.type) {
    return;
  }
  if (data.type === MESSAGE_SCORE) {
    const currentScore = Number(data.score ?? 0);
    score.value = currentScore;
    emit("scoreChange", currentScore);
    if (currentScore > highScore.value) {
      highScore.value = currentScore;
      emit("highScoreChange", highScore.value);
    }
    return;
  }
  if (data.type === MESSAGE_GAME_OVER) {
    const finalScore = Number(data.score ?? 0);
    gameOver.value = true;
    emit("gameOver", { score: finalScore, highScore: highScore.value });
  }
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.code !== "Space" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  postToIframe({ type: MESSAGE_JUMP });
};

onMounted(() => {
  window.addEventListener("message", handleMessage);
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="cool-loading dino-intro-loading">
    <iframe ref="iframeRef" class="dino-iframe" title="dino-game" src="/dino-game/index.html" />

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

.dino-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
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