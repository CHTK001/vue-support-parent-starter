<script setup>
import { defineExpose, defineEmits, defineProps, ref, defineAsyncComponent, shallowRef, nextTick } from 'vue';

const DefaultLayout = defineAsyncComponent(() => import("./layout/default.vue"))
const SpiningLayout = defineAsyncComponent(() => import("./layout/spining.vue"))
const Spining2Layout = defineAsyncComponent(() => import("./layout/spining2.vue"))
const BanterLayout = defineAsyncComponent(() => import("./layout/banter.vue"))
const JimiLayout = defineAsyncComponent(() => import("./layout/jimi.vue"))
const BoxLayout = defineAsyncComponent(() => import("./layout/box.vue"))
const PencilLayout = defineAsyncComponent(() => import("./layout/pencil.vue"))
const LoaderLayout = defineAsyncComponent(() => import("./layout/loader.vue"))
const Loader2Layout = defineAsyncComponent(() => import("./layout/loader2.vue"))
const Loader3Layout = defineAsyncComponent(() => import("./layout/loader3.vue"))
const Loader4Layout = defineAsyncComponent(() => import("./layout/loader4.vue"))
const Loader5Layout = defineAsyncComponent(() => import("./layout/loader5.vue"))
const Loader6Layout = defineAsyncComponent(() => import("./layout/loader6.vue"))
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: 'default' },
  showNumber: { type: Boolean, default: false },
  showLoading: { type: Boolean, default: false },
  showLoadingLabel: { type: String, default: "加载中..." },
  autoCloseFinished: { type: Boolean, default: false },
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
  nextTick(() => {
    layoutRef.value.stepTo(_step.value);
  });
  checkFisihed();
};
/**
 * 检查是否完成
 */
const checkFisihed = async () => {
  if (props.autoCloseFinished && _step.value === 100) {
    emit('update:modelValue', false);
    emit('finished');
  }
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
  nextTick(() => {
    layoutRef.value.reset();
  });
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
    <SpiningLayout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-if="props.layout === 'spining'" ></SpiningLayout>
    <Spining2Layout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'spining2'" ></Spining2Layout>
    <LoaderLayout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'loader'" ></LoaderLayout>
    <Loader2Layout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'loader2'" ></Loader2Layout>
    <Loader3Layout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'loader3'" ></Loader3Layout>
    <Loader4Layout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'loader4'" ></Loader4Layout>
    <Loader5Layout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'loader5'" ></Loader5Layout>
    <Loader6Layout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'loader6'" ></Loader6Layout>
    <BanterLayout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'banter'" ></BanterLayout>
    <PencilLayout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'pencil'" ></PencilLayout>
    <JimiLayout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'jimi'" ></JimiLayout>
    <BoxLayout ref="layoutRef" 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" v-else-if="props.layout === 'box'" ></BoxLayout>
    <DefaultLayout 
      :show-number="props.showNumber" 
      :show-loading="props.showLoading" 
      :show-loading-label="props.showLoadingLabel" ref="layoutRef" v-else></DefaultLayout>
  </div>
</template>