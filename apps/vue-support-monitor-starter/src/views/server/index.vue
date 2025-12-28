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
import { useServerMetricsStore } from "@/stores/serverMetrics";
import { useGlobalServerLatency } from "@/composables/useServerLatency";
import { createNamedSocketService, closeNamedSocketService, getNamedSocketService, parseSocketMessage, type SocketTemplate } from "@repo/core";
import { getConfig } from "@repo/config";
import {
  getServerPageList,
  deleteServer,
  testServerConnection,
  type ServerDisplayData,
  type ServerMetricsDisplay,
  mapServerListToDisplayData,
  mapServerMetricsToDisplay,
  SERVER_WS_MESSAGE_TYPE
} from "@/api/server";

// 导入 server-management 组件
const ServerManagement = defineAsyncComponent(() => import("./modules/server-management/index.vue"));

// 响应式状态
const loading = ref(false);
const totalCount = ref(0);

// 服务器数据
const servers = ref<ServerDisplayData[]>([]);
const serverMetrics = ref<Map<string, ServerMetricsDisplay>>(new Map());

// Socket 服务实例
const globalSocketService = ref<SocketTemplate | null>(null);
const wsConnected = computed(() => globalSocketService.value?.isConnected || false);
const GLOBAL_SOCKET_NAME = "server-global";

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
    const res = (await getServerPageList({
      page: 1,
      pageSize: 1000 // 加载所有服务器
    })) as any;

    if (res.code == "00000") {
      // 使用字段映射转换后台数据为前端显示数据
      const serverList = res.data?.data || [];
      servers.value = mapServerListToDisplayData(serverList);
      totalCount.value = res.data?.total || 0;

      console.log("已加载服务器列表:", servers.value.length, "台服务器");
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
  console.log("收到刷新服务器列表请求");
  await loadServers();
};

/**
 * 处理服务器操作请求
 */
const handleServerAction = async (action: string, server: any) => {
  console.log("收到服务器操作请求:", action, server);

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
      console.log("未处理的服务器操作:", action);
  }
};

/**
 * 处理选择服务器请求
 */
const handleSelectServer = (server: any) => {
  console.log("收到选择服务器请求:", server);
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
 * 连接服务器 - 使用 SocketService 创建 Socket 连接
 */
const connectServer = async (server: any) => {
  try {
    console.log("开始连接服务器:", server);
    message.info("正在连接服务器...");

    const socketName = `server-${server.id}`;
    const config = getConfig();
    
    // 先关闭已存在的连接
    const existingService = getNamedSocketService(socketName);
    if (existingService) {
      closeNamedSocketService(socketName);
    }
    
    // 创建命名 Socket 服务
    const socketService = createNamedSocketService(socketName, {
      protocol: "socketio",
      urls: config.SocketUrl ? config.SocketUrl.split(",") : [],
      query: { serverId: server.id },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
    });

    // 监听连接成功事件，连接成功后再发送请求
    socketService.on("connect", () => {
      console.log("Socket连接成功，发送ssh_connect请求到 gen/server");
      // 发送 SSH 连接请求消息到 gen/server 主题
      socketService.emit("gen/server", JSON.stringify({
        messageType: "ssh_connect",
        serverId: Number(server.id),
        serverHost: server.host,
        serverPort: server.port || 22,
        timestamp: Date.now(),
      }));
      message.success("服务器连接成功");
    });

    // 监听连接错误
    socketService.on("connect_error", (error: any) => {
      console.error("Socket连接失败:", error);
      message.error("连接失败");
    });

    console.log("Socket服务创建成功:", socketName);
  } catch (error) {
    message.error("连接异常，请稍后重试");
    console.error("连接服务器出错:", error);
  }
};

/**
 * 断开服务器连接 - 关闭 Socket 连接
 */
const disconnectServer = async (server: any) => {
  try {
    console.log("断开服务器连接:", server);
    message.info("正在断开连接...");

    const socketName = `server-${server.id}`;
    
    // 检查是否存在连接
    const existingService = getNamedSocketService(socketName);
    if (existingService) {
      // 发送断开连接消息到 gen/server 主题
      existingService.emit("gen/server", JSON.stringify({
        messageType: "ssh_disconnect",
        serverId: Number(server.id),
        errorMessage: "用户主动断开",
        timestamp: Date.now(),
      }));
      
      // 关闭 Socket 服务
      closeNamedSocketService(socketName);
      console.log("Socket服务已关闭:", socketName);
      message.success("服务器连接已断开");
    } else {
      message.warning("服务器未连接");
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
    await ElMessageBox.confirm(`确定要删除服务器 "${server.name}" 吗？`, "删除确认", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });

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
 * 处理 Socket 消息
 */
const handleSocketMessage = (msgData: any) => {
  const messageType = msgData.messageType;
  
  switch (messageType) {
    case "server_metrics":
      console.log("收到server_metrics消息:", msgData);
      if (msgData.serverId && msgData.data) {
        const data = msgData.data;
        const currentMetrics = serverMetrics.value.get(msgData.serverId as any);

        const cpuUsage = safeExtractValue(data.cpu?.usage ?? data.cpuUsage, currentMetrics?.cpuUsage);
        const memoryUsage = safeExtractValue(data.memory?.usage ?? data.memoryUsage, currentMetrics?.memoryUsage);
        const diskUsage = safeExtractValue(data.disk?.usage ?? data.diskUsage, currentMetrics?.diskUsage);
        const networkIn = safeExtractValue(data.network?.in ?? data.networkIn, currentMetrics?.networkIn);
        const networkOut = safeExtractValue(data.network?.out ?? data.networkOut, currentMetrics?.networkOut);
        const osInfo = data.osInfo ? JSON.parse(data.osInfo) : {};
        const loadAverage = data.loadAverage ?? (data.cpu?.load1m ? `${data.cpu.load1m} ${data.cpu.load5m || 0} ${data.cpu.load15m || 0}` : undefined) ?? currentMetrics?.loadAverage;

        serverMetricsStore.updateServerMetrics(msgData.serverId, {
          serverId: msgData.serverId,
          serverName: msgData.serverName,
          cpuUsage,
          memoryUsage,
          diskUsage,
          diskPartitions: data.disk?.partitions || [],
          networkIn,
          networkOut,
          networkInSpeed: data.network?.inSpeed || 0,
          networkOutSpeed: data.network?.outSpeed || 0,
          uptime: data.uptime || 0,
          processCount: data.processCount || 0,
          loadAverage,
          temperature: data.temperature,
          status: data.status === 1 ? "online" : "offline",
          collectTime: data.collectTime || new Date().toISOString(),
          osInfo: osInfo.osInfo,
          osName: osInfo.osName,
          osVersion: osInfo.osVersion,
          hostname: osInfo.hostname || "未知",
          extraInfo: data.extraInfo
        });

        const displayMetrics = mapServerMetricsToDisplay(data);
        serverMetrics.value.set(String(msgData.serverId), displayMetrics);
        console.log(`已更新服务器 ${msgData.serverId} 指标数据`);
      }
      break;

    case "server_status_summary":
      console.log("收到server_status_summary消息:", msgData);
      if (msgData.data) {
        serverMetricsStore.updateStatusSummary(msgData.data);
      }
      break;

    case "connection_status_change":
      console.log("收到connection_status_change消息:", msgData);
      if (msgData.serverId) {
        const serverIndex = servers.value.findIndex(s => s.id === String(msgData.serverId));
        if (serverIndex !== -1) {
          servers.value[serverIndex].connectionStatus = msgData.connectionStatus as any;
        }
      }
      break;

    case "server_alerts":
      console.log("收到server_alerts消息:", msgData);
      break;

    case SERVER_WS_MESSAGE_TYPE.SERVER_LATENCY:
    case "server_latency":
      console.log("收到server_latency消息:", msgData);
      if (msgData.serverId && msgData.data && typeof msgData.data.latency === "number") {
        latencyManager.updateLatencyData(msgData.serverId, msgData.data.latency, msgData.data.timestamp);
        const serverIndex = servers.value.findIndex(s => s.id === String(msgData.serverId));
        if (serverIndex !== -1) {
          servers.value[serverIndex].latency = msgData.data.latency;
        }
      }
      break;

    case SERVER_WS_MESSAGE_TYPE.BATCH_SERVER_LATENCY:
    case "batch_server_latency":
      console.log("收到batch_server_latency消息:", msgData);
      if (Array.isArray(msgData.data)) {
        msgData.data.forEach((latencyData: any) => {
          if (latencyData.serverId && typeof latencyData.latency === "number") {
            latencyManager.updateLatencyData(latencyData.serverId, latencyData.latency, latencyData.timestamp);
            const serverIndex = servers.value.findIndex(s => s.id === String(latencyData.serverId));
            if (serverIndex !== -1) {
              servers.value[serverIndex].latency = latencyData.latency;
            }
          }
        });
      }
      break;
  }
};

/**
 * 初始化 Socket 连接和消息处理
 */
const initSocketService = () => {
  console.log("初始化Socket服务...");
  
  const config = getConfig();
  
  // 先关闭已存在的连接
  const existing = getNamedSocketService(GLOBAL_SOCKET_NAME);
  if (existing) {
    closeNamedSocketService(GLOBAL_SOCKET_NAME);
  }
  
  // 创建全局 Socket 服务
  globalSocketService.value = createNamedSocketService(GLOBAL_SOCKET_NAME, {
    protocol: "socketio",
    urls: config.SocketUrl ? config.SocketUrl.split(",") : [],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
  });

  // 连接 Socket
  globalSocketService.value.connect();

  // 监听连接成功
  globalSocketService.value.on("connect", () => {
    console.log("全局Socket连接成功");
  });

  // 监听 gen/server 主题的消息
  globalSocketService.value.on("gen/server", (rawMessage: any) => {
    try {
      const data = parseSocketMessage(rawMessage);
      let messageData = data;
      
      if (data && (data as any).data && typeof (data as any).data === "string") {
        try {
          messageData = JSON.parse((data as any).data);
        } catch {
          messageData = data;
        }
      }
      
      handleSocketMessage(messageData);
    } catch (error) {
      console.error("解析Socket消息失败:", error);
    }
  });

  // 监听 monitor:server:metrics 主题
  globalSocketService.value.on("monitor:server:metrics", (rawMessage: any) => {
    try {
      const data = parseSocketMessage(rawMessage);
      handleSocketMessage({ messageType: "server_metrics", ...data });
    } catch (error) {
      console.error("解析指标消息失败:", error);
    }
  });

  // 监听 monitor:server:status 主题
  globalSocketService.value.on("monitor:server:status", (rawMessage: any) => {
    try {
      const data = parseSocketMessage(rawMessage);
      handleSocketMessage(data);
    } catch (error) {
      console.error("解析状态消息失败:", error);
    }
  });

  console.log("Socket服务初始化完成");
};

// 生命周期钩子
onMounted(async () => {
  console.log("server/index.vue 组件已挂载");

  // 加载服务器列表
  await loadServers();

  // 初始化 Socket 服务
  initSocketService();
});

onUnmounted(() => {
  console.log("server/index.vue 组件已卸载");

  // 关闭全局 Socket 服务
  closeNamedSocketService(GLOBAL_SOCKET_NAME);
  globalSocketService.value = null;
  console.log("Socket连接已断开");

  // 清理缓存数据
  serverMetricsStore.clearCache();
  console.log("服务器指标缓存已清理");
});
</script>

<style lang="scss" scoped>
.server-wrapper {
  height: 100vh;
  width: 100%;
}
.offline {
  background-color: red;
}
.online {
  background-color: green;
}
</style>
