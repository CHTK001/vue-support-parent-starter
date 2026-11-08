<script setup lang="ts">
/**
 * ReLoading default 主题 —— 全屏加载遮罩
 *
 * 使用 el-loading 全屏遮罩，v-model / loading prop 控制显隐。
 */
import { watchEffect } from "vue";
import { ElLoading } from "element-plus";

defineOptions({ name: "ReLoading", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    /** 遮罩文案 */
    text?: string;
  }>(),
  { loading: false, text: "加载中" },
);

let instance: { close: () => void } | null = null;

watchEffect(() => {
  if (props.loading) {
    if (!instance) {
      instance = ElLoading.service({ text: props.text, lock: true, background: "rgba(0,0,0,0.5)" });
    }
  } else if (instance) {
    instance.close();
    instance = null;
  }
});
</script>

<template>
  <span class="re-loading" v-bind="$attrs">
    <slot />
  </span>
</template>
