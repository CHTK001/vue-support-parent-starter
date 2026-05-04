<template>
  <div
    class="realtime-log-panel"
    :class="{ 'is-collapsed': collapsed }"
    :style="{ height: collapsed ? '40px' : `${localHeight}px` }"
  >
    <div class="realtime-log-panel__header" @mousedown="startDrag">
      <div class="realtime-log-panel__title">
        <IconifyIconOnline :icon="collapsed ? 'ep:arrow-up' : 'ep:arrow-down'" />
        <span>实时日志</span>
        <span v-if="statusText" class="realtime-log-panel__status">{{ statusText }}</span>
      </div>
      <div class="realtime-log-panel__actions">
        <ScButton size="small" circle text @click="toggleCollapse">
          <IconifyIconOnline :icon="collapsed ? 'ep:arrow-up' : 'ep:arrow-down'" />
        </ScButton>
      </div>
    </div>

    <div v-show="!collapsed" class="realtime-log-panel__content">
      <pre class="realtime-log-panel__log-content thin-scroller">{{ logContent }}</pre>
    </div>

    <div
      v-show="!collapsed"
      class="realtime-log-panel__resize-handle"
      @mousedown="startDrag"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import ScButton from "@repo/components/ScButton";
import { IconifyIconOnline } from "@repo/components";

const props = defineProps<{
  logContent?: string;
  statusText?: string;
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
}>();

const collapsed = ref(false);
const localHeight = ref(props.defaultHeight || 300);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartHeight = ref(0);

const minH = computed(() => props.minHeight || 100);
const maxH = computed(() => props.maxHeight || 600);

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

const startDrag = (e: MouseEvent) => {
  if (collapsed.value) return;
  isDragging.value = true;
  dragStartY.value = e.clientY;
  dragStartHeight.value = localHeight.value;
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
};

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const delta = dragStartY.value - e.clientY;
  const newHeight = Math.max(minH.value, Math.min(maxH.value, dragStartHeight.value + delta));
  localHeight.value = newHeight;
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
};

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style scoped lang="scss">
.realtime-log-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  transition: height 0.2s ease;

  &.is-collapsed {
    .realtime-log-panel__content {
      display: none;
    }

    .realtime-log-panel__resize-handle {
      display: none;
    }
  }
}

.realtime-log-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: ns-resize;
  user-select: none;

  &:active {
    cursor: ns-resize;
  }
}

.realtime-log-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.realtime-log-panel__status {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.realtime-log-panel__actions {
  display: flex;
  gap: 8px;
}

.realtime-log-panel__content {
  flex: 1;
  min-height: 0;
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
}

.realtime-log-panel__log-content {
  flex: 1;
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #0f172a;
  color: #dbeafe;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}

.realtime-log-panel__resize-handle {
  position: absolute;
  top: 38px;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: var(--el-border-color);
    border-radius: 2px;
  }

  &:hover::before {
    background: var(--el-color-primary);
  }
}
</style>
