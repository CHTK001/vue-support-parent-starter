<template>
  <teleport to="body">
    <!-- 窗口管理器容器 -->
    <div v-if="windowManagerStore.hasWindows" class="sc-window-manager">
      <!-- 所有窗口 -->
      <div
        v-for="window in windowManagerStore.windowInstances"
        v-show="window && !window.minimized"
        :key="window?.id || 'unknown'"
        :class="[
          'sc-window-modal',
          {
            'sc-window-maximized': window?.maximized,
            'sc-window-dragging': window?.dragging,
            'sc-window-resizing': window?.resizing,
            'sc-window-grid-mode': window?.gridMode
          }
        ]"
        :style="window ? getWindowStyle(window) : {}"
@mousedown="window && windowManagerStore.setActiveWindow(window.id)"
      >
        <!-- 窗口标题栏 -->
        <div class="sc-window-header" @mousedown="window && windowManagerStore.startDrag($event, window)" @dblclick="window && windowManagerStore.toggleMaximize(window)">
          <!-- 标题栏左侧 -->
          <div class="sc-window-header-left">
            <div class="sc-window-icon">
              <IconifyIconOnline :icon="window?.icon || 'ri:file-text-line'" style="font-size: 16px" />
            </div>
            <span class="sc-window-title">{{ window?.title || "未命名窗口" }}</span>
          </div>

          <!-- 标题栏右侧控制按钮 -->
          <div class="sc-window-header-controls">
            <button class="sc-window-control-btn sc-window-minimize-btn" title="最小化" @click="window && windowManagerStore.minimizeWindow(window)">
              <IconifyIconOnline icon="ri:subtract-line" style="font-size: 12px" />
            </button>
            <button class="sc-window-control-btn sc-window-maximize-btn" :title="window?.maximized ? '还原' : '最大化'" @click="window && windowManagerStore.toggleMaximize(window)">
              <IconifyIconOnline :icon="window?.maximized ? 'ri:picture-in-picture-exit-line' : 'ri:fullscreen-line'" style="font-size: 12px" />
            </button>
            <button class="sc-window-control-btn sc-window-close-btn" title="关闭" @click="window && windowManagerStore.closeWindow(window)">
              <IconifyIconOnline icon="ri:close-line" style="font-size: 12px" />
            </button>
          </div>
        </div>

        <!-- 窗口内容区域 -->
        <div class="sc-window-content">
          <component :is="window?.component" v-if="window?.component" v-bind="window?.props" @close="closeWindow(window)" />
          <div v-else-if="window?.content" v-html="window.content"></div>
          <div v-else class="sc-window-empty">
            <el-empty description="暂无内容" />
          </div>
        </div>

        <!-- 窗口缩放手柄 -->
        <div v-if="window?.resizable && !window?.maximized" class="sc-window-resize-handles">
          <div 
            class="sc-window-resize-handle sc-window-resize-n" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'n')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-s" 
            @mousedown="window && windowManagerStore.startResize($event, window, 's')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-w" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'w')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-e" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'e')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-nw" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'nw')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-ne" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'ne')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-sw" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'sw')"
          ></div>
          <div 
            class="sc-window-resize-handle sc-window-resize-se" 
            @mousedown="window && windowManagerStore.startResize($event, window, 'se')"
          ></div>
        </div>
      </div>

      <!-- 最小化窗口任务栏 -->
      <div v-if="windowManagerStore.minimizedWindows.length > 0" class="sc-window-taskbar">
        <div v-for="window in windowManagerStore.minimizedWindows" :key="window?.id || 'unknown'" class="sc-window-taskbar-item" :title="window?.title" @click="window && windowManagerStore.restoreWindow(window)">
          <IconifyIconOnline :icon="window?.icon || 'ri:file-text-line'" style="font-size: 16px" />
          <span class="sc-window-taskbar-title">{{ window?.title }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
/**
 * ScWindowModal - Windows风格的模态框组件
 * @author CH
 * @version 1.0.0
 * @created 2024-01-15
 * @description 提供类似Windows窗口的模态框功能，支持拖拽、缩放、最大化/最小化等操作
 */
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { ElEmpty } from "element-plus";
import { onMounted, onUnmounted } from "vue";
import { windowManagerStore } from "./composables/useWindowManager";
import type { ResizeHandle, WindowInstance } from "./types";

// 使用全局窗口管理器实例

// 缩放手柄配置
const resizeHandles: ResizeHandle[] = [
  { position: "n", cursor: "ns-resize" },
  { position: "s", cursor: "ns-resize" },
  { position: "e", cursor: "ew-resize" },
  { position: "w", cursor: "ew-resize" },
  { position: "ne", cursor: "nesw-resize" },
  { position: "nw", cursor: "nw-resize" },
  { position: "se", cursor: "nwse-resize" },
  { position: "sw", cursor: "nesw-resize" }
];

/**
 * 获取窗口样式
 * @param window 窗口实例
 * @returns 样式对象
 */
const getWindowStyle = (window: WindowInstance) => {
  if (!window) {
    return {
      left: "0px",
      top: "0px",
      width: "0px",
      height: "0px",
      zIndex: 0
    };
  }
  
  if (window.maximized) {
    return {
      left: "0px",
      top: "0px",
      width: "100vw",
      height: "100vh",
      zIndex: window.zIndex
    };
  }

  return {
    left: `${window.x}px`,
    top: `${window.y}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
    zIndex: window.zIndex
  };
};

// 组件生命周期
onMounted(() => {
  // 组件挂载时的初始化逻辑
})

onUnmounted(() => {
  // 组件卸载时的清理逻辑
  windowManagerStore.closeAllWindows()
})
</script>

<style scoped>
.sc-window-manager {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.sc-window-modal {
  position: absolute;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 300px;
  min-height: 200px;
  transform-origin: center;
  animation: windowOpen 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sc-window-modal:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.sc-window-modal.closing {
  animation: windowClose 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sc-window-maximized {
  border-radius: 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.sc-window-dragging {
  user-select: none;
  transition: none !important;
  transform: scale(1.02);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  z-index: 10000;
}

.sc-window-resizing {
  user-select: none;
  transition: none !important;
}

.sc-window-grid-mode {
  transition: all 0.1s ease;
}

/* 窗口标题栏 */
.sc-window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-bottom: 1px solid #e8e8e8;
  cursor: move;
  user-select: none;
  transition: background 0.2s ease;
}

.sc-window-modal:hover .sc-window-header {
  background: linear-gradient(135deg, #409EFF 0%, #337ecc 100%);
}

.sc-window-modal:hover .sc-window-title,
.sc-window-modal:hover .sc-window-icon {
  color: white;
  transition: color 0.2s ease;
}

.sc-window-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.sc-window-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #606266;
}

.sc-window-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc-window-header-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sc-window-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #606266;
  position: relative;
  overflow: hidden;
}

.sc-window-control-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
}

.sc-window-control-btn:hover::before {
  width: 100%;
  height: 100%;
}

.sc-window-control-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.sc-window-minimize-btn:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.sc-window-maximize-btn:hover {
  background: #f6ffed;
  color: #52c41a;
}

.sc-window-close-btn:hover {
  background: #fff2f0;
  color: #ff4d4f;
  transform: scale(1.1) rotate(90deg);
}

/* 窗口内容区域 */
.sc-window-content {
  height: calc(100% - 40px);
  overflow: auto;
  background: #ffffff;
}

.sc-window-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

/* 缩放手柄 */
.sc-window-resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sc-window-resize-handle {
  position: absolute;
  pointer-events: auto;
  z-index: 10;
  transition: background 0.2s ease;
}

.sc-window-resize-handle:hover {
  background: rgba(64, 158, 255, 0.1);
}

.sc-window-resize-n {
  top: -4px;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
}

.sc-window-resize-s {
  bottom: -4px;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
}

.sc-window-resize-e {
  top: 8px;
  right: -4px;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
}

.sc-window-resize-w {
  top: 8px;
  left: -4px;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
}

.sc-window-resize-ne {
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.sc-window-resize-nw {
  top: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
}

.sc-window-resize-se {
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.sc-window-resize-sw {
  bottom: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

/* 任务栏 */
.sc-window-taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  pointer-events: auto;
  z-index: 10000;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: taskbarSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.sc-window-taskbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 200px;
  position: relative;
  overflow: hidden;
  animation: taskbarItemAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sc-window-taskbar-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.sc-window-taskbar-item:hover::before {
  left: 100%;
}

.sc-window-taskbar-item:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.sc-window-taskbar-title {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 动画定义 */
@keyframes windowOpen {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes windowClose {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
}

@keyframes taskbarSlideIn {
  0% {
    transform: translateY(100%);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes taskbarItemAppear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 磁吸效果指示器 */
.sc-snap-indicator {
  position: absolute;
  border: 2px dashed #409EFF;
  background: rgba(64, 158, 255, 0.1);
  pointer-events: none;
  z-index: 9998;
  transition: all 0.2s ease;
}

/* 网格指示器 */
.sc-grid-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9997;
  opacity: 0;
  transition: opacity 0.2s ease;
  background-image: 
    linear-gradient(to right, #409EFF 1px, transparent 1px),
    linear-gradient(to bottom, #409EFF 1px, transparent 1px);
  background-size: 20px 20px;
}

.sc-grid-indicator.visible {
  opacity: 0.1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-window-modal {
    min-width: 280px;
    border-radius: 12px;
  }
  
  .sc-window-header {
    padding: 12px 16px;
    height: 48px;
  }
  
  .sc-window-title {
    font-size: 16px;
  }
  
  .sc-window-control-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .sc-window-taskbar {
    height: 56px;
    padding: 0 12px;
  }
  
  .sc-window-taskbar-item {
    padding: 12px 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .sc-window-modal {
    background: #2c3e50;
    color: #ecf0f1;
    border-color: #34495e;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .sc-window-header {
    background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
    border-bottom-color: #34495e;
  }
  
  .sc-window-taskbar {
    background: rgba(44, 62, 80, 0.95);
    border-top-color: #34495e;
  }
  
  .sc-window-taskbar-item {
    background: #34495e;
    border-color: #4a6741;
    color: #ecf0f1;
  }
}
</style>
