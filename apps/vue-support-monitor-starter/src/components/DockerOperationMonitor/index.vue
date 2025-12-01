<template>
  <div class="docker-operation-monitor" :class="{ expanded: isExpanded, minimized: isMinimized }">
    <!-- 折叠状态显示 -->
    <div v-if="isMinimized" class="monitor-badge" @click="toggleExpand">
      <el-badge :value="activeOperations.length" :hidden="activeOperations.length === 0" type="primary">
        <div class="badge-icon">
          <IconifyIconOnline icon="ri:docker-line" />
        </div>
      </el-badge>
      <span class="badge-text">Docker操作</span>
    </div>

    <!-- 展开状态 -->
    <div v-else class="monitor-panel">
      <div class="panel-header">
        <div class="header-title">
          <IconifyIconOnline icon="ri:docker-line" class="mr-2" />
          Docker操作监控
          <el-badge :value="activeOperations.length" :hidden="activeOperations.length === 0" type="primary" class="ml-2" />
        </div>
        <div class="header-actions">
          <el-button size="small" circle @click="clearCompleted" :disabled="completedCount === 0" title="清除已完成">
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
          <p>暂无操作</p>
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
import { computed, ref } from 'vue';
import { useDockerOperationStore, type DockerOperation } from '@/stores/dockerOperation';

/**
 * Docker操作监控组件
 * 显示在右下角，实时监控Docker相关操作
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

const store = useDockerOperationStore();

const isExpanded = ref(false);
const isMinimized = ref(true);

// 计算属性
const operations = computed(() => store.operations);
const activeOperations = computed(() => store.activeOperations);
const completedCount = computed(() => 
  operations.value.filter(op => op.status === 'completed' || op.status === 'failed').length
);

// 切换展开/折叠
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  isMinimized.value = !isExpanded.value;
};

// 切换最小化
const toggleMinimize = () => {
  isMinimized.value = true;
  isExpanded.value = false;
};

// 清除已完成的操作
const clearCompleted = () => {
  store.clearCompleted();
};

// 获取操作图标
const getOperationIcon = (type: string) => {
  const iconMap: Record<string, string> = {
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
  return iconMap[type] || 'ri:terminal-box-line';
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
  const textMap: Record<string, string> = {
    'pending': '等待中',
    'running': '进行中',
    'completed': '已完成',
    'failed': '失败',
  };
  return textMap[status] || status;
};
</script>

<style scoped lang="scss">
.docker-operation-monitor {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2000;
}

.monitor-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2496ED 0%, #1a7bc9 100%);
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(36, 150, 237, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(36, 150, 237, 0.4);
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
    background: linear-gradient(135deg, #2496ED 0%, #1a7bc9 100%);
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
