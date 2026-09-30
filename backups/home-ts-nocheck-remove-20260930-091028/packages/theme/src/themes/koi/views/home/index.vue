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
        <div class="home-welcome__avatar-box" :style="{ padding: frameSpill(56) + 'px' }">
          <img
            class="home-welcome__avatar"
            :src="authStore.loginUser?.avatar || defaultAvatarUrl"
            alt="avatar"
          />
          <div
            v-if="frameVisible"
            class="home-welcome__frame-layer"
            :style="frameLayer(56)"
          ></div>
          <span
            v-else
            class="koi-avatar-default-frame"
            :style="defaultFrame(56)"
          ></span>
        </div>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { debounce, getDayText } from "@repo/utils";
import { getConfig } from "@repo/config";
import { defaultAvatarUrl } from "@repo/assets";
import { getUserPermission } from "@repo/core";
import useAuthStore from "@repo/pinia/modules/auth";
import { useWornAvatarFrame } from "@repo/theme/koi/components/useWornAvatarFrame";
import HomeLayoutToolbar from "./HomeLayoutToolbar.vue";
import HomeGridView from "./HomeGridView.vue";
import CustomLayoutEditor from "./CustomLayoutEditor.vue";
import WidgetRenderer from "./WidgetRenderer.vue";
import WidgetSettingsDialog from "./widgets/WidgetSettingsDialog.vue";
import { useHomeLayout } from "./useHomeLayout";
import { preloadWidgetComponents } from "./useWidgetLoader";
import { filterCatalogByPermission, findWidgetCatalogItem, WIDGET_CATALOG } from "./widgets";
import type { GridPosition, WidgetItem, WidgetType } from "./types";

const authStore = useAuthStore();

// 欢迎区头像：佩戴头像框优先，未佩戴时展示默认光环（与顶栏 / 个人中心同一套实现）
const {
  visible: frameVisible,
  layerStyle: frameLayer,
  spillPx: frameSpill,
  defaultStyle: defaultFrame,
} = useWornAvatarFrame();

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

/** 上次已持久化的布局快照（用于跳过 save() 克隆数组后触发的重复 watch） */
let lastSavedSnapshot = "";

function layoutSnapshot(): string {
  return JSON.stringify({ widgets: state.widgets, grid: state.grid });
}

/**
 * 编辑模式下的自动保存（防抖 800ms）
 *
 * 进入编辑模式后，增删 / 拖拽 / 缩放 / 设置 widget 都会自动落盘，
 * 忘记点右上角「保存」也不会丢失。防抖合并高频变更（如拖拽过程）。
 *
 * 注意：useHomeLayout.save() 会用克隆数组替换 state.widgets/grid，
 * 导致 watch 再次触发；这里用内容快照比对，内容未变化时直接跳过，
 * 避免 save() ↔ watch 互相触发形成死循环。
 */
const autoSave = debounce(() => {
  if (!editMode.value) return;
  const snap = layoutSnapshot();
  if (snap === lastSavedSnapshot) return;
  lastSavedSnapshot = snap;
  save({
    widgets: state.widgets.map((w) => ({ ...w })),
    grid: state.grid.map((g) => ({ ...g })),
  });
}, 800);

watch(
  () => [state.widgets, state.grid],
  () => {
    if (!editMode.value) return;
    autoSave();
  },
  { deep: true },
);

/** 立即落盘待执行的自动保存（组件卸载 / 手动保存时调用） */
function flushAutoSave(): void {
  autoSave.cancel();
  if (!editMode.value) return;
  const snap = layoutSnapshot();
  if (snap === lastSavedSnapshot) return;
  lastSavedSnapshot = snap;
  save({
    widgets: state.widgets.map((w) => ({ ...w })),
    grid: state.grid.map((g) => ({ ...g })),
  });
}

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
  const target = state.widgets[idx];
  for (const key in patch) {
    if (key === "appearance" && patch.appearance) {
      target.appearance ??= {};
      Object.assign(target.appearance, patch.appearance);
    } else {
      (target as Record<string, unknown>)[key] = (patch as Record<string, unknown>)[key];
    }
  }
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
  // 取消待执行的自动保存：下面手动 save() 会持久化全部当前变更，无需重复落盘
  autoSave.cancel();
  save({
    widgets: state.widgets.map((w) => ({ ...w })),
    grid: state.grid.map((g) => ({ ...g })),
  });
  // 同步快照基准，避免 save() 克隆数组后 watch 重复触发时误判为有变更
  lastSavedSnapshot = layoutSnapshot();
  editMode.value = false;
  ElMessage.success("布局已保存");
}

onMounted(() => {
  load();
  preloadWidgetComponents(["calendar", "custom", "note", "client-info", "system-config", "alarm", "bookmark", "quick-access", "weather"]);
});

onBeforeUnmount(() => {
  // 组件卸载时先落盘待保存的变更，避免拖拽后立刻离开导致丢失
  flushAutoSave();
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
  padding: 0;
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

.home-welcome__avatar-box {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
}

.home-welcome__avatar {
  display: block;
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 50%;
  user-select: none;
}

.home-welcome__frame-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  pointer-events: none;
  transform: translate(-50%, -50%);
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