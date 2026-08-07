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

        <div v-if="customLayoutButton" class="home-welcome__actions">
          <button
            v-if="!editMode"
            type="button"
            class="home-card__layout-btn"
            title="进入自定义布局"
            aria-label="自定义布局"
            @click="enterEditMode"
          >
            <span class="home-card__layout-btn-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M3 3h7v2H5v5H3V3zm0 11h2v3h7v-2H3v-1zm14-11h-7v2h5v5h2V3zm0 11h-2v3h-7v-2h5v-5h2v3h2v1z" />
                <path d="M7 7h6v6H7V7zm1 1v4h4V8H8z" />
              </svg>
            </span>
            <span class="home-card__layout-btn-label">自定义布局</span>
          </button>

          <button
            v-else
            type="button"
            class="home-card__layout-btn home-card__layout-btn--save"
            title="保存布局"
            aria-label="保存"
            @click="saveLayout"
          >
            <span class="home-card__layout-btn-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M17 5H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-2-2zm-1 10H4V7h10v2H6v2h8V7h.59L17 8.41V15zM6 9h8V7H6v2z" />
                <path d="M16 16H4v-2h12v2zM6 11h8v2H6v-2z" opacity=".4" />
              </svg>
            </span>
            <span class="home-card__layout-btn-label">保存</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 视图模式：只读网格（按已保存布局渲染） -->
    <GridLayout
      v-if="!editMode && hasWidgets"
      v-model:layout="state.grid"
      :is-draggable="false"
      :is-resizable="false"
      :cols="12"
      :row-height="80"
      :margin="[12, 12]"
      :use-css-transforms="true"
      :vertical-compact="true"
      :prevent-collision="false"
      class="home-grid"
    >
      <GridItem
        v-for="item in state.grid"
        :key="item.i"
        :i="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :static="true"
        class="home-grid__item"
      >
        <WidgetRenderer :widget="getWidget(item.i)" />
      </GridItem>
    </GridLayout>

    <!-- 视图模式：空状态 -->
    <div v-else-if="!editMode" class="home-empty">
      <div class="home-empty__inner">
        <el-icon class="home-empty__icon"><DocumentRemove /></el-icon>
        <div class="home-empty__title">尚未配置仪表板</div>
        <div class="home-empty__desc">点击右上角「自定义布局」添加组件</div>
      </div>
    </div>

    <!-- 编辑模式：左预览 + 右组件面板 -->
    <div v-else class="home-editor">
      <div class="home-editor__preview">
        <div class="home-editor__preview-header">
          <div class="home-editor__preview-title">实时预览</div>
          <div class="home-editor__preview-hint">
            拖拽组件调整位置，编辑后「保存」即可生效
          </div>
        </div>
        <div class="home-editor__preview-body">
          <GridLayout
            v-model:layout="state.grid"
            :is-draggable="true"
            :is-resizable="true"
            :cols="12"
            :row-height="80"
            :margin="[12, 12]"
            :use-css-transforms="true"
            :vertical-compact="true"
            :prevent-collision="false"
            class="home-grid home-grid--editable"
          >
            <GridItem
              v-for="item in state.grid"
              :key="item.i"
              :i="item.i"
              :x="item.x"
              :y="item.y"
              :w="item.w"
              :h="item.h"
              :min-w="2"
              :min-h="2"
              class="home-grid__item"
            >
              <div class="home-grid__item-shell">
                <WidgetRenderer :widget="getWidget(item.i)" />
                <button
                  type="button"
                  class="home-grid__remove"
                  title="移除组件"
                  aria-label="移除"
                  @click.stop="removeWidget(item.i)"
                >
                  ×
                </button>
              </div>
            </GridItem>
          </GridLayout>
          <div v-if="!state.widgets.length" class="home-editor__preview-empty">
            <div class="home-editor__preview-empty-title">从右侧添加组件开始</div>
            <div class="home-editor__preview-empty-desc">
              点击右侧组件即可添加到预览中
            </div>
          </div>
        </div>
      </div>

      <aside class="home-editor__panel">
        <div class="home-editor__panel-header">
          <div class="home-editor__panel-title">系统组件</div>
          <div class="home-editor__panel-hint">点击添加</div>
        </div>
        <ul class="home-editor__catalog">
          <li
            v-for="item in WIDGET_CATALOG"
            :key="item.type"
            class="home-editor__catalog-item"
            @click="addWidget(item.type)"
          >
            <div class="home-editor__catalog-icon">
              <el-icon :size="20">
                <component :is="resolveIcon(item.icon)" />
              </el-icon>
            </div>
            <div class="home-editor__catalog-meta">
              <div class="home-editor__catalog-title">{{ item.title }}</div>
              <div class="home-editor__catalog-desc">{{ item.description }}</div>
            </div>
            <div class="home-editor__catalog-add" aria-hidden="true">+</div>
          </li>
        </ul>
      </aside>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts" name="homePage">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  DataAnalysis,
  Sunny,
  Cloudy,
  List,
  Bell,
  Monitor,
  TrendCharts,
  DocumentRemove,
} from "@element-plus/icons-vue";
import { getDayText } from "@repo/utils";
import { getConfig } from "@repo/config";
import useAuthStore from "@repo/pinia/modules/auth";
import { GridLayout, GridItem } from "grid-layout-plus";
import WidgetRenderer from "./WidgetRenderer.vue";
import { useHomeLayout } from "./useHomeLayout";
import { WIDGET_CATALOG, findWidgetCatalogItem } from "./widgets";
import type { WidgetItem, WidgetType, GridPosition } from "./types";

const authStore = useAuthStore();

const greetingText = computed(() => {
  return getDayText() || "您好，愿您天天开心，事事如意！";
});

/** 是否显示自定义布局按钮（受 app.yaml other.home.customLayoutButton 控制，默认 true） */
const customLayoutButton = computed(() => {
  return getConfig().other.home?.customLayoutButton !== false;
});

/** 兼容旧 prop：layout（原循环布局模式，新建自定义布局编辑器后推荐忽略） */
defineProps<{ layout?: "default" | "grid" | "columns" | "rows" }>();
defineEmits<{ (e: "update:layout", v: "default" | "grid" | "columns" | "rows"): void }>();

// ==================== 自定义布局编辑 ====================

const { state, load, save } = useHomeLayout();
const editMode = ref(false);
const hasWidgets = computed(() => state.widgets.length > 0);

/** 元素 Plus 图标映射（按 catalog.icon） */
const ICON_MAP: Record<string, unknown> = {
  DataAnalysis,
  Sunny,
  Cloudy,
  List,
  Bell,
  Monitor,
  TrendCharts,
};
function resolveIcon(name: string): unknown {
  return ICON_MAP[name] ?? DataAnalysis;
}

/** 生成新 widget id */
let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `w_${Date.now().toString(36)}_${idCounter}`;
}

/** 用 widgets 维护 widget 索引（grid-layout-plus 的 layout 用 i 关联） */
const widgetById = shallowRef<Map<string, WidgetItem>>(new Map());
function rebuildIndex(): void {
  const m = new Map<string, WidgetItem>();
  state.widgets.forEach((w) => m.set(w.id, w));
  widgetById.value = m;
}
function getWidget(id: string): WidgetItem {
  return widgetById.value.get(id) ?? { id, type: "stats", title: id };
}

watch(
  () => state.widgets,
  () => rebuildIndex(),
  { immediate: true },
);

/** 计算下一个可放置的位置（找现有网格的最大 y 之后） */
function computeNextPosition(defaultSize: { w: number; h: number }): GridPosition {
  if (!state.grid.length) {
    return { i: "", x: 0, y: 0, w: defaultSize.w, h: defaultSize.h };
  }
  let maxBottom = 0;
  state.grid.forEach((g) => {
    const bottom = g.y + g.h;
    if (bottom > maxBottom) maxBottom = bottom;
  });
  return { i: "", x: 0, y: maxBottom, w: defaultSize.w, h: defaultSize.h };
}

/** 添加组件 */
function addWidget(type: WidgetType): void {
  const catalog = findWidgetCatalogItem(type);
  const id = nextId();
  const widget: WidgetItem = {
    id,
    type: catalog.type,
    title: catalog.title,
  };
  const next = computeNextPosition(catalog.defaultSize);
  next.i = id;
  state.widgets.push(widget);
  state.grid.push(next);
  rebuildIndex();
  nextTick(() => {
    /* GridLayout 自动按 layout 渲染 */
  });
}

/** 移除组件 */
function removeWidget(id: string): void {
  const widgetIdx = state.widgets.findIndex((w) => w.id === id);
  if (widgetIdx >= 0) state.widgets.splice(widgetIdx, 1);
  const gridIdx = state.grid.findIndex((g) => g.i === id);
  if (gridIdx >= 0) state.grid.splice(gridIdx, 1);
  rebuildIndex();
}

/** 进入编辑模式 */
function enterEditMode(): void {
  editMode.value = true;
}

/** 退出编辑模式（取消） */
function cancelEditMode(): void {
  editMode.value = false;
}

/** 保存布局 */
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

.home-card__layout-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: auto;
  align-self: center;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.home-card__layout-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-blank));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.home-card__layout-btn:active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color-blank));
}

.home-card__layout-btn--save {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white, #fff);
}

.home-card__layout-btn--save:hover {
  background: color-mix(in srgb, var(--el-color-primary) 88%, white);
  color: var(--el-color-white, #fff);
  border-color: var(--el-color-primary);
}

.home-card__layout-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.home-card__layout-btn-label {
  letter-spacing: 0.02em;
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

.home-welcome__actions {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

// ==================== 自定义布局 ====================

.home-grid {
  width: 100%;
}

.home-grid__item {
  display: flex;
  flex-direction: column;
}

.home-grid__item-shell {
  position: relative;
  height: 100%;
  width: 100%;
}

.home-grid__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--el-color-danger);
  color: var(--el-color-white, #fff);
  font-size: 14px;
  line-height: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.home-grid__item-shell:hover .home-grid__remove {
  opacity: 1;
}

.home-grid--editable {
  background: var(--el-fill-color-light);
  border-radius: 10px;
  padding: 4px;
}

.home-empty {
  padding: 56px 24px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
}

.home-empty__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.home-empty__icon {
  font-size: 36px;
  color: var(--el-text-color-placeholder);
}

.home-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.home-empty__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
  min-height: 520px;
}

.home-editor__preview {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
}

.home-editor__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.home-editor__preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.home-editor__preview-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home-editor__preview-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  position: relative;
}

.home-editor__preview-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}

.home-editor__preview-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.home-editor__preview-empty-desc {
  font-size: 12px;
}

.home-editor__panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
}

.home-editor__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.home-editor__panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.home-editor__panel-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home-editor__catalog {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 8px;
  list-style: none;
}

.home-editor__catalog-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.home-editor__catalog-item:hover {
  background: var(--el-fill-color-light);
}

.home-editor__catalog-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-fill-color-blank));
  color: var(--el-color-primary);
}

.home-editor__catalog-meta {
  flex: 1;
  min-width: 0;
}

.home-editor__catalog-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.home-editor__catalog-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.home-editor__catalog-add {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white, #fff);
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  font-weight: 600;
}

@media (max-width: 900px) {
  .home-editor {
    grid-template-columns: 1fr;
  }
}
</style>
