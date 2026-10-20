<template>
  <div class="re-number-input">
    <el-input-number
      v-model="innerValue"
      :class="['re-number-input__inner', `re-number-input__inner--${size}`]"
      :min="min"
      :max="max"
      :step="effectiveStep"
      :precision="effectivePrecision"
      :disabled="disabled"
      :placeholder="placeholder"
      :controls="controls"
      :controls-position="controlsPosition"
      :step-strictly="stepStrictly"
      :size="size"
      @change="onChange"
      @blur="onBlur"
      @focus="onFocus"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'

/**
 * 数字输入框。
 *
 * <p>统一封装 element-plus 的 el-input-number，修掉它两个实测问题：</p>
 * <ol>
 *   <li><b>增减按钮点了没反应</b>：element-plus 的按钮是 span，
 *       在部分布局里被设置页/表格的 scoped 样式命中后 pointer-events 失效。
 *       这里给转出来的 DOM 加统一类名，把交互样式收到本组件内。</li>
 *   <li><b>精度与步长不同步导致按钮变「死」的</b>：模板写死 :step="0.1" 而
 *       实际精度是 0 时，ensurePrecision(old + 0.1) 会舍回原值，
 *       setCurrentValue 里 `oldVal === newVal && value` 直接返回，按钮再也不动。
 *       这里按 precision 反推 step，两者永远同源。</li>
 * </ol>
 *
 * <p>props 与 el-input-number 保持同名同义，替换时只改标签名即可。</p>
 */
const props = defineProps({
  modelValue: { type: [Number, String], default: undefined },
  /** 最小值；不传表示不限制 */
  min: { type: Number, default: undefined },
  /** 最大值；不传表示不限制 */
  max: { type: Number, default: undefined },
  /** 步长；不传时按 precision 反推（精度 0 → 1，精度 1 → 0.1，精度 2 → 0.01） */
  step: { type: Number, default: undefined },
  /** 小数位数；不传则按 modelValue 的小数位推断 */
  precision: { type: Number, default: undefined },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  /** 是否显示增减按钮 */
  controls: { type: Boolean, default: true },
  controlsPosition: { type: String as PropType<'' | 'right' | ''>, default: '' },
  /** 是否只能输入 step 的倍数 */
  stepStrictly: { type: Boolean, default: false },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

/**
 * 推断小数位数：modelValue 里实际有几位小数就按几位显示。
 *
 * @param value 值
 * @returns 小数位数
 */
function precisionOf(value: unknown): number {
  const raw = typeof value === 'number' ? String(value) : String(value ?? '').trim()
  const dot = raw.indexOf('.')
  return dot < 0 ? 0 : Math.min(6, raw.length - dot - 1)
}

/** 实际生效的小数位数 */
const effectivePrecision = computed(() =>
  props.precision ?? precisionOf(props.modelValue),
)

/** 实际生效的步长：显式传入优先，否则按精度反推，保证按钮永不被精度吞掉 */
const effectiveStep = computed(() =>
  props.step ?? Math.max(1e-6, 10 ** -effectivePrecision.value),
)

/**
 * 双向绑定值。
 *
 * modelValue 允许 Number | String（调用方有时直接传 '128000' 这种字符串），
 * 但 el-input-number 的 v-model 只接受 number | null | undefined。
 * 这里在边界上做一次归一：空串/非数字一律变成 undefined（等于「未填」），
 * 其余转成 number，避免把字符串塞进数字输入框后精度推断算出脏值。
 */
const innerValue = computed<number | undefined>({
  get: () => {
    const raw = props.modelValue
    if (raw === undefined || raw === null || raw === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  },
  set: (val) => emit('update:modelValue', val),
})

/**
 * change 事件透传。
 *
 * @param current 当前值
 * @param prev 变更前的值
 */
function onChange(current: number | undefined, prev: number | undefined) {
  emit('change', current, prev)
}

/**
 * blur 事件透传。
 *
 * @param e 事件对象
 */
function onBlur(e: FocusEvent) {
  emit('blur', e)
}

/**
 * focus 事件透传。
 *
 * @param e 事件对象
 */
function onFocus(e: FocusEvent) {
  emit('focus', e)
}

/** 暴露给模板的派生属性（script setup 里计算属性可直接在模板用，这里显式导出便于测试） */
defineExpose({ effectivePrecision, effectiveStep })
</script>

<style scoped>
.re-number-input {
  display: inline-flex;
  /* 默认撑满父容器：调用处原先各自写 style="width: 100%"，集中到这里 */
  width: 100%;
}

.re-number-input__inner {
  width: 100%;
}

/* 边框三态：与 ReInput 同一套 1px inset 描边，聚焦环是允许的第二类阴影 */
.re-number-input__inner :deep(.el-input__wrapper) {
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  transition: box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  background: var(--el-bg-color);
}

.re-number-input__inner :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.re-number-input__inner :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent) inset;
}

.re-number-input__inner :deep(.el-input__inner) {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

/* 增减按钮：确保可点。element-plus 默认是 span，某些祖先布局的
   pointer-events / user-select 规则会把它吃掉（实测 +/- 无反应），
   这里显式声明交互属性 */
.re-number-input__inner :deep(.el-input-number__decrease),
.re-number-input__inner :deep(.el-input-number__increase) {
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
}

.re-number-input__inner :deep(.el-input-number__decrease:hover),
.re-number-input__inner :deep(.el-input-number__increase:hover) {
  color: var(--el-color-primary);
}

.re-number-input__inner :deep(.el-input-number__decrease.is-disabled),
.re-number-input__inner :deep(.el-input-number__increase.is-disabled) {
  pointer-events: none;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-number-input__inner :deep(.el-input__wrapper) {
    transition: none;
  }
}
</style>
