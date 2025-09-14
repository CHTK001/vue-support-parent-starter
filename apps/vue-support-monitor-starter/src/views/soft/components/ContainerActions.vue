<template>
  <div class="container-actions">
    <el-button-group v-if="!compact">
      <el-button
        v-if="canStart"
        type="success"
        size="small"
        :loading="loading.start"
        @click="handleStart"
      >
        <el-icon><VideoPlay /></el-icon>
        启动
      </el-button>
      
      <el-button
        v-if="canStop"
        type="warning"
        size="small"
        :loading="loading.stop"
        @click="handleStop"
      >
        <el-icon><VideoPause /></el-icon>
        停止
      </el-button>
      
      <el-button
        v-if="canRestart"
        type="primary"
        size="small"
        :loading="loading.restart"
        @click="handleRestart"
      >
        <el-icon><Refresh /></el-icon>
        重启
      </el-button>
      
      <el-button
        v-if="canRemove"
        type="danger"
        size="small"
        :loading="loading.remove"
        @click="handleRemove"
      >
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </el-button-group>
    
    <!-- 紧凑模式下使用下拉菜单 -->
    <el-dropdown v-else @command="handleCommand">
      <el-button size="small">
        操作
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-if="canStart" 
            command="start"
            :disabled="loading.start"
          >
            <el-icon><VideoPlay /></el-icon>
            启动
          </el-dropdown-item>
          
          <el-dropdown-item 
            v-if="canStop" 
            command="stop"
            :disabled="loading.stop"
          >
            <el-icon><VideoPause /></el-icon>
            停止
          </el-dropdown-item>
          
          <el-dropdown-item 
            v-if="canRestart" 
            command="restart"
            :disabled="loading.restart"
          >
            <el-icon><Refresh /></el-icon>
            重启
          </el-dropdown-item>
          
          <el-dropdown-item 
            v-if="canRemove" 
            command="remove"
            :disabled="loading.remove"
            divided
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-dropdown-item>
          
          <el-dropdown-item command="logs" divided>
            <el-icon><Document /></el-icon>
            查看日志
          </el-dropdown-item>
          
          <el-dropdown-item command="stats">
            <el-icon><TrendCharts /></el-icon>
            性能监控
          </el-dropdown-item>
          
          <el-dropdown-item command="terminal">
            <el-icon><Monitor /></el-icon>
            进入终端
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 额外操作按钮 -->
    <div class="extra-actions" v-if="!compact">
      <el-button size="small" @click="$emit('view-logs', container)">
        <el-icon><Document /></el-icon>
      </el-button>
      
      <el-button size="small" @click="$emit('view-stats', container)">
        <el-icon><TrendCharts /></el-icon>
      </el-button>
      
      <el-button size="small" @click="$emit('open-terminal', container)">
        <el-icon><Monitor /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessageBox, message } from '@repo/utils';
import {
  VideoPlay,
  VideoPause,
  Refresh,
  Delete,
  Document,
  TrendCharts,
  Monitor,
  ArrowDown
} from '@element-plus/icons-vue';
import type { SystemSoftContainer } from '@/api/soft';
import {
  startSoftContainer,
  stopSoftContainer,
  removeSoftContainer
} from '@/api/soft';

interface Props {
  container: SystemSoftContainer;
  compact?: boolean;
}

interface Emits {
  (e: 'action-success', action: string, container: SystemSoftContainer): void;
  (e: 'view-logs', container: SystemSoftContainer): void;
  (e: 'view-stats', container: SystemSoftContainer): void;
  (e: 'open-terminal', container: SystemSoftContainer): void;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
});

const emit = defineEmits<Emits>();

const loading = ref({
  start: false,
  stop: false,
  restart: false,
  remove: false
});

// 计算容器可执行的操作
const canStart = computed(() => {
  return ['stopped', 'exited', 'paused'].includes(props.container.status);
});

const canStop = computed(() => {
  return ['running', 'restarting'].includes(props.container.status);
});

const canRestart = computed(() => {
  return ['running', 'stopped', 'exited'].includes(props.container.status);
});

const canRemove = computed(() => {
  return ['stopped', 'exited'].includes(props.container.status);
});

// 操作处理函数
const handleStart = async () => {
  loading.value.start = true;
  try {
    await startSoftContainer(props.container.containerId!);
    message.success('容器启动成功');
    emit('action-success', 'start', props.container);
  } catch (error) {
    message.error('容器启动失败');
  } finally {
    loading.value.start = false;
  }
};

const handleStop = async () => {
  loading.value.stop = true;
  try {
    await stopSoftContainer(props.container.containerId!);
    message.success('容器停止成功');
    emit('action-success', 'stop', props.container);
  } catch (error) {
    message.error('容器停止失败');
  } finally {
    loading.value.stop = false;
  }
};

const handleRestart = async () => {
  loading.value.restart = true;
  try {
    // 先停止再启动
    if (canStop.value) {
      await stopSoftContainer(props.container.containerId!);
      // 等待一秒后启动
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await startSoftContainer(props.container.containerId!);
    message.success('容器重启成功');
    emit('action-success', 'restart', props.container);
  } catch (error) {
    message.error('容器重启失败');
  } finally {
    loading.value.restart = false;
  }
};

const handleRemove = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除容器 "${props.container.containerName}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    loading.value.remove = true;
    await removeSoftContainer(props.container.containerId!);
    message.success('容器删除成功');
    emit('action-success', 'remove', props.container);
  } catch (error) {
    if (error !== 'cancel') {
      message.error('容器删除失败');
    }
  } finally {
    loading.value.remove = false;
  }
};

// 下拉菜单命令处理
const handleCommand = (command: string) => {
  switch (command) {
    case 'start':
      handleStart();
      break;
    case 'stop':
      handleStop();
      break;
    case 'restart':
      handleRestart();
      break;
    case 'remove':
      handleRemove();
      break;
    case 'logs':
      emit('view-logs', props.container);
      break;
    case 'stats':
      emit('view-stats', props.container);
      break;
    case 'terminal':
      emit('open-terminal', props.container);
      break;
  }
};
</script>

<style scoped>
.container-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.extra-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #e4e7ed;
}

.extra-actions .el-button {
  padding: 4px 8px;
}

@media (max-width: 768px) {
  .container-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .extra-actions {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #e4e7ed;
    padding-top: 8px;
    justify-content: center;
  }
}
</style>