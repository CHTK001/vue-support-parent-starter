<script setup lang="ts">
/**
 * 工作台 —— 地图 + 模式参数面板
 *
 * 布局：
 *   - 左侧：模式列表（el-menu vertical）
 *   - 中间：Leaflet 地图（GeoMap）
 *   - 右侧：当前模式的下载参数面板
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, markRaw, type Component } from "vue";
import { MODES } from "@/constants/modes";
import { useSelectionStore } from "@/store/selection";
import GeoMap from "@/components/GeoMap.vue";
import ImageryPanel from "@/components/panels/ImageryPanel.vue";
import DemPanel from "@/components/panels/DemPanel.vue";
import WaybackPanel from "@/components/panels/WaybackPanel.vue";
import Tiles3dPanel from "@/components/panels/Tiles3dPanel.vue";
import MvtPanel from "@/components/panels/MvtPanel.vue";
import OsmPanel from "@/components/panels/OsmPanel.vue";

const selection = useSelectionStore();
const activeMode = ref<(typeof MODES)[number]["value"]>("imagery");

const panelMap: Record<string, Component> = {
  imagery: markRaw(ImageryPanel),
  dem: markRaw(DemPanel),
  wayback: markRaw(WaybackPanel),
  tiles3d: markRaw(Tiles3dPanel),
  mvt: markRaw(MvtPanel),
  osm: markRaw(OsmPanel),
};

const activePanel = computed(() => panelMap[activeMode.value]);

const activeModeMeta = computed(() => MODES.find((m) => m.value === activeMode.value));

const boundsText = computed(() => {
  const b = selection.bounds;
  if (!b) return "尚未选择区域";
  return `N ${b.north.toFixed(4)} · S ${b.south.toFixed(4)} · E ${b.east.toFixed(4)} · W ${b.west.toFixed(4)}`;
});

/** 选区变化回调（选区已同步至 store，无需额外处理） */
function onBoundsChange() {
  /* 选区已同步至 store，无需额外处理 */
}
</script>

<template>
  <div class="workspace">
    <!-- 左侧模式 -->
    <aside class="ws-modes">
      <div class="ws-modes-title">下载模式</div>
      <el-menu :default-active="activeMode" class="ws-menu" @select="(v: any) => (activeMode = v)">
        <el-menu-item v-for="m in MODES" :key="m.value" :index="m.value">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
          <el-tooltip :content="m.description" placement="right" :show-after="400">
            <span class="ws-desc">{{ m.description }}</span>
          </el-tooltip>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 中间地图 -->
    <section class="ws-map">
      <div class="ws-map-head">
        <div class="ws-map-title">
          <el-icon><component :is="activeModeMeta?.icon" /></el-icon>
          <span>{{ activeModeMeta?.label }}</span>
          <el-tag size="small" type="info" effect="plain">{{ activeModeMeta?.description }}</el-tag>
        </div>
        <el-tooltip :content="boundsText" placement="top">
          <div class="ws-bounds">
            <el-icon><Location /></el-icon>
            <span>{{ boundsText }}</span>
          </div>
        </el-tooltip>
      </div>
      <GeoMap height="calc(100vh - 156px)" :center="[39.90923, 116.397428]" :zoom="5" @bounds-change="onBoundsChange" />
    </section>

    <!-- 右侧参数面板 -->
    <aside class="ws-panel">
      <div class="ws-panel-title">{{ activeModeMeta?.label }} 参数</div>
      <div class="ws-panel-body">
        <transition name="fade" mode="out-in">
          <component :is="activePanel" :key="activeMode" />
        </transition>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.workspace {
  display: flex;
  gap: 0;
  height: calc(100vh - 52px);
  padding: 8px;
  overflow: hidden;
}

/* 左侧模式列表 */
.ws-modes {
  width: 176px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: auto;
  margin-right: 8px;
}
.ws-modes-title {
  padding: 12px 12px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.ws-menu {
  border-right: none;
}
.ws-menu .el-menu-item {
  height: 44px;
  line-height: 44px;
}
.ws-desc {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 中间地图 */
.ws-map {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-right: 8px;
}
.ws-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 36px;
  padding: 0 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
.ws-map-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ws-bounds {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: default;
}

/* 右侧参数面板 */
.ws-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}
.ws-panel-title {
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}
.ws-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>