<template>
  <el-popover
    v-model:visible="isOpen"
    :width="popoverWidthReal"
    :popper-class="'re-card-select__popper'"
    placement="bottom-start"
    :fallback-placements="['top-start', 'top-end', 'bottom-end']"
    :persistent="false"
    :disabled="disabled"
    trigger="click"
  >
    <template #reference>
      <div
        ref="triggerRef"
        class="re-card-select__trigger"
        :class="{ 're-card-select__trigger--open': isOpen, 're-card-select__trigger--compact': compact }"
      >
        <span v-if="triggerIcon" class="re-card-select__trigger-icon">
          <slot name="icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </slot>
        </span>
        <span class="re-card-select__trigger-label">{{ triggerLabel || placeholder }}</span>
        <svg
          :class="['re-card-select__arrow', { 're-card-select__arrow--up': isOpen }]"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="14"
          height="14"
        >
          <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </template>

    <div class="re-card-select__dropdown">
      <slot name="header" />
      <div v-if="title" class="re-card-select__title">{{ title }}</div>
      <div v-if="multiple && bulkActions" class="re-card-select__bulk">
        <span class="re-card-select__bulk-btn" @click="selectAll">全选</span>
        <span class="re-card-select__bulk-btn" @click="invertSelection">反选</span>
      </div>
      <div v-if="filterable" class="re-card-select__search">
        <input v-model="searchText" class="re-card-select__search-input" :placeholder="placeholder" @input="onSearch" />
      </div>
      <div v-if="loading" class="re-card-select__loading">
        <svg class="re-card-select__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <span>加载中...</span>
      </div>
      <div v-else class="re-card-select__list">
        <template v-for="(group, gIdx) in groupedOptions" :key="gIdx">
          <div v-if="group.label" class="re-card-select__group-title">{{ group.label }}</div>
          <div
            v-for="opt in group.items"
            :key="String(opt.value)"
            :class="['re-card-select__option', { 're-card-select__option--selected': isSelected(opt), 're-card-select__option--disabled': opt.disabled }]"
            @click="toggle(opt)"
            :title="opt.tip"
          >
            <template v-if="$slots.option">
              <slot name="option" :opt="opt" :selected="isSelected(opt)" :toggle="toggle" />
            </template>
            <template v-else>
              <div class="re-card-select__option-body">
                <div class="re-card-select__option-main">
                  <span class="re-card-select__option-label">{{ opt.label }}</span>
                  <span v-if="opt.tag" class="re-card-select__option-tag" :style="opt.tagColor ? { background: opt.tagColor } : {}">{{ opt.tag }}</span>
                </div>
                <div v-if="opt.description" class="re-card-select__option-desc">{{ opt.description }}</div>
              </div>
              <svg v-if="isSelected(opt)" class="re-card-select__check" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </template>
          </div>
        </template>
        <div v-if="filteredOptions.length === 0" class="re-card-select__empty">暂无匹配选项</div>
      </div>
      <slot name="footer" />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
/**
 * CardDropdownLayout —— 卡片式下拉选择器布局
 *
 * 整体结构：白色圆角悬浮弹窗 + 底部固定触发栏。
 * 弹窗内纵向排列选项条目：标题 + 描述 + 标签 + 对勾，
 * 高阶/付费模型带高亮底色与功能标签。
 *
 * 用法：
 *   <ReSelect
 *     layout="card-dropdown"
 *     title="模型"
 *     :data="[
 *       { label: 'Seedream 4.5', value: 'sd45', description: '旗舰出图', tag: '升级', premium: true, consumption: '专业出图・4 倍消耗' },
 *       { label: 'GPT-4o', value: 'gpt4o', description: '通用推理' },
 *       { label: 'GPT-3.5', value: 'gpt35', description: '轻量快速' },
 *     ]"
 *     v-model="selected"
 *   />
 */
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElPopover } from "element-plus";

defineOptions({ name: "CardReSelect", inheritAttrs: true });

interface CardOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 左侧图标名（Element Plus / Iconify / HTTP 图床 URL） */
  icon?: string;
  /** 左侧图片地址（HTTP URL，优先于 icon） */
  image?: string;
  /** 悬停提示 */
  tip?: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  premium?: boolean;
  consumption?: string;
  group?: string;
  [key: string]: unknown;
}

const props = withDefaults(
  defineProps<{
    options?: CardOption[];
    multiple?: boolean;
    disabled?: boolean;
    loading?: boolean;
    filterable?: boolean;
    placeholder?: string;
    /** 弹窗顶部分类标题 */
    title?: string;
    /** 是否显示触发栏图标 */
    triggerIcon?: boolean;
    /** 弹窗宽度 */
    popoverWidth?: number;
    /** 紧凑模式：触发栏宽度自适应选中文字（默认 false） */
    compact?: boolean;
    /** 多选时是否显示全选 / 反选（默认 false） */
    bulkActions?: boolean;
  }>(),
  {
    options: () => [],
    multiple: false,
    disabled: false,
    loading: false,
    filterable: false,
    placeholder: "请选择",
    title: "",
    triggerIcon: true,
    popoverWidth: 300,
    compact: false,
    bulkActions: false,
  },
);

const modelValue = defineModel<string | number | (string | number)[] | null>({ default: "" });

const isOpen = ref(false);
const searchText = ref("");

/* ===== 宽度自适应：popover 与触发栏同宽 ===== */
const triggerRef = ref<HTMLElement | null>(null);
const measuredWidth = ref(0);
const popoverWidthReal = computed(() => measuredWidth.value > 0 ? measuredWidth.value : props.popoverWidth);
let resizeObserver: ResizeObserver | null = null;

function measureTriggerWidth() {
  if (triggerRef.value) {
    measuredWidth.value = triggerRef.value.getBoundingClientRect().width;
  }
}

onMounted(() => {
  measureTriggerWidth();
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measureTriggerWidth());
    if (triggerRef.value) resizeObserver.observe(triggerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(isOpen, (v) => {
  if (v) {
    nextTick(() => measureTriggerWidth());
    searchText.value = "";
  }
});

/* ===== 选中状态 ===== */
const selectedSet = computed<Set<string | number>>(() => {
  if (Array.isArray(modelValue.value)) return new Set(modelValue.value);
  if (modelValue.value !== "" && modelValue.value != null) return new Set([modelValue.value]);
  return new Set();
});

function isSelected(opt: CardOption): boolean {
  return selectedSet.value.has(opt.value);
}

function toggle(opt: CardOption) {
  if (props.disabled || opt.disabled) return;
  if (!props.multiple) {
    modelValue.value = opt.value;
    isOpen.value = false;
    return;
  }
  const cur = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
  const idx = cur.indexOf(opt.value);
  if (idx >= 0) cur.splice(idx, 1);
  else cur.push(opt.value);
  modelValue.value = cur;
}

function selectAll() {
  if (props.disabled) return;
  modelValue.value = props.options.filter((o) => !o.disabled).map((o) => o.value);
}

function invertSelection() {
  if (props.disabled) return;
  const curSet = new Set(Array.isArray(modelValue.value) ? modelValue.value : []);
  modelValue.value = props.options
    .filter((o) => (o.disabled ? curSet.has(o.value) : !curSet.has(o.value)))
    .map((o) => o.value);
}

/* ===== 搜索过滤 ===== */
const filteredOptions = computed(() => {
  if (!searchText.value) return props.options;
  const kw = searchText.value.toLowerCase();
  return props.options.filter(
    (o) => o.label.toLowerCase().includes(kw) || (o.description ?? "").toLowerCase().includes(kw),
  );
});

function onSearch() { /* computed 自动响应 */ }

/* ===== 分组 ===== */
const groupedOptions = computed(() => {
  const opts = filteredOptions.value;
  const hasGroup = opts.some((o) => o.group);
  if (!hasGroup) return [{ label: "", items: opts }];
  const map = new Map<string, CardOption[]>();
  const order: string[] = [];
  for (const o of opts) {
    const g = o.group ?? "";
    if (!map.has(g)) { map.set(g, []); order.push(g); }
    map.get(g)!.push(o);
  }
  return order.map((g) => ({ label: g, items: map.get(g)! }));
});

/* ===== 触发栏回显 ===== */
const triggerLabel = computed(() => {
  const list = props.options;
  const v = modelValue.value;
  if (v === null || v === undefined || v === "") return "";
  if (Array.isArray(v)) {
    return v
      .map((val) => list.find((o) => o.value === val)?.label ?? "")
      .filter(Boolean)
      .join("、");
  }
  const found = list.find((o) => o.value === v);
  return found ? found.label : "";
});

/* ===== 显隐 ===== */
</script>

<style scoped>
/* ===== 悬浮弹窗 ===== */
.re-card-select__dropdown {
  display: flex;
  flex-direction: column;
  max-height: 420px;
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}

/* 分类标题 */
.re-card-select__title {
  padding: 12px 16px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* 批量操作 */
.re-card-select__bulk {
  display: flex;
  gap: 14px;
  padding: 6px 16px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.re-card-select__bulk-btn {
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
}
.re-card-select__bulk-btn:hover { opacity: 0.7; }

/* 搜索 */
.re-card-select__search {
  padding: 8px 12px;
  flex-shrink: 0;
}
.re-card-select__search-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.re-card-select__search-input:focus {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
}

/* Loading */
.re-card-select__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.re-card-select__spinner {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
  animation: re-card-spin 0.8s linear infinite;
}
@keyframes re-card-spin {
  to { transform: rotate(360deg); }
}

/* 选项列表 */
.re-card-select__list {
  overflow-y: auto;
  padding: 6px;
  flex: 1;
  min-height: 0;
}

/* 分组标题 */
.re-card-select__group-title {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ===== 选项条目 ===== */
.re-card-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}
.re-card-select__option:hover:not(.re-card-select__option--disabled) {
  background: var(--el-fill-color);
}
.re-card-select__option--selected {
  background: var(--el-color-primary-light-9);
}
.re-card-select__option--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 选项主体 */
.re-card-select__option-body {
  flex: 1;
  min-width: 0;
}
.re-card-select__option-main {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.re-card-select__option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}
/* 标签 */
.re-card-select__option-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  flex-shrink: 0;
}
/* 描述 */
.re-card-select__option-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 对勾 */
.re-card-select__check {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

/* 空状态 */
.re-card-select__empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ===== 底部触发栏 ===== */
.re-card-select__trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  width: 100%;
  box-sizing: border-box;
}
.re-card-select__trigger--compact {
  min-width: 0;
  width: auto;
}
.re-card-select__trigger:hover {
  background: var(--el-fill-color);
}
.re-card-select__trigger--open {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.re-card-select__trigger-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}
.re-card-select__trigger-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 箭头 */
.re-card-select__arrow {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.re-card-select__arrow--up {
  transform: rotate(180deg);
}

/* 滚动条 */
.re-card-select__list::-webkit-scrollbar {
  width: 4px;
}
.re-card-select__list::-webkit-scrollbar-track {
  background: transparent;
}
.re-card-select__list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 4px;
}
.re-card-select__list::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}
</style>

<style>
/* ===== Popover 弹窗（teleport 到 body，需全局样式） ===== */
.re-card-select__popper {
  padding: 0 !important;
  border-radius: 14px;
  border: none;
  max-width: calc(100vw - 32px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.10),
    0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.re-card-select__popper .el-popover__title {
  display: none;
}
</style>
