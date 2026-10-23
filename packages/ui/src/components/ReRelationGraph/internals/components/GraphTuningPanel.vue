<script setup lang="ts">
/**
 * 布局调参面板（由 G6Graph 内联模板拆分而来）
 *
 * <p>展示当前布局可调参数：switch / select / range 三种控件，
 * 支持逐项重置、全部重置、重新布局与边标签开关。参数由父级传入，变更以事件回传。</p>
 *
 * @author CH
 */
import ReButton from "../../../ReButton"
import ReSelect from "../../../ReSelect"
import ReSwitch from "../../../ReSwitch"
import { t } from "../i18n"

defineOptions({ name: "GraphTuningPanel" })

export interface TuningField {
  key: string
  label: string
  control: "switch" | "select" | "range"
  min?: number
  max?: number
  step?: number
  options?: Array<{ label: string; value: string }>
}

const props = withDefaults(
  defineProps<{
    open?: boolean
    available?: boolean
    fields: TuningField[]
    edgeLabelsShown?: boolean
    getValue: (f: TuningField) => number | string
  }>(),
  {
    open: false,
    available: false,
    edgeLabelsShown: false,
    fields: () => [],
  },
)

const emit = defineEmits<{
  (e: "close"): void
  (e: "input", key: string, value: number | string): void
  (e: "apply"): void
  (e: "reset-one", key: string): void
  (e: "reset-all"): void
  (e: "toggle-edge-labels", on: boolean): void
}>()
</script>

<template>
  <div
    v-if="props.open"
    class="rrg__tuning"
    role="group"
    :aria-label="t('toolbar.tuningPanel', '布局参数面板')"
  >
    <div class="rrg__tuning-head">
      <span class="rrg__tuning-title">{{ t('toolbar.tuningPanel', '布局参数') }}</span>
      <button
        type="button"
        class="rrg__tuning-close"
        :title="t('toolbar.tuningClose', '关闭')"
        :aria-label="t('toolbar.tuningClose', '关闭')"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>
    <p v-if="!props.available" class="rrg__tuning-tip">
      {{ t('toolbar.tuningUnsupported', '当前布局不支持调参') }}
    </p>
    <template v-else>
      <div v-for="f in props.fields" :key="f.key" class="rrg__tuning-row">
        <label class="rrg__tuning-label" :for="'rrg-tuning-' + f.key">{{ f.label }}</label>
        <template v-if="f.control === 'switch'">
          <ReSwitch
            :id="'rrg-tuning-' + f.key"
            size="small"
            :model-value="Number(props.getValue(f)) >= 1"
            :aria-label="f.label"
            @update:model-value="(v: unknown) => emit('input', f.key, v ? 1 : 0)"
          />
          <span />
        </template>
        <template v-else-if="f.control === 'select'">
          <ReSelect
            :id="'rrg-tuning-' + f.key"
            :model-value="String(props.getValue(f))"
            :options="(f.options ?? []).map((o) => ({ label: o.label, value: o.value }))"
            size="small"
            :aria-label="f.label"
            @update:model-value="(v: unknown) => emit('input', f.key, String(v))"
          />
        </template>
        <template v-else>
          <input
            :id="'rrg-tuning-' + f.key"
            class="rrg__tuning-range"
            type="range"
            :min="f.min"
            :max="f.max"
            :step="f.step"
            :value="Number(props.getValue(f))"
            :aria-label="f.label"
            @input="emit('input', f.key, Number(($event.target as HTMLInputElement).value))"
          />
          <span class="rrg__tuning-value">{{ props.getValue(f) }}</span>
        </template>
        <button
          type="button"
          class="rrg__tuning-reset"
          :title="'重置 ' + f.label"
          :aria-label="'重置 ' + f.label"
          @click="emit('reset-one', f.key); emit('apply')"
        >
          ↺
        </button>
      </div>
      <div class="rrg__tuning-actions">
        <ReButton size="small" @click="emit('apply')">
          {{ t('toolbar.tuningApply', '重新布局') }}
        </ReButton>
        <ReButton size="small" @click="emit('reset-all'); emit('apply')">
          {{ t('toolbar.tuningReset', '恢复默认') }}
        </ReButton>
      </div>
      <!-- 边标签开关：onHover 模式下默认只显示悬停那条边，此处可切回全部常显 -->
      <label class="rrg__tuning-toggle">
        <ReSwitch
          size="small"
          :model-value="props.edgeLabelsShown"
          :aria-label="t('toolbar.edgeLabelsAll', '显示全部边标签')"
          @update:model-value="(v: unknown) => emit('toggle-edge-labels', !!v)"
        />
        <span>{{ t('toolbar.edgeLabelsAll', '显示全部边标签') }}</span>
      </label>
    </template>
  </div>
</template>