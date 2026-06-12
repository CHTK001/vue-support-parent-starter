<template>
  <div class="bs-iframe-container">
    <iframe
      v-if="src"
      :src="src"
      :allow-fullscreen="allowFullscreen"
      :sandbox="sandbox"
      class="bs-iframe-container__frame"
      frameborder="0"
      @load="onLoad"
      @error="onError"
    />
    <div v-else class="bs-iframe-container__placeholder">
      <span>未配置网页地址</span>
      <span class="bs-iframe-container__hint">请在配置面板中设置 iframeSrc</span>
    </div>
    <div v-if="loading" class="bs-iframe-container__loading">
      加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    src?: string;
    allowFullscreen?: boolean;
    sandbox?: string;
  }>(),
  {
    src: "",
    allowFullscreen: false,
    sandbox: "allow-scripts allow-same-origin",
  }
);

const loading = ref(false);

function onLoad() {
  loading.value = false;
}

function onError() {
  loading.value = false;
}
</script>

<style scoped>
.bs-iframe-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.bs-iframe-container__frame {
  width: 100%;
  height: 100%;
  border: none;
}

.bs-iframe-container__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 246, 255, 0.03);
  border: 1px dashed rgba(0, 246, 255, 0.2);
  color: rgba(0, 246, 255, 0.5);
  font-size: 14px;
}

.bs-iframe-container__hint {
  font-size: 11px;
  opacity: 0.5;
}

.bs-iframe-container__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(0, 246, 255, 0.8);
  font-size: 13px;
}
</style>
