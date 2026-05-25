/**
 * 大屏编辑器核心状态管理
 * 管理 widget CRUD、选择、持久化、缩放、编辑/预览模式切换。
 */
import { ref, computed, watch } from "vue";
import { nanoid } from "nanoid";
import type {
  WidgetConfig,
  WidgetId,
  WidgetTypeKey,
  WidgetRect,
  BigScreenProject,
} from "../types/widget";
import { getWidgetType } from "./useWidgetRegistry";

const STORAGE_KEY = "bigscreen-project";

const DEFAULT_PROJECT: BigScreenProject = {
  version: 1,
  name: "未命名大屏",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundColor: "#0a1628",
  widgets: [],
  gridSize: 20,
  snapToGrid: true,
};

export function useBigScreenStore() {
  // ── State ──────────────────────────────────────────────
  const mode = ref<"edit" | "preview">("edit");
  const project = ref<BigScreenProject>({ ...DEFAULT_PROJECT });
  const widgets = ref<WidgetConfig[]>([]);
  const selectedWidgetId = ref<WidgetId | null>(null);
  const zoom = ref(1);
  const showPalette = ref(true);
  const showConfigPanel = ref(true);
  const isDirty = ref(false);

  // ── Computed ───────────────────────────────────────────
  const selectedWidget = computed(() =>
    widgets.value.find((w) => w.id === selectedWidgetId.value) ?? null
  );

  const isEditMode = computed(() => mode.value === "edit");
  const isPreviewMode = computed(() => mode.value === "preview");

  // ── Widget CRUD ────────────────────────────────────────
  function addWidget(
    typeKey: WidgetTypeKey,
    partialRect?: Partial<WidgetRect>,
    initialVariant?: string
  ): WidgetId | null {
    const def = getWidgetType(typeKey);
    if (!def) return null;

    const id = nanoid(12);
    const rect: WidgetRect = {
      x: partialRect?.x ?? 0,
      y: partialRect?.y ?? 0,
      width: partialRect?.width ?? def.defaultWidth,
      height: partialRect?.height ?? def.defaultHeight,
    };

    const widget: WidgetConfig = {
      id,
      type: typeKey,
      variant: initialVariant || def.defaultVariant,
      rect,
      title: def.configFields.find((f) => f.key === "title")?.defaultValue as string ?? def.label,
      zIndex: widgets.value.length,
      visible: true,
      locked: false,
      opacity: 1,
      ...def.defaultConfig,
    };

    widgets.value.push(widget);
    markDirty();
    return id;
  }

  function removeWidget(id: WidgetId): void {
    const idx = widgets.value.findIndex((w) => w.id === id);
    if (idx === -1) return;
    widgets.value.splice(idx, 1);
    if (selectedWidgetId.value === id) {
      selectedWidgetId.value = null;
    }
    markDirty();
  }

  function updateWidget(id: WidgetId, patch: Partial<WidgetConfig>): void {
    const widget = widgets.value.find((w) => w.id === id);
    if (!widget) return;
    Object.assign(widget, patch);
    markDirty();
  }

  function updateWidgetRect(id: WidgetId, rect: Partial<WidgetRect>): void {
    const widget = widgets.value.find((w) => w.id === id);
    if (!widget) return;
    Object.assign(widget.rect, rect);
    markDirty();
  }

  function selectWidget(id: WidgetId | null): void {
    selectedWidgetId.value = id;
  }

  function duplicateWidget(id: WidgetId): WidgetId | null {
    const src = widgets.value.find((w) => w.id === id);
    if (!src) return null;
    const newId = nanoid(12);
    const clone: WidgetConfig = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      rect: { ...src.rect, x: src.rect.x + 20, y: src.rect.y + 20 },
      zIndex: widgets.value.length,
    };
    widgets.value.push(clone);
    selectedWidgetId.value = newId;
    markDirty();
    return newId;
  }

  function moveWidgetLayer(
    id: WidgetId,
    direction: "up" | "down" | "top" | "bottom"
  ): void {
    const idx = widgets.value.findIndex((w) => w.id === id);
    if (idx === -1) return;

    const [widget] = widgets.value.splice(idx, 1);
    switch (direction) {
      case "up":
        widgets.value.splice(Math.min(idx + 1, widgets.value.length), 0, widget);
        break;
      case "down":
        widgets.value.splice(Math.max(idx - 1, 0), 0, widget);
        break;
      case "top":
        widgets.value.push(widget);
        break;
      case "bottom":
        widgets.value.unshift(widget);
        break;
    }
    // 重新分配 zIndex
    widgets.value.forEach((w, i) => (w.zIndex = i));
    markDirty();
  }

  function clearCanvas(): void {
    widgets.value = [];
    selectedWidgetId.value = null;
    markDirty();
  }

  // ── 模式切换 ────────────────────────────────────────────
  function toggleMode(): void {
    mode.value = mode.value === "edit" ? "preview" : "edit";
    if (mode.value === "preview") {
      selectedWidgetId.value = null;
    }
  }

  // ── 缩放 ────────────────────────────────────────────────
  function zoomIn(): void {
    zoom.value = Math.min(zoom.value + 0.1, 3);
  }

  function zoomOut(): void {
    zoom.value = Math.max(zoom.value - 0.1, 0.25);
  }

  function zoomReset(): void {
    zoom.value = 1;
  }

  function zoomFit(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scaleX = (vw - 40) / project.value.canvasWidth;
    const scaleY = (vh - 120) / project.value.canvasHeight;
    zoom.value = Math.min(scaleX, scaleY, 1);
  }

  // ── 持久化 ────────────────────────────────────────────────
  function save(): void {
    project.value.widgets = [...widgets.value];
    project.value.updatedAt = Date.now();
    try {
      const json = JSON.stringify(project.value);
      localStorage.setItem(STORAGE_KEY, json);
      isDirty.value = false;
    } catch (e) {
      console.warn("[BigScreen] 保存失败:", e);
    }
  }

  function load(): boolean {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return false;
      const data = JSON.parse(json) as BigScreenProject;
      if (!data || !Array.isArray(data.widgets)) return false;
      project.value = { ...DEFAULT_PROJECT, ...data };
      widgets.value = data.widgets;
      isDirty.value = false;
      return true;
    } catch (e) {
      console.warn("[BigScreen] 加载失败:", e);
      return false;
    }
  }

  function exportConfig(): string {
    project.value.widgets = [...widgets.value];
    return JSON.stringify(project.value, null, 2);
  }

  function importConfig(json: string): boolean {
    try {
      const data = JSON.parse(json) as BigScreenProject;
      if (!data || !Array.isArray(data.widgets)) return false;
      project.value = { ...DEFAULT_PROJECT, ...data };
      widgets.value = data.widgets;
      isDirty.value = false;
      return true;
    } catch (e) {
      console.warn("[BigScreen] 导入失败:", e);
      return false;
    }
  }

  function resetProject(): void {
    project.value = { ...DEFAULT_PROJECT, createdAt: Date.now(), updatedAt: Date.now() };
    widgets.value = [];
    selectedWidgetId.value = null;
    isDirty.value = false;
  }

  // ── 内部 ────────────────────────────────────────────────
  function markDirty(): void {
    isDirty.value = true;
  }

  // 点击画布空白区域时取消选中
  function clearSelection(): void {
    selectedWidgetId.value = null;
  }

  return {
    // state
    mode,
    project,
    widgets,
    selectedWidgetId,
    selectedWidget,
    zoom,
    showPalette,
    showConfigPanel,
    isDirty,
    // computed
    isEditMode,
    isPreviewMode,
    // CRUD
    addWidget,
    removeWidget,
    updateWidget,
    updateWidgetRect,
    selectWidget,
    duplicateWidget,
    moveWidgetLayer,
    clearCanvas,
    clearSelection,
    // mode
    toggleMode,
    // zoom
    zoomIn,
    zoomOut,
    zoomReset,
    zoomFit,
    // persistence
    save,
    load,
    exportConfig,
    importConfig,
    resetProject,
  };
}
