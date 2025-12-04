<template>
  <el-dialog v-model="visibleProxy" title="导入镜像" width="600px" :show-close="true">
    <div class="content">
      <div class="import-steps">
        <el-steps :active="currentStep" align-center finish-status="success">
          <el-step title="选择服务器" icon="Server" />
          <el-step title="选择文件" icon="Document" />
          <el-step title="导入设置" icon="Setting" />
        </el-steps>
      </div>

      <!-- 步骤1: 选择服务器 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="pane-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          选择目标服务器
        </div>
        <div class="server-cards">
          <div
            v-for="server in servers"
            :key="server.monitorSysGenServerId"
            class="server-card"
            :class="{ selected: selectedServerId === server.monitorSysGenServerId }"
            @click="selectedServerId = server.monitorSysGenServerId"
          >
            <div class="server-card-header">
              <div class="server-name-status">
                <div class="server-name">{{ server.monitorSysGenServerName }}</div>
                <el-tag :type="getStatusType(server.monitorSysGenServerConnectionStatus)" size="small">
                  {{ getStatusText(server.monitorSysGenServerConnectionStatus) }}
                </el-tag>
              </div>
              <div class="server-check" v-if="selectedServerId === server.monitorSysGenServerId">
                <IconifyIconOnline icon="ri:check-line" />
              </div>
            </div>
            <div class="server-card-body">
              <div class="server-info-row">
                <IconifyIconOnline icon="ri:computer-line" class="info-icon" />
                <span>{{ server.monitorSysGenServerHost }}:{{ server.monitorSysGenServerPort }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 选择文件 -->
      <div v-else-if="currentStep === 1" class="step-content">
        <div class="pane-title">
          <IconifyIconOnline icon="ri:file-line" class="mr-2" />
          选择镜像文件
        </div>
        <div class="file-upload">
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".tar,.tar.gz,.tgz"
            :on-change="handleFileChange"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><IconifyIconOnline icon="ri:upload-cloud-line" /></el-icon>
            <div class="el-upload__text">
              将镜像文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .tar、.tar.gz 或 .tgz 格式的镜像文件
              </div>
            </template>
          </el-upload>
        </div>
      </div>

      <!-- 步骤3: 导入设置 -->
      <div v-else-if="currentStep === 2" class="step-content">
        <div class="pane-title">
          <IconifyIconOnline icon="ri:settings-3-line" class="mr-2" />
          导入设置
        </div>
        <el-form :model="importForm" label-width="120px">
          <el-form-item label="镜像名称">
            <el-input v-model="importForm.imageName" placeholder="镜像名称（如：nginx）" />
          </el-form-item>
          <el-form-item label="镜像标签">
            <el-input v-model="importForm.imageTag" placeholder="镜像标签（如：latest）" />
          </el-form-item>
          <el-form-item label="强制导入">
            <el-switch v-model="importForm.force" />
            <span class="form-tip">如果镜像已存在，是否强制覆盖</span>
          </el-form-item>
        </el-form>
        
        <div class="import-summary">
          <div class="summary-title">
            <IconifyIconOnline icon="ri:file-info-line" class="mr-1" />
            导入摘要
          </div>
          <div class="summary-item">
            <span class="label">目标服务器：</span>
            <span class="value">{{ getSelectedServerName() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">文件名称：</span>
            <span class="value">{{ fileList[0]?.name || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">文件大小：</span>
            <span class="value">{{ formatFileSize(fileList[0]?.size) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">镜像名称：</span>
            <span class="value">{{ importForm.imageName || '自动识别' }}:{{ importForm.imageTag || 'latest' }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" :disabled="!canNext" @click="nextStep">
          下一步
        </el-button>
        <el-button v-if="currentStep === 2" type="primary" :loading="importing" @click="submit">
          <IconifyIconOnline icon="ri:upload-line" class="mr-1" v-if="!importing" />
          {{ importing ? '导入中...' : '开始导入' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { getServerList, imageApi } from '@/api/docker';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
});

const currentStep = ref(0);
const servers = ref<any[]>([]);
const selectedServerId = ref<number | null>(null);
const fileList = ref<UploadFile[]>([]);
const importing = ref(false);

const importForm = ref({
  imageName: '',
  imageTag: 'latest',
  force: false
});

// 是否可以进入下一步
const canNext = computed(() => {
  if (currentStep.value === 0) {
    return selectedServerId.value !== null;
  }
  if (currentStep.value === 1) {
    return fileList.value.length > 0;
  }
  return true;
});

// 加载服务器列表
async function loadServers() {
  try {
    const res: any = await getServerList();
    if (res?.code === '00000') {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      servers.value = res || [];
    }
  } catch (error) {
    console.error('加载服务器列表失败:', error);
    ElMessage.error('加载服务器列表失败');
  }
}

// 获取状态类型
function getStatusType(status: number | undefined): 'success' | 'info' | 'warning' | 'danger' {
  if (status === 1) return 'success';
  if (status === 0) return 'danger';
  return 'info';
}

// 获取状态文本
function getStatusText(status: number | undefined): string {
  if (status === 1) return '在线';
  if (status === 0) return '离线';
  return '未知';
}

// 文件变化
function handleFileChange(file: UploadFile) {
  fileList.value = [file];
}

// 格式化文件大小
function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 获取选中的服务器名称
function getSelectedServerName(): string {
  const server = servers.value.find(s => s.monitorSysGenServerId === selectedServerId.value);
  return server?.monitorSysGenServerName || '-';
}

// 下一步
function nextStep() {
  if (canNext.value) {
    currentStep.value++;
  }
}

// 上一步
function prevStep() {
  currentStep.value--;
}

// 重置
function reset() {
  currentStep.value = 0;
  selectedServerId.value = null;
  fileList.value = [];
  importForm.value = {
    imageName: '',
    imageTag: 'latest',
    force: false
  };
}

// 提交
async function submit() {
  if (!selectedServerId.value) {
    return ElMessage.warning('请选择服务器');
  }
  if (fileList.value.length === 0) {
    return ElMessage.warning('请选择文件');
  }

  try {
    importing.value = true;

    const formData = new FormData();
    formData.append('file', fileList.value[0].raw as File);
    formData.append('serverId', selectedServerId.value.toString());
    if (importForm.value.imageName) {
      formData.append('imageName', importForm.value.imageName);
    }
    if (importForm.value.imageTag) {
      formData.append('imageTag', importForm.value.imageTag);
    }
    formData.append('force', importForm.value.force.toString());

    const result = await imageApi.importImage(formData);

    if (result.code === '00000') {
      emit('success');
      visibleProxy.value = false;
    } else {
      ElMessage.error(result.msg || '导入失败');
    }
  } catch (error: any) {
    console.error('导入镜像失败', error);
    ElNotification.error({
      title: '导入失败',
      message: error?.message || '导入失败，请稍后重试',
      position: 'bottom-right'
    });
  } finally {
    importing.value = false;
  }
}

// 监听对话框打开
watch(() => visibleProxy.value, (val) => {
  if (val) {
    loadServers();
  } else {
    reset();
  }
});
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.import-steps {
  margin-bottom: 24px;
}

.step-content {
  min-height: 300px;
}

.pane-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.server-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.server-card {
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.server-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.server-card.selected {
  border-color: var(--el-color-primary);
  background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(14,165,233,0.05));
}

.server-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.server-name-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: 600;
  font-size: 14px;
}

.server-check {
  color: var(--el-color-success);
  font-size: 20px;
}

.server-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.server-info-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.info-icon {
  margin-right: 4px;
}

.file-upload {
  margin-top: 16px;
}

.upload-area {
  width: 100%;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.import-summary {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.summary-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-item .label {
  color: var(--app-text-secondary);
  min-width: 100px;
}

.summary-item .value {
  font-weight: 500;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

