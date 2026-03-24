<script setup lang="ts">
interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 是否显示进度条（像素条内部自己实现节奏） */
  showProgress?: boolean;
}

withDefaults(defineProps<Props>(), {
  loadingText: "页面加载中...",
  showProgress: true
});
</script>

<template>
  <div class="cool-loading pixel-loading">
    <div class="pixel-container">
      <div class="pixel-text">
        {{ loadingText }}
      </div>
      <div class="pixel-bar">
        <div class="pixel-inner" />
      </div>
      <div class="pixel-tip">像素风加载中，请稍候...</div>
    </div>
  </div>
</template>

<style scoped>
.pixel-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #111827;
  color: #e5e7eb;
  font-family: "Courier New", Courier, monospace;
}

.pixel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pixel-text {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  text-align: center;
  animation: pixel-blink 1s steps(2) infinite;
}

.pixel-bar {
  width: 200px;
  height: 24px;
  border: 4px solid #e5e7eb;
  padding: 2px;
  position: relative;
  box-shadow: 0 0 0 3px #111827, 0 0 0 4px #e5e7eb;
  background: #111827;
}

.pixel-inner {
  height: 100%;
  width: 0;
  background: #22c55e;
  box-shadow: inset 0 0 0 2px #16a34a;
  animation: pixel-fill 2s steps(8) infinite;
}

.pixel-tip {
  font-size: 12px;
  opacity: 0.8;
}

@keyframes pixel-blink {
  50% {
    opacity: 0;
  }
}

@keyframes pixel-fill {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}
</style>


