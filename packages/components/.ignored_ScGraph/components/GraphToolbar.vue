<template>
  <div class="sc-graph-toolbar">
    <!-- 布局切换 -->
    <div class="sc-graph-toolbar__group">
      <el-select v-model="currentLayout" size="small" style="width:110px" @change="emitLayout">
        <el-option label="力导向" value="force" />
        <el-option label="环形" value="circular" />
        <el-option label="径向" value="radial" />
        <el-option label="层次" value="dagre" />
      </el-select>
    </div>

    <div class="sc-graph-toolbar__divider" />

    <!-- 小地图切换 -->
    <el-tooltip :content="showMinimap ? '隐藏小地图' : '显示小地图'" placement="top">
      <el-button
        :type="showMinimap ? 'primary' : 'default'"
        size="small"
        circle
        @click="$emit('update:minimap', !showMinimap)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
          <path d="M3 14h6v4H3z" fill="currentColor" stroke="none" opacity="0.4" />
        </svg>
      </el-button>
    </el-tooltip>

    <div class="sc-graph-toolbar__divider" />

    <!-- 边动画 -->
    <el-tooltip content="边动画：流动虚线效果" placement="top">
      <el-button
        :type="edgeAnimation ? 'primary' : 'default'"
        size="small"
        circle
        @click="$emit('update:edge-animation', !edgeAnimation)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12h4l2-5 4 10 2-5h4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </el-button>
    </el-tooltip>

    <div class="sc-graph-toolbar__divider" />

    <!-- 节点文字显隐 -->
    <el-tooltip content="显示/隐藏节点文字" placement="top">
      <el-button
        :type="showNodeLabels ? 'primary' : 'default'"
        size="small"
        circle
        @click="$emit('update:node-labels', !showNodeLabels)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M3 7V5a2 2 0 012-2h2" />
          <path d="M17 3h2a2 2 0 012 2v2" />
          <path d="M21 17v2a2 2 0 01-2 2h-2" />
          <path d="M7 21H5a2 2 0 01-2-2v-2" />
          <path d="M7 12h.01M12 12h.01M17 12h.01" stroke-linecap="round" />
        </svg>
      </el-button>
    </el-tooltip>

    <!-- 连线文字显隐 -->
    <el-tooltip content="显示/隐藏连线文字" placement="top">
      <el-button
        :type="showEdgeLabels ? 'primary' : 'default'"
        size="small"
        circle
        @click="$emit('update:edge-labels', !showEdgeLabels)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 20L20 4" stroke-linecap="round" />
          <path d="M4 12h4l2 5 2-10 2 5h4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </el-button>
    </el-tooltip>

    <div class="sc-graph-toolbar__divider" />

    <!-- 聚焦模式：分组透明 -->
    <el-tooltip content="分组聚焦：悬停节点时不同组变透明" placement="top">
      <el-button
        :type="focusMode === 'group' ? 'primary' : 'default'"
        size="small"
        circle
        @click="toggleFocusMode('group')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="5" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
        </svg>
      </el-button>
    </el-tooltip>

    <!-- 聚焦模式：关系透明 -->
    <el-tooltip content="关系聚焦：悬停节点时非关联节点变透明" placement="top">
      <el-button
        :type="focusMode === 'relation' ? 'primary' : 'default'"
        size="small"
        circle
        @click="toggleFocusMode('relation')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="7" y1="8" x2="11" y2="16" />
          <line x1="17" y1="8" x2="13" y2="16" />
        </svg>
      </el-button>
    </el-tooltip>

    <div class="sc-graph-toolbar__divider" />

    <!-- 3D 模式（暂未实现） -->
    <el-tooltip content="3D 立体模式（暂未实现）" placement="top">
      <el-button
        size="small"
        circle
        disabled
        style="opacity:0.35;cursor:not-allowed"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 22V12" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M3.3 7L12 12l8.7-5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </el-button>
    </el-tooltip>

    <div class="sc-graph-toolbar__divider" />

    <!-- 缩放控制 -->
    <el-tooltip content="放大" placement="top">
      <el-button size="small" circle @click="$emit('zoom-in')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5L21 21" stroke-linecap="round" />
          <path d="M11 8v6M8 11h6" stroke-linecap="round" />
        </svg>
      </el-button>
    </el-tooltip>
    <el-tooltip content="缩小" placement="top">
      <el-button size="small" circle @click="$emit('zoom-out')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5L21 21" stroke-linecap="round" />
          <path d="M8 11h6" stroke-linecap="round" />
        </svg>
      </el-button>
    </el-tooltip>
    <el-tooltip content="适应画布" placement="top">
      <el-button size="small" circle @click="$emit('fit-view')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke-linecap="round" />
        </svg>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  layout: string;
  showMinimap: boolean;
  focusMode?: "none" | "group" | "relation";
  edgeAnimation?: boolean;
  mode3d?: boolean;
  showNodeLabels?: boolean;
  showEdgeLabels?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:layout", layout: "force" | "circular" | "radial" | "dagre"): void;
  (e: "update:minimap", show: boolean): void;
  (e: "update:focus-mode", mode: "none" | "group" | "relation"): void;
  (e: "update:edge-animation", val: boolean): void;
  (e: "update:mode-3d", val: boolean): void;
  (e: "update:node-labels", val: boolean): void;
  (e: "update:edge-labels", val: boolean): void;
  (e: "zoom-in"): void;
  (e: "zoom-out"): void;
  (e: "fit-view"): void;
}>();

const currentLayout = ref(props.layout);

watch(() => props.layout, (val) => { currentLayout.value = val; });

function emitLayout(val: string) {
  emit("update:layout", val as "force" | "circular" | "radial" | "dagre");
}

function toggleFocusMode(mode: "group" | "relation") {
  const next = props.focusMode === mode ? "none" : mode;
  emit("update:focus-mode", next);
}
</script>

<style scoped lang="scss">
.sc-graph-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--el-border-color-light, rgba(255,255,255,0.3));
  border-radius: 10px;
  box-shadow: var(--app-shadow, 0 2px 8px rgba(0,0,0,0.08));
  z-index: 10;
  transition: box-shadow 0.25s ease;

  html.dark & {
    background: rgba(30, 30, 35, 0.85);
    border-color: rgba(255, 255, 255, 0.08);
  }

  &:hover {
    box-shadow: var(--app-shadow-md, 0 4px 16px rgba(0,0,0,0.1));
  }

  &__group {
    display: flex;
    align-items: center;
  }

  &__divider {
    width: 1px;
    height: 20px;
    background: var(--el-border-color-light, #e4e7ed);
    flex-shrink: 0;
  }

  :deep(.el-button) {
    transition: all 0.2s ease;
    &:hover {
      transform: scale(1.08);
    }
  }
}
</style>
