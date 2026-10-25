<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="isModern"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    :page-sizes="pageSizes"
    :disabled="disabled"
    :small="modernSize === 'small'"
    :size="modernSize"
    v-bind="$attrs"
    @update:current-page="emit('update:currentPage', $event)"
    @update:page-size="emit('update:pageSize', $event)"
    @current-change="emit('current-change', $event)"
    @size-change="emit('size-change', $event)"
    @prev-click="emit('prev-click', $event)"
    @next-click="emit('next-click', $event)"
  />

  <!-- 默认 el-pagination 布局 -->
  <el-pagination
    v-else
    v-bind="$attrs"
    :current-page="currentPage"
    :page-size="pageSize"
    :total="total"
    :page-sizes="pageSizes"
    :disabled="disabled"
    :background="background"
    :layout="resolvedPaginationLayout"
    :small="elSmall"
    class="re-pagination"
    :class="[`re-pagination--${effectiveSize}`]"
    @update:current-page="emit('update:currentPage', $event)"
    @update:page-size="emit('update:pageSize', $event)"
    @current-change="emit('current-change', $event)"
    @size-change="emit('size-change', $event)"
    @prev-click="emit('prev-click', $event)"
    @next-click="emit('next-click', $event)"
  />
</template>

<script setup lang="ts">
/**
 * RePagination —— 分页组件
 *
 * 透传 el-pagination 全部能力，增加：
 *   - layout：布局变体，"el"（默认，el-pagination）/ "modern"（现代化扁平分页，异步加载）
 *   - paginationLayout：el-pagination 内部布局字符串（如 "total, sizes, prev, pager, next"）
 *
 * 兼容说明：历史调用方把 el-pagination 的布局串直接传给了 `layout`（如
 * `<RePagination layout="prev, pager, next" />`）。为避免这类调用静默失效，
 * `layout` 取到非变体值时按"布局串"处理（见 resolvedPaginationLayout）。
 */
import { computed, defineAsyncComponent } from "vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "RePagination" });

const props = withDefaults(
  defineProps<{
    /**
     * 布局变体："el"（默认 el-pagination）/ "modern"（现代化扁平分页）。
     * 兼容历史用法：也可直接传 el-pagination 的布局串（如 "prev, pager, next"），
     * 此时按布局串处理，等价于 paginationLayout。
     */
    layout?: "el" | "modern" | (string & {});
    total: number;
    currentPage?: number;
    pageSize?: number;
    pageSizes?: number[];
    disabled?: boolean;
    background?: boolean;
    /** el-pagination 内部布局字符串（layout 传布局串时以 layout 为准） */
    paginationLayout?: string;
    small?: boolean;
    /**
     * 控件尺寸档位：default / small / mini（比 small 更紧凑）。与 small 并存时
     * small=true 等价于 size="small"；size="mini" 时 el 布局走 small 档 + CSS 再压薄，
     * modern 布局有原生 mini 档。
     */
    size?: "large" | "default" | "small" | "mini";
  }>(),
  {
    layout: "el",
    currentPage: undefined,
    pageSize: undefined,
    pageSizes: undefined,
    disabled: false,
    background: false,
    paginationLayout: "total, sizes, prev, pager, next, jumper",
    small: false,
    size: "default",
  },
);

/** 是否为 Modern 变体 */
const isModern = computed<boolean>(() => props.layout === "modern");

/**
 * 生效尺寸档位：size 与 small 取其一（small=true 视为 size="small"）。
 * mini 仅 modern 布局原生支持；el 布局降格为 small + CSS 压薄（见非 scoped 样式）。
 */
const effectiveSize = computed<"large" | "default" | "small" | "mini">(() => {
  if (props.size === "mini" || props.size === "small" || props.size === "large") {
    return props.size;
  }
  return props.small ? "small" : "default";
});

/** el 布局能吃下的档位（el-pagination 只有 small/默认两档） */
const elSmall = computed<boolean>(() => effectiveSize.value === "small" || effectiveSize.value === "mini");

/** modern 布局尺寸透传（含 mini 原生档） */
const modernSize = computed<"default" | "small" | "mini">(() =>
  effectiveSize.value === "mini" ? "mini" : effectiveSize.value === "small" ? "small" : "default",
);

/**
 * el-pagination 实际布局串。
 *
 * `layout` 是变体名时用 paginationLayout；否则说明调用方把布局串传给了 `layout`
 * （历史用法），此时以 `layout` 为准 —— 否则该入参会静默失效。
 */
const resolvedPaginationLayout = computed<string>(() => {
  const value = props.layout;
  if (value === "el" || value === "modern") {
    return props.paginationLayout;
  }
  return value;
});

const emit = defineEmits<{
  "update:currentPage": [val: number];
  "update:pageSize": [val: number];
  "current-change": [val: number];
  "size-change": [val: number];
  "prev-click": [val: number];
  "next-click": [val: number];
}>();
</script>

<style>
/* el-pagination 布局：圆角风格向 modern 布局（rm-pager）看齐 ——
   Element Plus 默认分页按钮是直角方块，ReTable 的分页（modern）是圆角按钮；
   这里给 el 布局的页码/翻页/尺寸选择统一上圆角，外观不再割裂。 */
.re-pagination .btn-prev,
.re-pagination .btn-next,
.re-pagination .el-pager li {
  border-radius: var(--re-pager-radius, 8px);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.re-pagination .el-pager li.is-active {
  border-radius: var(--re-pager-radius, 8px);
}
.re-pagination .el-pagination__sizes .el-select__wrapper {
  border-radius: var(--re-pager-radius, 8px);
}
.re-pagination .el-pagination__jump .el-input__wrapper {
  border-radius: var(--re-pager-radius, 8px);
}
/* mini 档：比 small 再压薄（small 由 el-pagination 自带，mini 靠这里） */
.re-pagination--mini .btn-prev,
.re-pagination--mini .btn-next,
.re-pagination--mini .el-pager li {
  min-width: 24px;
  height: 24px;
  font-size: 12px;
}
</style>
