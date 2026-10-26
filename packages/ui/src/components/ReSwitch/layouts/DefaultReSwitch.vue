<template>
  <div class="re-switch-default">
    <SwitchLabel :title="title" :sub="sub" :tip="tip" :description="description" />
    <ElSwitch v-bind="$attrs" v-model="modelValue" />
  </div>
</template>

<script setup lang="ts">
/**
 * DefaultReSwitch —— 原生行内开关（标题在左、开关在右）
 *
 * <p>文案四件套（title / sub / tip / description）都走共享的 SwitchLabel，
 * 与 card / square 保持一致 —— 此前这里只认 title，sub / tip / description
 * 传进来会静默变成按钮上的无效 DOM 属性。</p>
 */
import { ElSwitch } from "element-plus";
import SwitchLabel from "../shared/SwitchLabel.vue";

defineOptions({ name: "DefaultReSwitch", inheritAttrs: true });

defineProps<{
  title?: string;
  sub?: string;
  tip?: string;
  description?: string;
}>();

const modelValue = defineModel<boolean | string | number>({ default: false });
</script>

<style lang="scss" scoped>
.re-switch-default {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
</style>