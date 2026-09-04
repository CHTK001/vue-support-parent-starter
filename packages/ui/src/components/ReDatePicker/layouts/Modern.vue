<script setup lang="ts">
/**
 * ReDatePicker Modern 布局 —— 现代化扁平日期选择触发器
 *
 * 设计要点：
 *   - 玻璃质感容器（inset 高光 + 微阴影 + hover 上浮）
 *   - focus 多层 ring + 主色光晕
 *   - 左侧日历图标渐变 + 聚焦跟色
 *   - clear 按钮 hover 圆形背景高亮
 */
import { ref, computed } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReDatePickerModern", inheritAttrs: true });

const model = defineModel<string | number | Date | (string | number | Date)[] | null>({ default: null });

const props = withDefaults(
  defineProps<{
    type?: string;
    placeholder?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    format?: string;
    valueFormat?: string;
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    size?: "large" | "default" | "small";
    rangeSeparator?: string;
  }>(),
  {
    type: "date",
    placeholder: "选择日期",
    clearable: false,
    disabled: false,
    readonly: false,
    size: "default",
    rangeSeparator: "-",
  },
);

const focused = ref(false);

const displayValue = computed(() => {
  if (!model.value) return "";
  if (Array.isArray(model.value)) return model.value.map(String).join(` ${props.rangeSeparator} `);
  return String(model.value);
});
</script>

<template>
  <div
    :class="[
      'rm-date-wrap',
      `rm-date-wrap--${size || 'default'}`,
      {
        'rm-date-wrap--focused': focused,
        'rm-date-wrap--disabled': disabled,
        'rm-date-wrap--has-value': !!displayValue,
      },
    ]"
    v-bind="$attrs"
  >
    <svg class="rm-date-wrap__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
    <input
      type="text"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="true"
      class="rm-date-wrap__input"
      @focus="focused = true"
      @blur="focused = false"
    />
    <button
      v-if="clearable && model"
      type="button"
      class="rm-date-wrap__clear"
      aria-label="清除"
      @click.stop="model = null"
    >
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
    </button>
  </div>
</template>

<style scoped>
.rm-date-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--rm-height);
  padding: 0 12px;
  border-radius: var(--rm-radius-lg);
  background: var(--rm-bg);
  box-shadow: 0 0 0 1px var(--rm-border-light) inset;
  transition:
    box-shadow var(--rm-transition),
    background var(--rm-transition);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}
.rm-date-wrap--small {
  height: var(--rm-height-sm);
  font-size: var(--rm-font-sm);
  border-radius: var(--rm-radius);
}
.rm-date-wrap--large {
  height: var(--rm-height-lg);
  font-size: var(--rm-font-lg);
  border-radius: var(--rm-radius-xl);
}

.rm-date-wrap:hover:not(.rm-date-wrap--disabled) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--rm-primary) 30%, var(--rm-border-light)) inset;
}

.rm-date-wrap--focused {
  box-shadow: 0 0 0 1px var(--rm-primary) inset, 0 0 0 4px color-mix(in srgb, var(--rm-primary) 10%, transparent);
}
.rm-date-wrap--focused .rm-date-wrap__icon {
  color: var(--rm-primary);
}

.rm-date-wrap--disabled {
  background: var(--rm-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.rm-date-wrap__icon {
  width: 16px;
  height: 16px;
  color: var(--rm-text-secondary);
  flex-shrink: 0;
  transition: color var(--rm-transition);
}

.rm-date-wrap__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  font-weight: 500;
}
.rm-date-wrap__input::placeholder {
  color: var(--rm-text-disabled);
  font-weight: 400;
}
.rm-date-wrap--disabled .rm-date-wrap__input { cursor: not-allowed; }

.rm-date-wrap__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--rm-text-secondary);
  border-radius: 50%;
  transition:
    color var(--rm-transition),
    background var(--rm-transition);
}
.rm-date-wrap__clear:hover {
  color: var(--rm-text);
  background: var(--rm-bg-hover);
}
.rm-date-wrap__clear svg { width: 14px; height: 14px; }

@media (prefers-reduced-motion: reduce) {
  .rm-date-wrap,
  .rm-date-wrap__icon,
  .rm-date-wrap__clear {
    transition: none;
  }
  .rm-date-wrap:hover:not(.rm-date-wrap--disabled) {
    transform: none;
  }
}
</style>