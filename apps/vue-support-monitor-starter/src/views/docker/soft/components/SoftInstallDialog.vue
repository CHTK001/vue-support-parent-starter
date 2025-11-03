<template>
  <!-- 安装进度弹框 -->
  <ScSocketEventProcess
    v-for="(progressItem, index) in installProgressList"
    :key="progressItem.eventId"
    :event-id="progressItem.eventId"
    :event-name="progressItem.eventName"
    :title="progressItem.title"
    :icon="progressItem.icon"
    :position="getProgressPosition(index)"
    mode="dialog"
    layout="logs"
    v-model:visible="progressItem.visible"
    :storage-prefix="'docker-install'"
    @close="handleProgressClose(progressItem.eventId)"
    @data="handleProgressData(progressItem.eventId, $event)"
  />

  <el-dialog v-model="visibleProxy" class="soft-install-dialog" :show-close="true">
    <template #header>
      <div class="dlg-header">
        <div class="title">
          <IconifyIconOnline icon="ri:download-cloud-2-line" class="mr-2" /> 安装软件
        </div>
        <div class="subtitle">{{ soft?.systemSoftName }} · {{ soft?.systemSoftDockerImage || '-' }}</div>
      </div>
    </template>

    <div class="content">
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
          已选择 <b>{{ selectedServerCount }}</b> 台服务器，将自动拉取镜像并安装
        </div>
      </div>

      <!-- 安装说明 -->
      <div class="install-info">
        <div class="info-item">
          <IconifyIconOnline icon="ri:image-line" class="icon" />
          <div class="info-content">
            <div class="info-title">软件</div>
            <div class="info-value">{{ soft?.systemSoftName }} ({{ soft?.systemSoftDockerImage || '-' }})</div>
          </div>
        </div>
        <div class="info-item">
          <IconifyIconOnline icon="ri:shield-check-line" class="icon" />
          <div class="info-content">
            <div class="info-title">安装方式</div>
            <div class="info-value">Docker容器 (latest)</div>
          </div>
        </div>
        <div class="info-item">
          <IconifyIconOnline icon="ri:progress-5-line" class="icon" />
          <div class="info-content">
            <div class="info-title">进度推送</div>
            <div class="info-value">实时推送安装进度，请保持页面打开</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button type="primary" :loading="installing" :disabled="selectedServerCount === 0" @click="submit">
          <IconifyIconOnline icon="ri:download-cloud-2-line" class="mr-1" v-if="!installing" />
          {{ installing ? '安装中...' : '开始安装' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getServerList, softwareApi } from '@/api/docker-management';
import ScSocketEventProcess from '@repo/components/ScSocketEventProcess/index.vue';
import { ElMessage, ElNotification } from 'element-plus';
import { computed, ref, watch } from 'vue';

interface Props { visible: boolean; soft?: any }
interface Emits { (e: 'update:visible', v: boolean): void;(e: 'success'): void }

interface ProgressItem {
  eventId: string;
  eventName: string | string[];
  title: string;
  icon: string;
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const visibleProxy = computed({ get: () => props.visible, set: v => emit('update:visible', v) });

const servers = ref<any[]>([]);
const selectedServerIds = ref<number[]>([]);
const installing = ref(false);
const installProgressList = ref<ProgressItem[]>([]);

const selectedServerCount = computed(() => selectedServerIds.value.length);

async function loadServers() {
  try {
    const res: any = await getServerList();
    if (res?.code === '00000') {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      // 兼容部分接口直接返回数组
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
    case 1: return 'success';  // 在线
    case 0: return 'info';     // 离线
    case 2: return 'warning';  // 连接中
    case 3: return 'danger';   // 连接失败
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

// 获取进度弹框位置（多个弹框时错开显示）
function getProgressPosition(index: number): 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' {
  const positions: Array<'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'> = ['bottom-right', 'top-right', 'bottom-left', 'top-left'];
  return positions[index % 4];
}

// 处理进度弹框关闭
function handleProgressClose(eventId: string) {
  // 从列表中移除该进度项，释放资源
  const index = installProgressList.value.findIndex(item => item.eventId === eventId);
  if (index !== -1) {
    installProgressList.value.splice(index, 1);
  }
}

// 处理进度数据
function handleProgressData(eventId: string, data: any) {
  // 当进度完成或失败时，延迟移除（给用户查看结果的时间）
  if (data.status === 'success' || data.status === 'error') {
    setTimeout(() => {
      const item = installProgressList.value.find(item => item.eventId === eventId);
      if (item) {
        item.visible = false; // 先关闭弹框
        // 再延迟移除，确保关闭动画完成
        setTimeout(() => {
          handleProgressClose(eventId);
        }, 300);
      }
    }, 8000); // 8秒后自动关闭并移除
  }
}

// 监听对话框打开/关闭：打开时加载服务器，关闭时清理选择
watch(() => visibleProxy.value, (val) => {
  if (val) {
    loadServers();
  } else {
    // 清理选择
    selectedServerIds.value = [];
  }
});

async function submit() {
  const ids = selectedServerIds.value || [];
  if (!ids.length) {
    return ElMessage.warning('请选择至少一台服务器');
  }
  
  try {
    installing.value = true;
    
    // 简化的安装请求，只传 softId 和 serverIds
    const payload = {
      softId: props.soft?.systemSoftId,
      serverIds: ids,
      imageTag: 'latest'  // 默认使用latest标签
    };
    
    const result = await softwareApi.installSoftware(payload as any);
    
    if (result.code === '00000' && result.data?.operationId) {
      // 创建进度监控项
      const serverNames = servers.value
        .filter(s => ids.includes(s.monitorSysGenServerId))
        .map(s => s.monitorSysGenServerName)
        .join(', ');
      
      const progressItem: ProgressItem = {
        eventId: result.data.operationId,
        eventName: ['docker_start', 'docker_progress', 'docker_complete', 'docker_error'],
        title: `安装 ${props.soft?.systemSoftName} (${serverNames})`,
        icon: 'ri:download-cloud-2-line',
        visible: true
      };
      
      installProgressList.value.push(progressItem);
      
      // 通知父组件安装开始
      emit('success');
      
      ElNotification.success({
        title: '安装已开始',
        message: `正在 ${ids.length} 台服务器上安装 ${props.soft?.systemSoftName}`,
        position: 'bottom-right'
      });
      
      // 关闭对话框
      visibleProxy.value = false;
    } else {
      ElMessage.error(result.msg || '安装失败');
    }
  } catch (error: any) {
    console.error('安装软件失败', error);
    ElNotification.error({
      title: '安装失败',
      message: error?.message || '请稍后重试',
      position: 'bottom-right'
    });
  } finally {
    installing.value = false;
  }
}
</script>

<style scoped>
.soft-install-dialog :deep(.el-dialog__body) {
  padding: 0 20px 16px;
}

.dlg-header {
  display: flex;
  flex-direction: column;
  padding: 6px 4px;
}

.dlg-header .title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.dlg-header .subtitle {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.content {
  padding: 6px 2px;
}

.step-pane {
  margin-top: 16px;
}

.pane-title {
  font-weight: 600;
  margin: 14px 0 10px;
}

.kv-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv-item {
  display: flex;
  align-items: center;
}

.dlg-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* 服务器卡片样式 */
.server-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
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

.server-status {
  font-size: 12px;
  color: var(--app-text-secondary);
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

.install-info {
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
</style>
