<template>
  <div ref="nacosContainerRef" class="nacos-container h-full">
    <!-- 加载中状态 -->
    <div v-if="loading" class="nacos-loading">
      <div class="nacos-loading-spinner"></div>
      <div class="nacos-loading-text">正在加载 Nacos 控制台...</div>
    </div>

    <!-- iframe 加载失败时显示的内容 -->
    <div v-if="loadFailed" class="nacos-fallback">
      <div class="nacos-fallback-header">
        <IconifyIconOnline icon="ep:warning-filled" />
        <span>无法加载 Nacos 控制台</span>
      </div>
      <div class="nacos-fallback-content">
        <p>可能的原因:</p>
        <ul>
          <li>Nacos 服务器未启动或不可访问</li>
          <li>浏览器的内容安全策略限制了 iframe 加载</li>
          <li>网络连接问题</li>
        </ul>
        <div class="nacos-fallback-actions">
          <button class="nacos-fallback-button" @click="retryLoading">
            重试加载
          </button>
          <a
            :href="`http://${dataSource.genHost}:${dataSource.genPort}/nacos/index.html`"
            target="_blank"
            class="nacos-fallback-button"
          >
            在新窗口打开
          </a>
        </div>
      </div>
    </div>

    <!-- Nacos iframe -->
    <iframe
      v-show="!loadFailed && !loading"
      ref="nacosIframeRef"
      :src="`http://${dataSource.genHost}:${dataSource.genPort}/nacos/index.html`"
      class="nacos-iframe"
      :style="{ height: iframeHeight + 'px' }"
      allow="fullscreen"
      referrerpolicy="no-referrer"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      loading="eager"
      @load="handleIframeLoad"
      @error="handleIframeError"
    ></iframe>
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";

// 组件属性
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

// 元素引用
const nacosContainerRef = ref(null);
const nacosIframeRef = ref(null);

// 状态
const loading = ref(true);
const loadFailed = ref(false);
const loadAttempts = ref(0);

// 计算数据
const dataSource = computed(() => props.data || {});
const iframeHeight = ref(window.innerHeight);

// 处理 iframe 加载完成
const handleIframeLoad = () => {
  loading.value = false;
  loadFailed.value = false;
};

// 处理 iframe 加载失败
const handleIframeError = () => {
  loading.value = false;
  loadFailed.value = true;
  console.error("Nacos iframe 加载失败");
};

// 重试加载
const retryLoading = () => {
  if (loadAttempts.value < 3) {
    loading.value = true;
    loadFailed.value = false;
    loadAttempts.value += 1;

    // 重新加载 iframe
    if (nacosIframeRef.value) {
      const src = nacosIframeRef.value.src;
      nacosIframeRef.value.src = "";
      setTimeout(() => {
        if (nacosIframeRef.value) {
          nacosIframeRef.value.src = src;
        }
      }, 500);
    }
  }
};

// 更新iframe高度
const updateIframeHeight = () => {
  if (nacosContainerRef.value) {
    // 获取容器高度并设置iframe高度
    nextTick(() => {
      const containerHeight =
        nacosContainerRef.value.clientHeight || window.innerHeight;
      iframeHeight.value = containerHeight;
    });
  }
};

// 窗口尺寸变化处理
const handleResize = () => {
  updateIframeHeight();
};

// 组件挂载和卸载生命周期
onMounted(() => {
  updateIframeHeight();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

/**
 * 更新数据
 */
const upgrade = async (data, node) => {
  // 不需要处理树节点事件，因为已经设置为全屏模式
  console.log("Nacos组件不需要处理节点更新事件");
};

/**
 * 更新提示信息
 */
const upgradeHits = async (hits) => {
  // 这里可以实现提示信息的更新逻辑
  console.log("Nacos组件接收到提示信息更新:", hits);
};

// 导出方法
defineExpose({
  upgrade,
  upgradeHits,
});
</script>

<style scoped lang="scss">
.nacos-container {
  padding: 0;
  margin: 0;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;

  .nacos-iframe {
    border: none;
    width: 100%;
    min-height: 500px; /* 设置最小高度 */
    display: block;
    background-color: #fff;
  }

  .nacos-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;

    &-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #e4e7ed;
      border-top-color: #409eff;
      border-radius: 50%;
      animation: nacos-spin 1s linear infinite;
    }

    &-text {
      margin-top: 20px;
      font-size: 16px;
      color: #606266;
    }
  }

  .nacos-fallback {
    padding: 30px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f5f7fa;

    &-header {
      font-size: 24px;
      font-weight: bold;
      color: #f56c6c;
      margin-bottom: 20px;
      display: flex;
      align-items: center;

      i {
        margin-right: 10px;
        font-size: 28px;
      }
    }

    &-content {
      max-width: 600px;
      text-align: center;

      p {
        font-size: 16px;
        margin-bottom: 10px;
      }

      ul {
        text-align: left;
        margin-bottom: 30px;

        li {
          margin-bottom: 8px;
          color: #606266;
        }
      }
    }

    &-actions {
      display: flex;
      gap: 16px;
    }

    &-button {
      padding: 10px 20px;
      background-color: #409eff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;

      &:hover {
        background-color: #66b1ff;
      }
    }
  }
}

@keyframes nacos-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
