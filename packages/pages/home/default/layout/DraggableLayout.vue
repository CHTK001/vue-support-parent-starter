<script setup>
import "gridstack/dist/gridstack.min.css";

import { GridStack } from "gridstack";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

import { useLayoutLayoutStore } from "@repo/core";

const loadingCollection = {};
const userLayoutObject = useLayoutLayoutStore();

/**
 * gridstack 网格配置（精度来自网格粒度）
 * - 列数越大：横向缩放更细
 * - cellHeight 越小：纵向缩放更细
 */
const getGridMeta = () => userLayoutObject.getGridMeta?.() || { columnCount: 12, cellHeight: 90, margin: 12 };

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const gridEl = ref();
const gridRef = ref();

/**
 * 获取部件标题
 * @param key 部件key
 */
const getWidgetTitle = (key) => {
  const comp = userLayoutObject.getComponent(key);
  return comp?.sysSfcChineseName || comp?.sysSfcName || "未命名部件";
};

/**
 * 获取部件类型标签
 * @param item 部件项
 */
const getTypeLabel = (item) => {
  return item.type === 1 ? "本地" : "远程";
};

/**
 * 编辑模式下，是否正在展示真实组件内容。
 * - 本地组件：编辑模式下一直可见
 * - 远程组件：由“预览/隐藏”开关控制
 * @param item 部件项
 */
const isEditingContentVisible = (item) => {
  if (!props.modelValue) {
    return false;
  }
  if (item?.type === 1) {
    return true;
  }
  return !!userLayoutObject.loadRemoteComponent(item.id);
};

/**
 * 隐藏组件
 * @param key 隐藏组件
 */
const handleRemove = async (key) => {
  userLayoutObject.removeComp(key);
};

/**
 * 初始化/刷新 gridstack。
 * 只在“部件列表变化”时刷新，拖拽/缩放过程中仅同步数据，不重建实例。
 */
const initGridStack = async () => {
  await nextTick();
  if (!gridEl.value) {
    return;
  }

  if (gridRef.value) {
    gridRef.value.destroy(false);
    gridRef.value = null;
  }

  const grid = GridStack.init(
    {
      column: getGridMeta().columnCount,
      cellHeight: getGridMeta().cellHeight,
      margin: getGridMeta().margin,
      float: true,
      animate: true,
      disableOneColumnMode: false,
      minRow: 1,
      draggable: true,
      resizable: {
        handles: "all",
      },
    },
    gridEl.value,
  );

  grid.on("change", (event, items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }
    items.forEach((node) => {
      userLayoutObject.updateComponent(node);
      userLayoutObject.updateLayout(node);
    });
  });

  gridRef.value = grid;
  if (props.modelValue) {
    grid.enable();
  } else {
    grid.disable();
  }
};

const setEditMode = (enabled) => {
  if (!gridRef.value) {
    return;
  }
  if (enabled) {
    gridRef.value.enable();
    return;
  }
  gridRef.value.disable();
};

watch(
  () => props.modelValue,
  (val) => {
    setEditMode(!!val);
  },
);

watch(
  () => (userLayoutObject.layout || []).map((it) => it?.id).join(","),
  () => {
    initGridStack();
  },
);

onMounted(() => {
  initGridStack();
});

onUnmounted(() => {
  if (gridRef.value) {
    gridRef.value.destroy(false);
    gridRef.value = null;
  }
});
</script>

<template>
  <div class="customizing h-full">
    <div ref="gridEl" class="grid-stack grid-layout-container">
      <div
        v-for="item in userLayoutObject.layout"
        :key="item.id"
        class="grid-stack-item"
        :gs-id="item.id"
        :gs-x="item.x"
        :gs-y="item.y"
        :gs-w="item.w"
        :gs-h="item.h"
        :gs-min-w="item.minW || 1"
        :gs-min-h="item.minH || 1"
        :gs-max-w="item.maxW || 12"
        :gs-max-h="item.maxH || undefined"
        :gs-no-move="!props.modelValue"
        :gs-no-resize="!props.modelValue"
      >
        <div class="grid-stack-item-content">
          <div class="widgets-item">
            <!-- 部件内容 -->
            <div class="widget-content h-full">
              <el-skeleton
                class="h-full"
                :loading="userLayoutObject.isLoaded(item.id, loadingCollection)"
                animated
              >
                <template #template>
                  <div class="!w-full !h-full" style="width: 100% !important">
                    <div
                      class="!h-full"
                      v-if="
                        (item.type == 1 && props.modelValue) ||
                        !props.modelValue ||
                        userLayoutObject.loadRemoteComponent(item.id)
                      "
                    >
                      <keep-alive class="!h-full">
                        <component
                          class="!h-full"
                          :is="userLayoutObject.loadComponent(item.id)"
                          :frameInfo="userLayoutObject.loadFrameInfo(item.id)"
                          :key="userLayoutObject.loadFrameInfo(item.id).key"
                          @loaded="
                            () => userLayoutObject.loaded(item.id, loadingCollection)
                          "
                        />
                      </keep-alive>
                    </div>
                    <div v-else-if="props.modelValue" class="widget-placeholder">
                      <span class="placeholder-text">{{
                        getWidgetTitle(item.id)
                      }}</span>
                    </div>
                  </div>
                </template>
              </el-skeleton>
            </div>

            <!-- 编辑模式遮罩层 -->
            <div
              v-if="props.modelValue"
              class="customize-overlay"
              :class="{
                'is-local': item.type === 1,
                'is-minimal': isEditingContentVisible(item),
              }"
            >
              <!-- 操作按钮组 -->
              <div class="overlay-actions">
                <el-tooltip content="预览/隐藏" placement="top" v-if="item.type != 1">
                  <el-button
                    :type="
                      userLayoutObject.loadRemoteComponent(item.id)
                        ? 'primary'
                        : 'info'
                    "
                    size="small"
                    @click.stop="
                      userLayoutObject.loadRemoteComponent(
                        item.id,
                        !userLayoutObject.loadRemoteComponent(item.id),
                      )
                    "
                  >
                    {{ userLayoutObject.loadRemoteComponent(item.id) ? "隐藏" : "预览" }}
                  </el-button>
                </el-tooltip>
                <el-tooltip content="移除部件" placement="top">
                  <el-button
                    type="danger"
                    size="small"
                    @click.stop="handleRemove(item.id)"
                  >
                    移除
                  </el-button>
                </el-tooltip>
              </div>

              <!-- 信息展示区域 -->
              <div v-if="!isEditingContentVisible(item)" class="drag-area">
                <div class="drag-info">
                  <span class="drag-title">{{ getWidgetTitle(item.id) }}</span>
                  <el-tag
                    size="small"
                    :type="item.type === 1 ? 'success' : 'primary'"
                    class="drag-type"
                  >
                    {{ getTypeLabel(item) }}
                  </el-tag>
                </div>
                <div class="drag-hint">
                  <span>拖拽移动</span>
                </div>
              </div>

              <!-- 调整大小提示 -->
              <div v-if="!isEditingContentVisible(item)" class="resize-hint" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* gridstack 容器 */
.grid-layout-container {
  padding: 10px;
}

/* 让 gridstack 的内容撑满 */
::deep(.grid-stack-item-content) {
  width: 100%;
  height: 100%;
  background: transparent;
  pointer-events: auto;
}

/* resize handle 置顶，避免被遮罩层挡住 */
::deep(.grid-stack-item > .ui-resizable-handle),
::deep(.grid-stack-item > .gs-resize-handle) {
  z-index: 99;
  width: 20px;
  height: 20px;
  background: var(--el-color-primary);
  border: 2px solid var(--el-bg-color);
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

::deep(.grid-stack-item > .ui-resizable-handle:hover),
::deep(.grid-stack-item > .gs-resize-handle:hover) {
  opacity: 1;
  transform: scale(1.2);
}

/* 四角 resize handle */
::deep(.grid-stack-item > .ui-resizable-se),
::deep(.grid-stack-item > .gs-resize-handle-se) {
  cursor: nwse-resize;
}

::deep(.grid-stack-item > .ui-resizable-sw),
::deep(.grid-stack-item > .gs-resize-handle-sw) {
  cursor: nesw-resize;
}

::deep(.grid-stack-item > .ui-resizable-ne),
::deep(.grid-stack-item > .gs-resize-handle-ne) {
  cursor: nesw-resize;
}

::deep(.grid-stack-item > .ui-resizable-nw),
::deep(.grid-stack-item > .gs-resize-handle-nw) {
  cursor: nwse-resize;
}

/* 边缘 resize handle */
::deep(.grid-stack-item > .ui-resizable-n),
::deep(.grid-stack-item > .gs-resize-handle-n) {
  cursor: ns-resize;
  width: 100%;
  height: 10px;
  top: -5px;
  left: 0;
}

::deep(.grid-stack-item > .ui-resizable-s),
::deep(.grid-stack-item > .gs-resize-handle-s) {
  cursor: ns-resize;
  width: 100%;
  height: 10px;
  bottom: -5px;
  left: 0;
}

::deep(.grid-stack-item > .ui-resizable-e),
::deep(.grid-stack-item > .gs-resize-handle-e) {
  cursor: ew-resize;
  width: 10px;
  height: 100%;
  right: -5px;
  top: 0;
}

::deep(.grid-stack-item > .ui-resizable-w),
::deep(.grid-stack-item > .gs-resize-handle-w) {
  cursor: ew-resize;
  width: 10px;
  height: 100%;
  left: -5px;
  top: 0;
}

/* 基础布局 */
.widgets-item {
  position: relative;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease, background 0.3s ease, transform 0.2s ease;
  will-change: transform;

  /* Glassmorphism Support */
  [data-theme="glass"] & {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

.widgets-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

  [data-theme="glass"] & {
    background: rgba(255, 255, 255, 0.75);
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  }
}

/* 部件内容 */
.widget-content {
  border-radius: 8px;
  overflow: hidden;
}

/* 拖拽时的视觉反馈 */
::deep(.grid-stack-item.ui-draggable-dragging) {
  opacity: 0.8;
  z-index: 1000;
  transform: rotate(2deg);
}

::deep(.grid-stack-item.ui-resizable-resizing) {
  opacity: 0.9;
  z-index: 1000;
}

/* 占位符样式 */
.widget-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-light),
    var(--el-fill-color)
  );
  gap: 12px;

  [data-theme="glass"] & {
    background: transparent;
  }

  .placeholder-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
}

/* 编辑模式下整个卡片可拖动 */
::deep(.grid-stack-item:not(.ui-draggable-disabled)) .widgets-item {
  cursor: move;
}


/* 编辑模式遮罩层 */
.customize-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 2px dashed var(--el-color-primary-light-3);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  pointer-events: none;

  [data-theme="glass"] & {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.customize-overlay.is-local {
  background: transparent;
  backdrop-filter: none;
}

.customize-overlay.is-minimal {
  background: transparent;
  border: none;
  backdrop-filter: none;
}

.widgets-item:hover .customize-overlay {
  border-color: var(--el-color-primary);
}

/* 操作按钮组 */
.overlay-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 11;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  pointer-events: auto;

  :deep(.el-button) {
    height: 28px;
    padding: 0 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.widgets-item:hover .overlay-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 拖拽区域（信息展示区域） */
.drag-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  pointer-events: none;
}

.drag-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.drag-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-type {
  border-radius: 4px;
}

.drag-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 8px;
  opacity: 0.8;
}

/* 调整大小提示 */
.resize-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  opacity: 0.6;
  pointer-events: none;
}

.resize-hint::after {
  content: "";
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--el-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
  transform: rotate(-45deg);
}

/* 深色模式 */
.dark {
  .widgets-item {
    background: var(--el-bg-color);

    [data-theme="glass"] & {
      background: rgba(30, 30, 30, 0.6);
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  .customize-overlay {
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(8px);

    [data-theme="glass"] & {
      background: rgba(0, 0, 0, 0.5);
    }
  }

  .widgets-item:hover .customize-overlay {
    background: rgba(30, 30, 30, 0.95);

    [data-theme="glass"] & {
      background: rgba(0, 0, 0, 0.6);
    }
  }

  .widget-placeholder {
    background: linear-gradient(
      135deg,
      var(--el-fill-color),
      var(--el-fill-color-dark)
    );

    [data-theme="glass"] & {
      background: transparent;
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .drag-area {
    padding: 12px;
  }

  .drag-title {
    font-size: 13px;
  }

  .overlay-actions :deep(.el-button) {
    height: 28px;
    padding: 0 8px;
  }
}
</style>
