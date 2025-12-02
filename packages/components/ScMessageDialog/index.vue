<template>
  <div v-if="isVisible" ref="dialogRef" class="sc-message-dialog" :style="{ touchAction: 'none' }">
    <!-- 面板 -->
    <div class="monitor-panel">
      <!-- 头部（拖拽区域） -->
      <div class="panel-header" :style="headerStyle">
        <div class="header-title">
          <slot name="icon">
            <IconifyIconOnline :icon="icon" class="mr-2" />
          </slot>
          {{ title }}
          <el-badge :value="activeCount" :hidden="activeCount === 0" type="primary" class="ml-2" />
        </div>
        <div class="header-actions">
          <el-button size="small" circle @click.stop="handleClear" :disabled="completedCount === 0" title="清除已完成">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </el-button>
          <el-button size="small" circle @click.stop="handleClose" title="关闭">
            <IconifyIconOnline icon="ri:close-line" />
          </el-button>
        </div>
      </div>

      <!-- 内容 -->
      <div class="panel-content">
        <slot name="content">
          <div v-if="operations.length === 0" class="empty-state">
            <slot name="empty">
              <IconifyIconOnline icon="ri:inbox-line" class="empty-icon" />
              <p>{{ emptyText }}</p>
            </slot>
          </div>

          <div v-else class="operation-list">
            <div v-for="op in operations" :key="op.id" class="operation-item" :class="[op.status]">
              <slot name="item" :operation="op">
                <div class="operation-icon">
                  <IconifyIconOnline :icon="getOperationIcon(op.type)" />
                </div>
                <div class="operation-info">
                  <div class="operation-title">{{ op.title }}</div>
                  <div class="operation-desc">{{ op.description }}</div>
                  <div v-if="op.status === 'running'" class="operation-progress">
                    <el-progress :percentage="op.progress || 0" :stroke-width="4" :show-text="false" />
                    <span class="progress-text">{{ op.progress || 0 }}%</span>
                  </div>
                  <div v-if="op.error" class="operation-error">{{ op.error }}</div>
                </div>
                <div class="operation-status">
                  <el-tag :type="getStatusType(op.status)" size="small">
                    {{ getStatusText(op.status) }}
                  </el-tag>
                </div>
              </slot>
            </div>
          </div>
        </slot>
      </div>

      <!-- 底部 -->
      <div v-if="$slots.footer" class="panel-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 消息对话框组件
 * 使用 interact.js 实现拖拽
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 简化架构，完全由 interact.js 控制
 */
import { computed, ref, onMounted, onUnmounted, nextTick, CSSProperties } from "vue";
import interact from "interactjs";

// 类型定义
export type OperationStatus = "pending" | "running" | "completed" | "failed";
export type PositionType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface Operation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: OperationStatus;
  progress?: number;
  error?: string;
}

// Props
const props = withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    position?: PositionType;
    themeColor?: string;
    operations?: Operation[];
    emptyText?: string;
    iconMap?: Record<string, string>;
    statusTextMap?: Record<string, string>;
  }>(),
  {
    title: "操作监控",
    icon: "ri:terminal-box-line",
    position: "bottom-right",
    themeColor: "#3b82f6",
    operations: () => [],
    emptyText: "暂无操作",
    iconMap: () => ({}),
    statusTextMap: () => ({
      pending: "等待中",
      running: "进行中",
      completed: "已完成",
      failed: "失败"
    })
  }
);

const emit = defineEmits<{
  clear: [];
  close: [];
}>();

// 状态
const isVisible = ref(true);
const dialogRef = ref<HTMLElement | null>(null);
let interactInstance: ReturnType<typeof interact> | null = null;

// 计算属性
const activeCount = computed(() => props.operations.filter(op => op.status === "pending" || op.status === "running").length);

const completedCount = computed(() => props.operations.filter(op => op.status === "completed" || op.status === "failed").length);

const headerStyle = computed<CSSProperties>(() => ({
  background: `linear-gradient(135deg, ${props.themeColor} 0%, ${adjustColor(props.themeColor, -20)} 100%)`
}));

/**
 * 初始化 interact.js
 */
function initInteract(): void {
  if (!dialogRef.value) return;

  destroyInteract();

  const el = dialogRef.value;
  const margin = 20;

  // 计算初始位置
  let initX = margin;
  let initY = margin;

  switch (props.position) {
    case "top-left":
      initX = margin;
      initY = margin;
      break;
    case "top-right":
      initX = window.innerWidth - 380 - margin;
      initY = margin;
      break;
    case "bottom-left":
      initX = margin;
      initY = window.innerHeight - 480 - margin;
      break;
    case "bottom-right":
    default:
      initX = window.innerWidth - 380 - margin;
      initY = window.innerHeight - 480 - margin;
      break;
  }

  // 设置初始位置
  el.style.transform = `translate(${initX}px, ${initY}px)`;
  el.setAttribute("data-x", String(initX));
  el.setAttribute("data-y", String(initY));

  // 创建 interact 实例
  interactInstance = interact(el).draggable({
    allowFrom: ".panel-header",
    modifiers: [
      interact.modifiers.restrict({
        restriction: "body",
        endOnly: false
      })
    ],
    inertia: { resistance: 15, minSpeed: 200, endSpeed: 10 },
    listeners: {
      start: () => {
        document.body.style.userSelect = "none";
      },
      move: event => {
        const target = event.target as HTMLElement;
        const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
        const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute("data-x", String(x));
        target.setAttribute("data-y", String(y));
      },
      end: () => {
        document.body.style.userSelect = "";
      }
    }
  });
}

function destroyInteract(): void {
  if (interactInstance) {
    interactInstance.unset();
    interactInstance = null;
  }
}

// 事件处理
const handleClear = () => emit("clear");
const handleClose = () => {
  isVisible.value = false;
  emit("close");
};

const show = () => {
  isVisible.value = true;
  nextTick(() => initInteract());
};

// 工具函数
const getOperationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    upload: "ri:upload-cloud-line",
    download: "ri:download-cloud-line",
    build: "ri:hammer-line",
    create: "ri:add-circle-line",
    start: "ri:play-circle-line",
    stop: "ri:stop-circle-line",
    remove: "ri:delete-bin-line"
  };
  return props.iconMap[type] || icons[type] || "ri:terminal-box-line";
};

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    pending: "info",
    running: "primary",
    completed: "success",
    failed: "danger"
  };
  return map[status] || "info";
};

const getStatusText = (status: string): string => props.statusTextMap[status] || status;

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// 生命周期
onMounted(() => nextTick(() => initInteract()));
onUnmounted(() => destroyInteract());

// 暴露方法
defineExpose({ show, handleClose, handleClear, isVisible });
</script>

<style scoped lang="scss">
.sc-message-dialog {
  position: fixed;
  z-index: 2000;
}

.monitor-panel {
  width: 380px;
  max-height: 480px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    color: white;
    cursor: move;

    .header-title {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
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
    padding: 12px;
  }

  .panel-footer {
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: var(--el-text-color-placeholder);

  .empty-icon {
    font-size: 40px;
    margin-bottom: 8px;
  }
}

.operation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operation-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border-left: 3px solid var(--el-border-color-light);

  &.running {
    border-left-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  &.completed {
    border-left-color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }
  &.failed {
    border-left-color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  .operation-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--el-bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }

  .operation-info {
    flex: 1;
    min-width: 0;

    .operation-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }

    .operation-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }

    .operation-progress {
      display: flex;
      align-items: center;
      gap: 8px;

      .progress-text {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }

    .operation-error {
      font-size: 11px;
      color: var(--el-color-danger);
      margin-top: 4px;
    }
  }
}
</style>
