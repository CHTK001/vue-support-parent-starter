<script setup>
import { defineExpose, defineEmits, defineProps, ref, defineAsyncComponent, shallowRef } from 'vue';

const DefaultLayout = defineAsyncComponent(() => import("./layout/default.vue"))
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: 'default' },
  showNumber: { type: Boolean, default: false },
});

const layoutRef = shallowRef();

const _step = ref(0);

/**
 * 步长
 */
const step = async () => {
  stepBy(1);
};
/**
 * 步长
 * @param {number} value
 */
const stepBy = async (value) => {
  stepTo(_step.value + value);
};
/**
 * 步长
 * @param {number} value
 */
const stepTo = async (value) => {
  _step.value = value;
  check();
  layoutRef.value.stepTo(_step.value);
};

const check = async () => {
  if (_step.value > 100) {
    _step.value = 100;
  }
  if (_step.value < 0) {
    _step.value = 0;
  }
};

/**
 * 重置
 */
const reset = async () => {
  _step.value = 0;
  layoutRef.value.reset();
};
/**
 * 关闭
 */
const close = async () => {
  emit('update:modelValue', false);
};
defineExpose({
  step,
  stepBy,
  stepTo,
  close,
  reset
});
</script>
<template>
  <div class="h-full w-full" v-if="props.modelValue">
    <DefaultLayout ref="layoutRef" ></DefaultLayout>
  </div>
</template>