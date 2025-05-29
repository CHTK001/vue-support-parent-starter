<template>
  <div class="knife4j-document">
    <!-- iframe加载动画 -->
    <div v-if="loading" class="iframe-loading">
      <div class="loading-spinner" />
      <p class="loading-text">文档加载中，请稍候...</p>
    </div>

    <!-- 文档iframe展示 -->
    <iframe 
      :src="documentUrl" 
      class="document-frame" 
      frameborder="0" 
      allowfullscreen 
      @load="handleIframeLoad" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// 接收文档URL属性
const props = defineProps({
  documentUrl: {
    type: String,
    required: true
  }
});

// 加载状态
const loading = ref(true);

// 处理iframe加载完成
const handleIframeLoad = () => {
  loading.value = false;
};

// 监听文档URL变化，重置加载状态
watch(() => props.documentUrl, () => {
  loading.value = true;
});
</script>

<style scoped lang="scss">
.knife4j-document {
  position: relative;
  width: 100%;
  height: 100%;

  // iframe加载动画
  .iframe-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 10;
    backdrop-filter: blur(4px);

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid var(--el-color-primary-light-8);
      border-top: 4px solid var(--el-color-primary);
      border-radius: 50%;
      margin-bottom: 16px;
      animation: spin 1.5s linear infinite;
    }

    .loading-text {
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }
  }

  // iframe
  .document-frame {
    width: 100%;
    height: 100%;
    border: none;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .knife4j-document {
    .iframe-loading {
      background-color: rgba(0, 0, 0, 0.7);

      .loading-text {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}
</style> 