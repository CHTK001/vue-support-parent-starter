<template>
  <div class="h-full w-full" :style="{ '--loading-border-radius': props.borderRadius + 'px' }">
    <div class="shadow-text">
      <div class="text-center inline-block text-white text-14px w-full h-full">
        <div class="relative w-full flex flex-col items-center justify-center h-full">
          <div class="w-full rounded-2.5 flex items-center justify-center" style="width: 200px">
            <div data-v-a4c4d738="" class="w-full flex justify-center items-center">
              <!-- From Uiverse.io by mobinkakei -->
              <div class="wrapper">
                <div class="circle text" />
                <div class="circle text" />
                <div class="circle text" />
                <div class="shadow" />
                <div class="shadow" />
                <div class="shadow" />
              </div>
            </div>
          </div>
          <p v-if="props.showNumber" class="mt-4 xl:text-lg text-base text-white font-bold">
            {{ _step }}
            <span class="text-sm">%</span>
          </p>
          <p v-if="props.showLoading" class="mt-4 text-sm text-white font-bold">
            {{ props.showLoadingLabel }}
          </p>
          <!---->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineExpose, ref } from "vue";

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
<style scoped>
/* From Uiverse.io by mobinkakei */
.wrapper {
  width: 200px;
  height: 60px;
  position: relative;
  z-index: 1999;
}

.circle {
  width: 20px;
  height: 20px;
  position: absolute;
  border-radius: 50%;
  background-color: #fff;
  left: 15%;
  transform-origin: 50%;
  animation: circle7124 0.5s alternate infinite ease;
}

@keyframes circle7124 {
  0% {
    top: 60px;
    height: 5px;
    border-radius: 50px 50px 25px 25px;
    transform: scaleX(1.7);
  }

  40% {
    height: 20px;
    border-radius: 50%;
    transform: scaleX(1);
  }

  100% {
    top: 0%;
  }
}

.circle:nth-child(2) {
  left: 45%;
  animation-delay: 0.2s;
}

.circle:nth-child(3) {
  left: auto;
  right: 15%;
  animation-delay: 0.3s;
}

.shadow {
  width: 20px;
  height: 4px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.9);
  position: absolute;
  top: 62px;
  transform-origin: 50%;
  z-index: -1;
  left: 15%;
  filter: blur(1px);
  animation: shadow046 0.5s alternate infinite ease;
}

@keyframes shadow046 {
  0% {
    transform: scaleX(1.5);
  }

  40% {
    transform: scaleX(1);
    opacity: 0.7;
  }

  100% {
    transform: scaleX(0.2);
    opacity: 0.4;
  }
}

.shadow:nth-child(4) {
  left: 45%;
  animation-delay: 0.2s;
}

.shadow:nth-child(5) {
  left: auto;
  right: 15%;
  animation-delay: 0.3s;
}
</style>
