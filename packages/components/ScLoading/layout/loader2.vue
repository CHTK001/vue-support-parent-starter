<style scoped>
 /* From Uiverse.io by JkHuger */ 
.circle {
  position: relative;
  left: -100px;
  width: 0;
  height: 0;
  border: 50px solid #FDD835;
  border-radius: 50%;
  border-right-color: transparent;
  animation: move 5s linear 0s infinite normal forwards;
}

.circle:before {
  content: "";
  position: absolute;
  top: -50px;
  left: -50px;
  width: 0;
  height: 0;
  border: 50px solid #FDD835;
  border-radius: 50%;
  border-right-color: transparent;
  animation: chomp1 .25s ease-in-out 0s infinite normal forwards;
}

.circle:after {
  content: "";
  position: absolute;
  top: -50px;
  left: -50px;
  width: 0;
  height: 0;
  border: 50px solid #FDD835;
  border-radius: 50%;
  border-right-color: transparent;
  animation: chomp2 .25s ease-in-out 0s infinite normal forwards;
}

.loader {
  position: relative;
  top: 50px;
  width: 300px;
  height: 0px;
  border-top: 10px dotted black;
  animation: loader_4013 5s ease-in-out 0s infinite normal forwards;
}

.dots {
  position: relative;
  top: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 0 10px;
  border-radius: 50%;
  background: #1E88E5;
  animation: dot1 5s linear 0s infinite none normal;
}

.dot:nth-child(1) {
  animation-delay: 0s
}

.dot:nth-child(2) {
  animation-delay: 0.25s
}

.dot:nth-child(3) {
  animation-delay: 0.5s
}

.dot:nth-child(4) {
  animation-delay: 0.75s
}

.dot:nth-child(5) {
  animation-delay: 1s
}

.dot:nth-child(6) {
  animation-delay: 1.25s
}

.dot:nth-child(7) {
  animation-delay: 1.5s
}

.dot:nth-child(8) {
  animation-delay: 1.75s
}

.dot:nth-child(9) {
  animation-delay: 1.9s
}

.dot:nth-child(10) {
  animation-delay: 2.1s
}

.dots2 {
  position: relative;
  top: 50px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot2 {
  position: relative;
  left: -10px;
  width: 10px;
  height: 10px;
  margin: 0 10px;
  border-radius: 50%;
  background: #F44336;
  opacity: 0;
  animation: dot2 5s linear 0s infinite none normal;
}

.dot2:nth-child(10) {
  animation-delay: 2.5s
}

.dot2:nth-child(9) {
  animation-delay: 2.75s
}

.dot2:nth-child(8) {
  animation-delay: 3.0s
}

.dot2:nth-child(7) {
  animation-delay: 3.25s
}

.dot2:nth-child(6) {
  animation-delay: 3.5s
}

.dot2:nth-child(5) {
  animation-delay: 3.75s
}

.dot2:nth-child(4) {
  animation-delay: 4.0s
}

.dot2:nth-child(3) {
  animation-delay: 4.25s
}

.dot2:nth-child(2) {
  animation-delay: 4.5s
}

.dot2:nth-child(1) {
  animation-delay: 4.6s
}
/* #F44336;, #1E88E5, #FDD835; */
@keyframes chomp1 {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(45deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@keyframes chomp2 {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(-45deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@keyframes move {
  0%, 100% {
    left: -100px;
  }

  0%, 48% {
    transform: rotateY(0deg);
  }

  50%, 100% {
    transform: rotateY(180deg);
  }

  50% {
    left: 100%;
  }
}

@keyframes loader_4013 {
  0%, 100% {
    border-top: 10px dotted #1E88E5;
  }

  0%, 48% {
    border-top: 10px dotted #1E88E5;
  }

  50%, 100% {
    border-top: 10px dotted #F44336;
  }

  50% {
    border-top: 10px dotted #F44336;
  }
}

@keyframes dot1 {
  0%,4% {
    background: #1E88E5;
    opacity: 1;
  }

  5%,94% {
    background: #F44336;
    opacity: 0;
  }

  95%,100% {
    background: #1E88E5;
    opacity: 1;
  }
}

@keyframes dot2 {
  0%,4% {
    background: #F44336;
    opacity: 1;
  }

  5%,94% {
    opacity: 0;
  }

  95%,100% {
    background: #F44336;
    opacity: 1;
  }
}
</style>

<template>
  <div class="h-full w-full" :style="{'--loading-border-radius': props.borderRadius + 'px'}">
     <div class="shadow-text">
        <div class="text-center inline-block text-white text-14px w-full h-full">
          <div class="relative flex flex-col items-center justify-center h-full">
            <div class="rounded-2.5 flex items-center justify-center ">
              <div data-v-a4c4d738="" class="relative  flex justify-between items-center text-white">
                <main id="container">
                    
                    <div class="dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                    <div class="dots2">
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                        <div class="dot2"></div>
                    </div>
                    <div class="circle"></div>
                </main>
              </div>
            </div>
           <p class="mt-4 xl:text-lg text-base  text-white font-bold" v-if="props.showNumber">
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