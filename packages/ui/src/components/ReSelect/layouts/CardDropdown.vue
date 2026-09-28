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
        :class="[
          `re-card-select__trigger--${controlSize}`,
          { 're-card-select__trigger--open': isOpen, 're-card-select__trigger--compact': compact },
        ]"
      >
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
                  <img v-if="opt.image" :src="opt.image" class="re-card-select__option-icon re-card-select__option-image" alt="" />
                  <span v-else-if="opt.icon" class="re-card-select__option-icon re-card-select__option-glyph">{{ opt.icon }}</span>
                  <span class="re-card-select__option-label">{{ opt.label }}</span>
                  <span v-if="opt.tag" class="re-card-select__option-tag" :style="opt.tagColor ? { background: opt.tagColor } : {}">{{ opt.tag }}</span>
                </div>
                <div v-if="opt.description" class="re-card-select__option-desc">{{ opt.description }}</div>
              </div>
              <svg v-if="isSelected(opt)" class="re-card-select__check" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
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
import type { ReSelectSize } from "../types";

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
    /** 弹窗宽度 */
    popoverWidth?: number;
    /** 紧凑模式：触发栏宽度自适应选中文字（默认 false） */
    compact?: boolean;
    /** 多选时是否显示全选 / 反选（默认 false） */
    bulkActions?: boolean;
    /**
     * 控件尺寸档位（small / default / large）。
     *
     * 命名带 control 前缀是为了与 Square 布局里的「图标尺寸 size(number)」区分开：
     * 两者都叫 size 时语义完全不同，透传时极易串味。
     */
    controlSize?: ReSelectSize;
  }>(),
  {
    options: () => [],
    multiple: false,
    disabled: false,
    loading: false,
    filterable: false,
    placeholder: "请选择",
    title: "",
    popoverWidth: 300,
    compact: false,
    bulkActions: false,
    controlSize: "default",
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
  border-radius: 20px;
  overflow: hidden;
}

/* 分类标题 */
.re-card-select__title {
  padding: 20px 20px 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
  padding: 8px 16px 16px;
  flex: 1;
  min-height: 0;
}

/* 分组标题 */
.re-card-select__group-title {
  padding: 8px 0 4px;
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
  padding: 12px 0;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}
.re-card-select__option:hover:not(.re-card-select__option--disabled) {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin: 0 -8px;
  padding: 12px 8px;
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
.re-card-select__option-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 16px;
  color: var(--el-text-color-secondary);
}
.re-card-select__option-image {
  object-fit: cover;
  border-radius: 4px;
}
.re-card-select__option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}
/* 标签 */
.re-card-select__option-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: #e6f0ff;
  color: #216ce7;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  flex-shrink: 0;
}
html.dark .re-card-select__option-tag {
  background: rgba(33, 108, 231, 0.2);
  color: #4a8af4;
}
/* 描述 */
.re-card-select__option-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
html.dark .re-card-select__option-desc {
  color: var(--el-text-color-secondary);
}

/* 对勾 */
.re-card-select__check {
  flex-shrink: 0;
  color: var(--el-color-primary);
  font-size: 14px;
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
  padding: 4px 16px;
  border-radius: 12px;
  background: #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  width: 100%;
  box-sizing: border-box;
  border: none;
}
html.dark .re-card-select__trigger {
  background: var(--el-fill-color-light);
}
/* 尺寸档：与 default 布局的 28 / 34 / 40px 保持同一套基线 */
.re-card-select__trigger--small {
  min-height: 28px;
  padding: 2px 12px;
  border-radius: var(--rm-radius);
  font-size: 12px;
}
.re-card-select__trigger--large {
  min-height: 40px;
  padding: 6px 18px;
  border-radius: var(--rm-radius-xl);
  font-size: 14px;
}
.re-card-select__trigger--compact {
  min-width: 0;
  width: auto;
}
.re-card-select__trigger:hover {
  background: var(--el-fill-color);
}
.re-card-select__trigger--open {
  background: var(--el-fill-color-light);
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
  font-size: 13px;
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
  border-radius: 20px !important;
  border: none !important;
  max-width: calc(100vw - 32px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden;
}
.re-card-select__popper .el-popover__title {
  display: none;
}
</style>
