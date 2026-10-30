<!--
  ReKit 组件示例站 · 页面壳

  布局：左侧面板 + 右侧预览。
  左侧面板 Tab 切换：实时（组件列表 + 参数面板） / 实时代码（Source + 一键复制）
  右侧是选中示例的实时预览。
  参数面板展示该组件已定义的全部参数与示例值。
-->
<template>
  <div class="docs-page">
    <!-- 顶栏 -->
    <header class="docs-header">
      <h1 class="docs-header__title">ReKit 组件示例</h1>
      <p class="docs-header__desc">所有组件、所有参数，左侧面版驱动，右侧实时预览。</p>
    </header>

    <div class="docs-body">
      <!-- 左侧面板 -->
      <aside class="docs-aside">
        <div class="docs-aside__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="docs-aside__tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="docs-aside__panel">
          <!-- 实时 Tab：搜索 + 列表 + 示例 -->
          <div v-if="activeTab === 'live'" class="docs-aside__content">
            <ReInput v-model="filter" placeholder="搜索组件名称" clearable class="docs-search" />
            <div class="docs-list">
              <div
                v-for="comp in pageComponents"
                :key="comp.name"
                class="docs-item"
                :class="{ active: selected === comp.name }"
                @click="onPick(comp)"
              >
                <span class="docs-item__name">{{ comp.title }}</span>
                <span class="docs-item__tag">{{ comp.name }}</span>
              </div>
            </div>
            <!-- 参数面板 -->
            <ReCard class="docs-props" layout="simple" v-if="selectedComponent">
              <template #header>
                <ReSectionHead :title="selectedComponent.title" :description="`参数面板：所有示例参数`" />
              </template>
              <div class="docs-props__grid">
                <div v-for="(prop, k) in selectedComponent.props" :key="k" class="docs-prop">
                  <label class="docs-prop__label">{{ k }}</label>
                  <ReTag v-if="prop.type === 'boolean'" :type="selectedComponent.values[k] ? 'success' : 'info'">
                    {{ String(selectedComponent.values[k]) }}
                  </ReTag>
                  <ReInput
                    v-else-if="prop.type === 'string'"
                    v-model="selectedComponent.values[k]"
                    size="small"
                    clearable
                  />
                  <ReSelect
                    v-else-if="prop.type === 'array'"
                    v-model="selectedComponent.values[k]"
                    :options="prop.options"
                    size="small"
                  />
                  <ReInputNumber v-else v-model="selectedComponent.values[k]" size="small" controls="false" />
                </div>
              </div>
            </ReCard>
          </div>

          <!-- 实时代码 Tab：源码 + 复制 -->
          <div v-else class="docs-aside__content">
            <ReCard v-if="selectedComponent" layout="simple">
              <template #header>
                <ReSectionHead :title="selectedComponent.code" />
              </template>
              <div class="docs-code">
                <ReCode
                  :content="selectedComponent.code"
                  language="vue"
                  selectable
                />
                <div class="docs-code__bar">
                  <ReButton size="small" icon="Copy" type="primary" @click="onCopyCode">复制代码</ReButton>
                </div>
              </div>
            </ReCard>
          </div>
        </div>
      </aside>

      <!-- 右侧预览 -->
      <section class="docs-right">
        <div class="docs-preview">
          <div v-if="selectedComponent" class="docs-preview-inner">
            <component :is="selectedComponent.example" />
          </div>
          <div v-else class="docs-preview--empty">
            <ReEmpty state="data" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ReButton,
  ReInput,
  ReSelect,
  ReCard,
  ReCode,
  ReSectionHead,
  ReTag,
  ReInputNumber,
  ReEmpty,
} from "@repo/ui";
import { DOC_COMPONENTS } from "./registry";

const tabs = [
  { key: "live", label: "实时" },
  { key: "code", label: "实时代码" },
];

const filter = ref("");
const activeTab = ref("live");
const selected = ref("");

const pageComponents = computed(() =>
  DOC_COMPONENTS.filter((c) => c.title.includes(filter.value) || c.name.includes(filter.value))
);

const selectedComponent = computed(() => {
  const c = DOC_COMPONENTS.find((x) => x.name === selected.value);
  if (!c) return undefined;
  return { ...c, values: { ...c.props, default: "" } };
});

function onPick(comp: { name: string }) {
  selected.value = comp.name;
  activeTab.value = "code";
}

function onCopyCode() {
  navigator.clipboard.writeText((selectedComponent.value as any)?.code ?? "");
}
</script>

<style scoped>
.docs-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.docs-header {
  padding: 20px 28px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.docs-header__title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.docs-header__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.docs-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.docs-aside {
  width: 380px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.docs-aside__tabs {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.docs-aside__tab {
  flex: 1;
  padding: 10px 0;
  text-align: center;
  background: transparent;
  border: none;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color .15s;
}
.docs-aside__tab.active {
  color: var(--el-text-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
}

.docs-aside__panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.docs-aside__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.docs-search {
  padding: 0 4px 8px;
}

.docs-list {
  display: flex;
  flex-direction: column;
  row-gap: 4px;
}
.docs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
}
.docs-item:hover {
  background: var(--el-fill-color-light);
}
.docs-item.active {
  background: var(--el-color-primary-light-9);
}
.docs-item__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.docs-item__tag {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.docs-props {
  background: var(--el-bg-color-page);
  border-radius: 6px;
  margin-top: 8px;
}

.docs-props__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 0;
}
.docs-prop {
  font-size: 12px;
}
.docs-prop__label {
  display: block;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
  font-size: 11px;
}

.docs-code {
  position: relative;
  min-height: 300px;
}
.docs-code__bar {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

.docs-right {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--el-color-info-light-1);
}

.docs-preview {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  min-height: 200px;
  flex: 1;
  max-width: 800px;
}

.docs-preview--empty {
  align-items: center;
  justify-content: center;
}
</style>
