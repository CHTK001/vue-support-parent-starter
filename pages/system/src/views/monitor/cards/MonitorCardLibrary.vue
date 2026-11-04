<template>
  <aside class="mc-lib">
    <div class="mc-lib__header">
      <div class="mc-lib__heading">
        <div class="mc-lib__title">组件目录</div>
        <div class="mc-lib__hint">点击添加，添加后拖拽摆位置</div>
      </div>
      <button class="mc-lib__close" title="收起目录" aria-label="收起目录" @click="emit('close')">
        <el-icon :size="14"><Close /></el-icon>
      </button>
    </div>

    <div class="mc-lib__body">
      <section v-for="group in groups" :key="group.category" class="mc-lib__group">
        <header class="mc-lib__group-head">
          <h4>{{ group.label }}</h4>
          <span>{{ group.hint }}</span>
        </header>
        <ul class="mc-lib__list">
          <li
            v-for="item in group.items"
            :key="item.type"
            class="mc-lib__item"
            :class="{ 'is-full': isFull(item) }"
            :aria-disabled="isFull(item)"
            @click="onAdd(item)"
          >
            <span class="mc-lib__icon">
              <el-icon :size="16"><component :is="resolveIcon(item)" /></el-icon>
            </span>
            <span class="mc-lib__meta">
              <span class="mc-lib__name">
                {{ item.title }}
                <em v-if="item.counted" class="mc-lib__count">已加 {{ item.counted }}</em>
              </span>
              <span class="mc-lib__desc">{{ item.description }}</span>
            </span>
            <span class="mc-lib__action">{{ isFull(item) ? "已达上限" : "+" }}</span>
          </li>
        </ul>
      </section>

      <div v-if="!groups.length" class="mc-lib__empty">注册表还没有任何卡片</div>

      <p class="mc-lib__foot">
        卡片由<b>运行时注册表</b>提供，各业务模块可通过 <code>registerMonitorCards()</code> 自行追加；
        「自定义卡片」可自选数据源，做出一张你自己的卡片。
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts" name="MonitorCardLibrary">
/**
 * 组件目录（编辑模式右侧常驻面板）
 *
 * <p>与首页自定义布局右侧的「系统组件」面板对齐：不再是弹窗，而是和画布并排的一条
 * 常驻栏 —— 添加一张就能立刻在左边拖，所见即所得。</p>
 *
 * <p>目录来自响应式注册表 {@code monitorCardCatalog}，所以运行时贡献的卡片
 * （{@code registerMonitorCards()} 之后）也会自动出现在这里 —— 静态数组做不到这点，
 * 因为各 {@code pages/xx} 模块是在 app 的 {@code mount()} 阶段才注册的。</p>
 */
import { computed } from "vue";
import {
  AlarmClock,
  CircleCheck,
  Close,
  Coin,
  Collection,
  Connection,
  Cpu,
  DataAnalysis,
  DataBoard,
  Document,
  Link,
  Odometer,
  Setting,
  Tickets,
  TrendCharts,
} from "@element-plus/icons-vue";
import { message } from "@repo/core";
import {
  MONITOR_CARD_CATEGORY_HINT,
  MONITOR_CARD_CATEGORY_LABEL,
  MONITOR_CARD_CATEGORY_ORDER,
  type MonitorCardCatalogItem,
  type MonitorCardItem,
  type MonitorCardType,
} from "./types";
import { getMonitorCardRegistration, monitorCardCatalog } from "./registry";

const props = defineProps<{
  /** 已放置的卡片（用于计算「已加 N 张」与上限） */
  cards: MonitorCardItem[];
}>();

const emit = defineEmits<{
  (e: "add", type: MonitorCardType): void;
  (e: "close"): void;
}>();

/** 内置图标名 → 组件（只覆盖内置卡片用到的名字） */
const ICON_MAP: Record<string, unknown> = {
  AlarmClock,
  CircleCheck,
  Coin,
  Collection,
  Connection,
  Cpu,
  DataAnalysis,
  DataBoard,
  Document,
  Link,
  Odometer,
  Setting,
  Tickets,
  TrendCharts,
};

/** 取目录项图标：注册项自带组件优先 */
function resolveIcon(item: MonitorCardCatalogItem): unknown {
  return getMonitorCardRegistration(item.type)?.iconComponent ?? ICON_MAP[item.icon] ?? DataBoard;
}

/** 各类型已添加数量 */
const counts = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  for (const c of props.cards) map[c.type] = (map[c.type] ?? 0) + 1;
  return map;
});

/** 是否已达该类别的上限（maxCount ≤ 0 视为不限） */
function isFull(item: MonitorCardCatalogItem): boolean {
  return item.maxCount > 0 && (counts.value[item.type] ?? 0) >= item.maxCount;
}

/**
 * 按分类分组。
 *
 * <p>顺序取自 {@link MONITOR_CARD_CATEGORY_ORDER}；模块贡献了本页还不认识的分类时，
 * 按字母序排在末尾并以分类原始标识兜底显示 —— 目录是「已注册卡片的地图」，
 * 不能因为宿主没更新枚举就把新模块的卡片整组吞掉。</p>
 */
const groups = computed(() => {
  const known = new Set<string>(MONITOR_CARD_CATEGORY_ORDER);
  const extra = [...new Set(monitorCardCatalog.value.map((i) => i.category))]
    .filter((c) => !known.has(c))
    .sort();
  return [...MONITOR_CARD_CATEGORY_ORDER, ...extra].map((category) => ({
    category,
    label: MONITOR_CARD_CATEGORY_LABEL[category as keyof typeof MONITOR_CARD_CATEGORY_LABEL] ?? category,
    hint: MONITOR_CARD_CATEGORY_HINT[category as keyof typeof MONITOR_CARD_CATEGORY_HINT] ?? "",
    items: monitorCardCatalog.value
      .filter((i) => i.category === category)
      .map((i) => ({ ...i, counted: counts.value[i.type] ?? 0 })),
  })).filter((g) => g.items.length > 0);
});

function onAdd(item: MonitorCardCatalogItem): void {
  if (isFull(item)) {
    message.warning(`「${item.title}」最多添加 ${item.maxCount} 个`);
    return;
  }
  emit("add", item.type);
}
</script>

<style lang="scss" scoped>
.mc-lib {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  overflow: hidden;
}

.mc-lib__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.mc-lib__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mc-lib__hint {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.mc-lib__close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.mc-lib__close:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.mc-lib__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  overflow: auto;
}

.mc-lib__group-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;

  h4 {
    margin: 0;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 11px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

.mc-lib__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mc-lib__item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.mc-lib__item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.mc-lib__item.is-full {
  cursor: not-allowed;
  opacity: 0.55;
}

.mc-lib__item.is-full:hover {
  border-color: var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.mc-lib__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 8px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
}

.mc-lib__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.mc-lib__name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mc-lib__count {
  font-style: normal;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.mc-lib__desc {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mc-lib__action {
  flex: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.mc-lib__item.is-full .mc-lib__action {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.mc-lib__foot {
  margin: 0;
  padding: 8px 10px;
  border-radius: 9px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.7;

  code {
    font-family: var(--el-font-family-mono, ui-monospace, Menlo, monospace);
    font-size: 10.5px;
    color: var(--el-color-primary);
  }
}

.mc-lib__empty {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
