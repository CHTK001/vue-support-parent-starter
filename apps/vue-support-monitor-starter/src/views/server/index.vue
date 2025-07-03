<template>
  <div class="server-wrapper">
    <!-- 使用 server-management 组件，传递数据 -->
    <ServerManagement
      :servers="servers"
      :server-metrics="serverMetrics"
      :ws-connected="wsConnected"
      :total-count="totalCount"
      @refresh-servers="handleRefreshServers"
      @server-action="handleServerAction"
      @select-server="handleSelectServer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { useServerWebSocket } from "@/composables/useServerWebSocket";
import { useServerMetricsStore } from "@/stores/serverMetrics";
import { useGlobalServerLatency } from "@/composables/useServerLatency";
import {
  getServerPageList,
  deleteServer,
  testServerConnection,
  connectServer as connectServerApi,
  disconnectServer as disconnectServerApi,
  type ServerDisplayData,
  type ServerMetricsDisplay,
  mapServerListToDisplayData,
  mapServerMetricsToDisplay,
  SERVER_WS_MESSAGE_TYPE,
} from "@/api/server";

// 导入 server-management 组件
const ServerManagement = defineAsyncComponent(() => import("./modules/server-management/index.vue"));

// 响应式状态
const loading = ref(false);
const totalCount = ref(0);

// 服务器数据
const servers = ref<ServerDisplayData[]>([]);
const serverMetrics = ref<Map<string, ServerMetricsDisplay>>(new Map());

// WebSocket相关状态
const { state: wsState, onMessage, connect, disconnect } = useServerWebSocket();
const wsConnected = computed(() => wsState.value?.connected || false);

// ServerMetrics Store
const serverMetricsStore = useServerMetricsStore();

// 延迟管理器
const latencyManager = useGlobalServerLatency();

/**
 * 加载服务器列表
 */
const loadServers = async () => {
  try {
    loading.value = true;
    const res = await getServerPageList({
      page: 1,
      pageSize: 1000, // 加载所有服务器
    }) as any;

    if (res.code == "00000") {
      // 使用字段映射转换后台数据为前端显示数据
      const serverList = res.data?.data || [];
      servers.value = mapServerListToDisplayData(serverList);
      totalCount.value = res.data?.total || 0;

      console.log('已加载服务器列表:', servers.value.length, '台服务器');
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
    message.error("加载服务器列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 处理刷新服务器列表请求
 */
const handleRefreshServers = async () => {
  console.log('收到刷新服务器列表请求');
  await loadServers();
};

/**
 * 处理服务器操作请求
 */
const handleServerAction = async (action: string, server: any) => {
  console.log('收到服务器操作请求:', action, server);
  
  switch (action) {
    case "test":
      await testConnection(server);
      break;
    case "delete":
      await deleteServerConfirm(server);
      break;
    case "connect":
      await connectServer(server);
      break;
    case "disconnect":
      await disconnectServer(server);
      break;
    default:
      console.log('未处理的服务器操作:', action);
  }
};

/**
 * 处理选择服务器请求
 */
const handleSelectServer = (server: any) => {
  console.log('收到选择服务器请求:', server);
  // 这里可以处理服务器选择逻辑
};

/**
 * 测试连接
 */
const testConnection = async (server: any) => {
  try {
    const res = await testServerConnection(server.id);
    if (res.code == "00000") {
      message.success("连接测试成功");
    } else {
      message.error(res.msg || "连接测试失败");
    }
  } catch (error) {
    message.error("连接测试异常");
    console.error("测试连接失败:", error);
  }
};

/**
 * 连接服务器
 */
const connectServer = async (server: any) => {
  try {
    console.log("开始连接服务器:", server);
    message.info("正在连接服务器...");

    const connectResult = await connectServerApi(server.id);
    console.log("连接API响应:", connectResult);

    if (connectResult.code === "00000") {
      message.success("服务器连接成功");
    } else {
      message.error(connectResult.msg || "连接失败");
    }
  } catch (error) {
    message.error("连接异常，请稍后重试");
    console.error("连接服务器出错:", error);
  }
};

/**
 * 断开服务器连接
 */
const disconnectServer = async (server: any) => {
  try {
    console.log("断开服务器连接:", server);
    message.info("正在断开连接...");

    const disconnectResult = await disconnectServerApi(server.id);
    console.log("断开连接API响应:", disconnectResult);

    if (disconnectResult.code === "00000") {
      message.success("服务器连接已断开");
    } else {
      message.error(disconnectResult.msg || "断开连接失败");
    }
  } catch (error) {
    message.error("断开连接异常，请稍后重试");
    console.error("断开服务器连接出错:", error);
  }
};

/**
 * 删除服务器确认
 */
const deleteServerConfirm = async (server: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务器 "${server.name}" 吗？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const res = await deleteServer(server.id);
    if (res.code == "00000") {
      message.success("删除成功");
      await loadServers(); // 重新加载服务器列表
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("删除异常");
      console.error("删除服务器失败:", error);
    }
  }
};

/**
 * 安全提取值 - 如果新值无效且旧值存在，则保持旧值
 */
const safeExtractValue = (newValue: any, oldValue: any): number => {
  // 如果新值有效，使用新值
  if (newValue !== undefined && newValue !== null && !isNaN(Number(newValue))) {
    return Number(newValue);
  }
  // 如果新值无效但旧值有效，保持旧值
  if (oldValue !== undefined && oldValue !== null && !isNaN(Number(oldValue))) {
    return Number(oldValue);
  }
  // 如果都无效，返回0
  return 0;
};

/**
 * 初始化WebSocket消息处理
 */
const initWebSocketHandlers = () => {
  console.log('初始化WebSocket消息处理器...');

  // 监听服务器指标数据
  onMessage('server_metrics', (message) => {
    console.log('收到server_metrics消息:', message);
    if (message.serverId && message.data) {
      // 处理嵌套数据格式，兼容新旧格式
      const data = message.data;

      // 获取当前存储的指标数据
      const currentMetrics = serverMetrics.value.get(message.serverId as any);

      // 安全提取数据 - 如果新值无效且旧值存在，则保持旧值
      const cpuUsage = safeExtractValue(data.cpu?.usage ?? data.cpuUsage, currentMetrics?.cpuUsage);
      const memoryUsage = safeExtractValue(data.memory?.usage ?? data.memoryUsage, currentMetrics?.memoryUsage);
      const diskUsage = safeExtractValue(data.disk?.usage ?? data.diskUsage, currentMetrics?.diskUsage);
      const networkIn = safeExtractValue(data.network?.in ?? data.networkIn, currentMetrics?.networkIn);
      const networkOut = safeExtractValue(data.network?.out ?? data.networkOut, currentMetrics?.networkOut);

      // 提取负载平均值
      const loadAverage = data.loadAverage ??
        (data.cpu?.load1m ? `${data.cpu.load1m} ${data.cpu.load5m || 0} ${data.cpu.load15m || 0}` : undefined) ??
        currentMetrics?.loadAverage;

      // 更新store中的指标数据
      serverMetricsStore.updateServerMetrics(message.serverId, {
        serverId: message.serverId,
        serverName: message.serverName,
        cpuUsage,
        memoryUsage,
        diskUsage,
        diskPartitions: data.disk?.partitions || [], // 添加磁盘分区信息
        networkIn,
        networkOut,
        networkInSpeed: data.network?.inSpeed || 0,
        networkOutSpeed: data.network?.outSpeed || 0,
        uptime: data.uptime || 0,
        processCount: data.processCount || 0,
        loadAverage,
        temperature: data.temperature,
        status: data.status === 1 ? 'online' : 'offline',
        collectTime: data.collectTime || new Date().toISOString(),
      });

      // 同时更新本地缓存，传递完整的数据对象
      const displayMetrics = mapServerMetricsToDisplay(data);
      serverMetrics.value.set(String(message.serverId), displayMetrics);

      console.log(`已更新服务器 ${message.serverId} 指标数据: CPU=${cpuUsage}%, Memory=${memoryUsage}%, Disk=${diskUsage}%`);
    }
  });

  // 监听服务器状态汇总
  onMessage('server_status_summary', (message) => {
    console.log('收到server_status_summary消息:', message);
    if (message.data) {
      serverMetricsStore.updateStatusSummary(message.data);
      console.log('已更新服务器状态汇总');
    }
  });

  // 监听连接状态变化
  onMessage('connection_status_change', (message) => {
    console.log('收到connection_status_change消息:', message);
    if (message.serverId) {
      // 更新服务器连接状态
      const serverIndex = servers.value.findIndex(s => s.id === String(message.serverId));
      if (serverIndex !== -1) {
        servers.value[serverIndex].connectionStatus = message.connectionStatus as any;
        console.log(`已更新服务器 ${message.serverId} 连接状态`);
      }
    }
  });

  // 监听服务器告警
  onMessage('server_alerts', (message) => {
    console.log('收到server_alerts消息:', message);
    if (message.serverId && message.data) {
      console.log(`服务器 ${message.serverId} 告警信息:`, message.data);
      // 可以显示告警通知
    }
  });

  // 监听服务器延迟数据
  onMessage(SERVER_WS_MESSAGE_TYPE.SERVER_LATENCY, (message) => {
    console.log('收到server_latency消息:', message);
    if (message.serverId && message.data && typeof message.data.latency === 'number') {
      // 更新延迟数据到延迟管理器
      latencyManager.updateLatencyData(message.serverId, message.data.latency, message.data.timestamp);

      // 更新服务器列表中的延迟显示
      const serverIndex = servers.value.findIndex(s => s.id === String(message.serverId));
      if (serverIndex !== -1) {
        servers.value[serverIndex].latency = message.data.latency;
        console.log(`已更新服务器 ${message.serverId} 延迟: ${message.data.latency}ms`);
      }
    }
  });

  // 监听批量服务器延迟数据
  onMessage(SERVER_WS_MESSAGE_TYPE.BATCH_SERVER_LATENCY, (message) => {
    console.log('收到batch_server_latency消息:', message);
    if (Array.isArray(message.data)) {
      message.data.forEach((latencyData: any) => {
        if (latencyData.serverId && typeof latencyData.latency === 'number') {
          // 更新延迟数据到延迟管理器
          latencyManager.updateLatencyData(latencyData.serverId, latencyData.latency, latencyData.timestamp);

          // 更新服务器列表中的延迟显示
          const serverIndex = servers.value.findIndex(s => s.id === String(latencyData.serverId));
          if (serverIndex !== -1) {
            servers.value[serverIndex].latency = latencyData.latency;
            console.log(`已更新服务器 ${latencyData.serverId} 延迟: ${latencyData.latency}ms`);
          }
        }
      });
    }
  });

  console.log('WebSocket消息处理器初始化完成');
};

// 生命周期钩子
onMounted(async () => {
  console.log('server/index.vue 组件已挂载');
  
  // 加载服务器列表
  await loadServers();

  // 初始化WebSocket消息处理
  initWebSocketHandlers();

  // 连接 WebSocket
  try {
    await connect();
    console.log('WebSocket 连接成功');
  } catch (error) {
    console.error('WebSocket 连接失败:', error);
  }
});

onUnmounted(() => {
  console.log('server/index.vue 组件已卸载');
  
  // 断开 WebSocket 连接
  disconnect();
  console.log('WebSocket 连接已断开');

  // 清理缓存数据
  serverMetricsStore.clearCache();
  console.log('服务器指标缓存已清理');
});
</script>

<style lang="scss" scoped>
.server-wrapper {
  height: 100vh;
  width: 100%;
}
</style>
