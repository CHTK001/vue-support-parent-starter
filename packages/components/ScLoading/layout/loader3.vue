<template>
  <div class="h-full w-full" :style="{ '--loading-border-radius': props.borderRadius + 'px' }">
    <div class="shadow-text">
      <div class="text-center inline-block text-white text-14px w-full h-full">
        <div class="relative flex flex-col items-center justify-center h-full">
          <div class="rounded-2.5 flex items-center justify-center">
            <div data-v-a4c4d738="" class="relative flex justify-between items-center text-white">
              <div class="eye-lid">
                <div class="eye">
                  <div class="cornea">
                    <div class="white-pupil" />
                  </div>
                </div>
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
/* From Uiverse.io by FWDJc */
.eye-lid {
  background-color: rgb(0, 0, 0);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 9px 0 2px rgba(0, 0, 0, 0.2);
  width: 150px;
  height: 150px;
}

.eye {
  background-color: #ffbc03;
  border-radius: 50%;
  transform: translate3d(0, 0, 0) rotate(90deg);
  width: 120px;
  height: 120px;
  animation: eye 5s infinite;
}

@keyframes eye {
  12%,
  25% {
    width: 100px;
    height: 110px;
  }

  37%,
  50% {
    width: 60px;
    height: 130px;
  }

  63%,
  75% {
    width: 100px;
    height: 103px;
  }

  87% {
    width: 100px;
    height: 100px;
  }
}

.cornea {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgb(0, 0, 0);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: eye-color 5s infinite;
}

@keyframes eye-color {
  63%,
  75% {
    background-color: rgb(8, 20, 96);
  }
}

.white-pupil {
  position: absolute;
  top: 9%;
  left: 10%;
  border-radius: 50%;
  background-color: #ffbc03;
  width: 20px;
  height: 20px;
}
</style>
