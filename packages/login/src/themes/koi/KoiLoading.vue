<template>
  <div>
    <transition name="koi-loading-out" :duration="2500">
      <div v-if="visible" class="loading-box">
        <div class="loading">
          <span :style="`--i: ${i}`" v-for="i in 7"></span>
        </div>

        <svg>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            <!-- feColorMatrix 用于彩色滤光片转换 -->
            <feColorMatrix
              values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 20 -10
            "
            />
          </filter>
        </svg>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// 加载遮罩可见状态。true 时显示，false 时触发圆形收缩退出动画并在 2.5s 后从 DOM 移除。
const visible = ref(true);

onMounted(() => {
  // 1.5s 后开始退出动画
  setTimeout(() => {
    visible.value = false;
  }, 1500);
});
</script>

<style lang="scss" scoped>
.loading-box {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);

  svg {
    width: 0;
    height: 0;
  }

  .loading {
    position: relative;
    width: 300px;
    height: 300px;
    filter: url("#gooey");
  }

  .loading span {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    animation: loading-spin 3s ease-in-out infinite;
    /* var函数用来插入css变量的值，css变量名称以--开头 */
    animation-delay: calc(0.2s * var(--i));
  }

  .loading span::before {
    position: absolute;
    top: 0;
    left: calc(50% - 28px);
    width: 56px;
    height: 56px;
    content: "";
    background-image: linear-gradient(to right, #92fe9d 0%, #00c9ff 100%);
    border-radius: 50%;
    box-shadow: 0 0 30px #00c9ff;
  }

  @keyframes loading-spin {
    0% {
      transform: rotate(0deg);
    }

    50%,
    100% {
      transform: rotate(360deg);
    }
  }
}

/* 退出动画：圆形收缩消失，动画结束后元素从 DOM 移除 */
.koi-loading-out-leave-active {
  animation: circle-out-center 2.5s cubic-bezier(0.25, 1, 0.3, 1) both;
  pointer-events: none;
}

@keyframes circle-out-center {
  0% {
    clip-path: circle(125% at 50% calc(50vh - 150px + 28px));
  }

  100% {
    clip-path: circle(0% at 50% calc(50vh - 150px + 28px));
  }
}
</style>
