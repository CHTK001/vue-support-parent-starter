<template>
  <el-dialog
    v-model="visible"
    title="批量操作"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-operation">
      <el-alert
        title="批量操作提示"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #default>
          请谨慎执行批量操作，某些操作可能无法撤销
        </template>
      </el-alert>

      <el-form :model="formData" label-width="100px">
        <el-form-item label="操作类型">
          <el-select v-model="formData.operation" placeholder="选择操作类型" style="width: 100%">
            <el-option-group label="连接操作">
              <el-option label="批量连接" value="connect" />
              <el-option label="批量断开" value="disconnect" />
              <el-option label="测试连接" value="test" />
            </el-option-group>
            <el-option-group label="监控操作">
              <el-option label="启用监控" value="enable_monitoring" />
              <el-option label="禁用监控" value="disable_monitoring" />
              <el-option label="收集指标" value="collect_metrics" />
            </el-option-group>
            <el-option-group label="状态操作">
              <el-option label="启用服务器" value="enable" />
              <el-option label="禁用服务器" value="disable" />
              <el-option label="设为维护" value="maintenance" />
            </el-option-group>
            <el-option-group label="数据操作">
              <el-option label="导出配置" value="export" />
              <el-option label="重启服务" value="restart" />
              <el-option label="删除服务器" value="delete" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="目标服务器" v-if="selectedServers.length > 0">
          <div class="server-list">
            <el-tag
              v-for="server in selectedServers"
              :key="server.id"
              type="info"
              size="small"
              class="server-tag"
            >
              {{ server.name }} ({{ server.host }}:{{ server.port }})
            </el-tag>
          </div>
          <div class="server-count">
            共选择 {{ selectedServers.length }} 台服务器
          </div>
        </el-form-item>

        <el-form-item label="执行方式" v-if="formData.operation">
          <el-radio-group v-model="formData.executeMode">
            <el-radio label="parallel">并行执行</el-radio>
            <el-radio label="sequential">顺序执行</el-radio>
          </el-radio-group>
          <div class="execute-mode-tip">
            <el-text size="small" type="info">
              并行执行速度快但可能影响系统性能，顺序执行稳定但耗时较长
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="超时时间" v-if="needsTimeout">
          <el-input-number
            v-model="formData.timeout"
            :min="5"
            :max="300"
            :step="5"
            style="width: 100%"
          />
          <div class="timeout-tip">
            <el-text size="small" type="info">单位：秒</el-text>
          </div>
        </el-form-item>

        <el-form-item label="确认操作" v-if="isDangerousOperation">
          <el-checkbox v-model="formData.confirmed">
            我确认要执行此操作，并了解可能的风险
          </el-checkbox>
        </el-form-item>
      </el-form>

      <!-- 执行进度 -->
      <div v-if="executing" class="execution-progress">
        <el-divider content-position="left">执行进度</el-divider>
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="8"
        />
        <div class="progress-info">
          <span>{{ currentOperation }}</span>
          <span class="progress-detail">{{ progressDetail }}</span>
        </div>
        
        <!-- 执行日志 -->
        <div class="execution-log">
          <div
            v-for="(log, index) in executionLogs"
            :key="index"
            class="log-item"
            :class="log.type"
          >
            <IconifyIconOnline :icon="getLogIcon(log.type)" class="log-icon" />
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="executing">取消</el-button>
        <el-button
          type="primary"
          @click="handleExecute"
          :loading="executing"
          :disabled="!canExecute"
        >
          {{ executing ? '执行中...' : '开始执行' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { message } from "@repo/utils";

// Props
const props = defineProps<{
  servers?: any[];
}>();

// Emits
const emit = defineEmits<{
  success: [];
}>();

// 状态
const visible = ref(false);
const executing = ref(false);
const progress = ref(0);
const progressStatus = ref<'success' | 'exception' | undefined>();
const currentOperation = ref('');
const progressDetail = ref('');
const executionLogs = ref<any[]>([]);

// 表单数据
const formData = reactive({
  operation: '',
  executeMode: 'parallel',
  timeout: 30,
  confirmed: false
});

// 选中的服务器
const selectedServers = ref<any[]>([]);

// 计算属性
const needsTimeout = computed(() => {
  return ['connect', 'test', 'restart'].includes(formData.operation);
});

const isDangerousOperation = computed(() => {
  return ['delete', 'restart', 'disable'].includes(formData.operation);
});

const canExecute = computed(() => {
  if (!formData.operation || selectedServers.value.length === 0) {
    return false;
  }
  
  if (isDangerousOperation.value && !formData.confirmed) {
    return false;
  }
  
  return true;
});

// 方法
const open = (servers: any[] = []) => {
  selectedServers.value = servers;
  visible.value = true;
  resetForm();
};

const resetForm = () => {
  formData.operation = '';
  formData.executeMode = 'parallel';
  formData.timeout = 30;
  formData.confirmed = false;
  
  executing.value = false;
  progress.value = 0;
  progressStatus.value = undefined;
  currentOperation.value = '';
  progressDetail.value = '';
  executionLogs.value = [];
};

const handleClose = () => {
  if (executing.value) {
    message.warning('操作执行中，请等待完成');
    return;
  }
  visible.value = false;
  resetForm();
};

const handleExecute = async () => {
  if (!canExecute.value) return;

  try {
    executing.value = true;
    progressStatus.value = undefined;
    executionLogs.value = [];
    
    addLog('info', '开始执行批量操作...');
    
    if (formData.executeMode === 'parallel') {
      await executeParallel();
    } else {
      await executeSequential();
    }
    
    progressStatus.value = 'success';
    addLog('success', '批量操作执行完成');
    message.success('批量操作执行成功');
    
    setTimeout(() => {
      emit('success');
      handleClose();
    }, 2000);
    
  } catch (error) {
    progressStatus.value = 'exception';
    addLog('error', `批量操作执行失败: ${error}`);
    message.error('批量操作执行失败');
  } finally {
    executing.value = false;
  }
};

const executeParallel = async () => {
  currentOperation.value = '并行执行操作...';
  
  const promises = selectedServers.value.map((server, index) => 
    executeServerOperation(server, index)
  );
  
  await Promise.allSettled(promises);
  progress.value = 100;
};

const executeSequential = async () => {
  currentOperation.value = '顺序执行操作...';
  
  for (let i = 0; i < selectedServers.value.length; i++) {
    const server = selectedServers.value[i];
    await executeServerOperation(server, i);
    progress.value = Math.round(((i + 1) / selectedServers.value.length) * 100);
  }
};

const executeServerOperation = async (server: any, index: number) => {
  try {
    progressDetail.value = `正在处理: ${server.name}`;
    addLog('info', `开始处理服务器: ${server.name} (${server.host}:${server.port})`);
    
    // 模拟操作执行
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 根据操作类型执行不同的逻辑
    switch (formData.operation) {
      case 'connect':
        addLog('success', `${server.name}: 连接成功`);
        break;
      case 'disconnect':
        addLog('success', `${server.name}: 断开连接成功`);
        break;
      case 'test':
        addLog('success', `${server.name}: 连接测试通过`);
        break;
      case 'enable_monitoring':
        addLog('success', `${server.name}: 监控已启用`);
        break;
      case 'disable_monitoring':
        addLog('success', `${server.name}: 监控已禁用`);
        break;
      case 'collect_metrics':
        addLog('success', `${server.name}: 指标收集完成`);
        break;
      case 'enable':
        addLog('success', `${server.name}: 服务器已启用`);
        break;
      case 'disable':
        addLog('success', `${server.name}: 服务器已禁用`);
        break;
      case 'maintenance':
        addLog('success', `${server.name}: 已设为维护模式`);
        break;
      case 'export':
        addLog('success', `${server.name}: 配置导出完成`);
        break;
      case 'restart':
        addLog('success', `${server.name}: 服务重启完成`);
        break;
      case 'delete':
        addLog('success', `${server.name}: 删除完成`);
        break;
      default:
        addLog('success', `${server.name}: 操作完成`);
    }
    
    if (formData.executeMode === 'parallel') {
      progress.value = Math.round(((index + 1) / selectedServers.value.length) * 100);
    }
    
  } catch (error) {
    addLog('error', `${server.name}: 操作失败 - ${error}`);
    throw error;
  }
};

const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
  executionLogs.value.push({
    type,
    message,
    time: new Date()
  });
};

const getLogIcon = (type: string) => {
  const iconMap = {
    info: 'ri:information-line',
    success: 'ri:check-line',
    warning: 'ri:alert-line',
    error: 'ri:close-line'
  };
  return iconMap[type as keyof typeof iconMap] || 'ri:information-line';
};

const formatTime = (time: Date) => {
  return time.toLocaleTimeString();
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.batch-operation {
  .server-list {
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    padding: 8px;
    background-color: var(--el-fill-color-extra-light);

    .server-tag {
      margin: 2px 4px 2px 0;
    }
  }

  .server-count {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .execute-mode-tip,
  .timeout-tip {
    margin-top: 4px;
  }

  .execution-progress {
    margin-top: 20px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 14px;

      .progress-detail {
        color: var(--el-text-color-secondary);
      }
    }

    .execution-log {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 16px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      background-color: var(--el-fill-color-extra-light);

      .log-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        font-size: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        &.success {
          color: var(--el-color-success);
        }

        &.warning {
          color: var(--el-color-warning);
        }

        &.error {
          color: var(--el-color-danger);
        }

        &.info {
          color: var(--el-text-color-regular);
        }

        .log-icon {
          margin-right: 6px;
          flex-shrink: 0;
        }

        .log-time {
          margin-right: 8px;
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }

        .log-message {
          flex: 1;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}
</style>
