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
    /** 是否拉伸填充 */
    stretch?: boolean;
    /**
     * 布局变体：
     *   - "default"：element-plus el-tabs 原生样式
     *   - "capsule"：胶囊式分段选项卡（浅灰白底盘 + 白底激活项 + 图标文字均分）
     */
    variant?: "default" | "capsule";
    /**
     * capsule 布局下仅渲染分段导航条（不渲染内容面板），
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
    navOnly: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", name: string): void;
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

/** capsule 布局：点击 tab 项 */
const handleCapsuleClick = (tab: ReTabItem) => {
  if (tab.disabled) return;
  activeName.value = tab.name;
  emit("tab-click", { name: tab.name } as Record<string, unknown>);
};
</script>

<template>
  <!-- capsule 胶囊式分段布局：浅灰白底盘 + 白底激活项 + 图标文字均分 -->
  <div v-if="variant === 'capsule'" class="re-tab re-tab--capsule" v-bind="$attrs">
    <div class="re-tab-capsule__nav">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="re-tab-capsule__item"
        :class="{ 'is-active': activeName === tab.name, 'is-disabled': tab.disabled }"
        @click="handleCapsuleClick(tab)"
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
    @tab-remove="(name: string) => emit('tab-remove', name)"
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
.re-tab--capsule {
  width: 100%;

  /* 胶囊配色变量：浅色默认值，html.dark 下覆写实现暗色适配 */
  --retab-nav-bg: #f3f5f7;
  --retab-item-color: #9aa1ab;
  --retab-item-hover: #5c6166;
  --retab-active-bg: #ffffff;
  --retab-active-color: #1f2329;
  --retab-active-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  --retab-icon-color: #b4bac3;
  --retab-icon-active: #3a4048;
}

/* 暗色模式：胶囊配色覆写 */
html.dark .re-tab--capsule {
  --retab-nav-bg: #1f2124;
  --retab-item-color: #8a919f;
  --retab-item-hover: #c0c4cc;
  --retab-active-bg: #2b2e33;
  --retab-active-color: #ffffff;
  --retab-active-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --retab-icon-color: #6b7280;
  --retab-icon-active: #d1d5db;
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
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 0;
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
  font-size: 15px;
  color: var(--retab-icon-color);

  .re-tab-capsule__item.is-active & {
    color: var(--retab-icon-active);
  }
}

.re-tab-capsule__label {
  font-size: 13px;
  line-height: 1;
}

.re-tab-capsule__panel {
  margin-top: 14px;
}
</style>
