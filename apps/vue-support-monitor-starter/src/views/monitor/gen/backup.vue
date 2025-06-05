<template>
  <div class="backup-container">
    <el-drawer v-model="visible" title="备份配置" size="90%" :close-on-click-modal="false" @close="handleClose">
      <div class="backup-header px-4 py-2 border-b flex items-center gap-3">
        <el-button type="primary" @click="handleManualBackup">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          手动备份
        </el-button>
        <el-button v-if="!isBackupEnabled" type="success" @click="handleStartBackup" title="开启增量备份">
          <IconifyIconOnline icon="ri:lock-unlock-line" class="mr-1" />
          开启增量备份
        </el-button>
        <el-button v-else type="danger" @click="handleStopBackup" title="停止增量备份">
          <IconifyIconOnline icon="ri:lock-2-line" class="mr-1" />
          停止增量备份
        </el-button>
      </div>
      
      <el-container class="backup-content h-full">
        <!-- 左侧表单 -->
        <el-aside width="450px" class="border-r">
          <div class="backup-form p-4">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
              <el-form-item label="备份保留天数" prop="monitorSysGenBackupRetentionDays">
                <el-input-number v-model="form.monitorSysGenBackupRetentionDays" :min="1" :max="365" class="w-full" />
              </el-form-item>
              
              <el-form-item label="备份存储路径" prop="monitorSysGenBackupPath">
                <el-input v-model="form.monitorSysGenBackupPath" placeholder="请输入备份存储路径">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:folder-line" />
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="备份频率(天)" prop="monitorSysGenBackupDay">
                <el-input-number v-model="form.monitorSysGenBackupDay" :min="1" :max="365" class="w-full" />
              </el-form-item>
              
              <el-form-item label="重试次数" prop="monitorSysGenBackupRetry">
                <el-input-number v-model="form.monitorSysGenBackupRetry" :min="0" :max="10" class="w-full" />
              </el-form-item>
              
              <el-form-item label="超时时间(秒)" prop="monitorSysGenBackupTimeout">
                <el-input-number v-model="form.monitorSysGenBackupTimeout" :min="30" :max="3600" class="w-full" />
              </el-form-item>
              
              <el-form-item label="是否启用" prop="monitorSysGenBackupEnable">
                <el-switch v-model="form.monitorSysGenBackupEnable" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSaveConfig">保存配置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-aside>
        
        <!-- 右侧日志 -->
        <el-main class="backup-logs">
          <div class="logs-header pb-2 mb-2 border-b">
            <div class="text-lg font-medium flex items-center">
              <IconifyIconOnline icon="ri:file-list-line" class="mr-2" />
              实时备份日志
            </div>
          </div>
          <el-scrollbar height="calc(100% - 40px)" ref="logScrollRef">
            <div class="log-container p-2 font-mono text-sm">
              <div v-if="logs.length === 0" class="text-gray-400 py-4 text-center">
                暂无日志记录，启动备份后将显示实时日志
              </div>
              <div v-for="log in logs" :key="log.id" :class="['log-item py-1', log.type]">
                <template v-if="log.msg">
                   <span class="log-time text-gray-500 mr-2">{{ formatTime(log.timestamp || new Date()) }}</span>
                   <span :class="getLogClass(log.type)">{{ log.msg }}</span>
                </template>
              </div>
            </div>
          </el-scrollbar>
        </el-main>
      </el-container>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineExpose, nextTick, computed, onBeforeUnmount } from 'vue'
import { fetchGenBackupGet, fetchGenBackupSave, fetchGenBackupEdit, fetchGenBackupRun } from "@/api/monitor/gen/backup-all";
import { fetchGenBackupStart, fetchGenBackupStop } from "@/api/monitor/gen/backup";
import { message, useUUID, splitToArray } from "@repo/utils";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";

const visible = ref(false)
const sourceData = ref({} as any)
const logs = ref([])
const sessionId = ref(null)
const stompClient = ref(null)
const logScrollRef = ref(null)
const formRef = ref(null)

// 表单数据
const form = reactive({
  monitorSysGenBackupId: null,
  monitorSysGenBackupDay: 1,
  monitorSysGenBackupPath: '',
  monitorSysGenBackupStatus: '',
  monitorSysGenBackupRetry: 3,
  monitorSysGenBackupEnable: true,
  monitorSysGenBackupTimeout: 300,
  monitorSysGenBackupRetentionDays: 90,
  monitorSysGenId: null
})

// 表单验证规则
const rules = {
  monitorSysGenBackupRetentionDays: [{ required: true, message: '请输入备份保留天数', trigger: 'blur' }],
  monitorSysGenBackupPath: [{ required: true, message: '请输入备份存储路径', trigger: 'blur' }],
  monitorSysGenBackupDay: [{ required: true, message: '请输入备份频率', trigger: 'blur' }],
  monitorSysGenBackupTimeout: [{ required: true, message: '请输入超时时间', trigger: 'blur' }]
}

// 计算备份是否已启用
const isBackupEnabled = computed(() => {
  return sourceData.value?.genBackupStatus === 1
})

/**
 * 连接WebSocket
 */
const connectWebSocket = async () => {
  if (stompClient.value && stompClient.value.connected) {
    return
  }

  if(!sessionId.value) {
    message('获取sessionId失败, 请保存配置', { type: 'error' });
    return
  }
  
  try {
    const config = getConfig();
    stompClient.value = socket(splitToArray(config.SocketUrl), undefined, {
    });

    stompClient.value.on(`/topic/command/backup/${sessionId.value}`, message => {
      try {
        const output = JSON.parse(message.data);
        logs.value.push({
          ...output,
          id: logs.value.length + 1,
          timestamp: new Date()
        });

        // 自动滚动到底部
        nextTick(() => {
          scrollToBottom();
        });
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    });
    
    // 连接成功添加一条日志
    logs.value.push({
      id: logs.value.length + 1,
      type: 'info',
      content: '连接备份日志服务成功，等待备份操作...',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('WebSocket连接异常:', error);
  }
}

/**
 * 格式化时间
 */
const formatTime = (date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 根据日志类型获取样式类
 */
const getLogClass = (type) => {
  switch (type) {
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-orange-500';
    case 'success':
      return 'text-green-500';
    default:
      return 'text-blue-500';
  }
}

/**
 * 滚动到日志底部
 */
const scrollToBottom = () => {
  if (logScrollRef.value) {
    const scrollbar = logScrollRef.value;
    scrollbar.setScrollTop(scrollbar.wrapRef.scrollHeight);
  }
}

/**
 * 加载备份配置
 */
const loadBackupConfig = async () => {
  try {
    const res = await fetchGenBackupGet({ monitorSysGenId: sourceData.value.genId });
    if (res.code === '00000' && res.data) {
      Object.assign(form, res.data);
      sessionId.value = res.data.monitorSysGenBackupId;
    } else {
      // 如果没有配置，则设置默认值
      form.monitorSysGenId = sourceData.value.genId;
      form.monitorSysGenBackupId = null;
    }
  } catch (error) {
    console.error('加载备份配置失败:', error);
    message('加载备份配置失败', { type: 'error' });
  }
}

/**
 * 保存备份配置
 */
const handleSaveConfig = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    try {
      const saveMethod = form.monitorSysGenBackupId ? fetchGenBackupEdit : fetchGenBackupSave;
      const res = await saveMethod(form);
      
      if (res.code === '00000') {
        message('保存配置成功', { type: 'success' });
        loadBackupConfig(); // 重新加载配置
      } else {
        message(res.msg || '保存失败', { type: 'error' });
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      message('保存配置失败', { type: 'error' });
    }
  });
}

/**
 * 手动执行备份
 */
const handleManualBackup = async () => {
  if (!form.monitorSysGenBackupId) {
    message('请先保存备份配置', { type: 'warning' });
    return;
  }
  
  try {
    logs.value.push({
      id: logs.value.length + 1,
      type: 'info',
      content: '正在执行手动备份...',
      timestamp: new Date()
    });
    
    const res = await fetchGenBackupRun({ id: form.monitorSysGenBackupId });
    
    if (res.code === '00000') {
      message('备份任务已启动', { type: 'success' });
    } else {
      logs.value.push({
        id: logs.value.length + 1,
        type: 'error',
        content: `手动备份失败: ${res.msg}`,
        timestamp: new Date()
      });
      message(res.msg || '备份失败', { type: 'error' });
    }
  } catch (error) {
    console.error('执行备份失败:', error);
    message('执行备份失败', { type: 'error' });
  }
}

/**
 * 开启增量备份
 */
const handleStartBackup = async () => {
  try {
    const res = await fetchGenBackupStart(sourceData.value);
    
    if (res.code === '00000') {
      message('增量备份已开启', { type: 'success' });
      sourceData.value.genBackupStatus = 1;
      logs.value.push({
        id: logs.value.length + 1,
        type: 'success',
        content: '增量备份已开启，系统将按照配置自动执行备份',
        timestamp: new Date()
      });
    } else {
      message(res.msg || '开启失败', { type: 'error' });
    }
  } catch (error) {
    console.error('开启增量备份失败:', error);
    message('开启增量备份失败', { type: 'error' });
  }
}

/**
 * 停止增量备份
 */
const handleStopBackup = async () => {
  try {
    const res = await fetchGenBackupStop(sourceData.value);
    
    if (res.code === '00000') {
      message('增量备份已停止', { type: 'success' });
      sourceData.value.genBackupStatus = 0;
      logs.value.push({
        id: logs.value.length + 1,
        type: 'warning',
        content: '增量备份已停止，系统将不再自动执行备份',
        timestamp: new Date()
      });
    } else {
      message(res.msg || '停止失败', { type: 'error' });
    }
  } catch (error) {
    console.error('停止增量备份失败:', error);
    message('停止增量备份失败', { type: 'error' });
  }
}

/**
 * 打开抽屉
 */
const open = async () => {
  visible.value = true;
  nextTick(async () => {
    await loadBackupConfig();
    await connectWebSocket();
  });
}

/**
 * 设置数据
 */
const setData = (data) => {
  sourceData.value = data;
  form.monitorSysGenId = data.genId;
  return { open };
}

/**
 * 关闭抽屉
 */
const handleClose = async () => {
  visible.value = false;
  
  // 断开WebSocket连接
  if (stompClient.value && stompClient.value.connected) {
    try {
      stompClient.value.disconnect();
    } catch (error) {
      console.error('断开WebSocket连接失败:', error);
    }
  }
  
  // 清空日志
  logs.value = [];
}

// 组件销毁前断开WebSocket连接
onBeforeUnmount(() => {
  if (stompClient.value && stompClient.value.connected) {
    try {
      stompClient.value.disconnect();
    } catch (error) {
      console.error('组件销毁时断开WebSocket连接失败:', error);
    }
  }
});

defineExpose({
  setData
})
</script>

<style scoped lang="scss">
.backup-container {
  height: 100%;
}

.backup-content {
  height: calc(100% - 50px);
}

.backup-form {
  height: 100%;
  overflow-y: auto;
}

.backup-logs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-container {
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  min-height: 200px;
}

.log-item {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.error {
  color: var(--el-color-danger);
}

.warning {
  color: var(--el-color-warning);
}

.success {
  color: var(--el-color-success);
}
</style>
