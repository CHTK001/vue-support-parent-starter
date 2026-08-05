<script setup lang="ts">
/**
 * ReSelect Modern 布局 —— 现代化扁平下拉选择
 *
 * 设计特点：
 *   - 扁平触发器（细边框、大圆角）
 *   - 浮层面板无阴影、细边框
 *   - 平滑展开动画
 *   - hover 高亮 + 选中对勾
 */
import { ref, computed } from "vue";
import { onMounted, onBeforeUnmount } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReSelectModern", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: "" });

const props = withDefaults(
  defineProps<{
    options?: Array<{ label: string; value: string | number; disabled?: boolean; icon?: string; description?: string; [key: string]: unknown }>;
    placeholder?: string;
    clearable?: boolean;
    filterable?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    loading?: boolean;
    size?: "large" | "default" | "small";
  }>(),
  {
    options: () => [],
    placeholder: "请选择",
    clearable: false,
    filterable: false,
    multiple: false,
    disabled: false,
    loading: false,
    size: "default",
  },
);

const emit = defineEmits<{
  (e: "change", value: string | number | (string | number)[]): void;
}>();

const open = ref(false);
const keyword = ref("");

const filtered = computed(() => {
  if (!props.filterable || !keyword.value) return props.options;
  const kw = keyword.value.toLowerCase();
  return props.options.filter((o) => o.label.toLowerCase().includes(kw));
});

const displayLabel = computed(() => {
  if (model.value === null || model.value === undefined || model.value === "") return "";
  if (Array.isArray(model.value)) {
    return model.value
      .map((v) => props.options.find((o) => o.value === v)?.label ?? v)
      .join(", ");
  }
  return props.options.find((o) => o.value === model.value)?.label ?? model.value;
});

function toggle(): void {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) keyword.value = "";
}

function select(opt: { value: string | number; disabled?: boolean }): void {
  if (opt.disabled) return;
  if (!props.multiple) {
    model.value = opt.value;
    open.value = false;
    emit("change", opt.value);
    return;
  }
  const cur = Array.isArray(model.value) ? [...(model.value as (string | number)[])] : [];
  const idx = cur.indexOf(opt.value);
  if (idx >= 0) cur.splice(idx, 1);
  else cur.push(opt.value);
  model.value = cur;
  emit("change", cur);
}

function isChecked(opt: { value: string | number }): boolean {
  if (Array.isArray(model.value)) return model.value.includes(opt.value);
  return model.value === opt.value;
}

function onClear(e: MouseEvent): void {
  e.stopPropagation();
  model.value = props.multiple ? [] : "";
}

// 点击外部关闭
const wrapRef = ref<HTMLElement>();
function onClickOutside(e: MouseEvent): void {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}
onMounted(() => document.addEventListener("click", onClickOutside, true));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside, true));
</script>

<template>
  <div
    ref="wrapRef"
    :class="[
      'rm-select',
      `rm-select--${size || 'default'}`,
      {
        'rm-select--open': open,
        'rm-select--disabled': disabled,
        'rm-select--multiple': multiple,
      },
    ]"
    v-bind="$attrs"
  >
    <!-- Trigger -->
    <div class="rm-select__trigger" @click="toggle">
      <span
        v-if="!filterable || !open"
        :class="['rm-select__value', { 'rm-select__value--placeholder': !displayLabel }]"
      >
        {{ displayLabel || placeholder }}
      </span>
      <input
        v-else
        v-model="keyword"
        class="rm-select__search"
        :placeholder="displayLabel || placeholder"
        @click.stop
      />
      <div class="rm-select__icons">
        <button v-if="clearable && displayLabel" class="rm-select__clear" type="button" @click="onClear">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
        </button>
        <svg class="rm-select__arrow" :class="{ 'rm-select__arrow--open': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- Dropdown -->
    <div v-if="open" class="rm-select__dropdown">
      <div v-if="loading" class="rm-select__loading">加载中...</div>
      <div v-else-if="filtered.length === 0" class="rm-select__empty">无匹配选项</div>
      <div
        v-for="opt in filtered"
        :key="String(opt.value)"
        :class="[
          'rm-select__option',
          {
            'rm-select__option--selected': isChecked(opt),
            'rm-select__option--disabled': opt.disabled,
          },
        ]"
        @click.stop="select(opt)"
      >
        <span v-if="multiple" class="rm-select__check">
          <svg v-if="isChecked(opt)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        <span class="rm-select__option-label">{{ opt.label }}</span>
        <svg v-if="!multiple && isChecked(opt)" class="rm-select__option-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-select {
  position: relative;
  display: inline-flex;
  width: 100%;
  font-size: var(--rm-font-md);
}

/* Trigger */
.rm-select__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: var(--rm-height);
  padding: 0 10px 0 12px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  background: var(--rm-bg);
  cursor: pointer;
  transition:
    border-color var(--rm-transition),
    background var(--rm-transition);
}
.rm-select--small .rm-select__trigger { height: var(--rm-height-sm); font-size: var(--rm-font-sm); border-radius: var(--rm-radius-sm); }
.rm-select--large .rm-select__trigger { height: var(--rm-height-lg); font-size: var(--rm-font-lg); border-radius: var(--rm-radius-md); }

.rm-select--open .rm-select__trigger { border-color: var(--rm-border-focus); }
.rm-select--disabled .rm-select__trigger { background: var(--rm-bg-disabled); cursor: not-allowed; opacity: 0.6; }

.rm-select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rm-text);
}
.rm-select__value--placeholder {
  color: var(--rm-text-disabled);
}

.rm-select__search {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text);
  font-size: inherit;
  font-family: inherit;
  padding: 0;
}

.rm-select__icons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.rm-select__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--rm-text-secondary);
  border-radius: 50%;
  transition: color var(--rm-transition);
}
.rm-select__clear:hover { color: var(--rm-text); }
.rm-select__clear svg { width: 14px; height: 14px; }

.rm-select__arrow {
  width: 16px;
  height: 16px;
  color: var(--rm-text-secondary);
  transition: transform var(--rm-transition);
}
.rm-select__arrow--open { transform: rotate(180deg); }

/* Dropdown */
.rm-select__dropdown {
  position: absolute;
  z-index: 2000;
  top: 100%;
  left: 0;
  right: 0;
  min-width: 160px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
  margin-top: 4px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  background: var(--rm-bg);
  box-shadow: var(--rm-shadow-md);
}

.rm-select__loading,
.rm-select__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: var(--rm-text-secondary);
  font-size: var(--rm-font-sm);
}

/* Option */
.rm-select__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--rm-radius-sm);
  cursor: pointer;
  transition: background var(--rm-transition);
  color: var(--rm-text);
  font-size: var(--rm-font-md);
}
.rm-select__option:hover { background: var(--rm-bg-hover); }
.rm-select__option--selected { color: var(--rm-primary); font-weight: 500; }
.rm-select__option--disabled { opacity: 0.5; cursor: not-allowed; }

.rm-select__option-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.rm-select__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.rm-select__check svg { width: 14px; height: 14px; }

.rm-select__option-tick {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--rm-primary);
}
</style>
