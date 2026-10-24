<script setup lang="ts">
/**
 * RePagination Modern 布局 —— 现代化扁平分页
 *
 * 设计要点：
 *   - 极致扁平、hover 主色背景
 *   - 当前页渐变 + 内白色高光 + 主色发光
 *   - size 选择按钮玻璃质感、激活态主色
 *   - chevron 按钮 hover 主色背景 + scale 1.1 反馈
 *   - dropdown 玻璃卡片 + 主色激活
 */
import { computed, ref } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "RePaginationModern" });

const props = withDefaults(
  defineProps<{
    total: number;
    currentPage?: number;
    pageSize?: number;
    pageSizes?: number[];
    disabled?: boolean;
    small?: boolean;
    /** 尺寸档位：default / small / mini（比 small 更紧凑，按钮 24px） */
    size?: "default" | "small" | "mini";
  }>(),
  {
    currentPage: 1,
    pageSize: 10,
    pageSizes: () => [10, 20, 50, 100],
    disabled: false,
    small: false,
    size: "default",
  },
);

const emit = defineEmits<{
  "update:currentPage": [val: number];
  "update:pageSize": [val: number];
  "current-change": [val: number];
  "size-change": [val: number];
  "prev-click": [val: number];
  "next-click": [val: number];
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

/** 生成页码数组（含省略号占位 -1） */
const pages = computed<number[]>(() => {
  const total = totalPages.value;
  const cur = props.currentPage;
  const items: number[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) items.push(i);
    return items;
  }
  items.push(1);
  if (cur > 3) items.push(-1);
  const start = Math.max(2, cur - 1);
  const end = Math.min(total - 1, cur + 1);
  for (let i = start; i <= end; i++) items.push(i);
  if (cur < total - 2) items.push(-1);
  items.push(total);
  return items;
});

function goPage(p: number): void {
  if (p < 1 || p > totalPages.value || p === props.currentPage || props.disabled) return;
  emit("update:currentPage", p);
  emit("current-change", p);
}

function prev(): void {
  if (props.currentPage <= 1 || props.disabled) return;
  const p = props.currentPage - 1;
  emit("update:currentPage", p);
  emit("current-change", p);
  emit("prev-click", p);
}

function next(): void {
  if (props.currentPage >= totalPages.value || props.disabled) return;
  const p = props.currentPage + 1;
  emit("update:currentPage", p);
  emit("current-change", p);
  emit("next-click", p);
}

const showSizeSelect = ref(false);
function onSizeChange(size: number): void {
  emit("update:pageSize", size);
  emit("size-change", size);
  if (props.currentPage !== 1) {
    emit("update:currentPage", 1);
    emit("current-change", 1);
  }
  showSizeSelect.value = false;
}
</script>

<template>
  <nav
    :class="['rm-pager', { 'rm-pager--small': small, 'rm-pager--mini': size === 'mini', 'rm-pager--disabled': disabled }]"
    v-bind="$attrs"
  >
    <!-- Total -->
    <span class="rm-pager__total">共 {{ total }} 条</span>

    <!-- Size select -->
    <div v-if="pageSizes.length > 0" class="rm-pager__sizes">
      <button class="rm-pager__size-btn" type="button" @click="showSizeSelect = !showSizeSelect">
        {{ pageSize }} 条/页
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div v-if="showSizeSelect" class="rm-pager__size-dropdown">
        <button
          v-for="s in pageSizes"
          :key="s"
          :class="['rm-pager__size-option', { 'rm-pager__size-option--active': pageSize === s }]"
          type="button"
          @click="onSizeChange(s)"
        >{{ s }} 条/页</button>
      </div>
    </div>

    <!-- Prev -->
    <button
      class="rm-pager__btn rm-pager__btn--nav"
      type="button"
      :disabled="currentPage <= 1 || disabled"
      aria-label="上一页"
      @click="prev"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>

    <!-- Pages -->
    <button
      v-for="(p, idx) in pages"
      :key="idx"
      :class="[
        'rm-pager__btn',
        {
          'rm-pager__btn--active': p === currentPage,
          'rm-pager__btn--ellipsis': p === -1,
        },
      ]"
      :disabled="p === -1 || disabled"
      type="button"
      @click="p !== -1 ? goPage(p) : undefined"
    >
      <span v-if="p === -1">···</span>
      <span v-else>{{ p }}</span>
    </button>

    <!-- Next -->
    <button
      class="rm-pager__btn rm-pager__btn--nav"
      type="button"
      :disabled="currentPage >= totalPages || disabled"
      aria-label="下一页"
      @click="next"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </nav>
</template>

<style scoped>
.rm-pager {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--rm-radius-lg);
  background: color-mix(in srgb, var(--rm-bg-subtle) 60%, transparent);
  font-size: var(--rm-font-md);
  color: var(--rm-text-regular);
  user-select: none;
}
.rm-pager--small { font-size: var(--rm-font-sm); padding: 3px; }
.rm-pager--mini { font-size: 12px; padding: 2px; gap: 3px; }
.rm-pager--disabled { opacity: 0.55; pointer-events: none; }

.rm-pager__total {
  font-size: var(--rm-font-sm);
  color: var(--rm-text-secondary);
  padding: 0 12px 0 8px;
  white-space: nowrap;
  font-weight: 500;
}

/* Sizes dropdown */
.rm-pager__sizes { position: relative; margin: 0 4px; }
.rm-pager__size-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--rm-radius);
  background: transparent;
  color: var(--rm-text-regular);
  font-size: var(--rm-font-sm);
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--rm-transition),
    color var(--rm-transition),
    border-color var(--rm-transition);
  font-family: inherit;
}
.rm-pager__size-btn:hover {
  background: var(--rm-bg);
  color: var(--rm-primary);
}
.rm-pager__size-btn svg {
  width: 12px;
  height: 12px;
  color: var(--rm-text-secondary);
  transition: transform var(--rm-transition);
}
.rm-pager__size-btn:hover svg {
  color: var(--rm-primary);
}

.rm-pager__size-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  /* ⚠ 必须高过表格内部所有层级。
     这个菜单是**向上弹**的（bottom: calc(100% + 6px)），纵向必然落进表格的高度范围；
     而表格会造出比普通内容高的层：
       · ReTable 给固定列浮层写 z-index:30
         （element 的 .el-table__fixed-right / vxe 的 .vxe-table--fixed-right-wrapper）
       · 空态块是 position:sticky（sticky 会自建层叠上下文）
     原来这里是 20，低于 30 → 菜单被表格内容/固定列浮层压在下面，
     看着像"分页跑到表格后面、点了没反应"，而且随窗口宽度左右移动、不是必现。
     ReTable 侧已把页脚抬到 31 兜底；这里再把菜单自身抬到 40，
     使它**不依赖外层页脚的层叠**也一定在表格之上（两层保障，任一漏掉都不至于复现）。
     40 仍远低于 el-popover/el-select 那类 teleport 浮层（约 2000+），不会越权盖住它们。 */
  z-index: 40;
  min-width: 100%;
  padding: 4px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  background: var(--rm-bg);
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.06);
}
.rm-pager__size-option {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--rm-radius-xs);
  background: transparent;
  color: var(--rm-text);
  font-size: var(--rm-font-sm);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background var(--rm-transition), color var(--rm-transition);
  white-space: nowrap;
  font-family: inherit;
}
.rm-pager__size-option:hover { background: var(--rm-bg-hover); }
.rm-pager__size-option--active {
  color: var(--rm-primary);
  background: var(--rm-primary-light-9);
}

/* Page buttons */
.rm-pager__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--rm-radius);
  background: transparent;
  color: var(--rm-text-regular);
  font-size: var(--rm-font-md);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background var(--rm-transition),
    color var(--rm-transition),
    border-color var(--rm-transition),
    box-shadow var(--rm-transition);
  font-family: inherit;
}
.rm-pager--small .rm-pager__btn {
  min-width: 28px;
  height: 28px;
  font-size: var(--rm-font-sm);
}
.rm-pager--mini .rm-pager__btn {
  min-width: 24px;
  height: 24px;
  font-size: 12px;
  padding: 0 5px;
}
.rm-pager--mini .rm-pager__size-btn {
  height: 24px;
  font-size: 12px;
  padding: 0 8px;
}
.rm-pager--mini .rm-pager__total {
  font-size: 12px;
  padding: 0 8px 0 6px;
}
.rm-pager--mini .rm-pager__size-option {
  font-size: 12px;
  padding: 5px 8px;
}

.rm-pager__btn--nav svg {
  width: 16px;
  height: 16px;
  transition: transform var(--rm-transition);
}
.rm-pager__btn--nav:hover:not(:disabled) svg {
  transform: translateX(-1px);
}
.rm-pager__btn--nav:last-of-type:hover:not(:disabled) svg {
  transform: translateX(1px);
}

.rm-pager__btn:hover:not(:disabled):not(.rm-pager__btn--active):not(.rm-pager__btn--ellipsis) {
  background: var(--rm-bg);
  color: var(--rm-primary);
}

.rm-pager__btn--active {
  background: var(--rm-primary);
  color: var(--rm-text-white);
  border-color: transparent;
  box-shadow: none;
}
.rm-pager__btn:disabled {
  color: var(--rm-text-disabled);
  cursor: not-allowed;
}
.rm-pager__btn--ellipsis {
  cursor: default;
  letter-spacing: 1px;
  color: var(--rm-text-disabled);
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .rm-pager__btn,
  .rm-pager__size-btn,
  .rm-pager__size-btn svg,
  .rm-pager__btn--nav svg,
  .rm-pager__size-option {
    transition: none;
  }
}
</style>