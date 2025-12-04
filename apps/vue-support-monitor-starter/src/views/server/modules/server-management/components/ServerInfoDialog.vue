<template>
  <el-dialog
    v-model="visible"
    title="服务器详�?
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="server-info">
      <!-- 基本信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:information-line" class="mr-2" />
            基本信息
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="服务器名�?>
            {{ serverData.monitorSysGenServerName || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="协议类型">
            <el-tag :type="getProtocolType(serverData.monitorSysGenServerProtocol)">
              <IconifyIconOnline :icon="getProtocolIcon(serverData.monitorSysGenServerProtocol)" class="mr-1" />
              {{ serverData.monitorSysGenServerProtocol || "-" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="服务器地址">
            {{ serverData.monitorSysGenServerHost || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="端口">
            {{ serverData.monitorSysGenServerPort || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="用户�?>
            {{ serverData.monitorSysGenServerUsername || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="认证方式">
            <el-tag size="small">
              {{ serverData.monitorSysGenServerAuthType === "password" ? "密码认证" : "密钥认证" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状�?>
            <el-tag :type="getStatusType(serverData.monitorSysGenServerStatus)">
              {{ getStatusText(serverData.monitorSysGenServerStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="监控状�?>
            <el-tag :type="serverData.monitorSysGenServerMonitorEnabled ? 'success' : 'info'">
              {{ serverData.monitorSysGenServerMonitorEnabled ? "已启�? : "已禁�? }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <div v-if="serverData.monitorSysGenServerTags">
              <el-tag
                v-for="tag in serverData.monitorSysGenServerTags.split(',')"
                :key="tag"
                size="small"
                class="mr-1"
              >
                {{ tag.trim() }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ serverData.monitorSysGenServerDescription || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(serverData.monitorSysGenServerCreateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(serverData.monitorSysGenServerUpdateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 连接状�?-->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:link" class="mr-2" />
            连接状�?
            <el-button
              type="primary"
              size="small"
              :loading="statusLoading"
              @click="refreshStatus"
              class="ml-auto"
            >
              刷新状�?
            </el-button>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="连接状�?>
            <el-tag :type="getConnectionStatusType(connectionStatus.status)">
              {{ getConnectionStatusText(connectionStatus.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后连接时�?>
            {{ formatDate(connectionStatus.lastConnectTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="连接次数">
            {{ connectionStatus.connectCount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="在线时长">
            {{ formatDuration(connectionStatus.onlineDuration) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 系统信息 -->
      <el-card v-if="systemInfo && Object.keys(systemInfo).length > 0" class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:computer-line" class="mr-2" />
            系统信息
            <el-button
              type="primary"
              size="small"
              :loading="infoLoading"
              @click="refreshSystemInfo"
              class="ml-auto"
            >
              刷新信息
            </el-button>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作系统">
            {{ systemInfo.osName || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="系统版本">
            {{ systemInfo.osVersion || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="主机�?>
            {{ systemInfo.hostname || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="CPU架构">
            {{ systemInfo.cpuArch || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="CPU使用�?>
            <ScProgress
              type="line"
              :percentage="Math.round(systemInfo.cpuUsage || 0)"
              :stages="getProgressStages('cpu')"
              :show-text="true"
              text-position="right"
              :stroke-width="8"
            />
          </el-descriptions-item>
          <el-descriptions-item label="内存使用�?>
            <ScProgress
              type="line"
              :percentage="Math.round(systemInfo.memoryUsage || 0)"
              :stages="getProgressStages('memory')"
              :show-text="true"
              text-position="right"
              :stroke-width="8"
            />
          </el-descriptions-item>
          <el-descriptions-item label="磁盘使用�?>
            <ScProgress
              type="line"
              :percentage="Math.round(systemInfo.diskUsage || 0)"
              :stages="getProgressStages('disk')"
              :show-text="true"
              text-position="right"
              :stroke-width="8"
            />
          </el-descriptions-item>
          <el-descriptions-item label="系统负载">
            {{ systemInfo.loadAverage || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="运行时间" :span="2">
            {{ formatDuration(systemInfo.uptime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 最近指�?-->
      <el-card v-if="recentMetrics.length > 0" class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:line-chart-line" class="mr-2" />
            最近指标记�?
          </div>
        </template>
        
        <el-table :data="recentMetrics" stripe>
          <el-table-column prop="collectTime" label="收集时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.collectTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="cpuUsage" label="CPU使用�? width="120">
            <template #default="{ row }">
              <ScProgress
                type="line"
                :percentage="Math.round(row.cpuUsage || 0)"
                :stages="getProgressStages('cpu')"
                :show-text="true"
                text-position="inside"
                :stroke-width="6"
              />
            </template>
          </el-table-column>
          <el-table-column prop="memoryUsage" label="内存使用�? width="120">
            <template #default="{ row }">
              <ScProgress
                type="line"
                :percentage="Math.round(row.memoryUsage || 0)"
                :stages="getProgressStages('memory')"
                :show-text="true"
                text-position="inside"
                :stroke-width="6"
              />
            </template>
          </el-table-column>
          <el-table-column prop="diskUsage" label="磁盘使用�? width="120">
            <template #default="{ row }">
              <ScProgress
                type="line"
                :percentage="Math.round(row.diskUsage || 0)"
                :stages="getProgressStages('disk')"
                :show-text="true"
                text-position="inside"
                :stroke-width="6"
              />
            </template>
          </el-table-column>
          <el-table-column prop="networkIn" label="网络入流�? width="120">
            <template #default="{ row }">
              {{ formatBytes(row.networkIn) }}
            </template>
          </el-table-column>
          <el-table-column prop="networkOut" label="网络出流�? width="120">
            <template #default="{ row }">
              {{ formatBytes(row.networkOut) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-button type="success" @click="handleConnect">连接</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import { ScProgress } from "@repo/components";
import {
  getServerStatus,
  getServerInfo,
  connectServer,
  statusMap,
  connectionStatusMap,
  protocolIconMap,
} from "@/api/server";

// 定义事件
const emit = defineEmits<{
  edit: [data: any];
  connect: [data: any];
}>();

// 响应式状�?
const visible = ref(false);
const loading = ref(false);
const statusLoading = ref(false);
const infoLoading = ref(false);

// 数据
const serverData = reactive<any>({});
const connectionStatus = reactive<any>({});
const systemInfo = reactive<any>({});
const recentMetrics = ref<any[]>([]);

/**
 * 格式化日�?
 */
const formatDate = (date: string | Date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("zh-CN");
  } catch (e) {
    return String(date);
  }
};

/**
 * 格式化时�?
 */
const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return "-";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}�?{hours}小时${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

/**
 * 格式化字�?
 */
const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return "-";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * 获取状态类�?
 */
const getStatusType = (status: number) => {
  return statusMap[status]?.color || "info";
};

/**
 * 获取状态文�?
 */
const getStatusText = (status: number) => {
  return statusMap[status]?.text || "未知状�?;
};

/**
 * 获取连接状态类�?
 */
const getConnectionStatusType = (status: number) => {
  return connectionStatusMap[status]?.color || "info";
};

/**
 * 获取连接状态文�?
 */
const getConnectionStatusText = (status: number) => {
  return connectionStatusMap[status]?.text || "未知状�?;
};

/**
 * 获取协议类型
 */
const getProtocolType = (protocol: string) => {
  const typeMap = {
    SSH: "primary",
    RDP: "success",
    VNC: "warning",
  };
  return typeMap[protocol as keyof typeof typeMap] || "info";
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  return protocolIconMap[protocol as keyof typeof protocolIconMap] || "ri:server-line";
};

/**
 * 获取进度条颜色（支持渐变和不同指标类型）
 */
const getProgressColor = (percentage: number, metricType: string = 'cpu') => {
  // 定义不同指标的阈�?
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 90 },
    memory: { normal: 60, warning: 80, critical: 90 },
    disk: { normal: 70, warning: 85, critical: 95 },
    network: { normal: 60, warning: 80, critical: 90 }
  };

  const threshold = thresholds[metricType as keyof typeof thresholds] || thresholds.cpu;

  // 返回渐变色配�?
  return [
    { color: '#67c23a', percentage: threshold.normal },
    { color: '#e6a23c', percentage: threshold.warning },
    { color: '#f56c6c', percentage: 100 }
  ];
};

/**
 * 打开对话�?
 */
const open = () => {
  visible.value = true;
  loadServerStatus();
  loadSystemInfo();
};

/**
 * 设置数据
 */
const setData = (data: any) => {
  Object.assign(serverData, data);
};

/**
 * 加载服务器状�?
 */
const loadServerStatus = async () => {
  if (!serverData.monitorSysGenServerId) return;

  try {
    statusLoading.value = true;
    const res = await getServerStatus(String(serverData.monitorSysGenServerId));
    if (res.code === "00000") {
      Object.assign(connectionStatus, res.data || {});
    }
  } catch (error) {
    console.error("加载服务器状态失�?", error);
  } finally {
    statusLoading.value = false;
  }
};

/**
 * 加载系统信息
 */
const loadSystemInfo = async () => {
  if (!serverData.monitorSysGenServerId) return;

  try {
    infoLoading.value = true;
    const res = await getServerInfo(String(serverData.monitorSysGenServerId));
    if (res.code === "00000") {
      Object.assign(systemInfo, res.data?.systemInfo || {});
      recentMetrics.value = res.data?.recentMetrics || [];
    }
  } catch (error) {
    console.error("加载系统信息失败:", error);
  } finally {
    infoLoading.value = false;
  }
};

/**
 * 刷新状�?
 */
const refreshStatus = () => {
  loadServerStatus();
};

/**
 * 刷新系统信息
 */
const refreshSystemInfo = () => {
  loadSystemInfo();
};

/**
 * 编辑服务�?
 */
const handleEdit = () => {
  emit("edit", serverData);
  visible.value = false;
};

/**
 * 连接服务�?
 */
const handleConnect = async () => {
  try {
    loading.value = true;
    const res = await connectServer(String(serverData.monitorSysGenServerId));
    if (res.code === "00000") {
      message.success("连接成功");
      emit("connect", serverData);
      loadServerStatus(); // 刷新连接状�?
    } else {
      message.error(res.msg || "连接失败");
    }
  } catch (error) {
    message.error("连接异常，请稍后重试");
    console.error("连接服务器出�?", error);
  } finally {
    loading.value = false;
  };
};

/**
 * 进度阶段颜色（供 ScProgress 使用�?
 */
const getProgressStages = (metricType: string) => {
  const thresholds: Record<string, { normal: number; warning: number; critical: number }> = {
    cpu: { normal: 50, warning: 80, critical: 100 },
    memory: { normal: 60, warning: 85, critical: 100 },
    disk: { normal: 70, warning: 85, critical: 100 },
    network: { normal: 60, warning: 80, critical: 100 },
    temperature: { normal: 60, warning: 80, critical: 100 },
  };
  const t = thresholds[metricType] || thresholds.cpu;
  return [
    { threshold: t.normal, color: "#67c23a" },
    { threshold: t.warning, color: "#e6a23c" },
    { threshold: t.critical, color: "#f56c6c" },
  ];
};

// 暴露方法
defineExpose({
  open,
  setData,
});
</script>

<style lang="scss" scoped>
.server-info {
  .info-card {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .card-header {
      display: flex;
      align-items: center;
      font-weight: 500;

      .ml-auto {
        margin-left: auto;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>
