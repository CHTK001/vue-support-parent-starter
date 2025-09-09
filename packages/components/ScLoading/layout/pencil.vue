<template>
  <div class="h-full w-full" :style="{ '--loading-border-radius': props.borderRadius + 'px' }">
    <div class="shadow1">
      <div class="text-center inline-block text-white text-14px w-full h-full">
        <div class="relative flex flex-col items-center justify-center h-full">
          <div class="rounded-2.5 flex items-center justify-center shadow-bg1" style="width: 140px; height: 140px">
            <div data-v-a4c4d738="" class="relative flex justify-between items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" height="200px" width="200px" viewBox="0 0 200 200" class="pencil">
                <defs>
                  <clipPath id="pencil-eraser">
                    <rect height="30" width="30" ry="5" rx="5" />
                  </clipPath>
                </defs>
                <circle
                  transform="rotate(-113,100,100)"
                  stroke-linecap="round"
                  stroke-dashoffset="439.82"
                  stroke-dasharray="439.82 439.82"
                  stroke-width="2"
                  stroke="currentColor"
                  fill="none"
                  r="70"
                  class="pencil__stroke"
                />
                <g transform="translate(100,100)" class="pencil__rotate">
                  <g fill="none">
                    <circle transform="rotate(-90)" stroke-dashoffset="402" stroke-dasharray="402.12 402.12" stroke-width="30" stroke="hsl(223,90%,50%)" r="64" class="pencil__body1" />
                    <circle transform="rotate(-90)" stroke-dashoffset="465" stroke-dasharray="464.96 464.96" stroke-width="10" stroke="hsl(223,90%,60%)" r="74" class="pencil__body2" />
                    <circle transform="rotate(-90)" stroke-dashoffset="339" stroke-dasharray="339.29 339.29" stroke-width="10" stroke="hsl(223,90%,40%)" r="54" class="pencil__body3" />
                  </g>
                  <g transform="rotate(-90) translate(49,0)" class="pencil__eraser">
                    <g class="pencil__eraser-skew">
                      <rect height="30" width="30" ry="5" rx="5" fill="hsl(223,90%,70%)" />
                      <rect clip-path="url(#pencil-eraser)" height="30" width="5" fill="hsl(223,90%,60%)" />
                      <rect height="20" width="30" fill="hsl(223,10%,90%)" />
                      <rect height="20" width="15" fill="hsl(223,10%,70%)" />
                      <rect height="20" width="5" fill="hsl(223,10%,80%)" />
                      <rect height="2" width="30" y="6" fill="hsla(223,10%,10%,0.2)" />
                      <rect height="2" width="30" y="13" fill="hsla(223,10%,10%,0.2)" />
                    </g>
                  </g>
                  <g transform="rotate(-90) translate(49,-30)" class="pencil__point">
                    <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)" />
                    <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)" />
                    <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <p v-if="props.showNumber" class="mt-4 xl:text-lg text-base text-white font-bold text">
            {{ _step }}
            <span class="text-sm">%</span>
          </p>
          <p v-if="props.showLoading" class="mt-4 text-sm text-white font-bold text">
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
<style scoped>
/* From Uiverse.io by gustavofusco */
.pencil {
  display: block;
  width: 10em;
  height: 10em;
}

.pencil__body1,
.pencil__body2,
.pencil__body3,
.pencil__eraser,
.pencil__eraser-skew,
.pencil__point,
.pencil__rotate,
.pencil__stroke {
  animation-duration: 3s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.pencil__body1,
.pencil__body2,
.pencil__body3 {
  transform: rotate(-90deg);
}

.pencil__body1 {
  animation-name: pencilBody1;
}

.pencil__body2 {
  animation-name: pencilBody2;
}

.pencil__body3 {
  animation-name: pencilBody3;
}

.pencil__eraser {
  animation-name: pencilEraser;
  transform: rotate(-90deg) translate(49px, 0);
}

.pencil__eraser-skew {
  animation-name: pencilEraserSkew;
  animation-timing-function: ease-in-out;
}

.pencil__point {
  animation-name: pencilPoint;
  transform: rotate(-90deg) translate(49px, -30px);
}

.pencil__rotate {
  animation-name: pencilRotate;
}

.pencil__stroke {
  animation-name: pencilStroke;
  transform: translate(100px, 100px) rotate(-113deg);
}

/* Animations */
@keyframes pencilBody1 {
  from,
  to {
    stroke-dashoffset: 351.86;
    transform: rotate(-90deg);
  }

  50% {
    stroke-dashoffset: 150.8;
    /* 3/8 of diameter */
    transform: rotate(-225deg);
  }
}

@keyframes pencilBody2 {
  from,
  to {
    stroke-dashoffset: 406.84;
    transform: rotate(-90deg);
  }

  50% {
    stroke-dashoffset: 174.36;
    transform: rotate(-225deg);
  }
}

@keyframes pencilBody3 {
  from,
  to {
    stroke-dashoffset: 296.88;
    transform: rotate(-90deg);
  }

  50% {
    stroke-dashoffset: 127.23;
    transform: rotate(-225deg);
  }
}

@keyframes pencilEraser {
  from,
  to {
    transform: rotate(-45deg) translate(49px, 0);
  }

  50% {
    transform: rotate(0deg) translate(49px, 0);
  }
}

@keyframes pencilEraserSkew {
  from,
  32.5%,
  67.5%,
  to {
    transform: skewX(0);
  }

  35%,
  65% {
    transform: skewX(-4deg);
  }

  37.5%,
  62.5% {
    transform: skewX(8deg);
  }

  40%,
  45%,
  50%,
  55%,
  60% {
    transform: skewX(-15deg);
  }

  42.5%,
  47.5%,
  52.5%,
  57.5% {
    transform: skewX(15deg);
  }
}

@keyframes pencilPoint {
  from,
  to {
    transform: rotate(-90deg) translate(49px, -30px);
  }

  50% {
    transform: rotate(-225deg) translate(49px, -30px);
  }
}

@keyframes pencilRotate {
  from {
    transform: translate(100px, 100px) rotate(0);
  }

  to {
    transform: translate(100px, 100px) rotate(720deg);
  }
}

@keyframes pencilStroke {
  from {
    stroke-dashoffset: 439.82;
    transform: translate(100px, 100px) rotate(-113deg);
  }

  50% {
    stroke-dashoffset: 164.93;
    transform: translate(100px, 100px) rotate(-113deg);
  }

  75%,
  to {
    stroke-dashoffset: 439.82;
    transform: translate(100px, 100px) rotate(112deg);
  }
}
</template>