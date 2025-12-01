<template>
  <div 
    class="sc-operation-monitor" 
    :class="{ expanded: isExpanded, minimized: isMinimized }"
    :style="computedStyle"
  >
    <!-- 折叠状态显示 -->
    <div v-if="isMinimized" class="monitor-badge" :style="badgeStyle" @click="toggleExpand">
      <el-badge :value="activeCount" :hidden="activeCount === 0" type="primary">
        <div class="badge-icon">
          <slot name="icon">
            <IconifyIconOnline :icon="icon" />
          </slot>
        </div>
      </el-badge>
      <span class="badge-text">{{ title }}</span>
    </div>

    <!-- 展开状态 -->
    <div v-else class="monitor-panel" :style="panelStyle">
      <div class="panel-header" :style="headerStyle">
        <div class="header-title">
          <slot name="icon">
            <IconifyIconOnline :icon="icon" class="mr-2" />
          </slot>
          {{ title }}
          <el-badge :value="activeCount" :hidden="activeCount === 0" type="primary" class="ml-2" />
        </div>
        <div class="header-actions">
          <el-button size="small" circle @click="handleClear" :disabled="completedCount === 0" title="清除已完成">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </el-button>
          <el-button size="small" circle @click="toggleMinimize" title="最小化">
            <IconifyIconOnline icon="ri:subtract-line" />
          </el-button>
          <el-button size="small" circle @click="toggleExpand" title="关闭">
            <IconifyIconOnline icon="ri:close-line" />
          </el-button>
        </div>
      </div>

      <div class="panel-content">
        <div v-if="operations.length === 0" class="empty-state">
          <IconifyIconOnline icon="ri:inbox-line" class="empty-icon" />
          <p>{{ emptyText }}</p>
        </div>

        <div v-else class="operation-list">
          <div
            v-for="op in operations"
            :key="op.id"
            class="operation-item"
            :class="[op.status, { 'has-error': op.error }]"
          >
            <div class="operation-icon">
              <IconifyIconOnline :icon="getOperationIcon(op.type)" />
            </div>
            <div class="operation-info">
              <div class="operation-title">{{ op.title }}</div>
              <div class="operation-desc">{{ op.description }}</div>
              <div v-if="op.status === 'running'" class="operation-progress">
                <el-progress
                  :percentage="op.progress || 0"
                  :stroke-width="4"
                  :show-text="false"
                  status="primary"
                />
                <span class="progress-text">{{ op.progress || 0 }}%</span>
              </div>
              <div v-if="op.error" class="operation-error">{{ op.error }}</div>
            </div>
            <div class="operation-status">
              <el-tag :type="getStatusType(op.status)" size="small">
                {{ getStatusText(op.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, CSSProperties } from 'vue';

/**
 * 通用操作监控组件
 * 可配置位置（左下角/右下角），支持自定义主题色
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

// 操作状态类型
export type OperationStatus = 'pending' | 'running' | 'completed' | 'failed';

// 操作记录接口
export interface Operation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: OperationStatus;
  progress?: number;
  error?: string;
  createdAt?: number;
  updatedAt?: number;
}

// 位置类型
type PositionType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 组件属性
interface Props {
  /** 标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** 位置：四个角 */
  position?: PositionType;
  /** 水平偏移量(px) */
  offsetX?: number;
  /** 垂直偏移量(px) */
  offsetY?: number;
  /** 主题色 */
  themeColor?: string;
  /** 操作列表 */
  operations?: Operation[];
  /** 空状态文本 */
  emptyText?: string;
  /** 图标映射 */
  iconMap?: Record<string, string>;
  /** 状态文本映射 */
  statusTextMap?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  title: '操作监控',
  icon: 'ri:terminal-box-line',
  position: 'bottom-right',
  offsetX: 20,
  offsetY: 20,
  themeColor: '#3b82f6',
  operations: () => [],
  emptyText: '暂无操作',
  iconMap: () => ({}),
  statusTextMap: () => ({
    pending: '等待中',
    running: '进行中',
    completed: '已完成',
    failed: '失败',
  }),
});

// 事件
const emit = defineEmits<{
  (e: 'clear'): void;
  (e: 'expand', expanded: boolean): void;
}>();

const isExpanded = ref(false);
const isMinimized = ref(true);

// 计算属性
const activeCount = computed(() => 
  props.operations.filter(op => op.status === 'pending' || op.status === 'running').length
);

const completedCount = computed(() => 
  props.operations.filter(op => op.status === 'completed' || op.status === 'failed').length
);

// 计算位置样式
const computedStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    position: 'fixed',
    zIndex: 2000,
  };
  
  // 根据位置设置
  switch (props.position) {
    case 'top-left':
      style.top = `${props.offsetY}px`;
      style.left = `${props.offsetX}px`;
      break;
    case 'top-right':
      style.top = `${props.offsetY}px`;
      style.right = `${props.offsetX}px`;
      break;
    case 'bottom-left':
      style.bottom = `${props.offsetY}px`;
      style.left = `${props.offsetX}px`;
      break;
    case 'bottom-right':
    default:
      style.bottom = `${props.offsetY}px`;
      style.right = `${props.offsetX}px`;
      break;
  }
  
  return style;
});

// 徽章样式
const badgeStyle = computed<CSSProperties>(() => ({
  background: `linear-gradient(135deg, ${props.themeColor} 0%, ${adjustColor(props.themeColor, -20)} 100%)`,
  boxShadow: `0 4px 12px ${hexToRgba(props.themeColor, 0.3)}`,
}));

// 面板样式
const panelStyle = computed<CSSProperties>(() => ({}));

// 头部样式
const headerStyle = computed<CSSProperties>(() => ({
  background: `linear-gradient(135deg, ${props.themeColor} 0%, ${adjustColor(props.themeColor, -20)} 100%)`,
}));

// 切换展开/折叠
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  isMinimized.value = !isExpanded.value;
  emit('expand', isExpanded.value);
};

// 切换最小化
const toggleMinimize = () => {
  isMinimized.value = true;
  isExpanded.value = false;
  emit('expand', false);
};

// 清除已完成
const handleClear = () => {
  emit('clear');
};

// 获取操作图标
const getOperationIcon = (type: string) => {
  const defaultIcons: Record<string, string> = {
    'upload': 'ri:upload-cloud-line',
    'download': 'ri:download-cloud-line',
    'pull': 'ri:download-cloud-line',
    'push': 'ri:upload-cloud-line',
    'build': 'ri:hammer-line',
    'create': 'ri:add-circle-line',
    'start': 'ri:play-circle-line',
    'stop': 'ri:stop-circle-line',
    'restart': 'ri:restart-line',
    'remove': 'ri:delete-bin-line',
    'export': 'ri:export-line',
    'import': 'ri:import-line',
  };
  return props.iconMap[type] || defaultIcons[type] || 'ri:terminal-box-line';
};

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    'pending': 'info',
    'running': 'primary',
    'completed': 'success',
    'failed': 'danger',
  };
  return typeMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status: string) => {
  return props.statusTextMap[status] || status;
};

// 颜色调整工具函数
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
</script>

<style scoped lang="scss">
.sc-operation-monitor {
  // 位置样式通过计算属性动态设置
}

.monitor-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .badge-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
  }

  .badge-text {
    font-size: 13px;
    font-weight: 500;
    color: white;
  }
}

.monitor-panel {
  width: 380px;
  max-height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    color: white;

    .header-title {
      display: flex;
      align-items: center;
      font-size: 15px;
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
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
  }
}

.operation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.operation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 3px solid #e2e8f0;
  transition: all 0.3s ease;

  &.running {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  &.completed {
    border-left-color: #10b981;
    background: #ecfdf5;
  }

  &.failed {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  .operation-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #64748b;
    flex-shrink: 0;
  }

  .operation-info {
    flex: 1;
    min-width: 0;

    .operation-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .operation-desc {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .operation-progress {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-progress {
        flex: 1;
      }

      .progress-text {
        font-size: 11px;
        color: #64748b;
        min-width: 36px;
      }
    }

    .operation-error {
      font-size: 11px;
      color: #ef4444;
      margin-top: 4px;
    }
  }

  .operation-status {
    flex-shrink: 0;
  }
}
</style>
