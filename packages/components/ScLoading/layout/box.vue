<style scoped>
  /* From Uiverse.io by Nawsome */ 
.boxes {
  --size: 32px;
  --duration: 800ms;
  height: calc(var(--size) * 2);
  width: calc(var(--size) * 3);
  position: relative;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  margin-top: calc(var(--size) * 1.5 * -1);
  transform: rotateX(60deg) rotateZ(45deg) rotateY(0deg) translateZ(0px);
}

.boxes .box {
  width: var(--size);
  height: var(--size);
  top: 0;
  left: 0;
  position: absolute;
  transform-style: preserve-3d;
}

.boxes .box:nth-child(1) {
  transform: translate(100%, 0);
  -webkit-animation: box1 var(--duration) linear infinite;
  animation: box1 var(--duration) linear infinite;
}

.boxes .box:nth-child(2) {
  transform: translate(0, 100%);
  -webkit-animation: box2 var(--duration) linear infinite;
  animation: box2 var(--duration) linear infinite;
}

.boxes .box:nth-child(3) {
  transform: translate(100%, 100%);
  -webkit-animation: box3 var(--duration) linear infinite;
  animation: box3 var(--duration) linear infinite;
}

.boxes .box:nth-child(4) {
  transform: translate(200%, 0);
  -webkit-animation: box4 var(--duration) linear infinite;
  animation: box4 var(--duration) linear infinite;
}

.boxes .box > div {
  --background: #5C8DF6;
  --top: auto;
  --right: auto;
  --bottom: auto;
  --left: auto;
  --translateZ: calc(var(--size) / 2);
  --rotateY: 0deg;
  --rotateX: 0deg;
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--background);
  top: var(--top);
  right: var(--right);
  bottom: var(--bottom);
  left: var(--left);
  transform: rotateY(var(--rotateY)) rotateX(var(--rotateX)) translateZ(var(--translateZ));
}

.boxes .box > div:nth-child(1) {
  --top: 0;
  --left: 0;
}

.boxes .box > div:nth-child(2) {
  --background: #145af2;
  --right: 0;
  --rotateY: 90deg;
}

.boxes .box > div:nth-child(3) {
  --background: #447cf5;
  --rotateX: -90deg;
}

.boxes .box > div:nth-child(4) {
  --background: #DBE3F4;
  --top: 0;
  --left: 0;
  --translateZ: calc(var(--size) * 3 * -1);
}

@-webkit-keyframes box1 {
  0%, 50% {
    transform: translate(100%, 0);
  }

  100% {
    transform: translate(200%, 0);
  }
}

@keyframes box1 {
  0%, 50% {
    transform: translate(100%, 0);
  }

  100% {
    transform: translate(200%, 0);
  }
}

@-webkit-keyframes box2 {
  0% {
    transform: translate(0, 100%);
  }

  50% {
    transform: translate(0, 0);
  }

  100% {
    transform: translate(100%, 0);
  }
}

@keyframes box2 {
  0% {
    transform: translate(0, 100%);
  }

  50% {
    transform: translate(0, 0);
  }

  100% {
    transform: translate(100%, 0);
  }
}

@-webkit-keyframes box3 {
  0%, 50% {
    transform: translate(100%, 100%);
  }

  100% {
    transform: translate(0, 100%);
  }
}

@keyframes box3 {
  0%, 50% {
    transform: translate(100%, 100%);
  }

  100% {
    transform: translate(0, 100%);
  }
}

@-webkit-keyframes box4 {
  0% {
    transform: translate(200%, 0);
  }

  50% {
    transform: translate(200%, 100%);
  }

  100% {
    transform: translate(100%, 100%);
  }
}

@keyframes box4 {
  0% {
    transform: translate(200%, 0);
  }

  50% {
    transform: translate(200%, 100%);
  }

  100% {
    transform: translate(100%, 100%);
  }
}
</style>

<template>
  <div class="h-full w-full" :style="{'--loading-border-radius': props.borderRadius + 'px'}">
     <div class="shadow1">
        <div class="text-center inline-block text-white text-14px w-full h-full">
          <div class="relative flex flex-col items-center justify-center h-full">
            <div class="rounded-2.5 flex items-center justify-center shadow-bg1" style="width: 140px; height: 140px;">
              <div data-v-a4c4d738="" class="relative  flex justify-between items-center text-white" >
                 <!-- From Uiverse.io by Nawsome --> 
                <div class="boxes">
                    <div class="box">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div class="box">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div class="box">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div class="box">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
                <!-- From Uiverse.io by Nawsome -->
              </div>
            </div>
           <p class="mt-4 xl:text-lg text-base text-white font-bold text" v-if="props.showNumber">
              {{ _step }}  
             <span class="text-sm">%</span>
            </p>
            <p class="mt-4 text-sm  text-white font-bold text" v-if="props.showLoading">
              {{ props.showLoadingLabel }}
            </p>
            <!---->
          </div>
        </div>
      </div>
  </div>
</template>
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