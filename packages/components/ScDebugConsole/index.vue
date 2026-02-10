<template>
  <Teleport to="body">
    <div 
      v-if="isVisible" 
      ref="el" 
      class="sc-debug-console"
      :style="style"
    >
      <div class="console-panel">
        <!-- 头部（拖拽区域） -->
        <div 
          ref="handle"
          class="panel-header"
        >
          <div class="header-title">
            <IconifyIconOnline icon="ri:terminal-box-line" class="mr-2" />
            调试控制台
            <el-badge :value="logs.length" :hidden="logs.length === 0" type="primary" class="ml-2" />
          </div>
          <div class="header-actions">
            <el-button size="small" circle @click.stop="handleClear" :disabled="logs.length === 0" title="清空日志" @mousedown.stop>
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
            <el-button size="small" circle @click.stop="handleClose" title="关闭" @mousedown.stop>
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </div>
        </div>

        <!-- 内容 -->
        <div class="panel-content" ref="contentRef">
          <div v-if="logs.length === 0" class="empty-state">
            <IconifyIconOnline icon="ri:terminal-line" class="empty-icon" />
            <p>暂无日志输出</p>
          </div>

          <div v-else class="log-list">
            <div v-for="log in logs" :key="log.id" class="log-item" :class="[log.type]">
              <div class="log-type">
                <IconifyIconOnline :icon="getLogIcon(log.type)" />
              </div>
              <div class="log-content">
                <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                <div class="log-message">{{ log.message }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 调试控制台组件
 * 用于显示 console.log 等日志输出
 * @author CH
 * @version 1.1.0
 * @since 2025-12-03
 * @description 使用 @vueuse/core useDraggable 重构，优化性能和体验
 */
import { ref, onMounted, onUnmounted, nextTick, shallowRef, markRaw } from "vue";
import { enableConsoleProxy, disableConsoleProxy, type LogEntry, type LogType } from "@repo/utils";
import { useDraggable, useWindowSize } from '@vueuse/core';

const emit = defineEmits<{
  close: [];
}>();

// 状态
const isVisible = ref(true);
const el = ref<HTMLElement | null>(null);
const handle = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

// 使用 shallowRef 优化大数据量下的响应式性能
const logs = shallowRef<LogEntry[]>([]);
let unsubscribe: (() => void) | null = null;

// 窗口尺寸
const { width: windowWidth } = useWindowSize();

// 初始化位置：右上角
const initialValue = { x: windowWidth.value - 420, y: 80 };

// 使用 VueUse 的 useDraggable
// storageKey: 可选，如果需要记住位置可以配置
// storageType: 'local' | 'session'
const { style, isDragging } = useDraggable(el, {
  initialValue,
  handle: handle,
  preventDefault: true,
  stopPropagation: true,
});

/** 获取日志图标 */
const getLogIcon = (type: LogType): string => {
  const icons: Record<LogType, string> = {
    log: "ri:terminal-line",
    info: "ri:information-line",
    warn: "ri:alert-line",
    error: "ri:error-warning-line",
    debug: "ri:bug-line"
  };
  return icons[type] || "ri:terminal-line";
};

/** 格式化时间 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
};

/** 处理日志回调 */
const handleLog = (entry: LogEntry): void => {
  // 拖拽过程中暂停日志更新，避免 DOM 变更引起的重排影响拖拽流畅度
  if (isDragging.value) return;
  
  // 使用 markRaw 避免 Vue 对日志对象进行深度代理
  const newLogs = [...logs.value, markRaw(entry)];
  
  // 限制日志数量
  if (newLogs.length > 100) {
    newLogs.shift();
  }
  
  logs.value = newLogs;
  
  // 滚动到底部
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight;
    }
  });
};

/** 清空日志 */
const handleClear = (): void => {
  logs.value = [];
};

/** 关闭控制台 */
const handleClose = (): void => {
  isVisible.value = false;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  disableConsoleProxy();
  emit("close");
};

/** 显示控制台 */
const show = (): void => {
  isVisible.value = true;
  logs.value = [];
  unsubscribe = enableConsoleProxy(handleLog);
};

onMounted(() => {
  unsubscribe = enableConsoleProxy(handleLog);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  disableConsoleProxy();
});

defineExpose({ show, handleClose, isVisible });
</script>

<style scoped lang="scss">
.sc-debug-console {
  position: fixed;
  z-index: 9999;
  /* 初始位置由 style 绑定控制 */
  
  /* 硬件加速提示 */
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

.console-panel {
  width: 400px;
  max-height: 400px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    cursor: move;
    user-select: none;
    /* 确保触摸操作不会触发浏览器默认行为 */
    touch-action: none;

    .header-title {
      display: flex;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      /* 避免文字选中干扰拖拽 */
      pointer-events: none;
    }

    .header-actions {
      display: flex;
      gap: 4px;

      .el-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    max-height: 340px;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 12px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  color: var(--el-text-color-placeholder);

  .empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border-left: 3px solid var(--el-border-color);

  &.log {
    border-left-color: var(--el-color-info);
  }
  &.info {
    border-left-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  &.warn {
    border-left-color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }
  &.error {
    border-left-color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
  &.debug {
    border-left-color: #9333ea;
    background: rgba(147, 51, 234, 0.1);
  }

  .log-type {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  .log-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    .log-time {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 2px;
    }

    .log-message {
      color: var(--el-text-color-primary);
      word-break: break-all;
      white-space: pre-wrap;
    }
  }
}
</style>
