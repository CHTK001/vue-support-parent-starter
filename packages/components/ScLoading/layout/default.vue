<script setup>
import { defineExpose,  ref, defineAsyncComponent, shallowRef } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: 'default' },
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
const stepTo = (value) => {
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
<template>
  <div class="h-full w-full" :style="{'--loading-border-radius': props.borderRadius + 'px'}">
     <div class="shadow-text">
        <div class="text-center inline-block text-white text-14px w-full h-full">
          <div class="relative flex flex-col items-center justify-center h-full">
            <div class="rounded-2.5 flex items-center justify-center shadow-bg">
              <div data-v-a4c4d738="" class="relative w-8 h-8">
                <span data-v-a4c4d738="" class="left-circle absolute top-0 left-0 rounded-full bg-theme-skyblue w-3 h-3"></span>
                <span data-v-a4c4d738="" class="right-circle absolute top-0 right-0 rounded-full bg-theme w-3 h-3"></span>
                <span data-v-a4c4d738="" class="bottom-circle absolute bottom-0 left-50% -translate-x-50% rounded-full bg-theme-skyblue2 w-3 h-3"></span>
              </div>
            </div>
            <p class="mt-4 xl:text-lg text-base text-white font-bold" v-if="props.showNumber">
              {{ _step }}  
             <span class="text-sm">%</span>
            </p>
            <p class="mt-4 text-sm text-white font-bold" v-if="props.showLoading">
              {{ props.showLoadingLabel }}
            </p>
            <!---->
          </div>
        </div>
      </div>
  </div>
</template>
<style scoped lang="scss">
.left-circle {
  animation: circle1-a4c4d738 1.6s ease-in-out infinite;
}

.right-circle {
  animation: circle2-a4c4d738 1.6s ease-in-out infinite;
}

.bottom-circle {
  animation: circle3-a4c4d738 1.6s ease-in-out infinite;
}

@keyframes circle1-a4c4d738 {
  0%,
  to {
    transform: translate(0);
  }

  30% {
    transform: translate(84%, 167%);
  }

  60% {
    transform: translate(167%);
  }
}

@keyframes circle2-a4c4d738 {
  0%,
  to {
    transform: translate(0);
  }

  30% {
    transform: translate(-167%);
  }

  60% {
    transform: translate(-84%, 167%);
  }
}

@keyframes circle3-a4c4d738 {
  0%,
  to {
    transform: translate(-50%);
  }

  30% {
    transform: translate(42%, -167%);
  }

  60% {
    transform: translate(-134%, -167%);
  }
}</style>