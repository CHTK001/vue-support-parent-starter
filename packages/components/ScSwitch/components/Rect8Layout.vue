<!--
  Rect8Layout：8 方位矩形点选布局
  场景：方向/位置等 8 方位选择（四角 + 上下左右）
  @author CH
  @date 2026-02-24
-->
<template>
  <div
    class="sc-switch-rect8"
    :class="[
      `sc-switch-rect8--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading
      }
    ]"
    :style="customStyle"
  >
    <button
      v-for="opt in normalizedOptions"
      :key="opt.value"
      type="button"
      class="sc-switch-rect8__point"
      :class="[
        `is-${opt.position}`,
        {
          'is-selected': opt.value === modelValue,
          'is-option-disabled': !!opt.disabled
        }
      ]"
      :disabled="disabled || loading || !!opt.disabled"
      :title="opt.label"
      :aria-label="opt.label"
      :aria-pressed="opt.value === modelValue"
      @click="handleSelect(opt.value)"
    >
      <span class="sc-switch-rect8__dot" />
    </button>

    <div v-if="loading" class="sc-switch-rect8__loading">
      <IconifyIconOnline icon="ep:loading" class="is-loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

type Rect8Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface Rect8Option {
  /** 选项值 */
  value: string;
  /** 展示文案（tooltip/aria） */
  label: string;
  /** 所在位置 */
  position: Rect8Position;
  /** 是否禁用 */
  disabled?: boolean;
}

const DEFAULT_OPTIONS: Array<Rect8Option> = [
  { value: "top-left", label: "左上", position: "top-left" },
  { value: "top-center", label: "上", position: "top-center" },
  { value: "top-right", label: "右上", position: "top-right" },
  { value: "left-center", label: "左", position: "left-center" },
  { value: "right-center", label: "右", position: "right-center" },
  { value: "bottom-left", label: "左下", position: "bottom-left" },
  { value: "bottom-center", label: "下", position: "bottom-center" },
  { value: "bottom-right", label: "右下", position: "bottom-right" }
];

const props = defineProps({
  /**
   * 绑定值
   */
  modelValue: {
    type: String,
    required: true
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 是否加载中
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * 尺寸
   */
  size: {
    type: String,
    default: "default",
    validator: (val: string) => ["small", "default", "large"].includes(val)
  },
  /**
   * 选项（未传则使用默认 8 方位）
   */
  rect8Options: {
    type: Array as () => Array<Rect8Option>,
    default: undefined
  },
  /**
   * 选中态颜色
   */
  activeColor: {
    type: String,
    default: ""
  },
  /**
   * 未选中态颜色
   */
  inactiveColor: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

const normalizedOptions = computed<Array<Rect8Option>>(() => {
  const options = props.rect8Options?.length ? props.rect8Options : DEFAULT_OPTIONS;
  return options.filter((opt) => !!opt?.value && !!opt?.position);
});

const customStyle = computed(() => ({
  "--rect8-active-color": props.activeColor || "var(--el-color-primary)",
  "--rect8-inactive-color": props.inactiveColor || "var(--el-border-color)"
}));

function handleSelect(value: string): void {
  if (props.disabled || props.loading) return;
  if (value === props.modelValue) return;
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<style lang="scss" scoped>
.sc-switch-rect8 {
  position: relative;
  display: grid;
  width: 56px;
  height: 56px;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  user-select: none;

  &--small {
    width: 52px;
    height: 52px;
    padding: 7px;
    gap: 6px;
    border-radius: 10px;
  }

  &--large {
    width: 64px;
    height: 64px;
    padding: 9px;
    gap: 7px;
    border-radius: 14px;
  }

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.sc-switch-rect8__point {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(var(--el-color-primary-rgb), 0.08);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &.is-option-disabled {
    cursor: not-allowed;
  }

  &.is-selected {
    background: rgba(var(--el-color-primary-rgb), 0.12);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &.is-top-left {
    grid-column: 1;
    grid-row: 1;
  }

  &.is-top-center {
    grid-column: 2;
    grid-row: 1;
  }

  &.is-top-right {
    grid-column: 3;
    grid-row: 1;
  }

  &.is-left-center {
    grid-column: 1;
    grid-row: 2;
  }

  &.is-right-center {
    grid-column: 3;
    grid-row: 2;
  }

  &.is-bottom-left {
    grid-column: 1;
    grid-row: 3;
  }

  &.is-bottom-center {
    grid-column: 2;
    grid-row: 3;
  }

  &.is-bottom-right {
    grid-column: 3;
    grid-row: 3;
  }
}

.sc-switch-rect8__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rect8-inactive-color);
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

  .is-selected & {
    background: var(--rect8-active-color);
    box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb), 0.12);
    transform: scale(1.05);
  }
}

.sc-switch-rect8__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  color: var(--el-color-primary);
}

.dark .sc-switch-rect8__loading {
  background: rgba(0, 0, 0, 0.35);
}
</style>


