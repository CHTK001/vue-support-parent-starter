<script setup>
import { defineExpose, ref, defineAsyncComponent, shallowRef, nextTick } from "vue";

const DefaultLayout = defineAsyncComponent(() => import("./layout/default.vue"));
const SpiningLayout = defineAsyncComponent(() => import("./layout/spining.vue"));
const Spining2Layout = defineAsyncComponent(() => import("./layout/spining2.vue"));
const BanterLayout = defineAsyncComponent(() => import("./layout/banter.vue"));
const JimiLayout = defineAsyncComponent(() => import("./layout/jimi.vue"));
const BoxLayout = defineAsyncComponent(() => import("./layout/box.vue"));
const PencilLayout = defineAsyncComponent(() => import("./layout/pencil.vue"));
const LoaderLayout = defineAsyncComponent(() => import("./layout/loader.vue"));
const Loader2Layout = defineAsyncComponent(() => import("./layout/loader2.vue"));
const Loader3Layout = defineAsyncComponent(() => import("./layout/loader3.vue"));
const Loader4Layout = defineAsyncComponent(() => import("./layout/loader4.vue"));
const Loader5Layout = defineAsyncComponent(() => import("./layout/loader5.vue"));
const Loader6Layout = defineAsyncComponent(() => import("./layout/loader6.vue"));
const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layout: { type: String, default: "default" },
  showNumber: { type: Boolean, default: true },
  showLoading: { type: Boolean, default: false },
  showLoadingLabel: { type: String, default: "加载中..." },
  autoCloseFinished: { type: Boolean, default: false }
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
const stepBy = async value => {
  stepTo(_step.value + value);
};
/**
 * 步长
 * @param {number} value
 */
const stepTo = async value => {
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
    emit("update:modelValue", false);
    emit("finished");
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
  emit("update:modelValue", false);
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
  <div v-if="props.modelValue" class="h-full w-full absolute top-0 left-0">
    <SpiningLayout v-if="props.layout === 'spining'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <Spining2Layout v-else-if="props.layout === 'spining2'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <LoaderLayout v-else-if="props.layout === 'loader'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <Loader2Layout v-else-if="props.layout === 'loader2'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <Loader3Layout v-else-if="props.layout === 'loader3'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <Loader4Layout v-else-if="props.layout === 'loader4'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <Loader5Layout v-else-if="props.layout === 'loader5'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <Loader6Layout v-else-if="props.layout === 'loader6'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <BanterLayout v-else-if="props.layout === 'banter'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <PencilLayout v-else-if="props.layout === 'pencil'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <JimiLayout v-else-if="props.layout === 'jimi'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <BoxLayout v-else-if="props.layout === 'box'" ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
    <DefaultLayout v-else ref="layoutRef" :show-number="props.showNumber" :show-loading="props.showLoading" :show-loading-label="props.showLoadingLabel" />
  </div>
</template>
