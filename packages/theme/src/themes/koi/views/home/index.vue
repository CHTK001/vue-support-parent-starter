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
      @edit="openWidgetConfig"
    >
      <template #widget="{ widget }">
        <WidgetRenderer :widget="widget" />
      </template>
    </CustomLayoutEditor>

    <slot />

    <!-- 组件设置弹窗 -->
    <ReDialog
      v-model="configVisible"
      :width="560"
      :title="configForm.type === 'note' ? '便签设置' : '组件设置'"
      confirm-text="保存设置"
      cancel-text="取消"
      destroy-on-close
      @confirm="saveWidgetConfig"
      @cancel="configVisible = false"
    >
      <template #content>
        <div v-if="configWidget" class="widget-config">
          <!-- 通用：外观 -->
          <div class="widget-config__section">
            <div class="widget-config__section-title">
              <el-icon class="widget-config__section-icon"><Brush /></el-icon>
              <span>外观</span>
            </div>
            <el-form :model="configForm" label-position="top" size="default" class="widget-config__form">
              <el-form-item label="阴影强度">
                <el-radio-group v-model="configForm.shadow" class="widget-config__shadows">
                  <el-radio-button
                    v-for="opt in WIDGET_SHADOW_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >{{ opt.label }}</el-radio-button>
                </el-radio-group>
                <div class="widget-config__shadow-preview">
                  <span
                    class="widget-config__shadow-box"
                    :style="{ boxShadow: shadowCss }"
                  />
                  <span class="widget-config__switch-tip">预览：{{ shadowLabel }}</span>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <!-- 便签：外观主题 -->
          <div v-if="configForm.type === 'note'" class="widget-config__section">
            <div class="widget-config__section-title">
              <el-icon class="widget-config__section-icon"><SemiSelect /></el-icon>
              <span>便签主题</span>
            </div>
            <div class="widget-config__themes">
              <button
                v-for="opt in NOTE_THEME_OPTIONS"
                :key="opt.value"
                type="button"
                class="widget-config__theme"
                :class="{ 'is-active': configForm.theme === opt.value }"
                @click="configForm.theme = opt.value"
              >
                <span class="widget-config__theme-swatch" :style="{ background: opt.color }" />
                <span class="widget-config__theme-label">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 自定义页面：URL 配置 -->
          <div v-if="configForm.type === 'custom'" class="widget-config__section">
            <div class="widget-config__section-title">
              <el-icon class="widget-config__section-icon"><Connection /></el-icon>
              <span>页面配置</span>
            </div>
            <el-form :model="configForm" label-position="top" size="default" class="widget-config__form">
              <el-form-item label="页面地址 URL" required>
                <ReInput v-model="configForm.url" placeholder="https://example.com" />
              </el-form-item>
              <el-form-item label="组件标题">
                <ReInput v-model="configForm.title" placeholder="留空则不显示标题栏" maxlength="30" />
              </el-form-item>
              <el-form-item label="高度模式">
                <el-radio-group v-model="configForm.heightMode">
                  <el-radio label="fill">自适应</el-radio>
                  <el-radio label="fixed">固定</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="configForm.heightMode === 'fixed'" label="固定高度 (px)">
                <ReInputNumber v-model="configForm.fixedHeight" :min="100" :max="2000" :step="20" />
              </el-form-item>
              <el-form-item label="允许滚动" class="widget-config__switch-item">
                <ReSwitch layout="square" v-model="configForm.scrolling">
                  <el-icon><RefreshRight /></el-icon>
                </ReSwitch>
                <span class="widget-config__switch-tip">开启后 iframe 内容可内部滚动</span>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="homePage">
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Connection, RefreshRight, Brush, SemiSelect } from "@element-plus/icons-vue";
import { getDayText } from "@repo/utils";
import { getConfig } from "@repo/config";
import { getUserPermission } from "@repo/core";
import useAuthStore from "@repo/pinia/modules/auth";
import HomeLayoutToolbar from "./HomeLayoutToolbar.vue";
import HomeGridView from "./HomeGridView.vue";
import CustomLayoutEditor from "./CustomLayoutEditor.vue";
import WidgetRenderer from "./WidgetRenderer.vue";
import { useHomeLayout } from "./useHomeLayout";
import { filterCatalogByPermission, findWidgetCatalogItem, WIDGET_CATALOG, WIDGET_SHADOW_OPTIONS, WIDGET_SHADOW_MAP, NOTE_THEME_OPTIONS } from "./widgets";
import type { GridPosition, WidgetItem, WidgetType, WidgetShadowLevel, NoteTheme as NoteWidgetTheme } from "./types";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default()));
const ReSwitch = defineAsyncComponent(() => import("@repo/ui/re-switch").then((m) => m.default));
const ReInput = defineAsyncComponent(() => import("@repo/ui/re-input").then((m) => m.default));
const ReInputNumber = defineAsyncComponent(() => import("@repo/ui/re-input-number").then((m) => m.default));

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

/** 按当前权限过滤后的可放置 widget 目录 */
const availableCatalog = computed(() =>
  filterCatalogByPermission(WIDGET_CATALOG, currentPermission.value),
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

// ==================== 组件设置 ====================

const configVisible = ref(false);
const configWidget = ref<WidgetItem | null>(null);
const configForm = ref<{
  type: WidgetType;
  shadow: WidgetShadowLevel;
  url: string;
  title: string;
  heightMode: "fill" | "fixed";
  fixedHeight: number;
  scrolling: boolean;
  theme: NoteWidgetTheme;
}>({
  type: "custom",
  shadow: "soft",
  url: "",
  title: "",
  heightMode: "fill",
  fixedHeight: 400,
  scrolling: true,
  theme: "default",
});

/** 打开组件设置弹窗（按类型回填现有配置） */
function openWidgetConfig(id: string): void {
  const target = state.widgets.find((w) => w.id === id);
  if (!target) return;
  configWidget.value = target;
  const cfg = target.config;
  const noteCfg = target.noteConfig;
  configForm.value = {
    type: target.type,
    shadow: target.appearance?.shadow ?? "soft",
    url: cfg?.url ?? "",
    title: cfg?.title ?? "",
    heightMode: cfg?.heightMode ?? "fill",
    fixedHeight: cfg?.fixedHeight ?? 400,
    scrolling: cfg?.scrolling ?? true,
    theme: noteCfg?.theme ?? "default",
  };
  configVisible.value = true;
}

/** 当前阴影级别对应的 CSS（预览用） */
const shadowCss = computed(() => WIDGET_SHADOW_MAP[configForm.value.shadow]);

/** 当前阴影级别中文标签 */
const shadowLabel = computed(() => WIDGET_SHADOW_OPTIONS.find((o) => o.value === configForm.value.shadow)?.label ?? "");

/** 保存组件设置 */
function saveWidgetConfig(): void {
  const target = configWidget.value;
  if (!target) return;
  const f = configForm.value;
  if (f.type === "custom" && !f.url.trim()) {
    ElMessage.warning("请输入 URL");
    return;
  }
  const idx = state.widgets.findIndex((w) => w.id === target.id);
  if (idx < 0) return;
  const updated: WidgetItem = {
    ...target,
    appearance: { shadow: f.shadow },
  };
  if (f.type === "custom") {
    updated.config = {
      url: f.url.trim(),
      title: f.title.trim() || undefined,
      heightMode: f.heightMode,
      fixedHeight: f.heightMode === "fixed" ? f.fixedHeight : undefined,
      scrolling: f.scrolling,
    };
  }
  if (f.type === "note") {
    updated.noteConfig = { theme: f.theme };
  }
  state.widgets[idx] = updated;
  configVisible.value = false;
  ElMessage.success("设置已保存，点击「保存布局」生效");
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

.widget-config__section {
  padding: 4px 0 12px;
}

.widget-config__section + .widget-config__section {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.widget-config__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.widget-config__section-icon {
  font-size: 15px;
  color: var(--el-color-primary);
}

.widget-config__form {
  padding-bottom: 4px;
}

.widget-config__shadows {
  display: flex;
  flex-wrap: wrap;
}

.widget-config__shadow-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.widget-config__shadow-box {
  width: 40px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.widget-config__switch-item {
  margin-bottom: 0;
}

.widget-config__switch-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.widget-config__themes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.widget-config__theme {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.widget-config__theme:hover {
  border-color: var(--el-border-color);
}

.widget-config__theme.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

.widget-config__theme-swatch {
  width: 30px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.widget-config__theme-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
