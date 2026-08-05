<template>
  <div
    ref="root"
    :class="['re-card-select', { 're-card-select--open': isOpen, 're-card-select--disabled': disabled }]"
  >
    <!-- ===== 悬浮弹窗 ===== -->
    <Transition name="re-card-select-fade">
      <div v-if="isOpen" class="re-card-select__dropdown">
        <!-- 顶部分类标题 -->
        <div v-if="title" class="re-card-select__title">{{ title }}</div>

        <!-- 批量操作栏（多选） -->
        <div v-if="multiple" class="re-card-select__bulk">
          <span class="re-card-select__bulk-btn" @click="selectAll">全选</span>
          <span class="re-card-select__bulk-btn" @click="invertSelection">反选</span>
        </div>

        <!-- 搜索栏 -->
        <div v-if="filterable" class="re-card-select__search">
          <input
            v-model="searchText"
            class="re-card-select__search-input"
            :placeholder="placeholder"
            @input="onSearch"
          />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="re-card-select__loading">
          <svg class="re-card-select__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
          </svg>
          <span>加载中...</span>
        </div>

        <!-- 选项列表 -->
        <div v-else class="re-card-select__list">
          <template v-for="(group, gIdx) in groupedOptions" :key="gIdx">
            <!-- 分组标题 -->
            <div v-if="group.label" class="re-card-select__group-title">{{ group.label }}</div>
            <!-- 选项条目 -->
            <div
              v-for="opt in group.items"
              :key="String(opt.value)"
              :class="[
                're-card-select__option',
                {
                  're-card-select__option--selected': isSelected(opt),
                  're-card-select__option--premium': opt.premium,
                  're-card-select__option--disabled': opt.disabled,
                },
              ]"
              @click="toggle(opt)"
            >
              <div class="re-card-select__option-body">
                <!-- 主标题行 -->
                <div class="re-card-select__option-main">
                  <span class="re-card-select__option-label">{{ opt.label }}</span>
                  <!-- 标签（升级 / Pro / Beta 等） -->
                  <span
                    v-if="opt.tag"
                    class="re-card-select__option-tag"
                    :style="opt.tagColor ? { background: opt.tagColor } : {}"
                  >{{ opt.tag }}</span>
                  <!-- 消耗说明 -->
                  <span v-if="opt.consumption" class="re-card-select__option-consumption">
                    {{ opt.consumption }}
                  </span>
                </div>
                <!-- 描述 -->
                <div v-if="opt.description" class="re-card-select__option-desc">{{ opt.description }}</div>
              </div>
              <!-- 选中对勾 -->
              <svg
                v-if="isSelected(opt)"
                class="re-card-select__check"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="filteredOptions.length === 0" class="re-card-select__empty">
            暂无匹配选项
          </div>
        </div>
      </div>
    </Transition>

    <!-- ===== 底部触发栏 ===== -->
    <div class="re-card-select__trigger" @click="toggleOpen">
      <div class="re-card-select__trigger-left">
        <!-- 图标 -->
        <span v-if="triggerIcon" class="re-card-select__trigger-icon">
          <slot name="icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </slot>
        </span>
        <!-- 当前选中标签 -->
        <span class="re-card-select__trigger-label">
          {{ triggerLabel || placeholder }}
        </span>
      </div>
      <!-- 箭头 -->
      <svg
        :class="['re-card-select__arrow', { 're-card-select__arrow--up': isOpen }]"
        viewBox="0 0 20 20"
        fill="currentColor"
        width="16"
        height="16"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  </div>
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({ name: "CardDropdownReSelect", inheritAttrs: true });

interface CardOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: string;
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
    /** 触发栏图标（默认星形） */
    triggerIcon?: boolean;
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
  },
);

const modelValue = defineModel<string | number | (string | number)[] | null>({ default: "" });

const root = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const searchText = ref("");

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

/* ===== 开关 & 外部点击 ===== */
function toggleOpen() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) searchText.value = "";
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside, true));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside, true));
</script>

<style scoped>
.re-card-select {
  position: relative;
  display: inline-block;
  min-width: 200px;
}
.re-card-select--disabled {
  opacity: 0.55;
  pointer-events: none;
}

/* ===== 悬浮弹窗 ===== */
.re-card-select__dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 300px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 14px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.10),
    0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  z-index: 2200;
}

/* 分类标题 */
.re-card-select__title {
  padding: 12px 16px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* 批量操作 */
.re-card-select__bulk {
  display: flex;
  gap: 14px;
  padding: 6px 16px 4px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.re-card-select__bulk-btn {
  font-size: 12px;
  color: #6366f1;
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
  padding: 7px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  background: #f9fafb;
}
.re-card-select__search-input:focus {
  border-color: #6366f1;
  background: #fff;
}

/* Loading */
.re-card-select__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
}
.re-card-select__spinner {
  width: 20px;
  height: 20px;
  color: #6366f1;
  animation: re-card-spin 0.8s linear infinite;
}
@keyframes re-card-spin {
  to { transform: rotate(360deg); }
}

/* 选项列表 */
.re-card-select__list {
  overflow-y: auto;
  padding: 4px 0;
  flex: 1;
  min-height: 0;
}

/* 分组标题 */
.re-card-select__group-title {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ===== 选项条目 ===== */
.re-card-select__option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}
.re-card-select__option:hover:not(.re-card-select__option--disabled) {
  background: #f3f4f6;
}
/* 选中态 */
.re-card-select__option--selected {
  background: #f0f4ff;
}
.re-card-select__option--selected:hover {
  background: #e8eeff;
}
/* 高阶/付费模型高亮底色 */
.re-card-select__option--premium {
  background: #f5f5f7;
}
.re-card-select__option--premium:hover {
  background: #edeef1;
}
.re-card-select__option--premium.re-card-select__option--selected {
  background: #eef0ff;
}
/* 禁用 */
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
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}
/* 标签（升级 / Pro / Beta） */
.re-card-select__option-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 4px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  line-height: 1.5;
  flex-shrink: 0;
}
/* 消耗说明 */
.re-card-select__option-consumption {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}
/* 描述 */
.re-card-select__option-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 对勾 */
.re-card-select__check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #6366f1;
}

/* 空状态 */
.re-card-select__empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

/* ===== 底部触发栏 ===== */
.re-card-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.re-card-select__trigger:hover {
  border-color: #c7d2fe;
  background: #fafafa;
}
.re-card-select--open .re-card-select__trigger {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
.re-card-select__trigger-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.re-card-select__trigger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  flex-shrink: 0;
}
.re-card-select__trigger-icon svg {
  width: 16px;
  height: 16px;
}
.re-card-select__trigger-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 箭头 */
.re-card-select__arrow {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.re-card-select__arrow--up {
  transform: rotate(180deg);
}

/* ===== 弹窗动画 ===== */
.re-card-select-fade-enter-active {
  animation: re-card-dropdown-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.re-card-select-fade-leave-active {
  animation: re-card-dropdown-out 0.15s ease;
}
@keyframes re-card-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes re-card-dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
}

/* 滚动条 */
.re-card-select__list::-webkit-scrollbar {
  width: 4px;
}
.re-card-select__list::-webkit-scrollbar-track {
  background: transparent;
}
.re-card-select__list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.re-card-select__list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
