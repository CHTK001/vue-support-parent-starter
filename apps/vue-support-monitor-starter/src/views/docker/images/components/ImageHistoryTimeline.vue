<template>
  <el-dialog
    v-model="visible"
    title="镜像历史记录"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <div class="history-dialog-header">
        <div class="image-info">
          <IconifyIconOnline icon="ri:image-line" class="info-icon" />
          <div class="info-text">
            <div class="image-name">{{ image?.systemSoftImageName }}</div>
            <el-tag size="small" type="primary" effect="plain">
              {{ image?.systemSoftImageTag }}
            </el-tag>
          </div>
        </div>
        <div class="filter-bar">
          <el-select v-model="filterType" placeholder="操作类型" clearable size="small" @change="loadHistory">
            <el-option label="全部" :value="undefined" />
            <el-option label="拉取镜像" value="PULL_IMAGE" />
            <el-option label="创建容器" value="CREATE_CONTAINER" />
            <el-option label="导出镜像" value="EXPORT_IMAGE" />
            <el-option label="删除镜像" value="DELETE_IMAGE" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状�? clearable size="small" @change="loadHistory">
            <el-option label="全部" :value="undefined" />
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="2" />
            <el-option label="进行�? :value="0" />
          </el-select>
        </div>
      </div>
    </template>

    <el-scrollbar max-height="500px" v-loading="loading">
      <div v-if="records.length === 0" class="empty-state">
        <IconifyIconOnline icon="ri:history-line" class="empty-icon" />
        <p class="empty-text">暂无历史记录</p>
      </div>

      <el-timeline v-else class="history-timeline">
        <el-timeline-item
          v-for="record in records"
          :key="record.systemSoftRecordId"
          :timestamp="formatDateTime(record.systemSoftRecordTime)"
          placement="top"
          :type="getTimelineType(record.systemSoftRecordStatus)"
          :hollow="record.systemSoftRecordStatus === 0"
        >
          <el-card class="timeline-card" :class="`status-${record.systemSoftRecordStatus}`">
            <div class="record-header">
              <div class="record-title">
                <IconifyIconOnline :icon="getOperationIcon(record.systemSoftRecordOperationType)" class="mr-2" />
                <span class="operation-type">{{ getOperationText(record.systemSoftRecordOperationType) }}</span>
                <el-tag
                  :type="getStatusType(record.systemSoftRecordStatus)"
                  size="small"
                  class="ml-2"
                >
                  {{ getStatusText(record.systemSoftRecordStatus) }}
                </el-tag>
              </div>
              <div class="record-meta">
                <span class="meta-item">
                  <IconifyIconOnline icon="ri:user-line" />
                  {{ record.systemSoftRecordUser || '系统' }}
                </span>
                <span v-if="record.systemSoftRecordDuration" class="meta-item">
                  <IconifyIconOnline icon="ri:time-line" />
                  {{ formatDuration(record.systemSoftRecordDuration) }}
                </span>
              </div>
            </div>

            <div class="record-content">
              <div class="content-item">
                <span class="content-label">操作消息�?/span>
                <span class="content-value">{{ record.systemSoftRecordMessage || '-' }}</span>
              </div>

              <div v-if="record.systemSoftRecordParams" class="content-item">
                <span class="content-label">操作参数�?/span>
                <el-tag size="small" effect="plain" class="param-tag">
                  {{ record.systemSoftRecordParams }}
                </el-tag>
              </div>

              <div v-if="record.systemSoftRecordStatus === 1 && record.systemSoftRecordResult" class="content-item success-result">
                <span class="content-label">
                  <IconifyIconOnline icon="ri:check-line" class="mr-1" />
                  操作结果�?
                </span>
                <span class="content-value">{{ record.systemSoftRecordResult }}</span>
              </div>

              <div v-if="record.systemSoftRecordStatus === 2 && record.systemSoftRecordErrorMessage" class="content-item error-result">
                <span class="content-label">
                  <IconifyIconOnline icon="ri:error-warning-line" class="mr-1" />
                  错误信息�?
                </span>
                <span class="content-value">{{ record.systemSoftRecordErrorMessage }}</span>
              </div>

              <div v-if="record.systemSoftRecordContainerId" class="content-item">
                <span class="content-label">容器ID�?/span>
                <span class="content-value container-id">{{ record.systemSoftRecordContainerId.substring(0, 12) }}</span>
              </div>
            </div>

            <div v-if="record.systemSoftRecordStartTime && record.systemSoftRecordEndTime" class="record-footer">
              <span class="footer-item">
                开始：{{ formatDateTime(record.systemSoftRecordStartTime) }}
              </span>
              <span class="footer-item">
                结束：{{ formatDateTime(record.systemSoftRecordEndTime) }}
              </span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-scrollbar>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="loadHistory">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { SystemSoftImage } from '@/api/docker';

interface SystemSoftRecord {
  systemSoftRecordId: number;
  systemSoftId: number;
  systemServerId: number;
  systemSoftRecordOperationType: string;
  systemSoftRecordMethod: string;
  systemSoftRecordMessage: string;
  systemSoftRecordParams?: string;
  systemSoftRecordTime: string;
  systemSoftRecordStatus: number; // 0: 进行�? 1: 成功, 2: 失败
  systemSoftRecordUser?: string;
  systemSoftRecordContainerId?: string;
  systemSoftRecordStartTime?: string;
  systemSoftRecordEndTime?: string;
  systemSoftRecordDuration?: number;
  systemSoftRecordErrorMessage?: string;
  systemSoftRecordResult?: string;
}

interface Props {
  modelValue: boolean;
  image?: SystemSoftImage | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const visible = ref(props.modelValue);
const loading = ref(false);
const records = ref<SystemSoftRecord[]>([]);
const filterType = ref<string>();
const filterStatus = ref<number>();

// 加载历史记录
async function loadHistory() {
  if (!props.image) return;

  try {
    loading.value = true;
    // TODO: 调用API获取历史记录
    // const res = await softRecordApi.getRecordsByImage({
    //   softId: props.image.systemSoftId,
    //   operationType: filterType.value,
    //   status: filterStatus.value
    // });
    
    // 模拟数据
    setTimeout(() => {
      records.value = [
        {
          systemSoftRecordId: 1,
          systemSoftId: props.image!.systemSoftId!,
          systemServerId: props.image!.systemSoftImageServerId!,
          systemSoftRecordOperationType: 'PULL_IMAGE',
          systemSoftRecordMethod: 'pullImage',
          systemSoftRecordMessage: '拉取镜像成功',
          systemSoftRecordParams: `imageName=${props.image!.systemSoftImageName}, imageTag=${props.image!.systemSoftImageTag}`,
          systemSoftRecordTime: new Date().toISOString(),
          systemSoftRecordStatus: 1,
          systemSoftRecordUser: 'admin',
          systemSoftRecordStartTime: new Date(Date.now() - 30000).toISOString(),
          systemSoftRecordEndTime: new Date().toISOString(),
          systemSoftRecordDuration: 30000,
          systemSoftRecordResult: '镜像拉取完成'
        },
        {
          systemSoftRecordId: 2,
          systemSoftId: props.image!.systemSoftId!,
          systemServerId: props.image!.systemSoftImageServerId!,
          systemSoftRecordOperationType: 'CREATE_CONTAINER',
          systemSoftRecordMethod: 'createContainer',
          systemSoftRecordMessage: '创建容器成功',
          systemSoftRecordParams: `containerName=test-container`,
          systemSoftRecordTime: new Date(Date.now() - 3600000).toISOString(),
          systemSoftRecordStatus: 1,
          systemSoftRecordUser: 'admin',
          systemSoftRecordContainerId: 'abc123def456',
          systemSoftRecordStartTime: new Date(Date.now() - 3600000 - 5000).toISOString(),
          systemSoftRecordEndTime: new Date(Date.now() - 3600000).toISOString(),
          systemSoftRecordDuration: 5000,
          systemSoftRecordResult: '容器创建成功，ID: abc123def456'
        }
      ];
      loading.value = false;
    }, 500);
  } catch (error) {
    console.error('加载历史记录失败:', error);
    ElMessage.error('加载历史记录失败');
    loading.value = false;
  }
}

// 格式化日期时�?
function formatDateTime(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 格式化持续时�?
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

// 获取时间轴类�?
function getTimelineType(status: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  switch (status) {
    case 1: return 'success';
    case 2: return 'danger';
    case 0: return 'primary';
    default: return 'info';
  }
}

// 获取状态类�?
function getStatusType(status: number): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 1: return 'success';
    case 2: return 'danger';
    case 0: return 'warning';
    default: return 'info';
  }
}

// 获取状态文�?
function getStatusText(status: number): string {
  switch (status) {
    case 1: return '成功';
    case 2: return '失败';
    case 0: return '进行�?;
    default: return '未知';
  }
}

// 获取操作图标
function getOperationIcon(type: string): string {
  const icons: Record<string, string> = {
    PULL_IMAGE: 'ri:download-cloud-line',
    CREATE_CONTAINER: 'ri:add-box-line',
    START_CONTAINER: 'ri:play-circle-line',
    STOP_CONTAINER: 'ri:stop-circle-line',
    RESTART_CONTAINER: 'ri:restart-line',
    REMOVE_CONTAINER: 'ri:delete-bin-line',
    EXPORT_IMAGE: 'ri:download-2-line',
    DELETE_IMAGE: 'ri:delete-bin-2-line'
  };
  return icons[type] || 'ri:file-list-line';
}

// 获取操作文本
function getOperationText(type: string): string {
  const texts: Record<string, string> = {
    PULL_IMAGE: '拉取镜像',
    CREATE_CONTAINER: '创建容器',
    START_CONTAINER: '启动容器',
    STOP_CONTAINER: '停止容器',
    RESTART_CONTAINER: '重启容器',
    REMOVE_CONTAINER: '删除容器',
    EXPORT_IMAGE: '导出镜像',
    DELETE_IMAGE: '删除镜像'
  };
  return texts[type] || type;
}

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.image) {
    loadHistory();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});
</script>

<style scoped>
.history-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-icon {
  font-size: 32px;
  color: var(--el-color-primary);
}

.info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 18px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
}

.history-timeline {
  padding: 20px 0;
}

.timeline-card {
  margin-bottom: 0;
  border-left: 3px solid transparent;
}

.timeline-card.status-1 {
  border-left-color: var(--el-color-success);
}

.timeline-card.status-2 {
  border-left-color: var(--el-color-danger);
}

.timeline-card.status-0 {
  border-left-color: var(--el-color-warning);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.record-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.operation-type {
  color: var(--el-text-color-primary);
}

.record-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-item {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
}

.content-label {
  color: var(--el-text-color-secondary);
  min-width: 80px;
  display: flex;
  align-items: center;
}

.content-value {
  flex: 1;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.param-tag {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.success-result {
  padding: 8px;
  background: rgba(103, 194, 58, 0.1);
  border-radius: 4px;
}

.success-result .content-label {
  color: var(--el-color-success);
}

.error-result {
  padding: 8px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 4px;
}

.error-result .content-label {
  color: var(--el-color-danger);
}

.container-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: var(--el-color-primary);
}

.record-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.footer-item {
  display: flex;
  align-items: center;
}
</style>

