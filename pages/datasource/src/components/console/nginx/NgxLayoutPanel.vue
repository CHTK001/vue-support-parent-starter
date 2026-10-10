<template>
  <div class="ngl">
    <!-- 工具条 -->
    <div class="ngl-bar">
      <div class="ngl-bar-left">
        <span class="ngl-title">自定义看板</span>
        <span class="ngl-state" :class="stateClass">{{ stateText }}</span>
      </div>
      <div class="ngl-bar-right">
        <ReButton :loading="loading" data-testid="ngl-btn-reload" @click="reload">
          <template #icon><ReIcon name="Refresh" :size="13" /></template>
          重新载入
        </ReButton>
        <ReButton :disabled="!dirty || saving" data-testid="ngl-btn-save" @click="saveNow">
          <template #icon><ReIcon name="Check" :size="13" /></template>
          保存
        </ReButton>
        <ReButton type="primary" data-testid="ngl-btn-embed" @click="openEmbed">
          <template #icon><ReIcon name="Link" :size="13" /></template>
          嵌入链接
        </ReButton>
      </div>
    </div>

    <!-- 编辑器：左实时预览 + 右组件目录（复用 home 插件） -->
    <div class="ngl-body">
      <HomePreview
        :widgets="layout.widgets"
        :grid="layout.grid"
        @update:grid="onGridUpdate"
        @remove="onRemove"
        @edit="openSettings"
      >
        <template #default="{ widget }">
          <NgxCardRenderer :widget="widget as NgxWidgetItem" />
        </template>
      </HomePreview>
      <WidgetLibrary :catalog="NGX_CARD_CATALOG" @add="onAdd" />
    </div>

    <!-- 卡片设置（表单 / 自定义 JSON 双模式） -->
    <NgxCardSettingsDialog v-model="settingsVisible" :widget="editingWidget" @save="onSettingsSave" />

    <!-- 嵌入链接 -->
    <ReDialog v-model="embedVisible" title="嵌入到其他系统" width="680px">
      <div class="ngl-embed">
        <div class="ngl-embed-hint">
          下面链接免登录只读访问本看板，可直接 iframe 嵌入任意系统；令牌泄露可在下方重新生成（旧链接立即失效）。
        </div>
        <div class="ngl-embed-block">
          <div class="ngl-embed-label">嵌入链接</div>
          <div class="ngl-embed-row">
            <input class="ngl-embed-input" data-testid="ngl-embed-url" :value="embedUrl" readonly @focus="selectText" />
            <ReButton data-testid="ngl-btn-copy-url" @click="copyText(embedUrl, '链接')">复制</ReButton>
          </div>
        </div>
        <div class="ngl-embed-block">
          <div class="ngl-embed-label">iframe 片段</div>
          <div class="ngl-embed-row">
            <input class="ngl-embed-input" data-testid="ngl-embed-snippet" :value="iframeSnippet" readonly @focus="selectText" />
            <ReButton data-testid="ngl-btn-copy-snippet" @click="copyText(iframeSnippet, 'iframe 片段')">复制</ReButton>
          </div>
        </div>
        <div class="ngl-embed-foot">
          <span class="ngl-embed-token">令牌：{{ embedToken || "保存看板后自动生成" }}</span>
          <ReButton :loading="regenerating" data-testid="ngl-btn-regenerate" @click="regenerate">
            <template #icon><ReIcon name="RefreshRight" :size="13" /></template>
            重新生成令牌
          </ReButton>
        </div>
      </div>
      <template #footer>
        <ReButton type="primary" data-testid="ngl-btn-embed-close" @click="embedVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="NgxLayoutPanel">
/**
 * Nginx 自定义布局面板。
 *
 * <p>复用 home 插件的网格编辑器（HomePreview + WidgetLibrary），卡片配置挂 widget.ngx：
 * 指标选择 / 图表参数 / ECharts 参数 / 采集脚本 / 背景色 / 自定义 CSS 均在卡片设置里配置
 * （表单或 JSON 双模式，默认表单）。布局变化实时保存（debounce），并生成免登录嵌入链接
 * 供其他系统 iframe 使用。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReDialog from "@repo/ui/re-dialog";
import HomePreview from "@repo/theme/koi/views/home/HomePreview.vue";
import WidgetLibrary from "@repo/theme/koi/views/home/WidgetLibrary.vue";
import type { GridPosition } from "@repo/theme/koi/views/home/types";
import NgxCardRenderer from "./NgxCardRenderer.vue";
import NgxCardSettingsDialog from "./NgxCardSettingsDialog.vue";
import {
  emptyNgxLayout,
  parseNgxLayout,
  serializeNgxLayout,
  NGX_CARD_CATALOG,
  NGX_CARD_META,
  NGX_CTX_KEY,
  newNgxCardId,
} from "./ngxTypes";
import type { NgxCardKind, NgxLayoutState, NgxWidgetItem } from "./ngxTypes";
import {
  createNgxConsoleContext,
  fetchNginxDashboard,
  regenerateNginxToken,
  saveNginxDashboard,
} from "../../../api/nginx/api";

const props = defineProps<{
  datasourceId: number | null | undefined;
}>();

// 卡片取数上下文：控制台模式（登录态 + datasourceId）
provide(
  NGX_CTX_KEY,
  createNgxConsoleContext(() => props.datasourceId)
);

const route = useRoute();

const layout = ref<NgxLayoutState>(emptyNgxLayout());
const loading = ref(false);
const saving = ref(false);
const dirty = ref(false);
const embedToken = ref("");
const dashboardName = ref("");
const savedAt = ref("");
const saveError = ref("");

const settingsVisible = ref(false);
const editingWidget = ref<NgxWidgetItem | null>(null);

const embedVisible = ref(false);
const regenerating = ref(false);

const stateText = computed(() => {
  if (saving.value) {
    return "保存中…";
  }
  if (saveError.value) {
    return `保存失败：${saveError.value}`;
  }
  if (dirty.value) {
    return "编辑中…";
  }
  return savedAt.value ? `已保存 ${savedAt.value}` : "已同步";
});

const stateClass = computed(() => ({
  "is-saving": saving.value,
  "is-dirty": dirty.value && !saving.value,
  "is-error": !!saveError.value,
  "is-saved": !dirty.value && !saving.value && !saveError.value,
}));

/** 嵌入链接：hash 路由下的免登录只读页面 */
const embedUrl = computed(() => {
  if (!embedToken.value) {
    return "";
  }
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/nginx/embed/${embedToken.value}`;
});

const iframeSnippet = computed(
  () =>
    `<iframe src="${embedUrl.value}" width="100%" height="720" style="border:0" allowfullscreen loading="lazy"></iframe>`
);

// ==================== 载入与保存 ====================

/** 载入期间抑制 watcher 触发的保存：避免把「从后端载入布局」误当成「用户编辑」自动落库 */
let hydrating = false;

async function reload(): Promise<void> {
  loading.value = true;
  saveError.value = "";
  try {
    const dashboard = await fetchNginxDashboard(props.datasourceId);
    embedToken.value = dashboard?.embedToken || "";
    dashboardName.value = dashboard?.name || "";
    hydrating = true;
    layout.value = parseNgxLayout(dashboard?.config);
    void nextTick(() => {
      hydrating = false;
    });
    dirty.value = false;
    savedAt.value = dashboard?.updateTime ? formatTime(dashboard.updateTime) : "";
  } catch (e) {
    saveError.value = (e as Error)?.message || String(e);
    message.error(`看板读取失败：${saveError.value}`);
  } finally {
    loading.value = false;
  }
}

async function saveNow(): Promise<void> {
  if (saving.value) {
    return;
  }
  saving.value = true;
  saveError.value = "";
  try {
    const dashboard = await saveNginxDashboard({
      datasourceId: props.datasourceId,
      name: dashboardName.value || undefined,
      config: serializeNgxLayout(layout.value),
    });
    embedToken.value = dashboard?.embedToken || embedToken.value;
    dirty.value = false;
    savedAt.value = formatNow();
  } catch (e) {
    saveError.value = (e as Error)?.message || String(e);
  } finally {
    saving.value = false;
  }
}

/** 实时保存：布局变化 800ms 后落库 */
let saveTimer: number | null = null;

function scheduleSave(): void {
  dirty.value = true;
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void saveNow();
  }, 800);
}

watch(
  layout,
  () => {
    if (hydrating) {
      return;
    }
    scheduleSave();
  },
  { deep: true }
);

function formatNow(): string {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function formatTime(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString("zh-CN", { hour12: false });
}

// ==================== 布局操作 ====================

function onGridUpdate(grid: GridPosition[]): void {
  layout.value = { ...layout.value, grid };
}

function onRemove(id: string): void {
  layout.value = {
    ...layout.value,
    widgets: layout.value.widgets.filter(w => w.id !== id),
    grid: layout.value.grid.filter(g => g.i !== id),
  };
}

function onAdd(type: string): void {
  const kind = type as NgxCardKind;
  const meta = NGX_CARD_META[kind];
  if (!meta) {
    return;
  }
  const existing = layout.value.widgets.filter(w => w.type === type).length;
  if (existing >= 24) {
    message.warning(`${meta.label} 数量已达上限`);
    return;
  }
  const id = newNgxCardId();
  const bottom = layout.value.grid.reduce((max, g) => Math.max(max, g.y + g.h), 0);
  const widget: NgxWidgetItem = {
    id,
    type: kind,
    title: meta.label,
    ngx: { ...meta.defaultCard },
  };
  layout.value = {
    ...layout.value,
    widgets: [...layout.value.widgets, widget],
    grid: [...layout.value.grid, { i: id, x: 0, y: bottom, w: meta.defaultSize.w, h: meta.defaultSize.h }],
  };
  // 新增卡片直接打开设置，降低「加完不知道要配指标」的困惑
  openSettings(id);
}

function openSettings(id: string): void {
  const found = layout.value.widgets.find(w => w.id === id);
  if (!found) {
    return;
  }
  editingWidget.value = found;
  settingsVisible.value = true;
}

function onSettingsSave(payload: { widget: NgxWidgetItem }): void {
  layout.value = {
    ...layout.value,
    widgets: layout.value.widgets.map(w => (w.id === payload.widget.id ? payload.widget : w)),
  };
}

// ==================== 嵌入 ====================

function openEmbed(): void {
  embedVisible.value = true;
  // 未保存过的新看板：打开时先落一次库，令牌才能生成
  if (!embedToken.value && !saving.value) {
    void saveNow().then(() => {
      if (!embedToken.value) {
        // saveNow 失败时提示
        message.warning("请先成功保存看板后再获取嵌入链接");
      }
    });
  }
}

async function regenerate(): Promise<void> {
  try {
    await ElMessageBox.confirm("重新生成后旧链接立即失效，确认继续？", "重新生成令牌", {
      type: "warning",
      confirmButtonText: "重新生成",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  regenerating.value = true;
  try {
    const dashboard = await regenerateNginxToken(props.datasourceId);
    embedToken.value = dashboard?.embedToken || "";
    message.success("令牌已更新");
  } catch (e) {
    message.error(`生成失败：${(e as Error)?.message ?? e}`);
  } finally {
    regenerating.value = false;
  }
}

function selectText(e: FocusEvent): void {
  (e.target as HTMLInputElement).select();
}

async function copyText(text: string, label: string): Promise<void> {
  if (!text) {
    message.warning("暂无可复制的链接");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${label}已复制`);
  } catch {
    // 剪贴板不可用（非安全上下文）时退化为选中输入框内容
    message.warning("复制失败，请手动选中复制");
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  void reload();
  void route;
});

onBeforeUnmount(() => {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
});

watch(
  () => props.datasourceId,
  () => {
    void reload();
  }
);
</script>

<style scoped lang="scss">
.ngl {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
}
.ngl-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  flex-shrink: 0;
}
.ngl-bar-left { display: flex; align-items: center; gap: 10px; }
.ngl-bar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ngl-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.ngl-state {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 9999px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &.is-dirty { color: var(--status-warning); background: color-mix(in srgb, var(--status-warning) 12%, transparent); }
  &.is-saving { color: var(--brand-600); background: var(--brand-50); }
  &.is-error { color: var(--status-error); background: color-mix(in srgb, var(--status-error) 12%, transparent); }
  &.is-saved { color: var(--status-success); background: color-mix(in srgb, var(--status-success) 12%, transparent); }
}

/* HomePreview 需要确定高度才能把行高算满，这里给布局面板固定高度 */
.ngl-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 6px;
  height: clamp(520px, calc(100vh - 300px), 1400px);
  min-height: 0;
}

@media (max-width: 1100px) {
  .ngl-body { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(420px, 1fr) 260px; }
}

.ngl-embed { display: flex; flex-direction: column; gap: 12px; }
.ngl-embed-hint { font-size: 12px; color: var(--text-secondary); line-height: 1.7; }
.ngl-embed-block { display: flex; flex-direction: column; gap: 6px; }
.ngl-embed-label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.ngl-embed-row { display: flex; gap: 8px; }
.ngl-embed-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: ui-monospace, Consolas, monospace;
  color: var(--text-primary);
  background: var(--bg-elevated);
  outline: none;
  &:focus { border-color: var(--brand-500); }
}
.ngl-embed-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-subtle);
}
.ngl-embed-token { font-size: 11px; color: var(--text-tertiary); word-break: break-all; }
</style>
