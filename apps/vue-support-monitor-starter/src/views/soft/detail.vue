<template>
  <div class="soft-detail">
    <div class="header">
      <el-button @click="$router.back()">
        <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
        返回
      </el-button>
      <div class="title">
        {{ soft?.systemSoftName }}
        <span class="code">（{{ soft?.systemSoftCode }}）</span>
      </div>
      <div class="spacer" />
      <el-button type="primary" @click="openAddVersion">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        新增版本
      </el-button>
    </div>

    <!-- 软件基本信息 -->
    <el-descriptions v-if="soft" :column="3" border size="small" class="mb-3">
      <el-descriptions-item label="分类">{{ soft.systemSoftCategory }}</el-descriptions-item>
      <el-descriptions-item label="镜像">{{ soft.systemSoftImage }}</el-descriptions-item>
      <el-descriptions-item label="类型">{{ getSoftTypeLabel(soft.systemSoftType) }}</el-descriptions-item>
      <el-descriptions-item label="标签">
        <span v-for="tag in (soft.systemSoftTags || '').split(',').filter(Boolean)" :key="tag" class="tag">{{ tag }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(soft.systemSoftStatus)">{{ getStatusLabel(soft.systemSoftStatus) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDate(soft.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="说明" :span="3">{{ soft.systemSoftDesc }}</el-descriptions-item>
    </el-descriptions>

    <!-- 统计信息 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:archive-line" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ versionList.length }}</div>
          <div class="stat-label">版本数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:container-line" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ containerList.length }}</div>
          <div class="stat-label">容器数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:download-line" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ installRecords.length }}</div>
          <div class="stat-label">安装记录</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:server-line" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ runningContainers }}</div>
          <div class="stat-label">运行中</div>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <!-- 版本信息 -->
      <el-tab-pane label="版本信息" name="versions">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>版本列表</span>
              <el-button size="small" type="primary" @click="openAddVersion">
                <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                新增版本
              </el-button>
            </div>
          </template>
          <el-table :data="versionList" stripe v-loading="versionsLoading">
            <el-table-column prop="version" label="版本" width="160" />
            <el-table-column prop="imageTag" label="镜像标签" width="220" />
            <el-table-column prop="downloadUrl" label="下载地址" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="openInstall(row)">安装</el-button>
                <el-button size="small" type="danger" @click="openUninstall(row)">卸载</el-button>
                <el-button size="small" @click="viewVersionDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 容器管理 -->
      <el-tab-pane label="容器管理" name="containers">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>容器列表</span>
              <div class="header-actions">
                <el-button size="small" @click="refreshContainers" :loading="containersLoading">
                  <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                  刷新
                </el-button>
                <el-button size="small" type="primary" @click="batchManageContainers">
                  <IconifyIconOnline icon="ri:settings-line" class="mr-1" />
                  批量管理
                </el-button>
              </div>
            </div>
          </template>
          <div class="containers-grid">
              <ContainerCard
                v-for="container in containerList"
                :key="container.containerId"
                :container="container"
                @start="startContainer"
                @stop="stopContainer"
                @pause="pauseContainer"
                @restart="restartContainer"
                @remove="removeContainer"
                @view-logs="viewContainerLogs"
                @open-terminal="openContainerTerminal"
                @view-details="viewContainerDetails"
              />
            </div>
        </el-card>
      </el-tab-pane>

      <!-- 安装记录 -->
      <el-tab-pane label="安装记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>安装记录</span>
              <el-button size="small" @click="refreshRecords" :loading="recordsLoading">
                <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                刷新
              </el-button>
            </div>
          </template>
          <el-table :data="installRecords" stripe v-loading="recordsLoading">
            <el-table-column prop="version" label="版本" width="120" />
            <el-table-column prop="serverId" label="服务器" width="150">
              <template #default="{ row }">
                {{ getServerName(row.serverId) }}
              </template>
            </el-table-column>
            <el-table-column prop="installMethod" label="安装方式" width="120" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getRecordStatusType(row.status)">{{ getRecordStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.progress || 0" :status="getProgressStatus(row.status)" />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="安装时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewRecordDetail(row)">详情</el-button>
                <el-button size="small" type="info" @click="viewRecordLogs(row)">日志</el-button>
                <el-button size="small" type="danger" @click="cancelInstall(row)" :disabled="row.status !== 'INSTALLING'">
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="installVisible" title="安装软件" width="600px" destroy-on-close>
      <el-form :model="installForm">
        <el-form-item label="选择服务器">
          <el-select v-model="installForm.serverIds" multiple style="width: 100%" filterable placeholder="选择服务器">
            <el-option v-for="s in serverOptions" :key="s.id" :label="s.name + '(' + s.host + ')'" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装方式">
          <el-select v-model="installForm.method" placeholder="选择安装方式">
            <el-option label="Docker CLI" value="DOCKER_CLI" />
            <el-option label="Compose" value="COMPOSE" />
            <el-option label="Swarm" value="SWARM" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数(JSON)">
          <el-input v-model="installForm.params" type="textarea" :rows="6" placeholder='{"env":["TZ=Asia/Shanghai"],"ports":["8080:80"]}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="installVisible = false">取消</el-button>
        <el-button type="primary" :loading="installing" @click="doInstall">安装</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { message, ElMessageBox } from "@repo/utils";
import { 
  getSoftVersionPageList, 
  type SystemSoft, 
  type SystemSoftVersion, 
  type SystemSoftContainer,
  type SystemSoftRecord,
  installSoft,
  uninstallSoft,
  getSoftContainerList,
  getSoftInstallRecords,
  startSoftContainer,
  stopSoftContainer,
  removeSoftContainer,
  getSoftContainerLogs
} from "@/api/soft";
import { getServerPageList } from "@/api/server";
import { 
  useSoftWebSocket, 
  SOFT_WS_MESSAGE_TYPE,
  type ContainerStatusMessage,
  type ContainerLogMessage,
  type ContainerStatsMessage
} from "@/composables/useSoftWebSocket";
import ContainerCard from "./components/ContainerCard.vue";
import ContainerActions from "./components/ContainerActions.vue";
import LogViewer from "./components/LogViewer.vue";
import SoftVersionManager from "./components/SoftVersionManager.vue";

const route = useRoute();
const softId = Number(route.params.id);

// WebSocket连接
const {
  state: wsState,
  connect: connectWS,
  disconnect: disconnectWS,
  onMessage,
  offMessage,
  subscribeContainerStatus,
  unsubscribeContainerStatus,
  subscribeContainerLogs,
  unsubscribeContainerLogs
} = useSoftWebSocket();

// 基础数据
const soft = ref<SystemSoft | null>(null);
const versionList = ref<SystemSoftVersion[]>([]);
const containerList = ref<SystemSoftContainer[]>([]);
const installRecords = ref<SystemSoftRecord[]>([]);
const serverOptions = ref<any[]>([]);
const selectedContainers = ref<SystemSoftContainer[]>([]);

// 页面状态
const activeTab = ref('versions');
const versionsLoading = ref(false);
const containersLoading = ref(false);
const recordsLoading = ref(false);

// 安装对话框
const installVisible = ref(false);
const installing = ref(false);
const installForm = ref<{ systemSoftId: number; systemSoftVersionId?: number; serverIds: number[]; method?: string; params?: string }>({
  systemSoftId: softId,
  serverIds: [],
  method: "DOCKER_CLI",
  params: ""
});

// 计算属性
const runningContainers = computed(() => {
  return containerList.value.filter(container => container.status === 'RUNNING').length;
});

// 数据加载方法
const loadSoft = async () => {
  // 详情字段暂时以 card 页传参或后续新增详情接口
};

const loadVersions = async () => {
  try {
    versionsLoading.value = true;
    const res = await getSoftVersionPageList({ page: 1, pageSize: 100, systemSoftId: softId });
    if (res.code === "00000") {
      versionList.value = res.data.records || [];
    }
  } finally {
    versionsLoading.value = false;
  }
};

const loadContainers = async () => {
  try {
    containersLoading.value = true;
    const res = await getSoftContainerList({ systemSoftId: softId });
    if (res.code === "00000") {
      containerList.value = res.data || [];
    }
  } finally {
    containersLoading.value = false;
  }
};

const loadInstallRecords = async () => {
  try {
    recordsLoading.value = true;
    const res = await getSoftInstallRecords({ systemSoftId: softId });
    if (res.code === "00000") {
      installRecords.value = res.data || [];
    }
  } finally {
    recordsLoading.value = false;
  }
};

const loadServers = async () => {
  const res = await getServerPageList({ page: 1, pageSize: 1000 });
  if (res.code === "00000") {
    const data = (res.data as any).data || res.data.records || [];
    serverOptions.value = data.map((it: any) => ({ id: it.id || it.monitorSysGenServerId, name: it.name || it.monitorSysGenServerName, host: it.host || it.monitorSysGenServerHost }));
  }
};

// 刷新方法
const refreshContainers = async () => {
  await loadContainers();
  message.success('容器列表已刷新');
};

const refreshRecords = async () => {
  await loadInstallRecords();
  message.success('安装记录已刷新');
};

// 版本管理
const openAddVersion = () => message.info("后续提供新增版本弹窗");

const viewVersionDetail = (row: SystemSoftVersion) => {
  message.info(`查看版本 ${row.version} 详情`);
};

// 安装卸载
const openInstall = (row: SystemSoftVersion) => {
  installForm.value.systemSoftVersionId = row.systemSoftVersionId!;
  installVisible.value = true;
};

const openUninstall = async (row: SystemSoftVersion) => {
  try {
    await ElMessageBox.confirm(
      `确认卸载版本 ${row.version}？此操作将停止并删除相关容器。`,
      '确认卸载',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await uninstallSoft({
      systemSoftId: softId,
      systemSoftVersionId: row.systemSoftVersionId!
    });
    
    if (res.code === "00000") {
      message.success('卸载请求已提交');
      await loadContainers();
      await loadInstallRecords();
    }
  } catch (error) {
    if (error !== 'cancel') {
      message.error('卸载失败');
    }
  }
};

const doInstall = async () => {
  if (!installForm.value.systemSoftVersionId || installForm.value.serverIds.length === 0) {
    return message.warning("请选择版本与服务器");
  }
  try {
    installing.value = true;
    const res = await installSoft({
      systemSoftId: softId,
      systemSoftVersionId: installForm.value.systemSoftVersionId!,
      serverIds: installForm.value.serverIds,
      method: installForm.value.method,
      params: installForm.value.params
    });
    if (res.code === "00000") {
      message.success("安装请求已提交");
      installVisible.value = false;
      await loadInstallRecords();
    }
  } finally {
    installing.value = false;
  }
};

// 容器管理
const handleContainerSelection = (selection: SystemSoftContainer[]) => {
  selectedContainers.value = selection;
};

const batchManageContainers = () => {
  if (selectedContainers.value.length === 0) {
    return message.warning('请选择要管理的容器');
  }
  message.info('批量管理功能开发中');
};

const startContainer = async (container: SystemSoftContainer) => {
  try {
    const res = await startSoftContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 启动成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error('启动容器失败');
  }
};

const stopContainer = async (container: SystemSoftContainer) => {
  try {
    const res = await stopSoftContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 停止成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error('停止容器失败');
  }
};

const removeContainer = async (container: SystemSoftContainer) => {
  try {
    await ElMessageBox.confirm(
      `确认删除容器 ${container.containerName}？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    );
    
    const res = await removeSoftContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 删除成功`);
      await loadContainers();
    }
  } catch (error) {
    if (error !== 'cancel') {
      message.error('删除容器失败');
    }
  }
};

const viewContainerLogs = async (container: SystemSoftContainer) => {
  try {
    const res = await getSoftContainerLogs({ containerId: container.containerId! });
    if (res.code === "00000") {
      // 这里可以打开一个日志查看对话框
      message.info('日志查看功能开发中');
    }
  } catch (error) {
    message.error('获取容器日志失败');
  }
};

// 安装记录管理
const viewRecordDetail = (record: SystemSoftRecord) => {
  message.info(`查看安装记录详情: ${record.recordId}`);
};

const viewRecordLogs = (record: SystemSoftRecord) => {
  message.info(`查看安装日志: ${record.recordId}`);
};

const cancelInstall = async (record: SystemSoftRecord) => {
  try {
    await ElMessageBox.confirm(
      '确认取消此安装任务？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 这里调用取消安装的API
    message.success('安装任务已取消');
    await loadInstallRecords();
  } catch (error) {
    if (error !== 'cancel') {
      message.error('取消安装失败');
    }
  }
};

// 新增容器相关方法
const pauseContainer = async (container: SystemSoftContainer) => {
  message.info(`暂停容器: ${container.containerName}`);
};

const restartContainer = async (container: SystemSoftContainer) => {
  message.info(`重启容器: ${container.containerName}`);
};

const openContainerTerminal = (container: SystemSoftContainer) => {
  message.info(`打开容器终端: ${container.containerName}`);
};

const viewContainerDetails = (container: SystemSoftContainer) => {
  message.info(`查看容器详情: ${container.containerName}`);
};

// 工具方法
const formatDate = (date: string | Date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const getServerName = (serverId: number) => {
  const server = serverOptions.value.find(s => s.id === serverId);
  return server ? `${server.name}(${server.host})` : `服务器${serverId}`;
};

const getSoftTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'APPLICATION': '应用软件',
    'MIDDLEWARE': '中间件',
    'DATABASE': '数据库',
    'SYSTEM': '系统软件',
    'OTHER': '其他'
  };
  return typeMap[type] || type;
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'success',
    'INACTIVE': 'info',
    'DEPRECATED': 'warning',
    'DELETED': 'danger'
  };
  return statusMap[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'ACTIVE': '启用',
    'INACTIVE': '禁用',
    'DEPRECATED': '已废弃',
    'DELETED': '已删除'
  };
  return statusMap[status] || status;
};

const getContainerStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'RUNNING': 'success',
    'STOPPED': 'info',
    'PAUSED': 'warning',
    'ERROR': 'danger'
  };
  return statusMap[status] || 'info';
};

const getContainerStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'RUNNING': '运行中',
    'STOPPED': '已停止',
    'PAUSED': '已暂停',
    'ERROR': '错误'
  };
  return statusMap[status] || status;
};

const getRecordStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'INSTALLING': 'warning',
    'SUCCESS': 'success',
    'FAILED': 'danger',
    'CANCELLED': 'info'
  };
  return statusMap[status] || 'info';
};

const getRecordStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'INSTALLING': '安装中',
    'SUCCESS': '成功',
    'FAILED': '失败',
    'CANCELLED': '已取消'
  };
  return statusMap[status] || status;
};

const getProgressStatus = (status: string) => {
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'exception';
  if (status === 'INSTALLING') return undefined;
  return 'exception';
};

onMounted(async () => {
  await loadSoft();
  await loadVersions();
  await loadContainers();
  await loadInstallRecords();
  await loadServers();
  
  // 连接WebSocket并设置事件处理器
  connectWS();
  setupWebSocketHandlers();
});

onUnmounted(() => {
  // 清理WebSocket连接和事件处理器
  cleanupWebSocketHandlers();
  disconnectWS();
});

// 监听标签页切换，自动刷新数据
watch(activeTab, async (newTab) => {
  if (newTab === 'containers') {
    await loadContainers();
    // 订阅容器状态变化
    containerList.value.forEach(container => {
      subscribeContainerStatus(container.containerId);
    });
  } else if (newTab === 'records') {
    await loadInstallRecords();
  }
});

// WebSocket事件处理
const setupWebSocketHandlers = () => {
  // 容器状态变化处理
  onMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS_CHANGED, (message: ContainerStatusMessage) => {
    const { containerId, status } = message.data;
    const container = containerList.value.find(c => c.containerId === containerId);
    if (container) {
      container.status = status;
      message.success(`容器 ${container.containerName} 状态已更新: ${status}`);
    }
  });
  
  // 容器日志处理
  onMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_LOG, (message: ContainerLogMessage) => {
    const { containerId, log, level } = message.data;
    console.log(`[${level.toUpperCase()}] Container ${containerId}: ${log}`);
  });
  
  // 容器统计处理
  onMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS, (message: ContainerStatsMessage) => {
    const { containerId, cpuUsage, memoryUsage } = message.data;
    const container = containerList.value.find(c => c.containerId === containerId);
    if (container) {
      container.cpuUsage = cpuUsage;
      container.memoryUsage = memoryUsage;
    }
  });
  
  // 安装进度处理
  onMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_PROGRESS, (message) => {
    const { progress, stage, message: progressMessage } = message.data;
    console.log(`安装进度: ${progress}% - ${stage}: ${progressMessage}`);
  });
  
  // 安装完成处理
  onMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_COMPLETED, (message) => {
    message.success('软件安装完成');
    loadContainers(); // 重新加载容器列表
    loadInstallRecords(); // 重新加载安装记录
  });
  
  // 安装失败处理
  onMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_FAILED, (message) => {
    message.error(`软件安装失败: ${message.error || '未知错误'}`);
    loadInstallRecords(); // 重新加载安装记录
  });
};

// 清理WebSocket事件处理器
const cleanupWebSocketHandlers = () => {
  offMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS_CHANGED, () => {});
  offMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_LOG, () => {});
  offMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS, () => {});
  offMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_PROGRESS, () => {});
  offMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_COMPLETED, () => {});
  offMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_FAILED, () => {});
};
</script>

<style scoped>
.soft-detail {
  padding: 16px;
  background: var(--el-bg-color-overlay);
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header .title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header .title .code {
  margin-left: 8px;
   color: var(--el-text-color-primary);
  font-weight: 400;
  font-size: 14px;
}

.header .spacer {
  flex: 1;
}

/* 统计信息网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 12px;
  color: var(--el-text-color-primary);
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
   color: var(--el-text-color-primary);
}

/* 标签页样式 */
.detail-tabs {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.detail-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 0;
}

.detail-tabs :deep(.el-tab-pane) {
  padding: 20px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 标签样式 */
.tag {
  margin-right: 6px;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f2f5;
}

:deep(.el-table tr:hover > td) {
  background: var(--el-bg-color-overlay);
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
}

:deep(.el-button--small) {
  padding: 5px 12px;
  font-size: 12px;
}

/* 进度条样式 */
:deep(.el-progress) {
  width: 100%;
}

:deep(.el-progress-bar__outer) {
  border-radius: 10px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .soft-detail {
    padding: 12px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .header .spacer {
    display: none;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 12px;
  }
  
  .detail-tabs :deep(.el-tab-pane) {
    padding: 12px;
  }
}
</style>
