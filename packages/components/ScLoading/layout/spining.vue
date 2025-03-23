
<script setup>
import { defineExpose, defineEmits, defineProps, ref, defineAsyncComponent, shallowRef } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: 'default' },
  showNumber: { type: Boolean, default: false },
  showLoading: { type: Boolean, default: false },
  showLoadingLabel: { type: String, default: "加载中..." },
  borderRadius: { type: Number, default: 10 },
});

const _step = ref(0);
/**
 * 步长
 * @param {number} value
 */
const stepTo = async (value) => {
  _step.value = value;
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
/**
 * 步长
 */
<style scoped>
  /* From Uiverse.io by Tsiangana */ 
.dot-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  --uib-speed: 0.9s;
  height: 2.8rem;
  width: 2.8rem;
  /*animation: float 3s linear infinite;*/
}

@keyframes float {
  0% {
    transform: rotate(0deg) translate(100px) rotate(0deg);
  }

  100% {
    transform: rotate(360deg) translate(100px) rotate(-360deg);
  }
}

.dot-spinner__dot::before {
  content: '';
  height: 20%;
  width: 20%;
  border-radius: 50%;
  background-color: #fff;
  filter: drop-shadow(0 0 10px rgb(95, 150, 202));
  box-shadow: -6px -6px 11px #c1c1c1,
             6px 6px 11px #ffffff;
  transform: scale(0);
  opacity: 0.5;
  animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
  box-shadow: 0 0 20px rgba(18, 31, 53, 0.3);
}

.dot-spinner__dot {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
}

.dot-spinner__dot:nth-child(2) {
  transform: rotate(45deg);
}

.dot-spinner__dot:nth-child(2)::before {
  animation-delay: calc(var(--uib-speed) * -0.875);
}

.dot-spinner__dot:nth-child(3) {
  transform: rotate(90deg);
}

.dot-spinner__dot:nth-child(3)::before {
  animation-delay: calc(var(--uib-speed) * -0.75);
}

.dot-spinner__dot:nth-child(4) {
  transform: rotate(135deg);
}

.dot-spinner__dot:nth-child(4)::before {
  animation-delay: calc(var(--uib-speed) * -0.625);
}

.dot-spinner__dot:nth-child(5) {
  transform: rotate(180deg);
}

.dot-spinner__dot:nth-child(5)::before {
  animation-delay: calc(var(--uib-speed) * -0.5);
}

.dot-spinner__dot:nth-child(6) {
  transform: rotate(225deg);
}

.dot-spinner__dot:nth-child(6)::before {
  animation-delay: calc(var(--uib-speed) * -0.375);
}

.dot-spinner__dot:nth-child(7) {
  transform: rotate(270deg);
}

.dot-spinner__dot:nth-child(7)::before {
  animation-delay: calc(var(--uib-speed) * -0.25);
}

.dot-spinner__dot:nth-child(8) {
  transform: rotate(315deg);
}

.dot-spinner__dot:nth-child(8)::before {
  animation-delay: calc(var(--uib-speed) * -0.125);
}

@keyframes pulse0112 {
  0%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

<template>
 
  <div class="h-full w-full" :style="{'--loading-border-radius': props.borderRadius + 'px'}">
     <div class="shadow-text">
        <div class="text-center inline-block text-white text-14px w-full h-full">
          <div class="relative flex flex-col items-center justify-center h-full">
            <div class="rounded-2.5 flex items-center justify-center shadow-bg">
              <div data-v-a4c4d738="" class="relative w-8 h-8 flex justify-between items-center text-white">
                <div class="dot-spinner">
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
                  <div class="dot-spinner__dot"></div>
              </div>
              </div>
            </div>
           <p class="mt-4 xl:text-lg text-base text-white font-bold" v-if="props.showNumber">
              {{ _step }}  
             <span class="text-sm">%</span>
            </p>
            <p class="mt-4 text-sm  text-white font-bold" v-if="props.showLoading">
              {{ props.showLoadingLabel }}
            </p>
            <!---->
          </div>
        </div>
      </div>
  </div>
</template>
