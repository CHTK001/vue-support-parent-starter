<script setup lang="ts">
import { onMounted, ref, computed, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/utils";
import { ElMessageBox} from "element-plus";
import { 
  getSoftVersionPageList, 
  type SystemSoft, 
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
  type ContainerStatsMessage,
  type SoftWebSocketMessage
} from "@/composables/useSoftWebSocket";
import ContainerCard from "@/views/docker/containers/components/ContainerCard.vue";
import ContainerActions from "./components/ContainerActions.vue";
import LogViewer from "./components/LogViewer.vue";
import SoftVersionManager from "./components/SoftVersionManager.vue";

// 定义接口类型
interface SystemSoftVersion {
  systemSoftVersionId?: number;
  systemSoftId?: number;
  version?: string;
  imageTag?: string;
  downloadUrl?: string;
  description?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
}

interface SystemSoftRecord {
  recordId?: number;
  systemSoftId?: number;
  systemSoftVersionId?: number;
  serverId?: number;
  version?: string;
  installMethod?: string;
  status?: string;
  progress?: number;
  params?: string;
  createTime?: string;
  updateTime?: string;
}

interface SystemSoftContainer {
  containerId?: string;
  systemSoftContainerId?: number;
  systemSoftId?: number;
  systemSoftContainerName?: string;
  systemSoftContainerImage?: string;
  systemSoftContainerStatus?: string;
  systemSoftContainerServerName?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  // 添加其他可能需要的属性
  [key: string]: any;
}

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
  return containerList.value.filter(container => container.systemSoftContainerStatus === 'RUNNING').length;
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
      installRecords.value = res.data.records || [];
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
      systemSoftVersionId: row.systemSoftVersionId!,
      serverIds: [] // 根据实际需要填写服务器ID
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
      message.success(`容器 ${container.systemSoftContainerName} 启动成功`);
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
      message.success(`容器 ${container.systemSoftContainerName} 停止成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error('停止容器失败');
  }
};

const removeContainer = async (container: SystemSoftContainer) => {
  try {
    await ElMessageBox.confirm(
      `确认删除容器 ${container.systemSoftContainerName}？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    );
    
    const res = await removeSoftContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.systemSoftContainerName} 删除成功`);
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
  message.info(`暂停容器: ${container.systemSoftContainerName}`);
};

const restartContainer = async (container: SystemSoftContainer) => {
  message.info(`重启容器: ${container.systemSoftContainerName}`);
};

const openContainerTerminal = (container: SystemSoftContainer) => {
  message.info(`打开容器终端: ${container.systemSoftContainerName}`);
};

const viewContainerDetails = (container: SystemSoftContainer) => {
  message.info(`查看容器详情: ${container.systemSoftContainerName}`);
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
  const statusMap: Record<string, "success" | "info" | "warning" | "danger"> = {
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
  const statusMap: Record<string, "success" | "info" | "warning" | "danger"> = {
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
  const statusMap: Record<string, "success" | "info" | "warning" | "danger"> = {
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

// 分页相关方法
const handleSizeChange = (val: number) => {
  // 处理分页大小变化
  console.log('分页大小变化:', val);
};

const handleCurrentChange = (val: number) => {
  // 处理当前页变化
  console.log('当前页变化:', val);
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
      subscribeContainerStatus(container.containerId!);
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
      container.systemSoftContainerStatus = status;
      message(`容器 ${container.systemSoftContainerName} 状态已更新: ${status}`, { type: "success" });
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
  onMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_COMPLETED, (message: SoftWebSocketMessage) => {
    message('软件安装完成', { type: "success" });
    loadContainers(); // 重新加载容器列表
    loadInstallRecords(); // 重新加载安装记录
  });
  
  // 安装失败处理
  onMessage(SOFT_WS_MESSAGE_TYPE.INSTALL_FAILED, (message: SoftWebSocketMessage) => {
    message(`软件安装失败: ${(message as any, { type: "error" }).error || '未知错误'}`);
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