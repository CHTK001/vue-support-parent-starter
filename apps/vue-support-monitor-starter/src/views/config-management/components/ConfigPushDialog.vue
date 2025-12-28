<template>
  <sc-dialog v-model="visibleProxy" class="config-push-dialog" :show-close="true" width="720px">
    <template #header>
      <div class="dlg-header">
        <div class="title">
          <IconifyIconOnline icon="ri:send-plane-line" class="mr-2" />
          下发配置
        </div>
        <div class="subtitle">将配置推送到选定的服务器节点</div>
      </div>
    </template>

    <div class="content">
      <!-- 配置预览 -->
      <div class="config-preview">
        <div class="preview-title">
          <IconifyIconOnline icon="ri:settings-3-line" class="mr-2" />
          待下发配置 ({{ configs.length }}项)
        </div>
        <div class="config-list">
          <div v-for="config in configs" :key="config.monitorSysGenConfigId" class="config-item">
            <div class="config-key">{{ config.monitorSysGenConfigKey }}</div>
            <div class="config-value">{{ config.monitorSysGenConfigValue || '—' }}</div>
            <el-tag v-if="config.monitorSysGenConfigEnv" size="small" type="info">
              {{ config.monitorSysGenConfigEnv }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 选择服务器 -->
      <div class="step-pane">
        <div class="pane-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          选择目标服务器
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
          已选择 <b>{{ selectedServerCount }}</b> 台服务器，配置将通过 SyncServer 同步到这些节点
        </div>
      </div>

      <!-- 下发说明 -->
      <div class="push-info">
        <div class="info-item">
          <IconifyIconOnline icon="ri:git-branch-line" class="icon" />
          <div class="info-content">
            <div class="info-title">同步方式</div>
            <div class="info-value">通过 SyncServer 统一下发配置</div>
          </div>
        </div>
        <div class="info-item">
          <IconifyIconOnline icon="ri:refresh-line" class="icon" />
          <div class="info-content">
            <div class="info-title">动态更新</div>
            <div class="info-value">客户端监听配置变更自动热更新</div>
          </div>
        </div>
        <div class="info-item">
          <IconifyIconOnline icon="ri:notification-line" class="icon" />
          <div class="info-content">
            <div class="info-title">结果通知</div>
            <div class="info-value">下发完成后将显示每个节点的执行结果</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button type="primary" :loading="pushing" :disabled="selectedServerCount === 0" @click="submit">
          <IconifyIconOnline icon="ri:send-plane-line" class="mr-1" v-if="!pushing" />
          {{ pushing ? '下发中...' : '开始下发' }}
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { message } from '@repo/utils';
import { ElNotification } from 'element-plus';
import { getServerList } from '@/api/docker';
import { pushConfigToNodes, type MonitorConfig, type ConfigPushRequest } from '@/api/config';

interface Props { 
  visible: boolean;
  configs: MonitorConfig[];
}

interface Emits { 
  (e: 'update:visible', v: boolean): void; 
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleProxy = computed({ 
  get: () => props.visible, 
  set: v => emit('update:visible', v) 
});

const servers = ref<any[]>([]);
const selectedServerIds = ref<number[]>([]);
const pushing = ref(false);

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
  const serverIds = selectedServerIds.value;
  if (!serverIds.length) {
    return message('请选择至少一台服务器', { type: 'warning' });
  }

  if (!props.configs.length) {
    return message('没有要下发的配置', { type: 'warning' });
  }

  try {
    pushing.value = true;

    const payload: ConfigPushRequest = {
      configIds: props.configs.map(c => c.monitorSysGenConfigId!),
      serverIds: serverIds,
    };

    const res: any = await pushConfigToNodes(payload);

    if (res?.code === '00000') {
      const results = res.data?.results || [];
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        ElNotification.success({
          title: '下发成功',
          message: `成功下发到 ${successCount} 台服务器`,
          position: 'bottom-right'
        });
      } else {
        ElNotification.warning({
          title: '部分下发成功',
          message: `成功: ${successCount} 台, 失败: ${failCount} 台`,
          position: 'bottom-right'
        });
      }

      emit('success');
      visibleProxy.value = false;
    } else {
      message(res?.msg || '下发失败', { type: 'error' });
    }
  } catch (error: any) {
    console.error('下发配置失败', error);
    ElNotification.error({
      title: '下发失败',
      message: error?.message || '请稍后重试',
      position: 'bottom-right'
    });
  } finally {
    pushing.value = false;
  }
}
</script>

<style scoped>
.config-push-dialog :deep(.el-dialog__body) {
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

/* 配置预览 */
.config-preview {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.config-item .config-key {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-color-primary);
  min-width: 180px;
  word-break: break-all;
}

.config-item .config-value {
  flex: 1;
  font-size: 13px;
  color: var(--app-text-secondary);
  font-family: 'Monaco', 'Consolas', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: var(--el-bg-color);
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

.push-info {
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
