<script setup lang="ts">
/**
 * 数据库控制台的「是 / 否」分段选择器。
 *
 * <p>表设计里的可空 / 主键 / 唯一 / 无符号 / 补零 / 自增都是二态，
 * 两种形态：</p>
 * <ul>
 *   <li>{@code variant="segmented"}（默认）：Element Plus segmented，把「是 / 否」
 *       两个选项直接摊开成文字段，当前值一眼可读，与设计网格同高；</li>
 *   <li>{@code variant="square"}：**单个**方形按钮，图标随状态自动切换（开启=实心
 *       主色 onIcon，关闭=灰色 offIcon），点一下即翻转 —— 不是两枚 ✓/✕ 并排按钮，
 *       才配得上表设计网格里可空 / 主键 / 自增这类窄布尔列。</li>
 * </ul>
 */
import { computed } from "vue";
import ReIcon from "@repo/ui/re-icon";

defineOptions({ name: "BooleanSegmented", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    /** 开启文案，默认「是」 */
    onLabel?: string;
    /** 关闭文案，默认「否」 */
    offLabel?: string;
    size?: "small" | "default" | "large";
    /** segmented=文字分段（默认）；square=单方块自动切换 */
    variant?: "segmented" | "square";
    /** square 形态：开启态图标名（默认 ep 的 Check） */
    onIcon?: string;
    /** square 形态：关闭态图标名（默认 ep 的 Close） */
    offIcon?: string;
  }>(),
  {
    modelValue: false,
    onLabel: "是",
    offLabel: "否",
    size: "small",
    variant: "segmented",
    onIcon: "Check",
    offIcon: "Close",
  },
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

/** square 单按钮：原地翻转，图标随状态切换 */
function toggle(): void {
  emit("update:modelValue", !props.modelValue);
}

/** square 当前图标：开启 onIcon / 关闭 offIcon */
const currentIcon = computed(() => (props.modelValue ? props.onIcon : props.offIcon));

/** square 当前提示：开启显示 onLabel（如「主键」），关闭显示 offLabel */
const currentTitle = computed(() => (props.modelValue ? props.onLabel : props.offLabel));
</script>

<template>
  <!-- 文字分段（默认） -->
  <el-segmented
    v-if="variant === 'segmented'"
    :model-value="selected"
    :options="options"
    :size="size"
    class="dbm-bool-segmented"
    v-bind="$attrs"
    @update:model-value="onChange"
  />

  <!-- 单个方形按钮：开启=实心主色 onIcon，关闭=灰色 offIcon，点一下翻转 -->
  <button
    v-else
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :title="currentTitle"
    :disabled="$attrs.disabled as boolean | undefined"
    class="dbm-bool-square"
    :class="[
      `dbm-bool-square--${size}`,
      { 'dbm-bool-square--active': modelValue },
    ]"
    v-bind="$attrs"
    @click="toggle"
  >
    <ReIcon :name="currentIcon" :size="size === 'small' ? 14 : 16" />
  </button>
</template>

<style scoped>
.dbm-bool-segmented {
  width: auto;
  flex: none;
}

/* ===== square 单个方形按钮（开/关自动切换图标） ===== */
.dbm-bool-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1.5px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-extra-light, var(--el-bg-color, #fff));
  color: var(--el-text-color-placeholder, #c0c4cc);
  cursor: pointer;
  flex: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.dbm-bool-square--small { width: 24px; height: 24px; }
.dbm-bool-square--large { width: 32px; height: 32px; }

/* 未选中 hover：灰阶加深，不染主色（主色只给选中态） */
.dbm-bool-square:hover:not(.dbm-bool-square--active):not(:disabled) {
  border-color: var(--el-border-color-dark, #cdd0d6);
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}

/* 开启态：实心主色块 + 白图标 + 轻投影，与文字分段/ReRadio square 同一口径 */
.dbm-bool-square--active {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 72%, var(--el-color-black, #000));
  color: var(--el-color-white, #fff);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-primary, #409eff) 30%, transparent);
}

.dbm-bool-square:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
