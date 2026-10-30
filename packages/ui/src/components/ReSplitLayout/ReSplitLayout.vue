<script setup lang="ts">
/**
 * ReSplitLayout —— 基于内联布局内核（reactive-layout，MIT）的可拖拽 / 可持久化分栏布局。
 *
 * <p>把 `useLayout` + `SplitLayout` 包装成项目内统一组件：</p>
 * <ul>
 *   <li>默认布局由 `defaultLayout` 决定；</li>
 *   <li>`initialLayout` 用于挂载后灌入服务端保存的布局（例如发布管理把布局存进
 *       `ms_server_config`，换浏览器 / 换设备也能恢复）；</li>
 *   <li>拖拽分隔条、拖动页签（拆分成新列）后通过 `change` 事件抛出最新布局树，
 *       由业务侧决定存哪里；</li>
 *   <li>面板内容用 `#panel="{ activeTab }"` 作用域插槽渲染，页签图标用
 *       `#tab-icon="{ tab }"`（可选）。</li>
 * </ul>
 *
 * <p>之所以不直接用 reactive-layout 的 `storageKey`：它只写 localStorage，
 * 满足不了「布局跟着项目走、换机器仍一致」的要求，所以持久化交给业务侧。</p>
 */
import { defineComponent, provide, useSlots, watch, type PropType } from 'vue';
import { SplitLayout, useLayout, type PanelTab, type SplitNode } from './vendor';

defineOptions({ name: 'ReSplitLayout', inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 首次进入且服务端没有已保存布局时使用的默认布局 */
    defaultLayout: SplitNode;
    /** 服务端已保存的布局；加载完成后灌入 */
    initialLayout?: SplitNode | null;
    /** 可选：同时写入 localStorage 的键（离线兜底），不传则只用业务侧持久化 */
    storageKey?: string;
  }>(),
  {
    initialLayout: null,
    storageKey: undefined,
  },
);

const emit = defineEmits<{
  /** 布局树变化（拖拽分隔条 / 移动页签 / 拆分面板） */
  (e: 'change', layout: SplitNode): void;
}>();

const slots = useSlots();

/**
 * 面板内容宿主：把 reactive-layout 注入的 `activeTab` 转交给父组件的作用域插槽。
 *
 * <p>reactive-layout 只接受「组件」作为面板渲染器，拿不到调用方的插槽；
 * 这里用一层极薄的宿主组件桥接，页面就不用把整块模板搬进单独组件。</p>
 */
const PanelHost = defineComponent({
  name: 'ReSplitLayoutPanelHost',
  props: {
    activeTab: { type: Object as PropType<PanelTab>, required: true },
  },
  setup(hostProps) {
    return () => {
      const slot = (slots as Record<string, unknown>).panel as
        | ((arg: { activeTab: PanelTab }) => unknown)
        | undefined;
      return slot ? slot({ activeTab: hostProps.activeTab }) : null;
    };
  },
});

const { layout, moveTab, removeTab, addTab, splitPanel, updateSizesForSplit, findPanelById } =
  useLayout({
    defaultLayout: props.initialLayout || props.defaultLayout,
    storageKey: props.storageKey,
  });

/** 灌入服务端布局期间不向外抛 change，避免把刚读到的布局又原样存一遍 */
let hydrating = false;

/**
 * 恢复到「出厂默认」布局。
 *
 * <p>不能用 useLayout 自带的 resetLayout：它内部记的是首次挂载时的布局
 * （可能是服务端已保存的那份），点「重置布局」会回到上次保存的样子，
 * 用户会以为按钮没生效。这里直接回到 props.defaultLayout。</p>
 */
function resetLayout() {
  layout.value = JSON.parse(JSON.stringify(props.defaultLayout)) as SplitNode;
}

provide('moveTab', moveTab);
provide('closeTab', (tabId: string) => removeTab(tabId));
provide('splitPanel', splitPanel);
provide('updateSizesForSplit', updateSizesForSplit);
provide('layoutPanelContent', PanelHost);

// 服务端布局是异步拿到的：到货后整体替换；只在结构合法时采纳，避免坏数据把页面打空
watch(
  () => props.initialLayout,
  (next) => {
    if (next && next.type === 'split' && Array.isArray(next.children) && next.children.length > 0) {
      hydrating = true;
      layout.value = next;
      Promise.resolve().then(() => { hydrating = false; });
    }
  },
);

watch(
  layout,
  (next) => {
    if (!hydrating && next && next.type === 'split') {
      emit('change', next);
    }
  },
  { deep: true },
);

defineExpose({
  /** 当前布局树（只读使用） */
  layout,
  /** 恢复到默认布局 */
  resetLayout,
  /** 在指定页签所在面板追加页签 */
  addTab,
  /** 移除页签 */
  removeTab,
  /** 按 id 查找面板 */
  findPanelById,
});
</script>

<template>
  <div class="re-split-layout">
    <SplitLayout :node="layout" />
  </div>
</template>

<style scoped>
.re-split-layout {
  /* 把 reactive-layout 的深色默认变量对接到项目主题 */
  --bg: var(--bg-container, #1e1e1e);
  --bg3: var(--bg-fill, #252526);
  --border: var(--border-subtle, #333);
  --fg: var(--text-primary, #fff);
  --fg2: var(--text-primary, #ccc);
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 10px);
  background: var(--bg-container);
}

.re-split-layout :deep(.panel-tab-bar) {
  height: 34px;
  background: var(--bg-fill);
  border-top: none;
  border-bottom: 1px solid var(--border-subtle);
}

.re-split-layout :deep(.panel-tab) {
  background: transparent;
  border-right: none;
  border-bottom: 1px solid transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 500;
  gap: 6px;
}

.re-split-layout :deep(.panel-tab.active) {
  background: var(--bg-container);
  color: var(--brand-600, var(--text-primary));
  border-top: none;
  border-bottom: 1px solid transparent;
  box-shadow: inset 0 2px 0 var(--brand-500, #3b82f6);
  font-weight: 600;
}

.re-split-layout :deep(.panel-content) {
  background: var(--bg-container);
}

.re-split-layout :deep(.resize-handle.vertical) {
  height: 5px;
}

.re-split-layout :deep(.resize-handle:hover),
.re-split-layout :deep(.resize-handle.active) {
  background: var(--brand-500, #007acc);
}
</style>
