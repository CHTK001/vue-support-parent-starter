<template>
  <aside class="sc-tabs-rail-layout">
    <ScTabs
      v-model="currentValue"
      class="sc-tabs-rail-layout__tabs"
      :class="[
        { 'is-round': round },
        `close-mode-${closeButtonMode}`,
      ]"
      :tab-position="tabPosition"
      @tab-remove="handleTabRemove"
    >
      <ScTabPane
        v-for="item in items"
        :key="String(item.name)"
        :name="item.name"
      >
        <template #label>
          <span class="sc-tabs-rail-layout__label" :title="item.title || item.label">
            <ElIcon v-if="item.icon">
              <component :is="item.icon" />
            </ElIcon>
            <span v-else>{{ item.label }}</span>
            <span
              v-if="item.closable"
              class="sc-tabs-rail-layout__close"
              @click.stop="handleTabRemove(item.name)"
            >
              ×
            </span>
          </span>
        </template>
      </ScTabPane>
    </ScTabs>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElIcon } from "element-plus";
import { ScTabs, ScTabPane } from "@repo/components/ScTabs";

export interface ScTabsRailItem {
  closable?: boolean;
  icon?: any;
  label?: string;
  name: string | number;
  title?: string;
}

const props = withDefaults(defineProps<{
  closeButtonMode?: "always" | "hover";
  items: ScTabsRailItem[];
  modelValue: string | number;
  round?: boolean;
  tabPosition?: "top" | "right" | "bottom" | "left";
}>(), {
  closeButtonMode: "hover",
  round: false,
  tabPosition: "left",
});

const emit = defineEmits<{
  (e: "tab-remove", value: string): void;
  (e: "update:modelValue", value: string): void;
}>();

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", String(value));
  },
});

const handleTabRemove = (value: string | number) => {
  emit("tab-remove", String(value));
};
</script>

<style scoped lang="scss">
.sc-tabs-rail-layout {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.sc-tabs-rail-layout__tabs {
  height: 100%;
}

.sc-tabs-rail-layout__tabs :deep(.el-tabs) {
  height: 100%;
}

.sc-tabs-rail-layout__tabs :deep(.el-tabs__header) {
  margin: 0;
  height: 100%;
}

.sc-tabs-rail-layout__tabs :deep(.el-tabs__nav-wrap),
.sc-tabs-rail-layout__tabs :deep(.el-tabs__nav-scroll),
.sc-tabs-rail-layout__tabs :deep(.el-tabs__nav),
.sc-tabs-rail-layout__tabs :deep(.el-tabs__content) {
  height: 100%;
}

.sc-tabs-rail-layout__tabs :deep(.el-tabs__content),
.sc-tabs-rail-layout__tabs :deep(.el-tabs__nav-wrap::after),
.sc-tabs-rail-layout__tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.sc-tabs-rail-layout__tabs :deep(.el-tabs__item) {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 12px;
  color: #5f7686;
}

.sc-tabs-rail-layout__tabs.is-round :deep(.el-tabs__item) {
  border-radius: 999px;
}

.sc-tabs-rail-layout__tabs :deep(.el-tabs__item.is-active) {
  background: rgba(37, 99, 235, 0.14);
  color: #1252aa;
}

.sc-tabs-rail-layout__label {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
}

.sc-tabs-rail-layout__close {
  position: absolute;
  top: -3px;
  right: -3px;
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #fef2f2;
  color: #b42318;
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.sc-tabs-rail-layout__tabs.close-mode-hover .sc-tabs-rail-layout__close {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.92);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.sc-tabs-rail-layout__tabs.close-mode-hover
  :deep(.el-tabs__item:hover)
  .sc-tabs-rail-layout__close,
.sc-tabs-rail-layout__tabs.close-mode-hover
  :deep(.el-tabs__item.is-active)
  .sc-tabs-rail-layout__close {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.sc-tabs-rail-layout__close:hover {
  background: #fee2e2;
}
</style>
