<script setup lang="ts">
/**
 * ReTab —— 标签页组件
 *
 * 封装 el-tabs，增加 tab 项 icon 支持：
 *   <ReTab :tabs="[{ name: 'appearance', label: '外观', icon: 'Brush' }]">
 *     <template #appearance>...</template>
 *   </ReTab>
 */
import { computed } from "vue";
import { ElTabs, ElTabPane } from "element-plus";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";
import type { ReTabItem } from "./types";

defineOptions({ name: "ReTab", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** tab 项列表 */
    tabs?: ReTabItem[];
    /** 当前激活 name（v-model） */
    modelValue?: string;
    /** el-tabs 类型 */
    type?: "card" | "border-card" | "";
    /** 是否可关闭 */
    closable?: boolean;
    /**
     * 是否拉伸填充：内容面板吃满父容器的剩余高度。
     *
     * 四个变体均已实现：
     * - default：透传给 el-tabs 的 stretch
     * - capsule / koi / icon：根节点转纵向 flex，面板吃掉剩余高度（见样式块 stretch 段）
     *
     * 前置条件：父容器需为纵向 flex 或有确定高度，否则高度无从解析。
     */
    stretch?: boolean;
    /**
     * 布局变体：
     *   - "default"：element-plus el-tabs 原生样式
     *   - "capsule"：胶囊式分段选项卡（浅灰白底盘 + 白底激活项 + 图标文字均分）
     *   - "koi"：卡片页签（激活项浅主色块 + 白色大圆角内容卡片，支持 tabPosition 四个方向）
     *   - "icon"：图标磁贴页签（图标 + 文字，支持 tabPosition 四个方向，可收起）
     */
    variant?: "default" | "capsule" | "koi" | "icon";
    /** koi / icon 布局的页签方向（默认 top） */
    tabPosition?: "top" | "right" | "bottom" | "left";
    /** icon 布局：是否收起（收起后仅显示当前激活项） */
    collapsed?: boolean;
    /** icon 布局：是否显示内置收起按钮 */
    collapsible?: boolean;
    /**
     * capsule / koi 布局下仅渲染导航条（不渲染内容面板），
     * 用于纯选择型控件（如主题模式 light/dark/auto）。
     */
    navOnly?: boolean;
  }>(),
  {
    tabs: () => [],
    modelValue: "",
    type: "",
    closable: false,
    stretch: false,
    variant: "default",
    tabPosition: "top",
    collapsed: false,
    collapsible: false,
    navOnly: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", name: string): void;
  (e: "update:collapsed", v: boolean): void;
  (e: "tab-change", name: string): void;
  (e: "tab-click", pane: Record<string, unknown>): void;
  (e: "tab-remove", name: string): void;
}>();

/** el-tabs 使用的 modelValue */
const activeName = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit("update:modelValue", value);
    emit("tab-change", value);
  },
});

/** capsule / koi / icon 布局：点击页签项 */
const handleItemClick = (tab: ReTabItem) => {
  if (tab.disabled) return;
  activeName.value = tab.name;
  emit("tab-click", { name: tab.name } as Record<string, unknown>);
};

/** icon 布局：收起时仅保留当前激活项（非全部收起） */
const visibleTabs = computed<ReTabItem[]>(() =>
  props.variant === "icon" && props.collapsed
    ? props.tabs.filter((tab) => tab.name === props.modelValue)
    : props.tabs,
);

/** icon 布局：收起按钮图标（按方向指向展开侧） */
const toggleIcon = computed<string>(() => {
  if (props.tabPosition === "right") return props.collapsed ? "ArrowLeft" : "ArrowRight";
  if (props.tabPosition === "left") return props.collapsed ? "ArrowRight" : "ArrowLeft";
  return props.collapsed ? "ArrowDown" : "ArrowUp";
});

function toggleCollapsed(): void {
  emit("update:collapsed", !props.collapsed);
}
</script>

<template>
  <!-- capsule 胶囊式分段布局：浅灰白底盘 + 白底激活项 + 图标文字均分 -->
  <div
    v-if="variant === 'capsule'"
    class="re-tab re-tab--capsule"
    :class="{ 'is-stretch': stretch }"
    v-bind="$attrs"
  >
    <div class="re-tab-capsule__nav">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="re-tab-capsule__item"
        :class="{ 'is-active': activeName === tab.name, 'is-disabled': tab.disabled }"
        @click="handleItemClick(tab)"
      >
        <ReIcon v-if="tab.icon" :name="tab.icon" class="re-tab-capsule__icon" />
        <span v-if="tab.label" class="re-tab-capsule__label">{{ tab.label }}</span>
      </div>
    </div>
    <div class="re-tab-capsule__panel" v-if="!navOnly">
      <template v-for="tab in tabs" :key="tab.name">
        <slot v-if="activeName === tab.name" :name="tab.name"></slot>
      </template>
    </div>
  </div>

  <!-- koi 卡片页签：激活项浅主色块 + 白色大圆角内容卡片 -->
  <div
    v-else-if="variant === 'koi'"
    class="re-tab re-tab--koi"
    :class="[`re-tab--koi-${tabPosition}`, { 'is-stretch': stretch }]"
    v-bind="$attrs"
  >
    <div class="re-tab-koi__nav">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="re-tab-koi__item"
        :class="{ 'is-active': activeName === tab.name, 'is-disabled': tab.disabled }"
        @click="handleItemClick(tab)"
      >
        <ReIcon v-if="tab.icon" :name="tab.icon" class="re-tab-koi__icon" />
        <span v-if="tab.label" class="re-tab-koi__label">{{ tab.label }}</span>
      </div>
    </div>
    <div class="re-tab-koi__panel" v-if="!navOnly">
      <template v-for="tab in tabs" :key="tab.name">
        <slot v-if="activeName === tab.name" :name="tab.name"></slot>
      </template>
    </div>
  </div>

  <!-- icon 图标磁贴页签：图标 + 文字，可收起（收起仅显示激活项） -->
  <div
    v-else-if="variant === 'icon'"
    class="re-tab re-tab--icon"
    :class="[`re-tab--icon-${tabPosition}`, { 'is-collapsed': collapsed, 'is-stretch': stretch }]"
    v-bind="$attrs"
  >
    <div class="re-tab-icon__nav">
      <div
        v-for="tab in visibleTabs"
        :key="tab.name"
        class="re-tab-icon__item"
        :class="{ 'is-active': activeName === tab.name, 'is-disabled': tab.disabled }"
        :title="tab.label"
        @click="handleItemClick(tab)"
      >
        <span class="re-tab-icon__tile">
          <ReIcon v-if="tab.icon" :name="tab.icon" class="re-tab-icon__icon" />
        </span>
        <span v-if="!collapsed && tab.label" class="re-tab-icon__label">{{ tab.label }}</span>
      </div>
      <button
        v-if="collapsible"
        type="button"
        class="re-tab-icon__toggle"
        :title="collapsed ? '展开' : '收起'"
        @click="toggleCollapsed"
      >
        <ReIcon :name="toggleIcon" />
      </button>
    </div>
    <div class="re-tab-icon__panel" v-if="!navOnly">
      <template v-for="tab in tabs" :key="tab.name">
        <slot v-if="activeName === tab.name" :name="tab.name"></slot>
      </template>
    </div>
  </div>

  <!-- default 布局：element-plus el-tabs 原样 -->
  <ElTabs
    v-else
    v-bind="$attrs"
    v-model="activeName"
    :type="type"
    :closable="closable"
    :stretch="stretch"
    class="re-tab"
    @tab-click="(pane: Record<string, unknown>) => emit('tab-click', pane)"
    @tab-remove="(name: string | number) => emit('tab-remove', String(name))"
  >
    <ElTabPane
      v-for="tab in tabs"
      :key="tab.name"
      :name="tab.name"
      :label="tab.label"
      :closable="tab.closable"
      :disabled="tab.disabled"
    >
      <template #label>
        <span class="re-tab__label">
          <ReIcon v-if="tab.icon" :name="tab.icon" class="re-tab__icon" />
          <span v-if="tab.label">{{ tab.label }}</span>
        </span>
      </template>
      <slot :name="tab.name"></slot>
      <slot></slot>
    </ElTabPane>
  </ElTabs>
</template>

<style scoped>
.re-tab__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.re-tab__icon {
  font-size: 14px;
}

/* ===== capsule 胶囊式分段选项卡 ===== */
/* 全部走 koi / Element 变量，亮暗色自动适配 */
.re-tab--capsule {
  width: 100%;

  --retab-nav-bg: var(--el-fill-color-light);
  --retab-item-color: var(--el-text-color-secondary);
  --retab-item-hover: var(--el-text-color-regular);
  --retab-active-bg: var(--el-bg-color);
  --retab-active-color: var(--el-text-color-primary);
  --retab-active-shadow: var(--el-box-shadow-light);
  --retab-icon-color: var(--el-text-color-secondary);
  --retab-icon-active: var(--el-text-color-primary);
}

/* 外层底盘：浅灰白长条 + 大圆角 */
.re-tab-capsule__nav {
  display: flex;
  padding: 4px;
  background: var(--retab-nav-bg);
  border-radius: 999px;
}

/* 单个 tab 项：横向均分，图标 + 文字横排垂直居中 */
.re-tab-capsule__item {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  color: var(--retab-item-color);
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    color: var(--retab-item-hover);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &.is-active {
    background: var(--retab-active-bg);
    color: var(--retab-active-color);
    box-shadow: var(--retab-active-shadow);
  }
}

.re-tab-capsule__icon {
  flex: none;
  font-size: 15px;
  color: var(--retab-icon-color);

  .re-tab-capsule__item.is-active & {
    color: var(--retab-icon-active);
  }
}

.re-tab-capsule__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1;
}

.re-tab-capsule__panel {
  margin-top: 14px;
}

/* ===== stretch：内容面板吃满剩余高度 =====
   此前 stretch 只透传给默认 el-tabs（见下方 default 分支的 :stretch），
   capsule / koi / icon 三个变体拿到该属性却没有任何样式响应，属于空操作。
   这里补齐：根节点转纵向 flex 吃掉父级剩余高度，面板再吃掉根节点的剩余高度。

   前置条件（由调用方保证）：父容器是纵向 flex（或有确定高度），否则 min-height:100% 无从解析。
   面板与根节点都要 min-height:0，否则内容会把面板顶高而不是让内部滚动。 */
.re-tab--capsule.is-stretch,
.re-tab--koi.is-stretch,
.re-tab--icon.is-stretch {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
/* 面板既要自己吃掉根节点的剩余高度，也要转成纵向 flex 容器 ——
   否则插槽内容（消费方页面里的卡片/面板）只是普通块级子元素，
   其 flex:1 1 auto 不生效，内容仍按自身高度收尾。 */
.re-tab--capsule.is-stretch > .re-tab-capsule__panel,
.re-tab--koi.is-stretch > .re-tab-koi__panel,
.re-tab--icon.is-stretch > .re-tab-icon__panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
/* 左右磁贴：面板需与磁贴列等高。默认 align-items:flex-start 会让面板按内容收尾。 */
.re-tab--icon-left.is-stretch,
.re-tab--icon-right.is-stretch {
  align-items: stretch;
}

/* ===== koi 卡片页签：激活项浅主色块 + 白色大圆角内容卡片 ===== */
.re-tab--koi {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

/* 页签条（默认顶部） */
.re-tab-koi__nav {
  display: flex;
  align-items: flex-end;
  flex: none;
  gap: 8px;
  padding: 0 16px;
}

/* 页签项 */
.re-tab-koi__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  max-width: 100%;
  height: 44px;
  padding: 0 24px;
  box-sizing: border-box;
  border-radius: var(--el-radius-lg, 12px) var(--el-radius-lg, 12px) 0 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;
}

.re-tab-koi__item:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.re-tab-koi__item.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.re-tab-koi__item.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.re-tab-koi__icon {
  flex: none;
  font-size: 16px;
}

/* 文字过长时省略，避免把页签撑破 / 挤压相邻项 */
.re-tab-koi__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 内容卡片 */
.re-tab-koi__panel {
  flex: 1 1 auto;
  min-width: 0;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light);
}

/* 左 / 右：页签竖排，与内容卡片并排 */
.re-tab--koi-right,
.re-tab--koi-left {
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
}

.re-tab--koi-right {
  flex-direction: row-reverse;
}

.re-tab--koi-right .re-tab-koi__nav,
.re-tab--koi-left .re-tab-koi__nav {
  flex-direction: column;
  align-items: stretch;
  flex: none;
  /* 自适应内容宽度并留出上限，避免文字被 148px 硬夹挤压；长标题省略 */
  width: max-content;
  min-width: 120px;
  max-width: 240px;
  padding: 8px;
}

.re-tab--koi-right .re-tab-koi__item,
.re-tab--koi-left .re-tab-koi__item {
  justify-content: flex-start;
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border-radius: var(--el-radius-lg, 12px);
}

/* 底部：页签在下，圆角方向翻转 */
.re-tab--koi-bottom {
  flex-direction: column-reverse;
}

.re-tab--koi-bottom .re-tab-koi__item {
  border-radius: 0 0 var(--el-radius-lg, 12px) var(--el-radius-lg, 12px);
}

/* ===== icon 图标磁贴页签：图标 + 文字，支持方向与收起 ===== */
.re-tab--icon {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;

  /* 可调尺寸令牌（业务侧可覆写） */
  --retab-icon-tile: 42px;
  --retab-icon-pad: 4px;
  --retab-icon-gap: 6px;
}

/* 磁贴导航容器（白色圆角面板）：默认无内外间距 */
.re-tab-icon__nav {
  display: flex;
  align-items: center;
  flex: none;
  gap: 0;
  padding: var(--retab-icon-pad);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-lighter);
}

.re-tab-icon__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--retab-icon-gap);
  padding: var(--retab-icon-pad);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  user-select: none;
  transition: background-color var(--el-transition-duration, 0.2s) ease;
}

.re-tab-icon__item:hover {
  background: var(--el-fill-color-lighter);
}

.re-tab-icon__item.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 图标磁贴 */
.re-tab-icon__tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--retab-icon-tile);
  height: var(--retab-icon-tile);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;
}

.re-tab-icon__item:hover .re-tab-icon__tile {
  color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.re-tab-icon__item.is-active .re-tab-icon__tile {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.re-tab-icon__icon {
  font-size: 19px;
}

.re-tab-icon__label {
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.re-tab-icon__item.is-active .re-tab-icon__label {
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 内容区 */
.re-tab-icon__panel {
  flex: 1 1 auto;
  min-width: 0;
  margin-top: 12px;
}

/* 收起按钮 */
.re-tab-icon__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: auto;
  padding: 0;
  font-size: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color var(--el-transition-duration, 0.2s) ease,
    border-color var(--el-transition-duration, 0.2s) ease;
}

.re-tab-icon__toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

/* 左 / 右：磁贴竖排，与内容并排 */
.re-tab--icon-right,
.re-tab--icon-left {
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}

.re-tab--icon-right {
  flex-direction: row-reverse;
}

.re-tab--icon-right .re-tab-icon__nav,
.re-tab--icon-left .re-tab-icon__nav {
  flex-direction: column;
  align-items: stretch;
  width: calc(var(--retab-icon-tile) + var(--retab-icon-pad) * 4);
}

.re-tab--icon-right .re-tab-icon__item,
.re-tab--icon-left .re-tab-icon__item {
  padding: var(--retab-icon-pad) 0;
}

.re-tab--icon-right .re-tab-icon__toggle,
.re-tab--icon-left .re-tab-icon__toggle {
  align-self: center;
  margin: 4px 0 0;
}

.re-tab--icon-right .re-tab-icon__panel,
.re-tab--icon-left .re-tab-icon__panel {
  margin-top: 0;
}

/* 底部：磁贴在下 */
.re-tab--icon-bottom {
  flex-direction: column-reverse;
}

.re-tab--icon-bottom .re-tab-icon__panel {
  margin-top: 0;
  margin-bottom: 12px;
}
</style>
