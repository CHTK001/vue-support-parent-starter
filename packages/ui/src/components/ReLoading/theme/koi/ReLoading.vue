<script setup lang="ts">
/**
 * ReLoading koi 主题 —— 全屏加载遮罩（KoiLoading 移植）
 *
 * 独立动画结构（gooey 流体小球），不依赖 element-plus loading。
 */
defineOptions({ name: "ReLoading", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    loading?: boolean;
  }>(),
  { loading: false },
);
</script>

<template>
  <span class="re-loading" v-bind="$attrs">
    <!-- 透传业务子项：ReLoading 是加载态容器（全屏遮罩），子项必须保留在 DOM 中
        ，否则加载完成后内容不可见（主题逻辑只负责盖遮罩，不负责丢内容） -->
    <slot />
    <transition name="el-fade-in-linear">
      <div v-if="props.loading" class="koi-loading-box">
        <div class="koi-loading">
          <span :style="{ '--i': i }" v-for="i in 7" :key="i"></span>
        </div>
        <svg>
          <filter id="koi-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            <feColorMatrix
              values="1 0 0 0 0 
                      0 1 0 0 0
                      0 0 1 0 0 
                      0 0 0 20 -10"
            />
          </filter>
        </svg>
      </div>
    </transition>
  </span>
</template>

<style scoped lang="scss">
.koi-loading-box {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.18);
  will-change: clip-path;
  animation-fill-mode: both;

  svg {
    width: 0;
    height: 0;
  }

  .koi-loading {
    position: relative;
    width: 300px;
    height: 300px;
    filter: url("#koi-gooey");
  }

  .koi-loading span {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    animation: koi-loading 3s ease-in-out infinite;
    animation-delay: calc(0.2s * var(--i));
  }

  .koi-loading span::before {
    position: absolute;
    top: 0;
    left: calc(50% - 28px);
    width: 56px;
    height: 56px;
    content: "";
    background: var(--el-color-primary, #409eff);
    border-radius: 50%;
  }

  @keyframes koi-loading {
    0% {
      transform: rotate(0deg);
    }
    50%,
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
