<script setup lang="ts">
/**
 * 分区表格的可排序表头。
 *
 * <p>端口 / 磁盘等分区需要「点列头排序」，但每个分区都写一遍按钮结构和升降序箭头，
 * 样式与交互口径迟早会漂。这里把表头收敛成一个 14 行的原子组件：三态由父级持有
 * （未排序 / 升序 / 降序），本组件只负责渲染与向上抛「这一列被点了」。</p>
 *
 * <p>未排序列不显示箭头，hover 时才浮出一个淡箭头，避免每列都挂一个「▲」显得整表很吵。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
interface Props {
  /** 列名 */
  label: string;
  /** 当前排序列是否为这一列 */
  active?: boolean;
  /** 当前排序方向，仅在 active 时生效 */
  dir?: "asc" | "desc";
  /** 对齐方式：数字列常用 right */
  align?: "left" | "right" | "center";
  /** 是否可排序；操作列传 false，只渲染为静态文字 */
  sortable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  dir: "asc",
  align: "left",
  sortable: true,
});

const emit = defineEmits<{
  (e: "sort"): void;
}>();
</script>

<template>
  <button
    v-if="sortable"
    type="button"
    :class="['pf-sort', `is-${align}`, { on: active }]"
    :aria-sort="active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'"
    :title="`按${label}排序`"
    @click="emit('sort')"
  >
    <span class="pf-sort-label">{{ label }}</span>
    <span class="pf-sort-mark" aria-hidden="true">{{ active && dir === "desc" ? "▼" : "▲" }}</span>
  </button>
  <span v-else :class="['pf-sort', 'is-static', `is-${align}`]">{{ label }}</span>
</template>

<style scoped lang="scss">
.pf-sort {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder, #a8abb2);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.14s;
}
.pf-sort:hover,
.pf-sort.on {
  color: var(--el-text-color-regular, #4a5162);
}
.pf-sort.is-right {
  justify-content: flex-end;
  text-align: right;
}
.pf-sort.is-center {
  justify-content: center;
  text-align: center;
}
.pf-sort.is-static {
  cursor: default;
}
.pf-sort-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pf-sort-mark {
  flex: none;
  font-size: 8px;
  line-height: 1;
  opacity: 0;
  transform: translateY(-0.5px);
  transition: opacity 0.14s;
}
.pf-sort:hover .pf-sort-mark {
  opacity: 0.4;
}
.pf-sort.on .pf-sort-mark {
  opacity: 0.9;
  color: var(--el-color-primary, #5a4bd9);
}
</style>
