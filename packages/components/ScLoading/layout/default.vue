<script setup>
import { defineExpose, defineEmits, defineProps, ref, defineAsyncComponent, shallowRef } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: 'default' },
  showNumber: { type: Boolean, default: false },
  borderRadius: { type: Number, default: 10 }
});

const layoutRef = shallowRef();

const _step = ref(0);
/**
 * 步长
 * @param {number} value
 */
const stepTo = async (value) => {
  _step.value = value;
  layoutRef.value.stepTo(_step.value);
};

/**
 * 重置
 */
const reset = async () => {
  _step.value = 0;
  layoutRef.value.reset();
};
defineExpose({
  stepTo,
  reset
});
</script>
<template>
  <div class="h-full w-full" :style="{'--loading-border-radius': props.borderRadius + 'px'}">
     <div class="shadow">
        <div class="text-center inline-block text-white text-14px w-full h-full">
          <div class="relative flex flex-col items-center justify-center h-full">
            <div class="rounded-2.5 flex items-center justify-center shadow-bg">
              <div data-v-a4c4d738="" class="relative w-8 h-8">
                <span data-v-a4c4d738="" class="left-circle absolute top-0 left-0 rounded-full bg-theme-skyblue w-3 h-3"></span>
                <span data-v-a4c4d738="" class="right-circle absolute top-0 right-0 rounded-full bg-theme w-3 h-3"></span>
                <span data-v-a4c4d738="" class="bottom-circle absolute bottom-0 left-50% -translate-x-50% rounded-full bg-theme-skyblue2 w-3 h-3"></span>
              </div>
            </div>
            <p class="mt-4 xl:text-lg text-base text-white font-bold">
              {{ _step }}  
            <span class="text-sm">%</span></p>
            <!---->
          </div>
        </div>
      </div>
  </div>
</template>
<style scoped lang="scss">
.justify-center {
    justify-content: center;
}
.items-center {
    align-items: center;
}
.flex-col {
    flex-direction: column;
}

.text-14px {
    font-size: 14px;
}
.rounded-2\.5 {
    border-radius: .625rem;
}
.text-center {
    text-align: center;
}
.flex {
  display: flex;
}
.absolute {
  position: absolute;
}
.top-0{
  top:0;
} 
.right-0 {
  right: 0;
}
.left-0 {
  left: 0;
}
.bottom-0{
  bottom: 0;
}
.shadow {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  border-radius: var(--loading-border-radius);
  background-color: rgba(0, 0, 0, 0.6);
  .shadow-bg {
    width: 70px;
    height: 70px;
    background-color: rgba(0, 0, 0, .6);
    border-radius: 0.625rem;
  }
  .w-8 {
    width: 2rem;
  }
  .h-8{
    height: 2rem;
  }
}
@media (min-width: 1280px) {
    .xl\:text-lg {
        font-size: 1.125rem;
        line-height: 1.75rem;
    }
}
.rounded-full {
    border-radius: 9999px;
}

.w-3 {
    width: .75rem;
}
.h-3 {
    height: .75rem;
}
.font-700, .font-bold {
    font-weight: 700;
}
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