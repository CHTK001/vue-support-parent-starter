<script setup lang="ts">
/**
 * 数据库控制台的「是 / 否」分段选择器。
 *
 * <p>表设计里的可空 / 主键 / 唯一 / 无符号 / 补零 / 自增都是二态，
 * 两种形态：</p>
 * <ul>
 *   <li>{@code variant="segmented"}（默认）：Element Plus segmented，把「是 / 否」
 *       两个选项直接摊开成文字段，当前值一眼可读，与设计网格同高；</li>
 *   <li>{@code variant="square"}：两枚方形图标钮（默认 ✓ / ✕），选中态实心主色 +
 *       白图标，未选中灰底灰图标 —— 不占文字宽度，用于表设计网格的窄列省空间。</li>
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
    /** segmented=文字分段（默认）；square=方形图标钮 */
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

function setOn(): void {
  emit("update:modelValue", true);
}

function setOff(): void {
  emit("update:modelValue", false);
}
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

  <!-- 方形图标钮：两枚小方块，选中项实心主色 + 白图标，未选中灰底灰图标 -->
  <div
    v-else
    class="dbm-bool-square"
    :class="`dbm-bool-square--${size}`"
    role="radiogroup"
    v-bind="$attrs"
  >
    <button
      type="button"
      role="radio"
      :aria-checked="modelValue"
      :title="onLabel"
      :disabled="$attrs.disabled as boolean | undefined"
      class="dbm-bool-square__tile dbm-bool-square__tile--on"
      :class="{ 'is-active': modelValue }"
      @click="setOn"
    >
      <ReIcon :name="onIcon" :size="size === 'small' ? 13 : 15" />
    </button>
    <button
      type="button"
      role="radio"
      :aria-checked="!modelValue"
      :title="offLabel"
      :disabled="$attrs.disabled as boolean | undefined"
      class="dbm-bool-square__tile dbm-bool-square__tile--off"
      :class="{ 'is-active': !modelValue }"
      @click="setOff"
    >
      <ReIcon :name="offIcon" :size="size === 'small' ? 13 : 15" />
    </button>
  </div>
</template>

<style scoped>
.dbm-bool-segmented {
  width: auto;
  flex: none;
}

/* ===== square 方形图标钮 ===== */
.dbm-bool-square {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
}

.dbm-bool-square__tile {
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
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.dbm-bool-square--small .dbm-bool-square__tile {
  width: 24px;
  height: 24px;
}
.dbm-bool-square--large .dbm-bool-square__tile {
  width: 32px;
  height: 32px;
}

/* 未选中项 hover：灰阶加深，不染主色（主色只给选中项） */
.dbm-bool-square__tile:hover:not(.is-active) {
  border-color: var(--el-border-color-dark, #cdd0d6);
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}

/* 选中项：实心主色块 + 白图标 + 轻投影，与文字分段/ReRadio square 同一口径 */
.dbm-bool-square__tile.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 72%, var(--el-color-black, #000));
  color: var(--el-color-white, #fff);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-primary, #409eff) 30%, transparent);
}

.dbm-bool-square__tile:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
