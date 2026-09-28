<script setup lang="ts">
/**
 * GlueTypeCards —— 执行类型卡片选择（对象 / 脚本）
 *
 * 内联展示两张可选卡片（与 ReSelect 卡片下拉同款视觉），点击即切换，不再折叠进下拉。
 * 用于 ReForm 自定义字段：v-model 读 modelValue / update:modelValue，附带 change 事件。
 */
interface GlueTypeOption {
  label: string;
  value: string;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    /** 当前执行类型 */
    modelValue?: string;
    /** 可选项：对象 / 脚本 */
    options?: GlueTypeOption[];
    disabled?: boolean;
  }>(),
  { modelValue: "BEAN", options: () => [], disabled: false },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

/**
 * 选中某个类型。
 *
 * @param value 选项值
 */
function pick(value: string): void {
  if (props.disabled || value === props.modelValue) {
    return;
  }
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <div class="glue-cards" :class="{ 'is-disabled': disabled }">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="glue-cards__item"
      :class="{ 'is-active': modelValue === opt.value }"
      :disabled="disabled"
      @click="pick(opt.value)"
    >
      <span class="glue-cards__name">{{ opt.label }}</span>
      <span v-if="opt.description" class="glue-cards__desc">{{ opt.description }}</span>
    </button>
  </div>
</template>

<style scoped>
/* 卡片视觉与 ReSelect CardDropdown 卡片保持一致：浅灰底、悬停/选中主色描边。
   圆角原为 10px，10px 距 8(md)/12(lg) 等距，按 koi 统一口径取 12px(lg) */
.glue-cards {
  display: grid;
  /* 固定两列：对象/脚本始终并排一行，不再随宽度折行 */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.glue-cards__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--rm-border, var(--el-border-color-light));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  cursor: pointer;
  /* 原生 button：去掉浏览器默认轮廓，改用与全站一致的自绘焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 原生 button：自绘焦点环；禁用态不画，避免「禁用」看起来仍可聚焦 */
.glue-cards__item:focus-visible:not(:disabled) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.glue-cards__item:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, var(--el-border-color-light));
  background: var(--el-bg-color);
}

.glue-cards__item.is-active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.glue-cards__item:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.glue-cards__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.glue-cards__item.is-active .glue-cards__name {
  color: var(--el-color-primary);
}

.glue-cards__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .glue-cards__item {
    transition: none;
  }
}
</style>
