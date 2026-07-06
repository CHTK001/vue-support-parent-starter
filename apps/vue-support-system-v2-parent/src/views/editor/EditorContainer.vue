<template>
  <TuiProvider>
    <div class="editor-page" :class="{ 'editor-page--preview': store.isPreviewMode.value }">
      <!-- 预览模式：TuiAdaptive 提供主题背景 -->
      <TuiAdaptive
        v-if="store.isPreviewMode.value"
        adaptiveType="flexible"
        :shadow="true"
        :monitorRatio="true"
        :showPenetration="true"
      />
      <TuiThemeToggle v-if="store.isPreviewMode.value" class="editor-theme-toggle" />

      <!-- 顶部：工具栏 -->
      <div v-if="store.isEditMode.value" class="editor-top">
        <EditorToolbar
          :project-name="store.project.value.name"
          :is-edit="store.isEditMode.value"
          :is-dirty="store.isDirty.value"
          :zoom="store.zoom.value"
          :show-palette="store.showPalette.value"
          :show-config-panel="store.showConfigPanel.value"
          @name-change="onNameChange"
          @switch-mode="onSwitchMode"
          @zoom-in="store.zoomIn()"
          @zoom-out="store.zoomOut()"
          @zoom-fit="store.zoomFit()"
          @save="showSaveDialog = true"
          @clear="clearWithConfirm"
          @toggle-palette="store.showPalette.value = !store.showPalette.value"
          @toggle-config-panel="store.showConfigPanel.value = !store.showConfigPanel.value"
        />
      </div>

      <!-- 中部：左中右 -->
      <div class="editor-middle">
        <div class="editor-middle__left" :class="{ hidden: !store.isEditMode.value || !store.showPalette.value }">
          <EditorPalette v-show="store.isEditMode.value && store.showPalette.value" />
        </div>

        <div class="editor-middle__center" :class="{ 'editor-middle__center--preview': store.isPreviewMode.value }">
          <div class="editor-canvas-viewport" :style="{ background: store.isPreviewMode.value ? 'transparent' : store.project.value.backgroundColor }">
            <div class="canvas-transform-clip">
              <div class="canvas-scaled-stage" :style="canvasScaledStageStyle">
                <EditorCanvas
                  :widgets="store.widgets.value"
                  :selected-id="store.selectedWidgetId.value"
                  :is-edit="store.isEditMode.value"
                  :grid-size="store.project.value.gridSize"
                  :zoom="displayZoom"
                  @select="store.selectWidget($event)"
                  @remove="store.removeWidget($event)"
                  @duplicate="store.duplicateWidget($event)"
                  @open-data-binding="onOpenDataBinding"
                  @update-widget-rect="store.updateWidgetRect($event.id, $event.rect)"
                  @add-widget="onAddWidget"
                  @clear-selection="store.clearSelection()"
                  />
                </div>
            </div>
          </div>
        </div>

        <div class="editor-middle__right" :class="{ hidden: !store.isEditMode.value || !store.showConfigPanel.value }">
          <EditorConfigPanel
            v-show="store.isEditMode.value && store.showConfigPanel.value"
            :widget="store.selectedWidget.value"
            @update-widget="store.updateWidget($event.id, $event.patch)"
            @update-widget-rect="store.updateWidgetRect($event.id, $event.rect)"
            @remove="store.removeWidget($event)"
          />
        </div>
      </div>

      <SaveDialog
        :visible="showSaveDialog"
        :config-name="store.project.value.name"
        :remote-url="remoteUrl"
        @close="showSaveDialog = false"
        @save="onSave"
      />

      <!-- 预览模式退出按钮 -->
      <button
        v-if="store.isPreviewMode.value"
        class="editor-exit-preview"
        @click="onSwitchMode('edit')"
      >
        退出预览
      </button>
    </div>
  </TuiProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getConfig } from "@repo/config";
import { registerAllWidgetTypes, useBigScreenStore } from "@layout/bigscreen";
import EditorToolbar from "./components/EditorToolbar.vue";
import EditorPalette from "./components/EditorPalette.vue";
import EditorCanvas from "./components/EditorCanvas.vue";
import EditorConfigPanel from "./components/EditorConfigPanel.vue";
import SaveDialog from "./components/SaveDialog.vue";
import { STORAGE_KEY } from "./types/editor";

const store = useBigScreenStore();

const showSaveDialog = ref(false);

const remoteUrl = computed(() => {
  try {
    const url: unknown = getConfig("BigScreen.RemoteUrl");
    return typeof url === "string" && url.trim() ? url.trim() : undefined;
  } catch {
    return undefined;
  }
});

// 视口尺寸跟踪（用于预览模式自动缩放 + 中间区域精确尺寸）
const viewportSize = ref({ width: window.innerWidth, height: window.innerHeight });
const TOOLBAR_HEIGHT = 48;

/** 中间画布区域：预览填满视口，编辑保持视口等比例 */
const centerRect = computed(() => {
  const vw = viewportSize.value.width;
  const vh = viewportSize.value.height;

  // 预览模式：填满整个视口
  if (store.isPreviewMode.value) {
    return { width: vw, height: vh };
  }

  const leftW = store.showPalette.value ? 220 : 0;
  const rightW = store.showConfigPanel.value ? 260 : 0;
  const topH = TOOLBAR_HEIGHT;
  const availableW = vw - leftW - rightW;
  const availableH = vh - topH;
  const ratio = vw / vh;

  // 保持视口宽高比，取不超出可用范围的最大尺寸
  let w: number, h: number;
  if (availableW / ratio <= availableH) {
    w = availableW;
    h = availableW / ratio;
  } else {
    h = availableH;
    w = availableH * ratio;
  }

  return { width: Math.floor(w), height: Math.floor(h) };
});

/** 显示缩放：预览模式自动适应视口 */
const displayZoom = computed(() => {
  if (store.isPreviewMode.value) {
    const { width, height } = viewportSize.value;
    const scaleX = width / store.project.value.canvasWidth;
    const scaleY = height / store.project.value.canvasHeight;
    return Math.min(scaleX, scaleY);
  }
  return store.zoom.value;
});

/** 画布缩放层：position:absolute 脱离布局流，中心对齐 + scale */
const canvasScaledStageStyle = computed(() => ({
  position: "absolute",
  left: "50%",
  top: "50%",
  width: `${store.project.value.canvasWidth}px`,
  height: `${store.project.value.canvasHeight}px`,
  transform: `translate(-50%, -50%) scale(${displayZoom.value})`,
}));

/** 导出 JSON（用于保存弹窗） */
const projectJson = computed(() => store.exportConfig());

function onNameChange(name: string) {
  store.project.value.name = name;
}

function onSwitchMode(mode: "edit" | "preview") {
  store.mode.value = mode;
  if (mode === "preview") {
    store.clearSelection();
  }
}

function onAddWidget(payload: { type: string; x: number; y: number; variant?: string }) {
  store.addWidget(payload.type, { x: payload.x, y: payload.y }, payload.variant);
}

function onOpenDataBinding(id: string) {
  store.selectWidget(id);
  // 自动滚动配置面板到数据绑定区域
  const sections = document.querySelectorAll(".config-section__title");
  for (const s of sections) {
    if (s.textContent?.includes("数据绑定")) {
      s.closest(".config-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
  }
}

/** 键盘快捷键 */
function onKeyDown(e: KeyboardEvent) {
  // Escape 退出预览
  if (e.key === "Escape" && store.isPreviewMode.value) {
    onSwitchMode("edit");
    return;
  }

  if (e.key === "Delete" || e.key === "Backspace") {
    const target = e.target as HTMLElement;
    // 不干扰输入框内的删除
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") return;
    const id = store.selectedWidgetId.value;
    if (id) {
      e.preventDefault();
      store.removeWidget(id);
    }
  }
}

/** 保存：写入配置列表，按需远程 */
async function onSave(payload: { name: string; saveRemote: boolean }) {
  store.project.value.name = payload.name;
  const result = store.saveConfig(payload.name);
  // 回写传统 key 保持兼容
  const json = store.exportConfig();
  localStorage.setItem(STORAGE_KEY, json);
  store.isDirty.value = false;
  console.log(`[Editor] 保存成功 guid=${result.guid} update=${result.isUpdate}`);

  if (payload.saveRemote && remoteUrl.value) {
    try {
      const resp = await fetch(remoteUrl.value, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      console.log("[Editor] 远程保存成功");
    } catch (err) {
      console.warn("[Editor] 远程保存失败:", err);
      throw err;
    }
  }
}

function clearWithConfirm() {
  if (store.widgets.value.length === 0) return;
  store.clearCanvas();
}

function onResize() {
  viewportSize.value = { width: window.innerWidth, height: window.innerHeight };
}

/** 计算适配缩放：让画布完整显示在中间区域内 */
function getFitZoom() {
  const cw = store.project.value.canvasWidth;
  const ch = store.project.value.canvasHeight;
  const cRect = centerRect.value;
  return Math.min(cRect.width / cw, cRect.height / ch);
}

function applyFitZoom() {
  store.zoom.value = Math.min(getFitZoom(), 1); // 不超过 100%
}

// 确保在组件渲染前注册所有 widget 类型，否则 palette 的 computed 读不到
registerAllWidgetTypes();

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  // 自动适配缩放，让画布完整显示在容器内
  applyFitZoom();

  // 从独立 key 加载
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    store.importConfig(raw);
  } else {
    store.project.value.name = "新编辑项目";
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("resize", onResize);
});
</script>

<style lang="scss">
.editor-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #060d18;

  &--preview {
    position: relative;
    background: transparent;

    /* TuiAdaptive 作为绝对定位背景层 */
    > #tuiAdptOuter {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }

    /* 其他子元素在背景层之上 */
    > * {
      position: relative;
      z-index: 1;
    }
  }
}

.editor-top {
  flex-shrink: 0;
}

.editor-middle {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: #040b14;

  &__left,
  &__right {
    flex-shrink: 0;
    min-height: 0;
    overflow: hidden;
    transition: width 0.2s;
    display: flex;
    flex-direction: column;
    z-index: 2;
  }

  &__left {
    width: 220px;

    &.hidden {
      width: 0;
    }
  }

  &__right {
    width: 260px;
    margin-left: auto;

    &.hidden {
      width: 0;
    }
  }

  &__center {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    background: transparent;
    z-index: 1;

    &--preview {
      position: fixed;
      inset: 0;
      z-index: 1;
    }
  }
}

.editor-canvas-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 4px 30px rgba(0,0,0,0.5);
}

.canvas-transform-clip {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.editor-exit-preview {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(5, 15, 30, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 8px;
  color: rgba(0, 246, 255, 0.9);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    border-color: rgba(0, 246, 255, 0.5);
  }
}

.editor-theme-toggle {
  position: fixed;
  right: 18px;
  top: 9px;
  z-index: 9999;
}
</style>
