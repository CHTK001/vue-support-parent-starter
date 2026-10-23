<script setup lang="ts">
/**
 * 数据库控制台的「是 / 否」分段选择器（el-segmented）。
 *
 * <p>表设计里的可空 / 主键 / 唯一 / 无符号 / 补零 / 自增都是二态，
 * ReSwitch 的左右位置要猜哪边是开；这里用 Element Plus segmented
 * 把「是 / 否」两个选项直接摊开，当前值一眼可读，且与设计网格同高。</p>
 */
import { computed } from "vue";

defineOptions({ name: "BooleanSegmented", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    /** 开启文案，默认「是」 */
    onLabel?: string;
    /** 关闭文案，默认「否」 */
    offLabel?: string;
    size?: "small" | "default" | "large";
  }>(),
  { modelValue: false, onLabel: "是", offLabel: "否", size: "small" },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const YES = "yes";
const NO = "no";

const options = computed(() => [
  { label: props.onLabel, value: YES, disabled: false },
  { label: props.offLabel, value: NO, disabled: false },
]);

const selected = computed(() => (props.modelValue ? YES : NO));

function onChange(value: string | number | boolean): void {
  emit("update:modelValue", value === YES);
}
</script>

<template>
  <el-segmented
    :model-value="selected"
    :options="options"
    :size="size"
    class="dbm-bool-segmented"
    v-bind="$attrs"
    @update:model-value="onChange"
  />
</template>

<style scoped>
.dbm-bool-segmented {
  width: auto;
  flex: none;
}
</style>