<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { getConfig } from "@repo/config";
import type { WidgetConfig } from "./types/widget";
import { useBigScreenStore } from "./composables/useBigScreenStore";
import { registerAllWidgetTypes } from "./widgets";
import BigScreenToolbar from "./components/BigScreenToolbar.vue";
import WidgetPalette from "./components/WidgetPalette.vue";
import BigScreenCanvas from "./components/BigScreenCanvas.vue";
import WidgetConfigPanel from "./components/WidgetConfigPanel.vue";
import GlobalConfigPanel from "./components/GlobalConfigPanel.vue";
import DataBindingModal from "./components/DataBindingModal.vue";
import UnderConstruction from "./components/UnderConstruction.vue";

const store = useBigScreenStore();

const {
  project, widgets, selectedWidgetId, selectedWidget,
  mode, isEditMode, isPreviewMode, isDirty,
  zoom, showPalette, showConfigPanel,
} = store;

let route: any = {};
try {
  route = useRoute();
} catch {
  route = { query: {} };
}
const viewportSize = ref({ width: window.innerWidth, height: window.innerHeight });

const dataBindingWidgetId = ref<string | null>(null);
const dataBindingWidget = ref<WidgetConfig | null>(null);

const hasConfig = ref(false);
const guid = computed(() => route?.query?.guid as string | undefined);

const displayZoom = computed(() => {
  if (isPreviewMode.value) {
    const { width, height } = viewportSize.value;
    return Math.min(width / project.value.canvasWidth, height / project.value.canvasHeight);
  }
  return zoom.value;
});

function openDataBinding(id: string) {
  dataBindingWidgetId.value = id;
  dataBindingWidget.value = store.widgets.value.find((w) => w.id === id) ?? null;
}

function closeDataBinding() {
  dataBindingWidgetId.value = null;
  dataBindingWidget.value = null;
}

function goFullscreen() {
  document.documentElement.requestFullscreen?.();
}

function onResize() {
  viewportSize.value = { width: window.innerWidth, height: window.innerHeight };
}

onMounted(async () => {
  registerAllWidgetTypes();

  if (guid.value) {
    const found = store.loadConfigByGuid(guid.value);
    if (!found) {
      try {
        const remoteUrl: string | undefined = getConfig("BigScreen.RemoteUrl");
        if (remoteUrl) {
          const resp = await fetch(`${remoteUrl.replace(/\/+$/, "")}/${encodeURIComponent(guid.value)}`);
          if (resp.ok) {
            const json = await resp.text();
            store.importConfig(json);
            hasConfig.value = true;
          } else {
            console.warn("[BigScreen] 远程获取失败:", resp.status);
          }
        } else {
          console.warn("[BigScreen] GUID 未找到且未配置远程 URL");
        }
      } catch (err) {
        console.warn("[BigScreen] 远程加载失败:", err);
      }
    } else {
      hasConfig.value = true;
    }
  } else {
    store.loadDemoLayout();
    hasConfig.value = true;
  }

  mode.value = "preview";
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<template>
  <TuiProvider>
    <div class="bigscreen-layout" :class="{ 'bigscreen-layout--preview': isPreviewMode }">
      <template v-if="hasConfig">
        <BigScreenToolbar
          v-if="isEditMode"
          :project-name="project.name"
          :is-edit="isEditMode"
          :is-dirty="isDirty"
          :zoom="zoom"
          @switch-mode="(m: 'edit'|'preview') => mode = m"
          @zoom-in="store.zoomIn()"
          @zoom-out="store.zoomOut()"
          @zoom-reset="store.zoomReset()"
          @save="store.save()"
          @clear="store.clearCanvas()"
          @fullscreen="goFullscreen()"
        />

        <TuiThemeToggle v-if="isPreviewMode" class="bigscreen-theme-toggle" />

        <div class="bigscreen-body">
          <WidgetPalette v-if="isEditMode && showPalette" />
          <GlobalConfigPanel v-if="isEditMode" class="global-config" />

          <div class="bigscreen-canvas-area">
            <div
              class="bigscreen-canvas-viewport"
              :style="{
                transform: `scale(${displayZoom})`,
                transformOrigin: 'center center',
                width: project.canvasWidth + 'px',
                height: project.canvasHeight + 'px',
              }"
            >
              <BigScreenCanvas
                :widgets="widgets"
                :selected-id="selectedWidgetId"
                :is-edit="isEditMode"
                :grid-size="project.gridSize"
                :zoom="displayZoom"
                @select="store.selectWidget"
                @remove="store.removeWidget"
                @duplicate="store.duplicateWidget"
                @open-data-binding="openDataBinding"
                @update-rect="store.updateWidgetRect"
                @add-widget="(type, rect) => { const { _variant, ...r } = rect as any; store.addWidget(type, r, _variant); }"
                @clear-selection="store.clearSelection()"
              />
            </div>
          </div>

          <WidgetConfigPanel
            v-if="isEditMode && showConfigPanel"
            :widget="selectedWidget"
            @update="store.updateWidget"
            @update-rect="store.updateWidgetRect"
          />
        </div>

        <DataBindingModal
          :widget="dataBindingWidget"
          @close="closeDataBinding"
          @update="store.updateWidget"
        />
      </template>

      <UnderConstruction v-else />
    </div>
  </TuiProvider>
</template>

<style lang="scss">
.bigscreen-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a1628;

  &--preview {
    background: transparent;
  }
}

.bigscreen-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.bigscreen-canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}

.bigscreen-canvas-viewport {
  flex-shrink: 0;
  overflow: hidden;
}

.bigscreen-theme-toggle {
  position: absolute;
  right: 18px;
  top: 9px;
  z-index: 10;
}
</style>
