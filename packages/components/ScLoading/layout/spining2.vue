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
/** * 步长 */
<template>
  <div class="h-full w-full" :style="{ '--loading-border-radius': props.borderRadius + 'px' }">
    <div class="shadow-text">
      <div class="text-center inline-block text-white text-14px w-full h-full">
        <div class="relative flex flex-col items-center justify-center h-full">
          <div class="rounded-2.5 flex items-center justify-center shadow-bg1">
            <div data-v-a4c4d738="" class="relative w-8 h-8 flex justify-between items-center text-white">
              <!-- From Uiverse.io by satyamchaudharydev -->
              <div class="spinner">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
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

<style scoped>
/* From Uiverse.io by satyamchaudharydev */
.spinner {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  margin-left: -45px;
}

.spinner span {
  position: absolute;
  top: 50%;
  left: var(--left);
  width: 35px;
  height: 7px;
  background: #ffff;
  animation: dominos 1s ease infinite;
  box-shadow: 2px 2px 3px 0px black;
}

.spinner span:nth-child(1) {
  --left: 80px;
  animation-delay: 0.125s;
}

.spinner span:nth-child(2) {
  --left: 70px;
  animation-delay: 0.3s;
}

.spinner span:nth-child(3) {
  left: 60px;
  animation-delay: 0.425s;
}

.spinner span:nth-child(4) {
  animation-delay: 0.54s;
  left: 50px;
}

.spinner span:nth-child(5) {
  animation-delay: 0.665s;
  left: 40px;
}

.spinner span:nth-child(6) {
  animation-delay: 0.79s;
  left: 30px;
}

.spinner span:nth-child(7) {
  animation-delay: 0.915s;
  left: 20px;
}

.spinner span:nth-child(8) {
  left: 10px;
}

@keyframes dominos {
  50% {
    opacity: 0.7;
  }

  75% {
    -webkit-transform: rotate(90deg);
    transform: rotate(90deg);
  }

  80% {
    opacity: 1;
  }
}
</style>
