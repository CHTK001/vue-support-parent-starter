<script setup lang="ts">
/**
 * ReInputNumber Modern 布局 —— 现代化扁平数字输入框
 *
 * 设计要点：
 *   - 扁平容器（纯色背景 + 细边框）
 *   - 聚焦时主色边框
 *   - 左右分置加减按钮（hover 纯色高亮，icon 平滑缩放）
 *   - Tabular numerals 让数字对齐
 *   - 深浅色主题自动适配（跟随 Element Plus CSS 变量）
 *   - 支持 min / max / step / precision / 前缀 / 后缀
 */
import { computed, ref } from "vue";
import "../../shared/modern-vars.css";
import type { ReInputNumberControlsPosition, ReInputNumberSize } from "../types";

defineOptions({ name: "ReInputNumberModern", inheritAttrs: true });

/**
 * 数字模型。
 *
 * 允许 null：业务侧常用 null 表示「未填写」（如切换协议后清空端口），
 * 组件必须把它当空值渲染，不能 String(null) 成字面量「null」。
 */
const model = defineModel<number | null | undefined>({ default: undefined });

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    stepStrictly?: boolean;
    precision?: number;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    controls?: boolean;
    controlsPosition?: ReInputNumberControlsPosition;
    size?: ReInputNumberSize;
    prefix?: string;
    suffix?: string;
  }>(),
  {
    min: undefined,
    max: undefined,
    step: 1,
    stepStrictly: false,
    precision: undefined,
    placeholder: "",
    disabled: false,
    readonly: false,
    controls: true,
    controlsPosition: "",
    size: "default",
    prefix: "",
    suffix: "",
  },
);

const focused = ref(false);
const draft = ref<string | undefined>(undefined);

/** 夹取到 [min, max] 区间 */
const clamp = (v: number): number => {
  let n = Number.isNaN(v) ? 0 : v;
  if (props.min !== undefined && n < props.min) n = props.min;
  if (props.max !== undefined && n > props.max) n = props.max;
  return n;
};

/** 按 precision 四舍五入 */
const roundPrecision = (v: number): number => {
  if (props.precision === undefined) return v;
  const factor = 10 ** props.precision;
  return Math.round(v * factor) / factor;
};

/** 是否有值：null 与 undefined 都算「未填写」 */
const hasValue = computed(() => model.value !== undefined && model.value !== null);

/** 输入框展示值（草稿优先，否则格式化 model） */
const display = computed<string>(() => {
  if (draft.value !== undefined) return draft.value;
  if (!hasValue.value) return "";
  const v = model.value as number;
  if (props.precision !== undefined) return v.toFixed(props.precision);
  return String(v);
});

const canMinus = computed(() => {
  if (props.disabled || props.readonly || !hasValue.value) return false;
  const next = (model.value as number) - props.step;
  return props.min === undefined || next >= props.min;
});

const canPlus = computed(() => {
  if (props.disabled || props.readonly || !hasValue.value) return false;
  const next = (model.value as number) + props.step;
  return props.max === undefined || next <= props.max;
});

/** 提交草稿：合法则回写 model，非法则回显原值 */
function commit(): void {
  const raw = draft.value;
  draft.value = undefined;
  if (raw === undefined || raw === "") return;
  const n = Number(raw);
  if (Number.isNaN(n)) return;
  model.value = roundPrecision(clamp(n));
}

/** 步进 */
function stepBy(dir: 1 | -1): void {
  if (props.disabled || props.readonly) return;
  const base = model.value ?? 0;
  const next = roundPrecision(clamp(base + dir * props.step));
  model.value = props.stepStrictly ? Math.round(next / props.step) * props.step : next;
  draft.value = undefined;
}

/** 聚焦时方向键步进：↑ 加、↓ 减（配合无按钮的紧凑模式，是调值的主要手段）。
 *  步进基于当前草稿（输入框里正在编辑的值）或已提交的 model，光标不移动。 */
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
  e.preventDefault();
  if (props.disabled || props.readonly) return;
  const raw = draft.value !== undefined ? draft.value : "";
  const base = raw === "" ? (model.value ?? 0) : Number(raw);
  const dir = e.key === "ArrowUp" ? 1 : -1;
  const next = roundPrecision(clamp((Number.isNaN(base) ? 0 : base) + dir * props.step));
  model.value = props.stepStrictly ? Math.round(next / props.step) * props.step : next;
  draft.value = undefined;
}
</script>

<template>
  <div
    :class="[
      'rm-number',
      `rm-number--${size || 'default'}`,
      {
        'rm-number--focused': focused,
        'rm-number--disabled': disabled,
        'rm-number--readonly': readonly,
        'rm-number--no-controls': !controls,
        'rm-number--has-prefix': !!prefix,
        'rm-number--has-suffix': !!suffix,
      },
    ]"
    v-bind="$attrs"
  >
    <span v-if="prefix" class="rm-number__affix rm-number__affix--prefix">{{ prefix }}</span>

    <button
      v-if="controls"
      type="button"
      class="rm-number__step rm-number__step--minus"
      :disabled="disabled || readonly || !canMinus"
      :aria-label="'减少'"
      @click="stepBy(-1)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rm-number__icon"><path d="M5 12h14"/></svg>
    </button>

    <div class="rm-number__field">
      <input
        :value="display"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        spellcheck="false"
        class="rm-number__input"
        @input="(e: Event) => (draft = (e.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false; commit()"
        @keydown="onKeydown"
        @keydown.enter.prevent="commit()"
      />
    </div>

    <button
      v-if="controls"
      type="button"
      class="rm-number__step rm-number__step--plus"
      :disabled="disabled || readonly || !canPlus"
      :aria-label="'增加'"
      @click="stepBy(1)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rm-number__icon"><path d="M12 5v14M5 12h14"/></svg>
    </button>

    <span v-if="suffix" class="rm-number__affix rm-number__affix--suffix">{{ suffix }}</span>
  </div>
</template>

<style scoped>
/* ===================== 容器 ===================== */
.rm-number {
  --rm-num-bg: var(--rm-bg);
  --rm-num-border: var(--rm-border-hover);
  --rm-num-step-bg: transparent;
  --rm-num-step-color: var(--rm-text-secondary);

  display: inline-flex;
  align-items: stretch;
  gap: 2px;
  height: var(--rm-height);
  min-width: 96px;
  padding: 0 6px;
  border-radius: var(--rm-radius-lg);
  background: var(--rm-num-bg);
  box-shadow: 0 0 0 1px var(--rm-num-border) inset;
  transition:
    box-shadow var(--rm-transition),
    background var(--rm-transition);
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.rm-number:hover:not(.rm-number--disabled):not(.rm-number--readonly) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--rm-primary) 30%, var(--rm-border-light)) inset;
}

.rm-number--small { height: var(--rm-height-sm); border-radius: var(--rm-radius); min-width: 84px; }
.rm-number--large { height: var(--rm-height-lg); border-radius: var(--rm-radius-xl); min-width: 120px; }

/* ===================== Focus ===================== */
.rm-number--focused {
  box-shadow: 0 0 0 1px var(--rm-primary) inset, 0 0 0 4px var(--rm-primary-light-9);
}

/* ===================== States ===================== */
.rm-number--disabled {
  background: var(--rm-bg-disabled);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
.rm-number--readonly {
  background: var(--rm-bg-subtle);
}

/* ===================== 前缀 / 后缀 ===================== */
.rm-number__affix {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 6px;
  color: var(--rm-text-secondary);
  font-size: 0.9em;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
  transition: color var(--rm-transition);
}
.rm-number--focused .rm-number__affix {
  color: var(--rm-primary);
}

/* ===================== 输入区 ===================== */
.rm-number__field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rm-number__input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text);
  font-size: inherit;
  font-family: inherit;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: center;
  padding: 0 2px;
  letter-spacing: 0.01em;
}
.rm-number__input::placeholder {
  color: var(--rm-text-disabled);
  font-weight: 400;
}

/* ===================== 步进按钮 ===================== */
.rm-number__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  align-self: center;
  height: calc(100% - 8px);
  border: 1px solid transparent;
  border-radius: var(--rm-radius);
  background: var(--rm-num-step-bg);
  color: var(--rm-num-step-color);
  cursor: pointer;
  transition:
    background var(--rm-transition),
    color var(--rm-transition),
    border-color var(--rm-transition),
    transform var(--rm-transition);
}
.rm-number__icon {
  width: 14px;
  height: 14px;
  transition: transform var(--rm-transition);
}
.rm-number__step:hover:not(:disabled) {
  background: var(--rm-primary-light-9);
  border-color: color-mix(in srgb, var(--rm-primary) 22%, transparent);
  color: var(--rm-primary);
}
.rm-number__step:hover:not(:disabled) .rm-number__icon {
  transform: scale(1.15);
}
.rm-number__step:active:not(:disabled) {
  background: var(--rm-primary-light-8);
  transform: scale(0.94);
}
.rm-number__step:disabled {
  color: var(--rm-text-disabled);
  cursor: not-allowed;
  opacity: 0.5;
}

/* 减号按钮 hover 时 icon 向左微移，加号向右 */
.rm-number__step--minus:hover:not(:disabled) .rm-number__icon {
  transform: scale(1.15) translateX(-1px);
}
.rm-number__step--plus:hover:not(:disabled) .rm-number__icon {
  transform: scale(1.15) translateX(1px);
}

/* ===================== Reduced Motion ===================== */
@media (prefers-reduced-motion: reduce) {
  .rm-number,
  .rm-number__step,
  .rm-number__icon,
  .rm-number__affix {
    transition: none;
  }
  .rm-number:hover:not(.rm-number--disabled):not(.rm-number--readonly) {
    transform: none;
  }
  .rm-number__step:active:not(:disabled) {
    transform: none;
  }
}
</style>