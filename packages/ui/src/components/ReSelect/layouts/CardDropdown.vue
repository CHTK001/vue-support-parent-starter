<template>
  <ElPopover
    v-model:visible="isOpen"
    :width="popoverWidthReal"
    popper-class="re-card-select__popper"
    placement="bottom-start"
    :fallback-placements="['top-start', 'top-end', 'bottom-end']"
    :persistent="false"
    :disabled="disabled"
    trigger="click"
  >
    <template #reference>
      <button
        ref="triggerRef"
        type="button"
        class="re-card-select__trigger"
        :class="[
          `re-card-select__trigger--${controlSize}`,
          {
            'is-open': isOpen,
            'is-compact': compact,
            'is-selected': hasSelection,
            'is-disabled': disabled,
          },
        ]"
        :disabled="disabled"
        :aria-haspopup="true"
        :aria-expanded="isOpen"
      >
        <span v-if="$slots.trigger" class="re-card-select__trigger-leading">
          <slot name="trigger" />
        </span>
        <ReIcon
          v-else-if="triggerIconName"
          :name="triggerIconName"
          :size="triggerIconSize"
          class="re-card-select__trigger-leading"
        />
        <span class="re-card-select__trigger-label" :class="{ 'is-placeholder': !hasSelection }">
          {{ triggerLabel || placeholder }}
        </span>
        <svg
          class="re-card-select__arrow"
          :class="{ 'is-up': isOpen }"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <polyline points="6 9 10 13 14 9" />
        </svg>
      </button>
    </template>

    <div class="re-card-select__dropdown">
      <slot name="header" />

      <div v-if="title" class="re-card-select__head">
        <span class="re-card-select__title">{{ title }}</span>
        <span v-if="multiple && selectedCount" class="re-card-select__count">{{ selectedCount }}</span>
      </div>

      <div v-if="multiple && bulkActions" class="re-card-select__bulk">
        <button type="button" class="re-card-select__bulk-btn" @click="selectAll">全选</button>
        <span class="re-card-select__bulk-sep" aria-hidden="true"></span>
        <button type="button" class="re-card-select__bulk-btn" @click="invertSelection">反选</button>
      </div>

      <div v-if="filterable" class="re-card-select__search">
        <ReIcon name="Search" :size="14" class="re-card-select__search-icon" />
        <input
          v-model="searchText"
          class="re-card-select__search-input"
          type="text"
          :placeholder="placeholder"
        />
      </div>

      <div v-if="loading" class="re-card-select__loading">
        <span class="re-card-select__spinner" aria-hidden="true"></span>
        <span>加载中…</span>
      </div>

      <div v-else-if="groupedOptions.length" class="re-card-select__list">
        <template v-for="(group, gIdx) in groupedOptions" :key="gIdx">
          <div v-if="group.label" class="re-card-select__group-title">{{ group.label }}</div>
          <div
            v-for="opt in group.items"
            :key="String(opt.value)"
            class="re-card-select__option"
            :class="{
              'is-selected': isSelected(opt),
              'is-disabled': opt.disabled,
              'is-premium': Boolean(opt.premium),
            }"
            :title="opt.tip"
            @click="toggle(opt)"
          >
            <slot name="option" :opt="opt" :selected="isSelected(opt)" :toggle="toggle">
              <span v-if="opt.image" class="re-card-select__option-icon">
                <img :src="opt.image" alt="" />
              </span>
              <ReStateIcon
                v-else-if="hasOptionIcon(opt)"
                class="re-card-select__option-icon"
                :active="isSelected(opt)"
                :icon="(opt.icon as string) || undefined"
                :active-icon="(opt.activeIcon as string) || undefined"
                :inactive-icon="(opt.inactiveIcon as string) || undefined"
                :preset="(opt.preset as string) || undefined"
                :size="20"
              />
              <ReIcon
                v-else-if="opt.icon"
                :name="opt.icon as string"
                :size="20"
                class="re-card-select__option-icon"
              />

              <div class="re-card-select__option-body">
                <div class="re-card-select__option-main">
                  <span class="re-card-select__option-label">{{ opt.label }}</span>
                  <span v-if="opt.tag" class="re-card-select__option-tag" :style="tagStyle(opt)">
                    {{ opt.tag }}
                  </span>
                  <span v-else-if="opt.premium" class="re-card-select__option-tag re-card-select__option-tag--premium">
                    高级
                  </span>
                </div>
                <div v-if="opt.description || opt.consumption" class="re-card-select__option-meta">
                  <span v-if="opt.description" class="re-card-select__option-desc">{{ opt.description }}</span>
                  <span v-if="opt.consumption" class="re-card-select__option-consumption">
                    {{ opt.consumption }}
                  </span>
                </div>
              </div>

              <span v-if="isSelected(opt)" class="re-card-select__check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              </span>
            </slot>
          </div>
        </template>
      </div>

      <div v-else class="re-card-select__empty">
        <ReIcon name="Box" :size="28" />
        <span>{{ emptyText }}</span>
      </div>

      <slot name="footer" />
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
/**
 * CardDropdownLayout —— 卡片式下拉选择器布局（layout="card" / "card-dropdown"）
 *
 * 结构：底部固定触发栏（圆角描边控件）+ 点击后浮出的卡片面板。
 * 面板内纵向排列选项条目：图标 / 标签 / 标签 chip / 描述 / 消耗 / 对勾。
 *
 * 视觉口径（与库内 Modern 族 / surface 基线一致）：
 *   - 颜色只走 {@code --el-*} 与 {@code --re-surface-*} 令牌，不写死 hex / rgb；
 *   - 圆角走 {@code --el-radius-*}（触发栏）与 {@code --re-surface-radius}（面板）；
 *   - 悬停用条目自身底色（不靠负 margin 制造内缩），选中态主色浅底 + 主色对勾；
 *   - 图标位统一为圆角方块，选中后转主色浅底，与 square 布局同一语言。
 *
 * 选项支持「两态图标」：{@code activeIcon} / {@code inactiveIcon} / {@code preset}
 * 任一非空即走 {@link ReStateIcon} 的动画切换，{@code icon} 作为兜底。
 *
 * 用法：
 *   <ReSelect
 *     layout="card"
 *     title="模型"
 *     :data="[
 *       { label: 'Seedream 4.5', value: 'sd45', description: '旗舰出图', tag: '升级', premium: true, consumption: '专业出图・4 倍消耗' },
 *       { label: 'GPT-4o', value: 'gpt4o', description: '通用推理' },
 *     ]"
 *     v-model="selected"
 *   />
 */
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElPopover } from "element-plus";
import ReIcon from "../../ReIcon";
import ReStateIcon from "../../ReStateIcon/StateIcon.vue";
import "../../shared/re-surface.css";
import type { ReSelectSize } from "../types";

defineOptions({ name: "CardReSelect", inheritAttrs: true });

interface CardOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 左侧图标名（Element Plus / Iconify / HTTP 图床 URL） */
  icon?: string;
  /** 选中态图标名（两态图标，缺省回退到 icon） */
  activeIcon?: string;
  /** 未选中态图标名（两态图标，缺省回退到 icon） */
  inactiveIcon?: string;
  /** 内置图标集名（sunmoon / check / star / bell / arrow / anim） */
  preset?: string;
  /** 左侧图片地址（HTTP URL，优先于 icon 显示） */
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
    /** 面板顶部分类标题 */
    title?: string;
    /** 面板宽度（缺省随触发栏实测宽度） */
    popoverWidth?: number;
    /** 紧凑模式：触发栏宽度自适应选中文字 */
    compact?: boolean;
    /** 多选时是否显示全选 / 反选 */
    bulkActions?: boolean;
    /**
     * 控件尺寸档位（small / default / large / mini）。
     *
     * 命名带 control 前缀是为了与 Square 布局里的「图标尺寸 size(number)」区分开：
     * 两者都叫 size 时语义完全不同，透传时极易串味。
     */
    controlSize?: ReSelectSize;
    /**
     * 触发栏图标：字符串=图标名；true=显示当前选中项的图标；false=不显示。
     */
    triggerIcon?: boolean | string;
    /** 空数据文案 */
    emptyText?: string;
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
    triggerIcon: true,
    emptyText: "暂无匹配选项",
  },
);

const modelValue = defineModel<string | number | (string | number)[] | null>({ default: "" });

const isOpen = ref(false);
const searchText = ref("");

/* ===== 宽度自适应：popover 与触发栏同宽 ===== */
const triggerRef = ref<HTMLElement | null>(null);
const measuredWidth = ref(0);
const popoverWidthReal = computed(() => (measuredWidth.value > 0 ? measuredWidth.value : props.popoverWidth));
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

const hasSelection = computed<boolean>(() => selectedSet.value.size > 0);

const selectedCount = computed<number>(() => {
  if (Array.isArray(modelValue.value)) return modelValue.value.length;
  return hasSelection.value ? 1 : 0;
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

/* ===== 触发栏图标 ===== */
const selectedOption = computed<CardOption | undefined>(() => {
  const v = modelValue.value;
  if (Array.isArray(v) || v === "" || v == null) return undefined;
  return props.options.find((o) => o.value === v);
});

/** 触发栏图标名：字符串直接用；true 时取选中项的图标；false 时不显示 */
const triggerIconName = computed<string>(() => {
  if (typeof props.triggerIcon === "string") return props.triggerIcon;
  if (!props.triggerIcon) return "";
  return (selectedOption.value?.icon as string | undefined) ?? "";
});

const triggerIconSize = computed(() => (props.controlSize === "large" ? 18 : 16));

/* ===== 选项图标判定 ===== */
function hasOptionIcon(opt: CardOption): boolean {
  return Boolean(
    (opt.icon as string | undefined) ||
      (opt.activeIcon as string | undefined) ||
      (opt.inactiveIcon as string | undefined) ||
      (opt.preset as string | undefined),
  );
}

/** 标签配色：显式 tagColor 优先，否则走主色令牌（暗色自动跟随） */
function tagStyle(opt: CardOption): Record<string, string> {
  const color = opt.tagColor as string | undefined;
  if (!color) return {};
  return {
    color,
    borderColor: color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
  };
}

/* ===== 搜索过滤 ===== */
const filteredOptions = computed(() => {
  if (!searchText.value) return props.options;
  const kw = searchText.value.toLowerCase();
  return props.options.filter(
    (o) => o.label.toLowerCase().includes(kw) || (o.description ?? "").toLowerCase().includes(kw),
  );
});

/* ===== 分组 ===== */
const groupedOptions = computed(() => {
  const opts = filteredOptions.value;
  const hasGroup = opts.some((o) => o.group);
  if (!hasGroup) return [{ label: "", items: opts }];
  const map = new Map<string, CardOption[]>();
  const order: string[] = [];
  for (const o of opts) {
    const g = o.group ?? "";
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
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
</script>

<style scoped>
/* ============================================================
 * 触发栏（底部固定控件）
 * ============================================================ */
.re-card-select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 12px;
  min-height: 34px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  outline: none;
  /* 顶部高光 + 极淡投影，让控件有"浮在纸面"的体积感，不靠实色边框划界 */
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--el-bg-color) 55%, transparent),
    0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent);
  transition:
    border-color var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;
}

/* 尺寸档：对齐 Element 控件基线 28 / 34 / 40（mini 为库内扩展档） */
.re-card-select__trigger--small {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--el-radius-sm, 6px);
}
.re-card-select__trigger--default {
  min-height: 34px;
}
.re-card-select__trigger--large {
  min-height: 40px;
  padding: 0 14px;
  font-size: 14px;
  border-radius: var(--el-radius-lg, 12px);
}
.re-card-select__trigger--mini {
  min-height: 24px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: var(--el-radius-xs, 4px);
}

.re-card-select__trigger.is-compact {
  width: auto;
  min-width: 0;
}

.re-card-select__trigger:hover:not(.is-disabled) {
  border-color: var(--el-color-primary-light-5, var(--el-color-primary));
  background: var(--el-fill-color-lighter);
}

.re-card-select__trigger.is-open {
  border-color: var(--el-color-primary);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--el-bg-color) 55%, transparent),
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.re-card-select__trigger:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--el-bg-color) 55%, transparent),
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}

.re-card-select__trigger.is-selected {
  color: var(--el-text-color-primary);
}

.re-card-select__trigger.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}

.re-card-select__trigger-leading {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.re-card-select__trigger-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}
.re-card-select__trigger-label.is-placeholder {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.re-card-select__arrow {
  flex: none;
  color: var(--el-text-color-secondary);
  transition: transform var(--el-transition-duration, 0.2s) cubic-bezier(0.22, 1, 0.36, 1);
}
.re-card-select__arrow.is-up {
  transform: rotate(180deg);
}

/* ============================================================
 * 悬浮面板
 * ============================================================ */
.re-card-select__dropdown {
  display: flex;
  flex-direction: column;
  max-height: 420px;
  background: var(--re-surface-bg, var(--el-bg-color-overlay));
  overflow: hidden;
}

/* 面板头部：标题 + 已选计数 */
.re-card-select__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 18px 10px;
  flex-shrink: 0;
}
.re-card-select__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
}
.re-card-select__count {
  flex: none;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-radius: 9999px;
}

/* 批量操作 */
.re-card-select__bulk {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 18px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.re-card-select__bulk-btn {
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;
  transition: opacity var(--el-transition-duration-fast, 0.15s) ease;
}
.re-card-select__bulk-btn:hover {
  opacity: 0.75;
}
.re-card-select__bulk-sep {
  width: 1px;
  height: 12px;
  background: var(--el-border-color);
}

/* 搜索 */
.re-card-select__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  flex-shrink: 0;
}
.re-card-select__search-icon {
  flex: none;
  color: var(--el-text-color-placeholder);
}
.re-card-select__search-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  font: inherit;
  font-size: 13px;
  outline: none;
  transition:
    border-color var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;
}
.re-card-select__search-input::placeholder {
  color: var(--el-text-color-placeholder);
}
.re-card-select__search-input:focus {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* Loading */
.re-card-select__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 18px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.re-card-select__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: re-card-select-spin 0.8s linear infinite;
}
@keyframes re-card-select-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 选项列表 */
.re-card-select__list {
  overflow-y: auto;
  padding: 6px 12px 12px;
  flex: 1;
  min-height: 0;
}

/* 分组标题 */
.re-card-select__group-title {
  padding: 10px 6px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

/* ================== 选项条目 ================== */
.re-card-select__option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--el-transition-duration-fast, 0.15s) ease,
    box-shadow var(--el-transition-duration-fast, 0.15s) ease;
}
.re-card-select__option:hover:not(.is-disabled):not(.is-selected) {
  background: var(--el-fill-color-lighter);
}
.re-card-select__option.is-selected {
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 34%, transparent);
}
.re-card-select__option.is-premium {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-warning) 40%, transparent);
}
.re-card-select__option.is-premium.is-selected {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-warning) 20%, transparent);
}
.re-card-select__option.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 图标位：圆角方块，选中后转主色浅底（与 square 布局同一语言） */
.re-card-select__option-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  overflow: hidden;
}
.re-card-select__option-icon :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.re-card-select__option.is-selected .re-card-select__option-icon {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
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
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-card-select__option.is-selected .re-card-select__option-label {
  color: var(--el-color-primary);
}

/* 标签 chip：默认主色浅底，显式 tagColor 时由内联 style 覆盖 */
.re-card-select__option-tag {
  flex: none;
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: var(--el-radius-xs, 4px);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 26%, transparent);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.re-card-select__option-tag--premium {
  border-color: color-mix(in srgb, var(--el-color-warning) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
  color: var(--el-color-warning);
}

/* 次级信息行：描述 + 消耗 */
.re-card-select__option-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 3px;
  min-width: 0;
}
.re-card-select__option-desc {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-card-select__option-consumption {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-warning);
  font-variant-numeric: tabular-nums;
}

/* 选中对勾：主色圆底 + 白勾，与 square 布局同一规格 */
.re-card-select__check {
  flex: none;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-primary) 88%, var(--el-color-black));
  color: var(--el-color-white);
  box-shadow: 0 1px 4px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}
.re-card-select__check svg {
  width: 11px;
  height: 11px;
}

/* 空状态 */
.re-card-select__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 18px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* 滚动条 */
.re-card-select__list::-webkit-scrollbar {
  width: 6px;
}
.re-card-select__list::-webkit-scrollbar-track {
  background: transparent;
}
.re-card-select__list::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--el-text-color-secondary) 30%, transparent);
  border-radius: 3px;
}
.re-card-select__list::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--el-text-color-secondary) 55%, transparent);
}

/* ================== 减少动效 ================== */
@media (prefers-reduced-motion: reduce) {
  .re-card-select__trigger,
  .re-card-select__arrow,
  .re-card-select__option,
  .re-card-select__search-input {
    transition: none;
  }
  .re-card-select__spinner {
    animation-duration: 1.6s;
  }
}
</style>

<style>
/* ===== Popover 弹窗（teleport 到 body，必须非 scoped） =====
   外壳只定圆角 + 投影，颜色全部走 surface 基线令牌（--re-surface-shadow
   由本组件 import 的 re-surface.css 定义在 :root，teleport 后依然可解析）。 */
.re-card-select__popper {
  padding: 0 !important;
  border-radius: var(--re-surface-radius, 16px) !important;
  border: 1px solid transparent !important;
  max-width: calc(100vw - 32px);
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent),
    0 18px 36px -14px color-mix(in srgb, var(--el-color-primary) 30%, transparent) !important;
  overflow: hidden;
}
.re-card-select__popper .el-popover__title {
  display: none;
}
</style>
