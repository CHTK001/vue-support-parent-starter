<template>
  <div class="mc-card" :class="{ 'is-editable': editable }">
    <div class="mc-card__head">
      <span class="mc-card__icon">
        <el-icon :size="15"><component :is="icon" /></el-icon>
      </span>
      <h4 class="mc-card__title" :title="card.title">{{ card.title }}</h4>
      <span v-if="badge" class="mc-card__badge">{{ badge }}</span>
      <!--
        浏览态的工具按钮：只保留「设置 / 移除」。
        上移 / 下移在这里<b>没有意义</b> —— 位置由网格坐标决定，上下移动请进编辑态直接拖；
        留着两个永远不生效的按钮比没有按钮更让人困惑。
      -->
      <div v-if="!editable" class="mc-card__tools">
        <button class="mc-tool" title="卡片设置" aria-label="卡片设置" @click="emit('settings', card)">
          <el-icon :size="13"><Setting /></el-icon>
        </button>
        <button class="mc-tool mc-tool--danger" title="移除卡片" aria-label="移除卡片" @click="emit('remove', card.id)">
          <el-icon :size="13"><Close /></el-icon>
        </button>
      </div>
    </div>

    <div class="mc-card__body">
      <component
        :is="loader.Component.value"
        v-if="loader.state.value === 'ready' && loader.Component.value"
        :card="card"
        :refresh-key="refreshKey"
        @patch-config="(p: Partial<MonitorCardItem>) => emit('patch', card.id, p)"
        @open-settings="emit('settings', card)"
      />

      <!-- 占位卡片：当前应用未注册该 type。刻意不给「重试」—— 未注册时重试必然失败 -->
      <div v-else-if="loader.state.value === 'unregistered'" class="mc-card__placeholder">
        <el-icon :size="20"><Box /></el-icon>
        <span class="mc-card__placeholder-title">{{ card.title }}</span>
        <span class="mc-card__placeholder-hint">{{ placeholderHint }}</span>
      </div>

      <div v-else-if="loader.state.value === 'loading'" class="mc-card__placeholder">
        <el-icon class="mc-card__spin" :size="18"><Loading /></el-icon>
        <span>{{ card.title }} 加载中…</span>
      </div>

      <div v-else class="mc-card__placeholder mc-card__placeholder--error" role="alert">
        <el-icon :size="18"><WarningFilled /></el-icon>
        <span>{{ card.title }} 加载失败</span>
        <button class="mc-mini-btn" @click="loader.reload()">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="MonitorCardHost">
/**
 * 单张卡片宿主
 *
 * <p>负责卡片外壳（标题栏、工具按钮）与组件加载调度；卡片正文由注册表里对应的组件渲染，
 * 正文自己管数据请求。</p>
 *
 * <p><b>尺寸不在这里算</b>：卡片占几列几行由外层网格（{@code MonitorCardCanvas}）的
 * {@code GridItem} 决定，宿主只需 {@code height: 100%} 填满格子。早期版本在这里写
 * {@code gridColumn: span N} 与固定像素高度 —— 那种做法无法自由摆放，也就谈不上所见即所得。</p>
 *
 * <p>卡片组件通过 {@code patch-config} 把自己改的配置传回页面层落盘 ——
 * 组件不能直接改 props（那是父级的数据）。命名沿用首页的
 * {@code patch-config} 而不是 {@code update}：{@code update} 语义太泛，
 * 将来某张卡片想用 {@code v-model} 就会撞车。</p>
 */
import { computed, markRaw } from "vue";
import { Box, Close, DataBoard, Loading, Setting, WarningFilled } from "@element-plus/icons-vue";
import type { MonitorCardItem } from "./types";
import { getMonitorCardRegistration } from "./registry";
import { useCardLoader } from "./useCardLoader";

const props = defineProps<{
  card: MonitorCardItem;
  /** 全局刷新信号：变化时卡片重新取数 */
  refreshKey: number;
  /** 编辑态：把外壳上的工具让给网格浮层（删除 / 设置），避免两套按钮打架 */
  editable?: boolean;
}>();

const emit = defineEmits<{
  (e: "remove", id: string): void;
  (e: "settings", card: MonitorCardItem): void;
  (e: "patch", id: string, partial: Partial<MonitorCardItem>): void;
}>();

const loader = useCardLoader(() => props.card.type);

/** 图标：注册项自带图标组件优先，其次按内置图标名映射，最后兜底 */
const ICON_MAP: Record<string, unknown> = { DataBoard };

const icon = computed(() => {
  const reg = getMonitorCardRegistration(props.card.type);
  return reg?.iconComponent ? markRaw(reg.iconComponent) : (ICON_MAP[reg?.icon ?? ""] ?? DataBoard);
});

/** 标题右侧的小徽标：模块贡献的卡片标出来源 */
const badge = computed(() => {
  const reg = getMonitorCardRegistration(props.card.type);
  if (!reg) return "未注册";
  return reg.source ? reg.source : "";
});

/** 占位卡片的说明文案（存档里带了 source 才能说清「由谁提供」） */
const placeholderHint = computed(() =>
  props.card.source
    ? `该卡片由「${props.card.source}」模块提供，当前应用未启用`
    : "该卡片在当前应用未启用",
);
</script>

<style lang="scss" scoped>
.mc-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  padding: 12px 14px 14px;
  box-sizing: border-box;
  overflow: hidden;
}

/**
 * 编辑态：整张卡片不接收指针事件。
 *
 * <p>否则鼠标落在图表 / 表格 / iframe 上时，事件被里面的元素吃掉，拖不动卡片 ——
 * 这正是首页自定义布局里对 iframe 做的同一件事（那里的做法是给 iframe 加遮罩）。
 * 浮层上的「删除 / 设置」是卡片的兄弟节点，不受影响。</p>
 */
.mc-card.is-editable {
  pointer-events: none;
}

.mc-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-width: 0;
  flex: none;
}

.mc-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: 7px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
}

.mc-card__title {
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-card__badge {
  flex: none;
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

/* 工具按钮：默认淡出，悬停/聚焦时出现；触屏与窄屏常驻（否则根本点不到） */
.mc-card__tools {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.mc-card:hover .mc-card__tools,
.mc-card:focus-within .mc-card__tools {
  opacity: 1;
}

@media (hover: none), (max-width: 768px) {
  .mc-card__tools {
    opacity: 1;
  }
}

.mc-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.mc-tool:hover:not(:disabled) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.mc-tool--danger:hover:not(:disabled) {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/**
 * 正文区填满卡片剩余高度。
 *
 * <p>不给固定像素高度：卡片多高由网格的行数决定，正文跟着伸缩 —— 拖大卡片，
 * 里面的图表/列表跟着变大，这才是「所见即所得」。{@code min-height: 0} 必须写，
 * 否则 flex 子项的最小内容高度会撑破格子。</p>
 */
.mc-card__body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;

  > * {
    flex: 1 1 auto;
    min-height: 0;
  }
}

.mc-card__placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  box-sizing: border-box;
}

.mc-card__placeholder-title {
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.mc-card__placeholder-hint {
  font-size: 11.5px;
  line-height: 1.6;
}

.mc-card__placeholder--error {
  color: var(--el-color-danger);
}

.mc-card__spin {
  color: var(--el-color-primary);
  animation: mc-host-spin 1.1s linear infinite;
}

.mc-mini-btn {
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

@keyframes mc-host-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
