<!--
  Home 主页面

  支持两种模式：
  - 浏览模式（默认）：渲染 HomeGridView
  - 编辑模式：渲染 CustomLayoutEditor（左侧预览 + 右侧组件目录）

  布局数据由 useHomeLayout 管理，缓存到 localStorage；layoutConfig.source=remote 时额外上报。
  组件目录按当前用户权限（user/admin/superadmin）过滤，角色字面量来自 app.yaml。
-->
<template>
  <div class="home-card">
    <div class="home-card__welcome">
      <div class="home-welcome">
        <img
          class="home-welcome__avatar"
          :src="
            authStore.loginUser?.avatar ||
            'https://avatars.githubusercontent.com/u/185870639?v=4&size=64'
          "
          alt="avatar"
        />
        <div class="home-welcome__content">
          <div class="home-welcome__greeting">{{ greetingText }}</div>
          <div class="home-welcome__subtitle">
            一款有「鲤」的后台框架——简约优雅，欢迎回来
            <span class="home-welcome__name">{{ authStore.loginUser?.loginName || "管理员" }}</span>
          </div>
        </div>

        <HomeLayoutToolbar
          v-if="customLayoutButton"
          :edit-mode="editMode"
          @enter-edit="editMode = true"
          @save="saveLayout"
        />
      </div>
    </div>

    <HomeGridView
      v-if="!editMode"
      :widgets="state.widgets"
      :grid="state.grid"
      @update:grid="onGridUpdate"
    >
      <template #default="{ widget }">
        <WidgetRenderer :widget="widget" />
      </template>
    </HomeGridView>

    <CustomLayoutEditor
      v-else
      :widgets="state.widgets"
      :grid="state.grid"
      :catalog="availableCatalog"
      @update:grid="onGridUpdate"
      @remove="removeWidget"
      @add="addWidget"
      @edit="openWidgetSettings"
      @update:widget="patchWidget"
    >
      <template #widget="{ widget }">
        <WidgetRenderer :widget="widget" />
      </template>
    </CustomLayoutEditor>

    <WidgetSettingsDialog
      v-if="editingWidget"
      v-model:visible="settingsVisible"
      :widget="editingWidget"
      @save="onWidgetSettingsSave"
    />

    <slot />
  </div>
</template>

<script setup lang="ts" name="homePage">
// @ts-nocheck

// @ts-nocheck
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getDayText } from "@repo/utils";
import { getConfig } from "@repo/config";
import { getUserPermission } from "@repo/core";
import useAuthStore from "@repo/pinia/modules/auth";
import HomeLayoutToolbar from "./HomeLayoutReToolbar.vue";
import HomeGridView from "./HomeGridView.vue";
import CustomLayoutEditor from "./CustomLayoutEditor.vue";
import WidgetRenderer from "./WidgetRenderer.vue";
import WidgetSettingsDialog from "./widgets/WidgetSettingsDialog.vue";
import { useHomeLayout } from "./useHomeLayout";
import { preloadWidgetComponents } from "./useWidgetLoader";
import { filterCatalogByPermission, findWidgetCatalogItem, WIDGET_CATALOG } from "./widgets";
import type { GridPosition, WidgetItem, WidgetType } from "./types";

const authStore = useAuthStore();

const greetingText = computed(() => {
  return getDayText() || "您好，愿您天天开心，事事如意！";
});

/** 是否显示自定义布局按钮（受 app.yaml other.home.customLayoutButton 控制，默认 true） */
const customLayoutButton = computed(() => {
  return getConfig().other.home?.customLayoutButton !== false;
});

// ==================== 自定义布局编辑 ====================

const { state, load, save } = useHomeLayout();
const editMode = ref(false);

/**
 * 当前用户权限等级（user / admin / superadmin）。
 * 角色名由 app.yaml permissionConfig.{superadmin,admin} 决定，
 * 通过 getUserPermission() 读取，home 自身不写死角色字面量。
 */
const currentPermission = computed(() => getUserPermission());

const filteredCatalog = computed(() =>
  filterCatalogByPermission(WIDGET_CATALOG, currentPermission.value),
);

const availableCatalog = computed(() =>
  filteredCatalog.value
    .map((item) => {
      const counted = state.widgets.filter((w) => w.type === item.type).length;
      return { ...item, counted };
    })
    .filter((item) => item.counted < item.maxCount),
);

function onGridUpdate(next: GridPosition[]): void {
  state.grid = next;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `w_${Date.now().toString(36)}_${idCounter}`;
}

/** 计算下一个可放置的位置（找现有网格的最大 y 之后） */
function computeNextPosition(defaultSize: { w: number; h: number }): { x: number; y: number; w: number; h: number } {
  if (!state.grid.length) {
    return { x: 0, y: 0, w: defaultSize.w, h: defaultSize.h };
  }
  let maxBottom = 0;
  state.grid.forEach((g) => {
    const bottom = g.y + g.h;
    if (bottom > maxBottom) maxBottom = bottom;
  });
  return { x: 0, y: maxBottom, w: defaultSize.w, h: defaultSize.h };
}

function addWidget(type: WidgetType): void {
  const catalog = findWidgetCatalogItem(type);
  const counted = state.widgets.filter((w) => w.type === type).length;
  if (counted >= catalog.maxCount) {
    ElMessage.warning(`「${catalog.title}」最多添加 ${catalog.maxCount} 个`);
    return;
  }
  const id = nextId();
  const widget = { id, type: catalog.type, title: catalog.title, appearance: { shadow: "soft" } };
  const pos = computeNextPosition(catalog.defaultSize);
  state.widgets.push(widget);
  state.grid.push({ i: id, ...pos });
}

function removeWidget(id: string): void {
  const widgetIdx = state.widgets.findIndex((w) => w.id === id);
  if (widgetIdx >= 0) state.widgets.splice(widgetIdx, 1);
  const gridIdx = state.grid.findIndex((g) => g.i === id);
  if (gridIdx >= 0) state.grid.splice(gridIdx, 1);
}

/** 合并 widget 字段（由 CustomLayoutEditor 的设置 dialog 触发） */
function patchWidget(id: string, patch: Partial<WidgetItem>): void {
  const idx = state.widgets.findIndex((w) => w.id === id);
  if (idx < 0) return;
  state.widgets[idx] = { ...state.widgets[idx], ...patch };
}

// ==================== 设置弹窗 ====================

/** 正在编辑的 widget（点击预览中的「设置」按钮时赋值） */
const editingWidget = ref<WidgetItem | null>(null);
const settingsVisible = ref(false);

function openWidgetSettings(id: string): void {
  const widget = state.widgets.find((w) => w.id === id);
  if (!widget) return;
  editingWidget.value = widget;
  settingsVisible.value = true;
}

function onWidgetSettingsSave(id: string, patch: Partial<WidgetItem>): void {
  patchWidget(id, patch);
}

function saveLayout(): void {
  save({
    widgets: state.widgets.map((w) => ({ ...w })),
    grid: state.grid.map((g) => ({ ...g })),
  });
  editMode.value = false;
  ElMessage.success("布局已保存");
}

onMounted(() => {
  load();
  preloadWidgetComponents(["calendar", "custom", "note", "client-info", "system-config", "alarm", "bookmark", "quick-access"]);
});
</script>

<style lang="scss" scoped>
.home-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 12px 16px 16px;
  border-radius: 8px;
  gap: 12px;
}

.home-card__welcome {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
}

.home-welcome {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
  min-height: 76px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.home-welcome__avatar {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 50%;
  user-select: none;
}

.home-welcome__content {
  flex: 1;
  min-width: 0;
}

.home-welcome__greeting {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.home-welcome__subtitle {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.home-welcome__name {
  margin-left: 4px;
  font-weight: 600;
  color: var(--el-color-primary);
}
</style>