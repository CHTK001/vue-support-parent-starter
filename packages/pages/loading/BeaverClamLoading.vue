<script setup lang="ts">
import BeaverClamGame from "../game/BeaverClam.vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 占位兼容 */
  showProgress?: boolean;
}

withDefaults(defineProps<Props>(), {
  loadingText: "河狸正在努力敲开蛤蜊...",
  showProgress: false
});
</script>

<template>
  <div class="beaver-loading">
    <div class="loading-content">
      <BeaverClamGame />
    </div>
    <div class="loading-text">{{ loadingText }}</div>
  </div>
</template>

<style scoped lang="scss">
.beaver-loading {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.loading-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  :deep(.beaver-game-container) {
    padding: 0;
    background: transparent;
    min-height: auto;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .game-area {
      width: 100%;
      height: 100%;
      max-width: 800px;
      max-height: 600px;
    }
    
    .controls {
      display: none;
    }
  }
}

.loading-text {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 10;
}
</style>

