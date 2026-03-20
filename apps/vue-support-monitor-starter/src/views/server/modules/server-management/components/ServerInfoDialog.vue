<template>
  <sc-dialog
    v-model="visible"
    title="服务器详情"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="server-info">
      <!-- 基本信息 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:information-line" class="mr-2" />
            基本信息
          </div>
        </template>

        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="服务器名称">
            {{ serverData.monitorSysGenServerName || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="协议类型">
            <ScTag
              :type="getProtocolType(serverData.monitorSysGenServerProtocol)"
            >
              <IconifyIconOnline
                :icon="getProtocolIcon(serverData.monitorSysGenServerProtocol)"
                class="mr-1"
              />
              {{ serverData.monitorSysGenServerProtocol || "-" }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="服务器地址">
            {{ serverData.monitorSysGenServerHost || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="端口">
            {{ serverData.monitorSysGenServerPort || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="用户名">
            {{ serverData.monitorSysGenServerUsername || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="认证方式">
            <ScTag size="small">
              {{
                serverData.monitorSysGenServerAuthType === "password"
                  ? "密码认证"
                  : "密钥认证"
              }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="状态">
            <ScTag :type="getStatusType(serverData.monitorSysGenServerStatus)">
              {{ getStatusText(serverData.monitorSysGenServerStatus) }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="监控状态">
            <ScTag
              :type="
                serverData.monitorSysGenServerMonitorEnabled
                  ? 'success'
                  : 'info'
              "
            >
              {{
                serverData.monitorSysGenServerMonitorEnabled
                  ? "已启用"
                  : "已禁用"
              }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="标签" :span="2">
            <div v-if="serverData.monitorSysGenServerTags">
              <ScTag
                v-for="tag in serverData.monitorSysGenServerTags.split(',')"
                :key="tag"
                size="small"
                class="mr-1"
              >
                {{ tag.trim() }}
              </ScTag>
            </div>
            <span v-else>-</span>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="描述" :span="2">
            {{ serverData.monitorSysGenServerDescription || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="创建时间">
            {{ formatDate(serverData.monitorSysGenServerCreateTime) }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="更新时间">
            {{ formatDate(serverData.monitorSysGenServerUpdateTime) }}
          </ScDescriptionsItem>
        </ScDescriptions>
      </ScCard>

      <!-- 连接状态 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:link" class="mr-2" />
            连接状态
            <ScButton
              type="primary"
              size="small"
              :loading="statusLoading"
              class="ml-auto"
              @click="refreshStatus"
            >
              刷新状态
            </ScButton>
          </div>
        </template>

        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="连接状态">
            <ScTag :type="getConnectionStatusType(connectionStatus.status)">
              {{ getConnectionStatusText(connectionStatus.status) }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="最后连接时间">
            {{ formatDate(connectionStatus.lastConnectTime) }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="连接次数">
            {{ connectionStatus.connectCount || 0 }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="在线时长">
            {{ formatDuration(connectionStatus.onlineDuration) }}
          </ScDescriptionsItem>
        </ScDescriptions>
      </ScCard>

      <!-- 系统信息 -->
      <ScCard
        v-if="systemInfo && Object.keys(systemInfo).length > 0"
        class="info-card"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:computer-line" class="mr-2" />
            系统信息
            <ScButton
              type="primary"
              size="small"
              :loading="infoLoading"
              class="ml-auto"
              @click="refreshSystemInfo"
            >
              刷新信息
            </ScButton>
          </div>
        </template>

        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="操作系统">
            {{ systemInfo.osName || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="系统版本">
            {{ systemInfo.osVersion || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="主机名">
            {{ systemInfo.hostname || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="CPU架构">
            {{ systemInfo.cpuArch || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="CPU使用率">
            <ScProgress
              type="line"
              :percentage="Math.round(systemInfo.cpuUsage || 0)"
              :stages="getProgressStages('cpu')"
              :show-text="true"
              text-position="right"
              :stroke-width="8"
            />
          </ScDescriptionsItem>
          <ScDescriptionsItem label="内存使用率">
            <ScProgress
              type="line"
              :percentage="Math.round(systemInfo.memoryUsage || 0)"
              :stages="getProgressStages('memory')"
              :show-text="true"
              text-position="right"
              :stroke-width="8"
            />
          </ScDescriptionsItem>
          <ScDescriptionsItem label="磁盘使用率">
            <ScProgress
              type="line"
              :percentage="Math.round(systemInfo.diskUsage || 0)"
              :stages="getProgressStages('disk')"
              :show-text="true"
              text-position="right"
              :stroke-width="8"
            />
          </ScDescriptionsItem>
          <ScDescriptionsItem label="系统负载">
            {{ systemInfo.loadAverage || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="运行时间" :span="2">
            {{ formatDuration(systemInfo.uptime) }}
          </ScDescriptionsItem>
        </ScDescriptions>
      </ScCard>

      <!-- 最近指标 -->
      <ScCard v-if="recentMetrics.length > 0" class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:line-chart-line" class="mr-2" />
            最近指标记录
          </div>
        </template>

        <ScTable :data="recentMetrics" stripe>
          <ScTableColumn prop="collectTime" label="收集时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.collectTime) }}
            </template>
          </ScTableColumn>
          <ScTableColumn prop="cpuUsage" label="CPU使用率" width="120">
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
          </ScTableColumn>
          <ScTableColumn prop="memoryUsage" label="内存使用率" width="120">
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
          </ScTableColumn>
          <ScTableColumn prop="diskUsage" label="磁盘使用率" width="120">
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
          </ScTableColumn>
          <ScTableColumn prop="networkIn" label="网络入流量" width="120">
            <template #default="{ row }">
              {{ formatBytes(row.networkIn) }}
            </template>
          </ScTableColumn>
          <ScTableColumn prop="networkOut" label="网络出流量" width="120">
            <template #default="{ row }">
              {{ formatBytes(row.networkOut) }}
            </template>
          </ScTableColumn>
        </ScTable>
      </ScCard>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="visible = false">关闭</ScButton>
        <ScButton type="primary" @click="handleEdit">编辑</ScButton>
        <ScButton type="success" @click="handleConnect">连接</ScButton>
      </div>
    </template>
  </sc-dialog>
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

// 响应式状态
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
 * 格式化日期
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
 * 格式化时长
 */
const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return "-";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

/**
 * 格式化字节
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
 * 获取状态类型
 */
const getStatusType = (status: number) => {
  return statusMap[status]?.color || "info";
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  return statusMap[status]?.text || "未知状态";
};

/**
 * 获取连接状态类型
 */
const getConnectionStatusType = (status: number) => {
  return connectionStatusMap[status]?.color || "info";
};

/**
 * 获取连接状态文本
 */
const getConnectionStatusText = (status: number) => {
  return connectionStatusMap[status]?.text || "未知状态";
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
  return (
    protocolIconMap[protocol as keyof typeof protocolIconMap] ||
    "ri:server-line"
  );
};

/**
 * 获取进度条颜色（支持渐变和不同指标类型）
 */
const getProgressColor = (percentage: number, metricType: string = "cpu") => {
  // 定义不同指标的阈值
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 90 },
    memory: { normal: 60, warning: 80, critical: 90 },
    disk: { normal: 70, warning: 85, critical: 95 },
    network: { normal: 60, warning: 80, critical: 90 },
  };

  const threshold =
    thresholds[metricType as keyof typeof thresholds] || thresholds.cpu;

  // 返回渐变色配置
  return [
    { color: "#67c23a", percentage: threshold.normal },
    { color: "#e6a23c", percentage: threshold.warning },
    { color: "#f56c6c", percentage: 100 },
  ];
};

/**
 * 打开对话框
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
 * 加载服务器状态
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
    console.error("加载服务器状态失败:", error);
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
 * 刷新状态
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
 * 编辑服务器
 */
const handleEdit = () => {
  emit("edit", serverData);
  visible.value = false;
};

/**
 * 连接服务器
 */
const handleConnect = async () => {
  try {
    loading.value = true;
    const res = await connectServer(String(serverData.monitorSysGenServerId));
    if (res.code === "00000") {
      message.success("连接成功");
      emit("connect", serverData);
      loadServerStatus(); // 刷新连接状态
    } else {
      message.error(res.msg || "连接失败");
    }
  } catch (error) {
    message.error("连接异常，请稍后重试");
    console.error("连接服务器出错:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 进度阶段颜色（供 ScProgress 使用）
 */
const getProgressStages = (metricType: string) => {
  const thresholds: Record<
    string,
    { normal: number; warning: number; critical: number }
  > = {
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

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
