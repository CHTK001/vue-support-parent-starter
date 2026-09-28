<template>
  <div
    class="re-select-square"
    :class="[
      `re-select-square--${controlSize}`,
      {
        're-select-square--compact': compact,
        're-select-square--text': !iconOnly,
        're-select-square--vertical': vertical,
      },
    ]"
  >
    <div
      v-for="opt in displayOptions"
      :key="String(opt.value)"
      :class="[
        're-select-square__item',
        { 're-select-square__item--active': isSelected(opt) },
      ]"
      :title="opt.label"
      @click="select(opt)"
    >
      <ReIcon v-if="opt.icon" :name="opt.icon" :size="iconSize" />
      <span v-if="!vertical && !opt.icon" class="re-select-square__fallback">{{ String(opt.label).charAt(0) }}</span>
      <span v-if="!iconOnly || vertical" class="re-select-square__label">{{ opt.label }}</span>
      <span v-if="isSelected(opt)" class="re-select-square__check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2 6 5 9 10 3" />
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReSelect Square 布局
 *
 * 横向排列方形按钮，点击切换选中（互斥单选）。
 * 支持两种显示模式（iconOnly）：
 *   - true（默认）：仅显示图标，隐藏文字
 *   - false：图标 + 文字
 * 支持 compact 紧凑模式（默认开启）：
 *   - 紧凑正方形按钮（iconOnly 时固定小宽高）
 *   - 关闭时为大卡片样式（图标在上、文字在下、留白更足）
 * 支持 vertical 竖向档（vertical=true）：一行一档、整行走菜单感底色，选中态是整行高亮 + 右侧对勾。
 * 选项图标通过 ReIcon 渲染，自动支持：
 *   - element-plus PascalCase
 *   - ep:xxx / ri:xxx / mdi:xxx
 *   - iconfont class / uni / svg
 *   - HTTP URL
 * 没有 icon 的选项：横向档取 label 首字占位，竖向档直接显示 label 文字。
 */
import { computed } from "vue";
import ReIcon from "../../ReIcon/theme/default/ReIcon.vue";
import type { ReOption, ReSelectSize } from "../types";

const props = withDefaults(
  defineProps<{
    /** 选项列表 */
    options: ReOption[];
    /** 当前模型值（单值或数组） */
    modelValue?: string | number | (string | number)[];
    /** 是否多选 */
    multiple?: boolean;
    /** 图标尺寸 */
    size?: number;
    /**
     * 控件尺寸档位（small / default / large），只影响按钮本身的宽高与字号。
     *
     * 与上面的图标尺寸 size(number) 是两件事，故不复用 size 这个名字。
     */
    controlSize?: ReSelectSize;
    /** 仅显示图标，隐藏文字（默认 true） */
    iconOnly?: boolean;
    /** 紧凑模式（默认 true） */
    compact?: boolean;
    /** 竖向档位列表：一行一档，文字优先、选中态走整行 */
    vertical?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
  }>(),
  {
    modelValue: "",
    multiple: false,
    size: 22,
    iconOnly: true,
    compact: true,
    vertical: false,
    disabled: false,
    controlSize: "default",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", val: string | number | (string | number)[]): void;
}>();

const displayOptions = computed(() => props.options);

/** 紧凑模式下图标更小，否则用默认图标尺寸 */
const iconSize = computed(() => (props.compact ? Math.max(16, props.size - 8) : props.size));

function isSelected(opt: ReOption): boolean {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(opt.value);
  }
  return props.modelValue === opt.value;
}

function select(opt: ReOption) {
  if (props.disabled) return;
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const idx = arr.indexOf(opt.value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(opt.value);
    emit("update:modelValue", arr as (string | number)[]);
  } else {
    emit("update:modelValue", opt.value as string | number);
  }
}
</script>

<style lang="scss" scoped>
.re-select-square {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* ===== 紧凑模式（默认开启） ===== */
.re-select-square--compact {
  gap: 8px;
}
.re-select-square--compact .re-select-square__item {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  min-width: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}
.re-select-square--compact .re-select-square__check {
  width: 14px;
  height: 14px;
  top: -3px;
  right: -3px;
}
.re-select-square--compact .re-select-square__check svg {
  width: 8px;
  height: 8px;
}

/* ===== 紧凑 + 文字（iconOnly=false）：横向文字按钮，用于搜索区等窄行高场景 =====
   纯图标紧凑档把按钮锁成 40x40 方块，直接塞文字会被裁掉，故这一档另算尺寸 */
.re-select-square--compact.re-select-square--text .re-select-square__item {
  width: auto;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
}
.re-select-square--compact.re-select-square--text .re-select-square__fallback,
.re-select-square--compact.re-select-square--text .re-select-square__check {
  display: none;
}
.re-select-square--compact.re-select-square--text .re-select-square__label {
  font-size: 13px;
}

.re-select-square__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  min-width: 80px;
  border: 1.5px solid var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  &:hover {
    border-color: var(--el-color-primary-light-3, #a0cfff);
    color: var(--el-color-primary, #409eff);
    background: var(--el-color-primary-light-9, #ecf5ff);
  }

  &--active {
    border: 2px solid var(--el-color-primary, #409eff);
    padding: 11px 13px;
    color: var(--el-color-primary, #409eff);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
  }
}

// 紧凑模式下选中态也保持 0 内边距（覆盖上方 &--active 的 padding）
.re-select-square--compact .re-select-square__item--active {
  padding: 0;
  border-width: 1.5px;
  box-shadow: none;
}

/* 文字紧凑档的选中态：留在 32px 胶囊尺寸里，不回落到方块档的 0 内边距 */
.re-select-square--compact.re-select-square--text .re-select-square__item--active {
  padding: 0 12px;
}

.re-select-square__label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.re-select-square__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: inherit;
}
.re-select-square--compact .re-select-square__fallback {
  font-size: 16px;
}

.re-select-square__check {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--el-color-primary, #409eff);
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.4);
}

.re-select-square__check svg {
  width: 10px;
  height: 10px;
}

/* ===== 竖向档位档（vertical）：一行一档，用于浮层里选间隔 =====
   整行走「无边框 + 底色」的菜单感，不走方块档的描边选中，避免窄浮层里出现一串框 */
.re-select-square--vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
}
.re-select-square--vertical .re-select-square__item {
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  gap: 10px;
  justify-content: flex-start;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
}
.re-select-square--vertical .re-select-square__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular, #606266);
}
.re-select-square--vertical .re-select-square__item:hover {
  background: var(--el-fill-color-light, #f5f7fa);
  border-color: transparent;
}
.re-select-square--vertical .re-select-square__item--active {
  padding: 0 10px;
  border: 1px solid transparent;
  background: var(--el-color-primary-light-9, #ecf5ff);
  box-shadow: none;
}
.re-select-square--vertical .re-select-square__item--active .re-select-square__label {
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}
/* 选中态用整行右侧的对勾，不飘在方块角上 */
.re-select-square--vertical .re-select-square__check {
  position: static;
  width: auto;
  height: auto;
  margin-left: auto;
  background: transparent;
  color: var(--el-color-primary, #409eff);
  box-shadow: none;
}
.re-select-square--vertical .re-select-square__check svg {
  width: 14px;
  height: 14px;
}

/* ===== 控件尺寸档（controlSize）：28 / 34 / 40px 基线 =====
   放在最后并用「尺寸 + 紧凑」双类选择器，保证能盖过上面 compact/text 档写死的宽高。 */
.re-select-square--small.re-select-square--compact .re-select-square__item {
  width: 32px;
  height: 32px;
  /* Modern 控件族用 --rm-* 令牌（= 8px），不要写死值 */
  border-radius: var(--rm-radius);
}
.re-select-square--small.re-select-square--compact.re-select-square--text .re-select-square__item {
  height: 26px;
  padding: 0 8px;
}
.re-select-square--small.re-select-square--compact .re-select-square__label {
  font-size: 11px;
}

.re-select-square--large.re-select-square--compact .re-select-square__item {
  width: 46px;
  height: 46px;
  /* Modern 控件族用 --rm-* 令牌（= 12px），不要写死值 */
  border-radius: var(--rm-radius-lg);
}
.re-select-square--large.re-select-square--compact.re-select-square--text .re-select-square__item {
  height: 38px;
  padding: 0 16px;
}
.re-select-square--large.re-select-square--compact .re-select-square__label {
  font-size: 14px;
}

/* 竖向档是「一行一档」菜单，尺寸只调行高，不动通栏宽度 */
.re-select-square--small.re-select-square--vertical .re-select-square__item {
  height: 28px;
}
.re-select-square--large.re-select-square--vertical .re-select-square__item {
  height: 40px;
}
</style>