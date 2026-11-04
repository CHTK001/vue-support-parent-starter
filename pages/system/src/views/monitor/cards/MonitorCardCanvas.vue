<template>
  <div class="mc-canvas" :class="{ 'is-editing': editable }">
    <!--
      空布局不渲染网格：grid-layout-plus 会给容器写死内联高度
      bottom * (rowHeight + margin) + margin，空布局 bottom=0 时算出 12px，
      表现为页面里多出一条莫名其妙的空带（首页踩过同一个坑）。
    -->
    <GridLayout
      v-if="cards.length"
      v-model:layout="layout"
      :is-draggable="editable"
      :is-resizable="editable"
      :cols="GRID_COLS"
      :row-height="MONITOR_ROW_HEIGHT"
      :margin="[MONITOR_GRID_MARGIN, MONITOR_GRID_MARGIN]"
      :use-css-transforms="true"
      :vertical-compact="true"
      :prevent-collision="false"
      class="mc-canvas__grid"
      @layout-updated="onLayoutUpdated"
    >
      <GridItem
        v-for="item in visibleLayout"
        :key="item.i"
        :i="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :min-w="MONITOR_MIN_W"
        :min-h="MONITOR_MIN_H"
        class="mc-canvas__item"
      >
        <div class="mc-canvas__shell">
          <!--
            页面区块（page: 前缀）走 #block 插槽：正文由页面渲染，要复用页面里现成的实时数据。
            其余卡片仍走 #default → MonitorCardHost → 注册表组件加载。
          -->
          <slot
            v-if="isPageBlockType(cardById.get(item.i)!.type)"
            name="block"
            :card="cardById.get(item.i)!"
            :editable="editable"
          />
          <slot v-else :card="cardById.get(item.i)!" :editable="editable" />

          <!-- 编辑态浮层：与首页自定义布局一致的「删除 / 设置」 -->
          <div v-if="editable" class="mc-canvas__overlay">
            <button
              type="button"
              class="mc-canvas__remove"
              title="移除卡片"
              aria-label="移除卡片"
              @click.stop="emit('remove', item.i)"
            >
              <el-icon class="mc-canvas__remove-icon"><DeleteFilled /></el-icon>
            </button>
            <button
              v-if="!isPageBlockType(cardById.get(item.i)!.type)"
              type="button"
              class="mc-canvas__settings"
              title="卡片设置"
              aria-label="卡片设置"
              @click.stop="emit('settings', cardById.get(item.i)!)"
            >
              <el-icon class="mc-canvas__settings-icon"><Setting /></el-icon>
              <span>设置</span>
            </button>
          </div>
        </div>
      </GridItem>
    </GridLayout>

    <div v-else class="mc-canvas__empty">
      <el-icon :size="20"><DataBoard /></el-icon>
      <p v-if="editable">从右侧「组件目录」点一张卡片开始 —— 拖拽摆位置，右下角拖动改大小。</p>
      <p v-else>还没有卡片。点上方「自定义布局」从组件目录里挑一张。</p>
    </div>
  </div>
</template>

<script setup lang="ts" name="MonitorCardCanvas">
/**
 * 卡片画布：12 列网格，浏览态只读、编辑态可拖拽 / 可缩放
 *
 * <p>与首页的 {@code HomeGridView} / {@code HomePreview} 是同一套做法
 * （grid-layout-plus + 容器滚动），区别只在行高策略：首页按容器高度反解行高以铺满整屏，
 * 这里是长页面中的一段，用固定行高 {@link MONITOR_ROW_HEIGHT}。</p>
 *
 * <p>卡片正文由两个插槽交给页面层渲染：</p>
 * <ul>
 *   <li>{@code #block} —— 页面原生区块（{@code page:} 前缀）：正文就是页面里原来那几段
 *       {@code <section>}，直接吃页面自己的实时数据；</li>
 *   <li>{@code #default} —— 其余卡片，由 {@code MonitorCardHost} 交给注册表加载组件。</li>
 * </ul>
 * <p>画布本身不认识任何具体卡片类型。</p>
 */
import { computed } from "vue";
import { GridLayout, GridItem } from "@repo/theme/koi/views/home/gridLayout";
import { DataBoard, DeleteFilled, Setting } from "@element-plus/icons-vue";
import { GRID_COLS } from "./gridCompat";
import {
  MONITOR_GRID_MARGIN,
  MONITOR_MIN_H,
  MONITOR_MIN_W,
  MONITOR_ROW_HEIGHT,
  isPageBlockType,
  type MonitorCardItem,
  type MonitorGridItem,
} from "./types";

const props = defineProps<{
  cards: MonitorCardItem[];
  grid: MonitorGridItem[];
  /** 编辑态：开启拖拽 / 缩放与「删除 / 设置」浮层 */
  editable?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:grid", v: MonitorGridItem[]): void;
  (e: "remove", id: string): void;
  (e: "settings", card: MonitorCardItem): void;
}>();

const layout = computed<MonitorGridItem[]>({
  get: () => props.grid,
  set: (v) => emit("update:grid", v as MonitorGridItem[]),
});

const cardById = computed(() => {
  const m = new Map<string, MonitorCardItem>();
  props.cards.forEach((c) => m.set(c.id, c));
  return m;
});

/**
 * 只渲染「网格里有坐标、卡片清单里也有条目」的格子。
 *
 * <p>孤儿格子（结构损坏，不知道该显示什么）不占位；而「有卡片、只是当前应用未注册该
 * type」的条目会保留，由 {@code MonitorCardHost} 渲染成占位卡片 —— 两者不是一回事。</p>
 */
const visibleLayout = computed<MonitorGridItem[]>(() =>
  props.grid.filter((g) => cardById.value.has(g.i)),
);

/**
 * 拖拽 / 缩放结束后把网格抛给看板落盘。
 *
 * <p>不能只靠 {@code v-model:layout}：grid-layout-plus 的拖拽 / 缩放是<b>就地改</b>
 * {@code layout} 数组里的元素，结束后只发 {@code layout-updated}，不发
 * {@code update:layout}（后者只在响应式断点切换时发）。只绑 v-model 的表现是
 * 「格子在屏幕上动了、坐标也变了，但没写存档」，刷新后回到旧位置。</p>
 *
 * <p>抛出前先比对坐标签名：{@code layout-updated} 在 layout 变化时也会发，
 * 而本函数又会改写 layout（经看板归一化后回灌），不设闸门就会
 * 「props 变 → 事件 → 再改 props」无限递归（实测报
 * {@code Maximum recursive updates exceeded}）。坐标没变就不抛。</p>
 */
let lastGridSignature = "";

function gridSignature(list: readonly MonitorGridItem[]): string {
  return list.map((g) => `${g.i}:${g.x},${g.y},${g.w},${g.h}`).join("|");
}

function onLayoutUpdated(next?: MonitorGridItem[]): void {
  // 浏览态不会产生有效改动（不能拖也不能缩放）：挂载时库也会发一次 layout-updated，
  // 若照单全收就会「刚打开还没动就写一次存档」，与「先读服务器」的时序打架。
  if (!props.editable) return;
  const source = next ?? props.grid;
  const copy = source.map((g) => ({ ...g }));
  const signature = gridSignature(copy);
  if (signature === lastGridSignature) return;
  lastGridSignature = signature;
  emit("update:grid", copy);
}
</script>

<style lang="scss" scoped>
.mc-canvas {
  width: 100%;
  min-width: 0;
}

.mc-canvas__grid {
  background: transparent;
}

.mc-canvas.is-editing .mc-canvas__grid {
  /* 编辑态给画布一层浅底，拖拽时能看清格子的活动范围 */
  padding: 4px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.mc-canvas__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mc-canvas__shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

/* 编辑态：鼠标按下即为拖拽把手（与首页一致，整卡可拖） */
.mc-canvas.is-editing .mc-canvas__shell {
  cursor: move;
}

.mc-canvas__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s, background 0.15s, backdrop-filter 0.15s;
}

.mc-canvas__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.78);
  color: #fff;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s, background 0.15s;
}

.mc-canvas__remove-icon {
  font-size: 26px;
}

.mc-canvas__remove:hover {
  transform: scale(1.06);
  background: rgba(220, 38, 38, 0.92);
}

.mc-canvas__settings {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: rgba(20, 20, 20, 0.62);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
  transition: background 0.15s, transform 0.15s;
}

.mc-canvas__settings-icon {
  font-size: 13px;
}

.mc-canvas__settings:hover {
  background: rgba(20, 20, 20, 0.8);
  transform: translateX(-50%) translateY(-2px);
}

.mc-canvas__shell:hover .mc-canvas__overlay {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

.mc-canvas__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;

  p {
    margin: 0;
    max-width: 460px;
    font-size: 12.5px;
    line-height: 1.7;
  }
}
</style>
