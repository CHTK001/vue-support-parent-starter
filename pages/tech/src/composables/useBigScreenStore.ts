import { ref, computed, watch } from "vue";
import { nanoid } from "nanoid";
import type {
  WidgetConfig,
  WidgetId,
  WidgetTypeKey,
  WidgetRect,
  BigScreenProject,
  BigScreenConfigEntry,
} from "../types/widget";
import { getWidgetType } from "./useWidgetRegistry";

const STORAGE_KEY = "bigscreen-project";
const CONFIG_LIST_KEY = "bigscreen-config-list";

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
  const mode = ref<"edit" | "preview">("edit");
  const project = ref<BigScreenProject>({ ...DEFAULT_PROJECT });
  const widgets = ref<WidgetConfig[]>([]);
  const selectedWidgetId = ref<WidgetId | null>(null);
  const zoom = ref(1);
  const showPalette = ref(true);
  const showConfigPanel = ref(true);
  const isDirty = ref(false);

  const selectedWidget = computed(() =>
    widgets.value.find((w) => w.id === selectedWidgetId.value) ?? null
  );

  const isEditMode = computed(() => mode.value === "edit");
  const isPreviewMode = computed(() => mode.value === "preview");

  function addWidget(
    typeKey: WidgetTypeKey,
    partialRect?: Partial<WidgetRect>,
    initialVariant?: string
  ): WidgetId | null {
    const def = getWidgetType(typeKey);
    if (!def) return null;

    const id = nanoid(12);
    const cw = project.value.canvasWidth;
    const ch = project.value.canvasHeight;
    const rect: WidgetRect = {
      x: partialRect?.x !== undefined ? Math.max(0, Math.min(partialRect.x, cw - (partialRect?.width ?? def.defaultWidth))) : 0,
      y: partialRect?.y !== undefined ? Math.max(0, Math.min(partialRect.y, ch - (partialRect?.height ?? def.defaultHeight))) : 0,
      width: Math.max(40, Math.min(partialRect?.width ?? def.defaultWidth, cw)),
      height: Math.max(30, Math.min(partialRect?.height ?? def.defaultHeight, ch)),
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
    selectWidget(id);
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
    const cw = project.value.canvasWidth;
    const ch = project.value.canvasHeight;
    if (rect.x !== undefined) widget.rect.x = Math.max(0, Math.min(rect.x, cw - widget.rect.width));
    if (rect.y !== undefined) widget.rect.y = Math.max(0, Math.min(rect.y, ch - widget.rect.height));
    if (rect.width !== undefined) widget.rect.width = Math.max(40, Math.min(rect.width, cw));
    if (rect.height !== undefined) widget.rect.height = Math.max(30, Math.min(rect.height, ch));
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
    widgets.value.forEach((w, i) => (w.zIndex = i));
    markDirty();
  }

  function clearCanvas(): void {
    widgets.value = [];
    selectedWidgetId.value = null;
    markDirty();
  }

  function toggleMode(): void {
    mode.value = mode.value === "edit" ? "preview" : "edit";
    if (mode.value === "preview") {
      selectedWidgetId.value = null;
    }
  }

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

  function loadDemoLayout(): void {
    widgets.value = [
      {
        id: "demo-header",
        type: "header",
        variant: "A1",
        rect: { x: 0, y: 0, width: 1920, height: 80 },
        title: "数据可视化大屏",
        zIndex: 0, visible: true, locked: false, opacity: 1,
        glowOpacity: 0.8,
      },
      {
        id: "demo-panel-1",
        type: "panel",
        variant: "A1",
        rect: { x: 40, y: 120, width: 440, height: 280 },
        title: "业务概览",
        zIndex: 1, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5, backgroundOpacity: 0.4,
      },
      {
        id: "demo-panel-2",
        type: "panel",
        variant: "A2",
        rect: { x: 500, y: 120, width: 440, height: 280 },
        title: "实时监控",
        zIndex: 2, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5, backgroundOpacity: 0.4,
      },
      {
        id: "demo-panel-3",
        type: "panel",
        variant: "B1",
        rect: { x: 960, y: 120, width: 440, height: 280 },
        title: "数据分析",
        zIndex: 3, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5, backgroundOpacity: 0.4,
      },
      {
        id: "demo-panel-4",
        type: "panel",
        variant: "DV1",
        rect: { x: 1420, y: 120, width: 460, height: 280 },
        title: "数据面板",
        zIndex: 4, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5, backgroundOpacity: 0.4,
      },
      {
        id: "demo-panel-5",
        type: "dataview-panel",
        variant: "DV2",
        rect: { x: 40, y: 420, width: 440, height: 300 },
        title: "趋势图表",
        zIndex: 5, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5,
      },
      {
        id: "demo-panel-6",
        type: "dataview-panel",
        variant: "DV3",
        rect: { x: 500, y: 420, width: 440, height: 300 },
        title: "分布统计",
        zIndex: 6, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5,
      },
      {
        id: "demo-panel-7",
        type: "dataview-panel",
        variant: "DV4",
        rect: { x: 960, y: 420, width: 440, height: 300 },
        title: "指标看板",
        zIndex: 7, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5,
      },
      {
        id: "demo-panel-8",
        type: "dataview-panel",
        variant: "DV5",
        rect: { x: 1420, y: 420, width: 460, height: 300 },
        title: "实时数据",
        zIndex: 8, visible: true, locked: false, opacity: 1,
        glow: true, glowOpacity: 0.5,
      },
      {
        id: "demo-deco-1",
        type: "decoration",
        variant: "A1",
        rect: { x: 40, y: 740, width: 400, height: 20 },
        title: "装饰线条",
        zIndex: 9, visible: true, locked: false, opacity: 1,
      },
      {
        id: "demo-deco-2",
        type: "decoration",
        variant: "C1",
        rect: { x: 500, y: 740, width: 400, height: 20 },
        title: "装饰线条",
        zIndex: 10, visible: true, locked: false, opacity: 1,
      },
      {
        id: "demo-scroll",
        type: "scrolling-text",
        variant: "A1",
        rect: { x: 40, y: 780, width: 1840, height: 40 },
        title: "滚动字幕",
        zIndex: 11, visible: true, locked: false, opacity: 1,
        scrollingText: {
          content: "数据可视化大屏系统 · 实时监控数据中 · 请持续关注",
          speed: 60, direction: "left", fontSize: 16, color: "#00f6ff",
        },
      },
    ];
    selectedWidgetId.value = null;
    isDirty.value = true;
  }

  function getConfigList(): BigScreenConfigEntry[] {
    try {
      const raw = localStorage.getItem(CONFIG_LIST_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveConfig(name: string): { guid: string; isUpdate: boolean } {
    const list = getConfigList();
    const existing = list.find((e) => e.name === name);
    const now = Date.now();

    project.value.widgets = [...widgets.value];
    project.value.updatedAt = now;

    if (existing) {
      existing.project = JSON.parse(JSON.stringify(project.value));
      existing.updatedAt = now;
      try {
        localStorage.setItem(CONFIG_LIST_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn("[BigScreen] 保存配置列表失败:", e);
      }
      isDirty.value = false;
      return { guid: existing.guid, isUpdate: true };
    }

    const entry: BigScreenConfigEntry = {
      guid: nanoid(12),
      name,
      createdAt: now,
      updatedAt: now,
      project: JSON.parse(JSON.stringify(project.value)),
    };
    list.push(entry);
    try {
      localStorage.setItem(CONFIG_LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("[BigScreen] 保存配置列表失败:", e);
    }
    isDirty.value = false;
    return { guid: entry.guid, isUpdate: false };
  }

  function loadConfigByGuid(guid: string): boolean {
    const list = getConfigList();
    const entry = list.find((e) => e.guid === guid);
    if (!entry) return false;

    project.value = { ...DEFAULT_PROJECT, ...JSON.parse(JSON.stringify(entry.project)) };
    widgets.value = entry.project.widgets || [];
    isDirty.value = false;
    return true;
  }

  function deleteConfig(guid: string): void {
    const list = getConfigList();
    const idx = list.findIndex((e) => e.guid === guid);
    if (idx === -1) return;
    list.splice(idx, 1);
    try {
      localStorage.setItem(CONFIG_LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("[BigScreen] 删除配置失败:", e);
    }
  }

  function markDirty(): void {
    isDirty.value = true;
  }

  function clearSelection(): void {
    selectedWidgetId.value = null;
  }

  return {
    mode,
    project,
    widgets,
    selectedWidgetId,
    selectedWidget,
    zoom,
    showPalette,
    showConfigPanel,
    isDirty,
    isEditMode,
    isPreviewMode,
    addWidget,
    removeWidget,
    updateWidget,
    updateWidgetRect,
    selectWidget,
    duplicateWidget,
    moveWidgetLayer,
    clearCanvas,
    clearSelection,
    toggleMode,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomFit,
    save,
    load,
    loadDemoLayout,
    exportConfig,
    importConfig,
    resetProject,
    getConfigList,
    saveConfig,
    loadConfigByGuid,
    deleteConfig,
  };
}
