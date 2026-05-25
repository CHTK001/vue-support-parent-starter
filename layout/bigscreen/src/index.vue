<template>
  <div class="bigscreen-layout" :class="{ 'bigscreen-layout--preview': isPreviewMode }">
    <!-- 工具栏 -->
    <BigScreenToolbar
      v-if="isEditMode"
      :project-name="store.project.value.name"
      :is-edit="store.isEditMode.value"
      :is-dirty="store.isDirty.value"
      :zoom="store.zoom.value"
      @switch-mode="onSwitchMode"
      @zoom-in="store.zoomIn"
      @zoom-out="store.zoomOut"
      @zoom-reset="store.zoomReset"
      @save="onSave"
      @clear="onClearCanvas"
      @fullscreen="onFullscreen"
    />

    <!-- 主体区域 -->
    <div class="bigscreen-layout__body">
      <!-- 左侧组件面板 -->
      <WidgetPalette v-if="isEditMode && store.showPalette.value" />

      <!-- 画布容器（带缩放） -->
      <div class="bigscreen-layout__canvas-wrapper">
        <div
          class="bigscreen-layout__canvas-scaler"
          :style="canvasTransform"
        >
          <div
            class="bigscreen-layout__canvas-area"
            :style="canvasStyle"
          >
            <BigScreenCanvas
              :widgets="store.widgets.value"
              :selected-id="store.selectedWidgetId.value"
              :is-edit="isEditMode"
              :grid-size="store.project.value.gridSize"
              @select="store.selectWidget"
              @remove="onRemoveWidget"
              @duplicate="store.duplicateWidget"
              @update-rect="store.updateWidgetRect"
              @add-widget="onAddWidget"
              @clear-selection="store.clearSelection"
            />
          </div>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <WidgetConfigPanel
        v-if="isEditMode && store.showConfigPanel.value && store.selectedWidget.value"
        :widget="store.selectedWidget.value"
        @update="store.updateWidget"
        @update-rect="store.updateWidgetRect"
      />
    </div>

    <!-- 预览模式浮动退出按钮 -->
    <button
      v-if="isPreviewMode"
      class="bigscreen-layout__exit-preview"
      @click="onSwitchMode('edit')"
    >
      <IconifyIconOffline icon="ep:close" />
      退出预览
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useBigScreenStore } from "./composables/useBigScreenStore";
import { registerAllWidgetTypes } from "./widgets";
import BigScreenToolbar from "./components/BigScreenToolbar.vue";
import BigScreenCanvas from "./components/BigScreenCanvas.vue";
import WidgetPalette from "./components/WidgetPalette.vue";
import WidgetConfigPanel from "./components/WidgetConfigPanel.vue";
import "./styles/index.scss";

defineOptions({ name: "BigScreenLayout" });

// 初始化 Widget 注册
registerAllWidgetTypes();

const store = useBigScreenStore();

const isEditMode = computed(() => store.isEditMode.value);
const isPreviewMode = computed(() => store.isPreviewMode.value);

const canvasTransform = computed(() => ({
  transform: `scale(${store.zoom.value})`,
  transformOrigin: "center center",
}));

const canvasStyle = computed(() => ({
  width: `${store.project.value.canvasWidth}px`,
  height: `${store.project.value.canvasHeight}px`,
  backgroundColor: store.project.value.backgroundColor,
}));

function onSwitchMode(mode: "edit" | "preview") {
  store.mode.value = mode;
}

function onSave() {
  store.save();
}

function onRemoveWidget(id: string) {
  store.removeWidget(id);
}

function onAddWidget(type: string, rect: Record<string, number>) {
  const variant = (rect as any)._variant as string | undefined;
  store.addWidget(type, rect, variant);
}

function onClearCanvas() {
  if (confirm("确定要清空画布吗？此操作不可撤销。")) {
    store.clearCanvas();
  }
}

function onFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!isEditMode.value) return;

  // Delete / Backspace 删除选中 widget
  if ((e.key === "Delete" || e.key === "Backspace") && store.selectedWidgetId.value) {
    store.removeWidget(store.selectedWidgetId.value);
  }

  // Ctrl+S 保存
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    store.save();
  }

  // Ctrl+D 复制
  if ((e.ctrlKey || e.metaKey) && e.key === "d" && store.selectedWidgetId.value) {
    e.preventDefault();
    store.duplicateWidget(store.selectedWidgetId.value);
  }

  // Escape 取消选中
  if (e.key === "Escape") {
    store.clearSelection();
  }
}

onMounted(() => {
  store.load();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss" scoped>
.bigscreen-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a1628;
  color: #fff;
  overflow: hidden;

  &--preview {
    .bigscreen-layout__canvas-wrapper {
      padding: 0;
    }

    .bigscreen-layout__canvas-area {
      width: 100vw !important;
      height: 100vh !important;
      transform-origin: top left;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  &__canvas-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    background:
      radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.04) 0%, transparent 50%),
      #060d18;
    padding: 20px;
  }

  &__canvas-scaler {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  &__canvas-area {
    position: relative;
    overflow: hidden;
    box-shadow:
      0 0 40px rgba(0, 246, 255, 0.05),
      0 0 0 1px rgba(0, 246, 255, 0.1);
  }

  &__exit-preview {
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
}
</style>
