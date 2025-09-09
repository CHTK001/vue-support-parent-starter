<style scoped>
/* From Uiverse.io by rust_1966 */
.progress-container {
  position: relative;
  width: 60%;
  max-width: 500px;
  height: 20px;
  background: radial-gradient(circle, #1b2735, #090a0f);
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  border: 1px solid #313131;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  transform: scaleX(0);
  transform-origin: left;
  background: linear-gradient(90deg, #00f260, #0575e6);
  border-radius: 30px;
  box-shadow:
    0 0 15px #00f260,
    0 0 30px #0575e6;
  will-change: transform;
  /* 移除动画延迟，确保动画能即时响应进度变化 */
  animation: grow 1s ease-in-out;
  animation-fill-mode: forwards;
}

@keyframes grow {
  0% {
    transform: scaleX(0);
  }
  100% {
    /* 根据 --current-step 动态缩放 */
    transform: scaleX(calc(var(--current-step)));
  }
}

.progress-bar::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent);
  opacity: 0.5;
  animation: ripple 3s infinite;
  will-change: transform, opacity; /* 提前告知浏览器变换和透明度即将改变 */
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  z-index: 2;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  opacity: 0.6;
  animation: float 5s infinite ease-in-out;
  will-change: transform; /* 提前告知浏览器变换即将改变 */
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes float {
  0% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-20px) translateX(10px);
  }
  100% {
    transform: translateY(0) translateX(0);
  }
}
.particle:nth-child(1) {
  top: 10%;
  left: 20%;
  animation-delay: 0s;
}
.particle:nth-child(2) {
  top: 30%;
  left: 70%;
  animation-delay: 1s;
}
.particle:nth-child(3) {
  top: 50%;
  left: 50%;
  animation-delay: 2s;
}
.particle:nth-child(4) {
  top: 80%;
  left: 40%;
  animation-delay: 1.5s;
}
.particle:nth-child(5) {
  top: 90%;
  left: 60%;
  animation-delay: 2.5s;
}
</style>

<template>
  <div class="h-full w-full" :style="{ '--loading-border-radius': props.borderRadius + 'px' }">
    <div class="shadow-text">
      <div class="text-center inline-block text-white text-14px w-full h-full">
        <div class="relative w-full flex flex-col items-center justify-center h-full">
          <div class="w-full rounded-2.5 flex items-center justify-center">
            <div data-v-a4c4d738="" class="w-full flex justify-center items-center text-white">
              <!-- From Uiverse.io by rust_1966 -->
              <div
                class="progress-container"
                :style="{
                  '--current-step': _step + '%'
                }"
              >
                <div class="progress-bar"></div>
                <div class="progress-text" v-if="props.showNumber">{{ _step }} %</div>
                <div class="particles">
                  <div class="particle"></div>
                  <div class="particle"></div>
                  <div class="particle"></div>
                  <div class="particle"></div>
                  <div class="particle"></div>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-4 text-sm text-white font-bold" v-if="props.showLoading">
            {{ props.showLoadingLabel }}
          </p>
          <!---->
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { defineExpose, ref, defineAsyncComponent, shallowRef } from "vue";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: "default" },
  showNumber: { type: Boolean, default: false },
  showLoading: { type: Boolean, default: false },
  showLoadingLabel: { type: String, default: "加载中..." },
  borderRadius: { type: Number, default: 10 }
});

const _step = ref(0);

/**
 * 步长
 * @param {number} value
 */
const stepTo = value => {
  const animate = () => {
    if (_step.value < value) {
      _step.value++;
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

/**
 * 重置
 */
const reset = async () => {
  _step.value = 0;
};
defineExpose({
  stepTo,
  reset
});
</script>
