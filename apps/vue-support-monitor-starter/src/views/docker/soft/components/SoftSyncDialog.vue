<template>
  <el-dialog v-model="visibleProxy" class="soft-sync-dialog" :show-close="true" width="680px">
    <template #header>
      <div class="dlg-header">
        <div class="title">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-2" /> 同步镜像
        </div>
        <div class="subtitle">从服务器同步Docker镜像到系统</div>
      </div>
    </template>

    <div class="content">
      <!-- 选择服务器 -->
      <div class="step-pane">
        <div class="pane-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          选择同步服务器
        </div>
        <div class="server-cards">
          <div v-for="server in servers" :key="server.monitorSysGenServerId" class="server-card"
            :class="{ selected: selectedServerIds.includes(server.monitorSysGenServerId) }" 
            @click="toggleServerSelect(server.monitorSysGenServerId)">
            <div class="card-header">
              <div class="server-name">
                <IconifyIconOnline icon="ri:checkbox-blank-circle-fill" 
                  :class="['status-indicator', getStatusClass(server.monitorSysGenServerConnectionStatus)]" />
                {{ server.monitorSysGenServerName || '-' }}
              </div>
              <el-tag :type="getStatusType(server.monitorSysGenServerConnectionStatus) as any" size="small">
                {{ getStatusText(server.monitorSysGenServerConnectionStatus) }}
              </el-tag>
            </div>
            <div class="card-body">
              <div class="server-host">
                <IconifyIconOnline icon="ri:global-line" class="mr-1" />
                {{ server.monitorSysGenServerHost || '-' }}:{{ server.monitorSysGenServerPort || '-' }}
              </div>
              <div class="server-tags" v-if="server.monitorSysGenServerTags">
                <el-tag v-for="tag in (server.monitorSysGenServerTags || '').split(',')" 
                  :key="tag" size="small" type="info">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="card-check" v-if="selectedServerIds.includes(server.monitorSysGenServerId)">
              <IconifyIconOnline icon="ri:checkbox-circle-fill" />
            </div>
          </div>
        </div>
        <div class="server-hint">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          已选择 <b>{{ selectedServerCount }}</b> 台服务器，将从这些服务器获取Docker镜像列表并同步
        </div>
      </div>

      <!-- 同步说明 -->
      <div class="sync-info">
        <div class="info-item">
          <IconifyIconOnline icon="ri:database-2-line" class="icon" />
          <div class="info-content">
            <div class="info-title">同步内容</div>
            <div class="info-value">Docker镜像列表（使用DockerProtocolClient.listImage）</div>
          </div>
        </div>
        <div class="info-item">
          <IconifyIconOnline icon="ri:save-line" class="icon" />
          <div class="info-content">
            <div class="info-title">保存位置</div>
            <div class="info-value">SystemSoftImage表（镜像信息关联到对应软件）</div>
          </div>
        </div>
        <div class="info-item">
          <IconifyIconOnline icon="ri:progress-5-line" class="icon" />
          <div class="info-content">
            <div class="info-title">进度推送</div>
            <div class="info-value">实时推送同步进度，请保持页面打开</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button type="primary" :loading="syncing" :disabled="selectedServerCount === 0" @click="submit">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" v-if="!syncing" />
          {{ syncing ? '同步中...' : '开始同步' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getServerList, softwareApi } from '@/api/docker-management';
import { ElMessage, ElNotification } from 'element-plus';
import { computed, ref, watch } from 'vue';

interface Props { visible: boolean }
interface Emits { (e: 'update:visible', v: boolean): void; (e: 'success'): void }

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const visibleProxy = computed({ get: () => props.visible, set: v => emit('update:visible', v) });

const servers = ref<any[]>([]);
const selectedServerIds = ref<number[]>([]);
const syncing = ref(false);

const selectedServerCount = computed(() => selectedServerIds.value.length);

async function loadServers() {
  try {
    const res: any = await getServerList();
    if (res?.code === '00000') {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      servers.value = res || [];
    }
  } catch (err) {
    console.error('加载服务器失败', err);
  }
}

function toggleServerSelect(id: number) {
  const idx = selectedServerIds.value.indexOf(id);
  if (idx === -1) selectedServerIds.value.push(id);
  else selectedServerIds.value.splice(idx, 1);
}

// 获取服务器连接状态类型
function getStatusType(status: number | undefined): 'success' | 'info' | 'warning' | 'danger' {
  switch (status) {
    case 1: return 'success';
    case 0: return 'info';
    case 2: return 'warning';
    case 3: return 'danger';
    default: return 'info';
  }
}

// 获取服务器连接状态文本
function getStatusText(status: number | undefined): string {
  switch (status) {
    case 1: return '在线';
    case 0: return '离线';
    case 2: return '连接中';
    case 3: return '失败';
    default: return '未知';
  }
}

// 获取服务器状态样式类
function getStatusClass(status: number | undefined): string {
  switch (status) {
    case 1: return 'status-online';
    case 0: return 'status-offline';
    case 2: return 'status-connecting';
    case 3: return 'status-error';
    default: return 'status-unknown';
  }
}

// 监听对话框打开/关闭
watch(() => visibleProxy.value, (val) => {
  if (val) {
    loadServers();
  } else {
    selectedServerIds.value = [];
  }
});

async function submit() {
  const ids = selectedServerIds.value || [];
  if (!ids.length) {
    return ElMessage.warning('请选择至少一台服务器');
  }
  
  try {
    syncing.value = true;
    
    const payload = {
      serverIds: ids
    };
    
    const result = await softwareApi.syncImages(payload as any);
    
    if (result.code === '00000') {
      // 通知父组件同步成功
      emit('success');
      
      // 关闭对话框
      visibleProxy.value = false;
    } else {
      ElMessage.error(result.msg || '同步失败');
    }
  } catch (error: any) {
    console.error('同步镜像失败', error);
    ElNotification.error({
      title: '同步失败',
      message: error?.message || '请稍后重试',
      position: 'bottom-right'
    });
  } finally {
    syncing.value = false;
  }
}
</script>

<style scoped>
.soft-sync-dialog :deep(.el-dialog__body) {
  padding: 0 20px 16px;
}

.dlg-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dlg-header .title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: var(--app-text-primary);
}

.dlg-header .subtitle {
  font-size: 13px;
  color: var(--app-text-secondary);
  margin-left: 28px;
}

.content {
  max-height: 580px;
  overflow-y: auto;
}

.step-pane {
  margin-bottom: 20px;
}

.pane-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-border-color-lighter);
}

.server-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.server-card {
  position: relative;
  border: 2px solid var(--el-border-color, #e6e6e6);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all .2s ease;
  background: #fff;
}

.server-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}

.server-card.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  font-size: 8px;
}

.status-online {
  color: var(--el-color-success);
}

.status-offline {
  color: var(--el-color-info);
}

.status-connecting {
  color: var(--el-color-warning);
}

.status-error {
  color: var(--el-color-danger);
}

.status-unknown {
  color: var(--el-color-info);
}

.card-body {
  margin-top: 8px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.server-host {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.server-tags {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.card-check {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 24px;
  color: var(--el-color-primary);
  background: white;
  border-radius: 50%;
  line-height: 1;
}

.server-hint {
  margin-top: 10px;
  padding: 8px 12px;
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
  color: var(--el-color-primary);
  font-size: 13px;
  display: flex;
  align-items: center;
}

.sync-info {
  margin-top: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-item .icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  color: var(--app-text-primary);
  font-weight: 500;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

