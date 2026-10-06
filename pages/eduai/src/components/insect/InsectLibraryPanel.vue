<template>
  <aside class="ilp">
    <div class="ilp__head">
      <h2 class="ilp__title">昆虫名录</h2>
      <span class="ilp__count">{{ listed.length }}/{{ insects.length }}</span>
    </div>

    <!-- 筛选：目 -->
    <div class="ilp__filter">
      <button
        type="button"
        class="ilp__chip"
        :class="{ 'is-active': !orderFilter }"
        @click="orderFilter = ''"
      >
        全部
      </button>
      <button
        v-for="o in orderChips"
        :key="o.key"
        type="button"
        class="ilp__chip"
        :class="{ 'is-active': orderFilter === o.key }"
        @click="orderFilter = orderFilter === o.key ? '' : o.key"
      >
        {{ o.label }}
        <span class="ilp__chip-n">{{ o.count }}</span>
      </button>
    </div>

    <!-- 筛选：变态类型 -->
    <div class="ilp__filter ilp__filter--slim">
      <button
        v-for="m in META_OPTIONS"
        :key="m.value"
        type="button"
        class="ilp__chip ilp__chip--slim"
        :class="{ 'is-active': metaFilter === m.value }"
        @click="metaFilter = m.value"
      >
        {{ m.label }}
      </button>
    </div>

    <!-- 搜索 -->
    <div class="ilp__search">
      <input
        v-model="keyword"
        class="ilp__input"
        type="search"
        placeholder="搜中文名 / 学名 / 俗称"
      />
    </div>

    <ul class="ilp__list">
      <li v-for="it in listed" :key="it.insectCode">
        <button
          type="button"
          class="ilp__item"
          :class="{ 'is-active': it.insectCode === activeCode }"
          @click="emit('select', it.insectCode)"
        >
          <span class="ilp__dot" :style="{ background: it.insectAccent || 'var(--el-color-primary)' }" />
          <span class="ilp__body">
            <span class="ilp__name">{{ it.insectName }}</span>
            <span class="ilp__latin">{{ it.insectLatin }}</span>
          </span>
          <!-- 图标统一走 ReIcon：✎ 是 dingbat 字形，屏幕阅读器会念成「笔」之类的冗余文本 -->
          <span v-if="notedCodes.includes(it.insectCode)" class="ilp__note" title="已记笔记">
            <ReIcon name="EditPen" :size="12" aria-hidden="true" />
          </span>
        </button>
      </li>
    </ul>

    <p v-if="!listed.length" class="ilp__empty">没有符合条件的昆虫</p>
  </aside>
</template>

<script setup lang="ts">
/**
 * InsectLibraryPanel —— 左栏名录：按目 / 变态类型 / 关键词筛选物种
 *
 * 物种清单由父级一次性拉全（/v2/edu/insect/all），筛选全在前端本地做，
 * 切筛选不再打后端 —— 上游是同样的取舍（名录与展台解耦）。
 */
import { computed, ref } from "vue";
import { ORDER_LABELS } from "./orderLabels";
import type { InsectLibraryItem } from "../../api/types";

const META_OPTIONS = [
  { label: "全部", value: "" },
  { label: "完全变态", value: "complete" },
  { label: "不完全变态", value: "incomplete" },
] as const;

const props = defineProps<{
  /** 全量物种（轻量） */
  insects: InsectLibraryItem[];
  /** 当前选中的物种 slug */
  activeCode: string;
  /** 已写过笔记的物种 slug */
  notedCodes?: string[];
}>();

const emit = defineEmits<{ (e: "select", code: string): void }>();

const orderFilter = ref("");
const metaFilter = ref("");
const keyword = ref("");

/** 只展示物种数 >= 2 的目，独有目并入「全部」，避免筛选区过长 */
const orderChips = computed(() => {
  const count = new Map<string, number>();
  for (const it of props.insects) {
    count.set(it.insectOrder, (count.get(it.insectOrder) || 0) + 1);
  }
  return [...count.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([key, c]) => ({ key, label: ORDER_LABELS[key] ?? key, count: c }));
});

const notedCodes = computed(() => props.notedCodes ?? []);

const listed = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return props.insects.filter((it) => {
    if (orderFilter.value && it.insectOrder !== orderFilter.value) return false;
    if (metaFilter.value && it.insectMetamorphosis !== metaFilter.value) return false;
    if (kw) {
      const hay = `${it.insectName} ${it.insectLatin} ${it.insectEpithet ?? ""}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
});
</script>

<style scoped>
.ilp {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  background: var(--el-bg-color);
  /* 原 22px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px 14px;
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.ilp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.ilp__title {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.ilp__count {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.ilp__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ilp__chip {
  height: 28px;
  padding: 0 10px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.ilp__chip:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}
.ilp__chip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.ilp__chip.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}
.ilp__chip--slim {
  height: 26px;
  font-size: 11px;
}
.ilp__chip-n {
  margin-left: 3px;
  opacity: 0.7;
}

.ilp__input {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.ilp__input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.ilp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 120px;
  max-height: 52vh;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ilp__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 0;
  border-radius: var(--el-radius-lg, 12px);
  background: transparent;
  cursor: pointer;
  text-align: left;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    background var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.ilp__item:hover {
  background: var(--el-color-primary-light-9);
}
.ilp__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.ilp__item.is-active {
  background: var(--el-color-primary);
}
.ilp__dot {
  width: 8px;
  height: 8px;
  /* 分类色点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  flex-shrink: 0;
}
.ilp__body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ilp__name {
  font-size: 13px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ilp__latin {
  font-size: 11px;
  font-style: italic;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ilp__item.is-active .ilp__name,
.ilp__item.is-active .ilp__latin {
  color: var(--el-color-white);
}
.ilp__note {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-color-warning);
  /* 换成 ReIcon 后需要 flex 容器让图标居中 */
  display: inline-flex;
  align-items: center;
}
.ilp__item.is-active .ilp__note {
  color: var(--el-color-white);
}
.ilp__empty {
  margin: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .ilp__chip,
  .ilp__item,
  .ilp__input {
    transition: none;
  }
}

/*
 * 触摸设备：可点控件抬到 44px。
 * 名录 chip 桌面档只有 26~28px（筛选条要塞几十个标签，紧凑是有意的），
 * 但触屏上 26px 很难点准 —— WCAG 2.2 的 2.5.8（AA）底线 24px 虽已过，
 * 这里再补 2.5.5（AAA）的 44px 档。只在 pointer: coarse 生效，
 * 桌面端和管理后台的紧凑筛选条外观不变。
 */
@media (pointer: coarse) {
  .ilp__chip,
  .ilp__chip--slim {
    height: 44px;
    font-size: 13px;
    padding: 0 14px;
  }
  .ilp__input {
    height: 44px;
  }
}
</style>
