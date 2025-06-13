<template>
  <el-drawer v-model="drawerVisible" :title="'软件安装进度 - ' + props.software.softServiceName" size="90%" direction="rtl" :destroy-on-close="false" :before-close="handleClose" class="install-progress-drawer">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center justify-between">
          <IconifyIconOnline icon="ep:connection" class="mr-2 text-primary text-xl" />
          <span class="text-lg font-medium">软件安装进度 - {{ props.software.softServiceName }}</span>
        </div>
      </div>
    </template>
    <el-container class="install-container h-full">
      <!-- 左侧信息和设备列表 -->
      <el-aside width="320px" class="install-left-sidebar">
        <div class="left-sidebar-content">
          <!-- 软件信息部分 -->
          <SoftwareInfo :software="props.software" />

          <!-- 设备列表部分 -->
          <DeviceList :device-list="deviceServices" :active-device="activeInstallId" @select-device="handleSelectDevice" />
        </div>
      </el-aside>

      <!-- 右侧日志和设备卡片 -->
      <el-container class="install-right-content">
        <!-- 右侧上部日志区域 -->
        <el-main class="install-logs" :class="{ 'has-active-device': !!activeInstallId && activeInstallId !== 'loading' && activeInstallId !== 'error' && activeInstallId !== 'no-records' }">
          <div class="install-progress-header" v-if="activeInstallId && activeInstallId !== 'loading' && activeInstallId !== 'error' && activeInstallId !== 'no-records'">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <el-avatar :size="36" class="mr-3">
                  <IconifyIconOnline icon="ep:monitor" />
                </el-avatar>
                <div>
                  <h3 class="text-lg font-medium mb-0">
                    {{ getCurrentDeviceName() }}
                    <el-tag :type="getStatusTagType(installStatus)" effect="dark" size="small">
                      {{ getInstallStatusText(installStatus) }}
                    </el-tag>
                    <el-tag v-if="installStatus === 2" :type="isServiceRunning ? 'success' : 'info'" effect="light" size="small" class="ml-1">
                      {{ getRunStatusText(serviceRunStatus) }}
                    </el-tag>
                  </h3>
                  <div class="text-sm text-gray-500">
                    {{ getCurrentDeviceInfo() }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- 服务控制按钮组 - 仅在安装成功时显示 -->
                <div v-if="installStatus === 2 && activeInstallId && activeInstallId !== 'loading' && activeInstallId !== 'error' && activeInstallId !== 'no-records'" class="service-control-buttons">
                  <!-- 服务未运行时显示启动按钮 -->
                  <el-tooltip v-if="!isServiceRunning" content="启动服务" placement="top">
                    <el-button type="success" :icon="useRenderIcon('ep:video-play')" circle size="small" :loading="serviceActionLoading.start" @click="handleStartService" />
                  </el-tooltip>
                  
                  <!-- 服务运行中显示停止和重启按钮 -->
                  <template v-if="isServiceRunning">
                    <el-tooltip content="停止服务" placement="top">
                      <el-button type="warning" :icon="useRenderIcon('ep:video-pause')" circle size="small" :loading="serviceActionLoading.stop" @click="handleStopService" />
                    </el-tooltip>
                    
                    <el-tooltip content="重启服务" placement="top">
                      <el-button type="primary" :icon="useRenderIcon('ep:refresh-right')" circle size="small" :loading="serviceActionLoading.restart" @click="handleRestartService" />
                    </el-tooltip>
                  </template>
                </div>
                
                <!-- 配置按钮 - 仅在设备有配置路径时显示 -->
                <el-tooltip v-if="currentDevice?.installConfigPath && activeInstallId && activeInstallId !== 'loading' && activeInstallId !== 'error' && activeInstallId !== 'no-records'" content="查看/修改配置" placement="top">
                  <el-button type="info" :icon="useRenderIcon('ep:setting')" circle size="small" @click="handleOpenConfig" />
                </el-tooltip>
                
                <el-tooltip v-if="activeInstallId && activeInstallId !== 'loading' && activeInstallId !== 'error' && activeInstallId !== 'no-records'" content="刷新设备状态" placement="top">
                  <el-button type="primary" :icon="useRenderIcon('ep:refresh')" circle size="small" class="ml-2" :loading="refreshing" @click="refreshDeviceStatus" />
                </el-tooltip>
                
                <el-tag  v-if="activeInstallId && activeInstallId !== 'loading' && activeInstallId !== 'error' && activeInstallId !== 'no-records' && installStatus != 0" class="flex items-center justify-center cursor-pointer" type="danger" @click="handleUninstall" :loading="uninstalling">
                  <span><IconifyIconOnline icon="ep:delete" class="mr-1" /></span>
                  <span>卸载</span>
                </el-tag>
              </div>
            </div>
          </div>
          <LogSection :logs="logs" :logs-height="logsHeight" :install-status="getInstallRecordStatus(installStatus)" :can-view-service-logs="canViewServiceLogs" :install-progress="currentInstallProgress" ref="logSectionRef" @log-type-change="handleLogTypeChange" @clear="clearLogs" @export="exportLogs" />
        </el-main>
      </el-container>
    </el-container>
  </el-drawer>

  <!-- 服务表单对话框 -->
  <ServiceForm v-model="serviceFormVisible" :service-data="serviceForm" :is-edit="isEditService" :soft-service-list="softServiceList" @submit="submitServiceForm" @cancel="serviceFormVisible = false" />

  <!-- 配置编辑器对话框 -->
  <ConfigEditor v-model="configEditorVisible" :install-id="activeInstallId" @save="handleConfigSave" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { message, useUUID, splitToArray } from "@repo/utils";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { http, type ReturnResult } from "@repo/utils";
import type { PartialSoftService } from "@/api/soft";
import {
  fetchSoftServiceStartService,
  fetchSoftServiceStopService,
  fetchSoftServiceRestartService,
  fetchSoftServiceUninstall,
  fetchSoftServiceLog,
  fetchSoftServiceInstallByServiceId,
  fetchSoftServiceInstallAdd,
  fetchSoftServiceInstallUpdate,
  fetchSoftServiceInstallDelete,
  type SoftServiceInstall,
} from "@/api/soft/install";
import { fetchSoftServicePage } from "@/api/soft";
import { fetchSoftServiceInstallLog } from "@/api/soft/log";
import { ElMessageBox } from "element-plus";
import { ResizeHandle, LogSection, ServiceSection, DeviceList, ServiceForm, SoftwareInfo, ConfigEditor } from "./install-progress";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

// 扩展SoftServiceInstall接口，添加UI需要的额外字段
//@ts-ignore
interface ExtendedSoftServiceInstall extends Partial<SoftServiceInstall> {
  sshName?: string;
  sshHost?: string;
  sshPort?: string | number;
  progress?: number; // 添加进度属性
  sshId?: string; // 确保sshId为字符串类型
  installId?: string; // 确保installId为字符串类型
  sshUsername?: string;
  sshPassword?: string;
  installConfigPath?: string;
  remark?: string;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  software: {
    type: Object as () => PartialSoftService,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "finish"]);

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// 状态和日志相关
const logs = ref<any[]>([]);
const stompClient = ref<any>(null);
const logSectionRef = ref<any>(null);
const activeInstallId = ref<string>("");
const installStatus = ref<number>(0); // pending, running, success, error
const deviceServices = ref<ExtendedSoftServiceInstall[]>([]);
const installId = ref<string>("");
const isViewMode = ref(false); // 是否为查看模式
const serviceFormVisible = ref(false);
const serviceForm = reactive<ExtendedSoftServiceInstall>({
  installId: undefined,
  sshId: "",
  softServiceId: 0,
  installStatus: 0,
  installPath: "",
  installVersion: "",
  installRunStatus: 0,
  sshName: "",
  sshHost: "",
  sshPort: 22,
  sshUsername: "root",
  sshPassword: "",
  installConfigPath: "",
  remark: ""
});
const isEditService = ref(false);
const currentServiceId = ref("");
const softServiceList = ref<any[]>([]); // 软件服务列表

// 服务控制按钮加载状态
const serviceActionLoading = reactive({
  start: false,
  stop: false,
  restart: false,
});

// 计算属性: 是否可以查看服务日志
const canViewServiceLogs = computed(() => {
  return activeInstallId.value && deviceServices.value.length > 0;
});

// 当前选中的设备
const currentDevice = computed(() => {
  return deviceServices.value.find((d) => d.installId === activeInstallId.value);
});

// 计算属性: 服务运行状态
const serviceRunStatus = computed(() => {
  const device = currentDevice.value;
  if (!device) return 0;

  return device.installRunStatus || 0;
});

// 计算属性: 服务是否正在运行
const isServiceRunning = computed(() => {
  return serviceRunStatus.value === 1;
});

// 选择第一个有效设备的辅助函数
const selectFirstDevice = () => {
  if (deviceServices.value.length > 0) {
    const firstDevice = deviceServices.value[0];
    if (firstDevice) {
      // 使用installId或sshId作为activeInstallId
      activeInstallId.value = firstDevice.installId || firstDevice.sshId || "";
      if (activeInstallId.value) {
        // 自动加载该设备的日志和状态
        nextTick(() => {
          handleSelectDevice("", activeInstallId.value);
        });
      }
    }
  }
};

// 拖动分隔符相关
const resizing = ref(false);
const startY = ref(0);
const logsHeight = ref("calc(100vh - 450px)");
const minLogHeight = 150;
const maxLogHeight = window.innerHeight - 350;
const currentLogHeight = ref(window.innerHeight - 450);

// 服务区域切换器
const servicesVisible = ref(false);
const toggleServices = () => {
  servicesVisible.value = !servicesVisible.value;
};

// 处理拖动调整大小
const handleResize = (height: number) => {
  logsHeight.value = `${height}px`;
  currentLogHeight.value = height;
};

// 添加日志
const addLog = (type: string, content: string) => {
  logs.value.push({
    id: logs.value.length + 1,
    type,
    msg: content,
    timestamp: new Date(),
  });

  // 自动滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

// 滚动到日志底部
const scrollToBottom = () => {
  if (logSectionRef.value?.logScrollRef) {
    const scrollbar = logSectionRef.value.logScrollRef;
    scrollbar.setScrollTop(scrollbar.wrapRef.scrollHeight);
  }
};

// 加载软件服务列表
const loadSoftServiceList = async () => {
  try {
    const res: any = await fetchSoftServicePage({
      pageNum: 1,
      pageSize: 999,
    });

    if (res.code === "00000" && res.data && res.data.data) {
      softServiceList.value = res.data.data;
    } else {
      softServiceList.value = [];
    }
  } catch (error) {
    console.error("加载软件服务列表失败:", error);
    softServiceList.value = [];
  }
};

// 加载设备安装日志
const loadDeviceInstallLog = async (deviceId: string) => {
  try {
    // 清空日志
    logs.value = [];
    addLog("info", "正在加载安装日志...");

    // 检查deviceId是否有效
    if (!deviceId || typeof deviceId !== "string" || deviceId === "loading" || deviceId === "error" || deviceId === "load-error" || deviceId === "no-records") {
      addLog("error", "无效的设备ID，无法加载日志");
      return;
    }

    // 查询设备安装日志
    const res = await fetchSoftServiceLog({ 
      installId: deviceId
    });

    if (res.code === "00000" && res.data) {
      // 处理返回的日志数据
      const logData = res.data;

      if (Array.isArray(logData) && logData.length > 0) {
        // 转换日志格式
        logs.value = logData.map((log, index) => ({
          id: index + 1,
          type: log.level?.toLowerCase() || "info",
          msg: log.message || "",
          timestamp: log.createTime ? new Date(log.createTime) : new Date(),
          module: log.module,
        }));
      } else {
        addLog("info", "暂无安装日志记录");
      }

      // 自动滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
    } else {
      addLog("error", res.msg || "加载安装日志失败");
    }
  } catch (error) {
    console.error("加载安装日志失败:", error);
    addLog("error", "加载安装日志失败");
  }
};

// 加载设备服务
const loadDeviceServices = async () => {
  if (!activeInstallId.value || activeInstallId.value === "loading" || activeInstallId.value === "error" || activeInstallId.value === "load-error" || activeInstallId.value === "no-records") {
    deviceServices.value = [];
    return;
  }

  try {
    deviceServices.value = [];

    // 查询设备服务，获取所有与当前软件关联的安装记录
    const res = await fetchSoftServiceInstallByServiceId({
      softServiceId: props.software.softServiceId!,
      installId: activeInstallId.value,
    });

    if (res.code === "00000" && res.data) {
      // 过滤当前设备的服务
      deviceServices.value = Array.isArray(res.data) ? res.data.filter((service: any) => service.sshId == activeInstallId.value || service.installId == activeInstallId.value) : res.data ? [res.data] : [];
    } else {
      deviceServices.value = [];
    }
  } catch (error) {
    console.error("加载设备服务失败:", error);
    deviceServices.value = [];
    message.error("加载设备服务失败");
  }
};

// 格式化时间
const formatTime = (date: Date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// 获取安装记录状态
const getInstallRecordStatus = (status: number | string | undefined) => {
  if (status === undefined) return "pending";

  // 转换为数字
  const statusNum = typeof status === "string" ? parseInt(status, 10) : status;

  switch (statusNum) {
    case 0:
      return "pending"; // 未安装
    case 1:
      return "running"; // 安装中
    case 2:
      return "success"; // 已安装
    case 3:
      return "error"; // 安装失败
    default:
      return "pending";
  }
};

// 监听软件信息变化，获取已安装的设备
watch(
  () => props.software.installedServers,
  (newInstalledServers) => {
    // 默认为查看模式
    isViewMode.value = true;

    if (newInstalledServers && newInstalledServers.length > 0) {
      // 如果有已安装的服务器信息，转换为设备服务列表
      deviceServices.value = newInstalledServers.map((server) => ({
        installId: String(server.installId || server.sshId || ""),  // 如果没有installId，使用sshId
        sshId: String(server.sshId || ""),
        softServiceId: props.software.softServiceId,
        installStatus: server.installStatus || 0,
        installPath: server.installPath || "",
        installVersion: server.installVersion || props.software.softServiceVersion || "",
        installRunStatus: server.installRunStatus || 0,
        sshName: server.serverName || server.sshName || `设备 ${server.sshId?.substring(0, 8) || "未知"}`,
        sshHost: server.host || "",
        sshPort: server.port || "",
        createTime: server.installTime || new Date(),
      }));

      // 如果有指定的设备ID，则选中该设备
      if ((props.software as any).selectedDeviceId) {
        const deviceId = (props.software as any).selectedDeviceId;
        const device = deviceServices.value.find((d) => d.installId === deviceId || d.sshId === deviceId);
        if (device) {
          activeInstallId.value = device.installId || device.sshId || "";
          // 自动加载该设备的日志和状态
          nextTick(() => {
            handleSelectDevice("", activeInstallId.value);
          });
        } else {
          // 如果指定的设备不存在，则选择第一个设备
          selectFirstDevice();
        }
      }
      // 否则选择第一个设备
      else {
        selectFirstDevice();
      }
    } else {
      // 如果没有已安装服务器，查询历史安装记录
      loadInstallHistory();
    }
  },
  { immediate: true }
);

// 监听 activeInstallId 变化
watch(
  () => activeInstallId.value,
  (newInstallId) => {
    if (newInstallId && newInstallId !== "loading" && newInstallId !== "error" && newInstallId !== "no-records") {
      // 加载设备服务
      loadDeviceServices();
    }
  }
);

// 连接 WebSocket
const connectWebSocket = async () => {
  if (stompClient.value && stompClient.value.connected) {
    return;
  }

  try {
    const config = getConfig();
    stompClient.value = socket(splitToArray(config.SocketUrl), undefined, {});

    // 连接成功添加一条日志
    addLog("info", "连接安装日志服务成功，等待安装操作...");

    // 订阅软件安装日志
    subscribeToLogs();
  } catch (error) {
    console.error("WebSocket连接异常:", error);
    addLog("error", `WebSocket连接异常: ${error}`);
  }
};

// 订阅日志
const subscribeToLogs = () => {
  if (!stompClient.value) return;

  // 先取消之前的订阅
  unsubscribeFromLogs();

  // 清空日志
  logs.value = [];

  // 订阅软件主题
  const topic = `/topic/install/soft`;

  stompClient.value.on(topic, (message: any) => {
    try {
      const output = JSON.parse(message.data);

      // 如果有eventId（installId），检查是否是当前选中的设备
      if (output.eventId && activeInstallId.value && output.eventId != activeInstallId.value) {
        // 不是当前设备的日志，忽略
        return;
      }

      // 如果有softServiceId，检查是否是当前软件
      if (output.softServiceId && props.software.softServiceId && output.softServiceId !== props.software.softServiceId) {
        // 不是当前软件的日志，忽略
        return;
      }

      // 处理后端推送的消息格式
      logs.value.push({
        id: logs.value.length + 1,
        msg: output.msg,
        type: output.type || "info",
        timestamp: output.timestamp ? new Date(output.timestamp) : new Date(),
        step: output.step,
        total: output.total,
        module: output.module,
        eventId: output.eventId,
      });

      // 自动滚动到底部
      nextTick(() => {
        scrollToBottom();
      });

      // 检查安装状态和更新进度
      if (output.step !== undefined && output.total !== undefined && output.total > 0) {
        const progress = Math.round((output.step / output.total) * 100);
        // 只更新一次进度数据
        updateInstallProgress(activeInstallId.value, progress);
        checkInstallStatus(output);
      } else {
        // 如果没有进度信息，只检查安装状态
        checkInstallStatus(output);
      }

      // 当收到安装完成的消息时，重新加载设备服务
      if (output.type === "success" && output.msg && output.msg.includes("安装完成")) {
        nextTick(async () => {
          await loadDeviceServices();
          if (deviceServices.value.length > 0 && activeInstallId.value) {
            servicesVisible.value = true;
          }
        });
      }
    } catch (error) {
      console.error("解析WebSocket消息失败:", error);
    }
  });

  addLog("info", `正在监听${getLogTypeText()}...`);
};

// 取消订阅
const unsubscribeFromLogs = () => {
  if (!stompClient.value) return;

  // 取消软件主题订阅
  const softTopic = `/topic/install/soft`;
  stompClient.value.off(softTopic);

  // 不需要取消设备特定的主题，因为我们只使用软件主题
};

// 获取日志类型文本
const getLogTypeText = () => {
  if (!logSectionRef.value) return "日志";

  const activeLogType = logSectionRef.value.activeLogType;
  switch (activeLogType) {
    case "install":
      return "安装日志";
    case "start":
      return "启动日志";
    case "stop":
      return "停止日志";
    case "restart":
      return "重启日志";
    case "uninstall":
      return "卸载日志";
    case "monitor":
      return "实时监控";
    default:
      return "日志";
  }
};

// 检查安装状态
const checkInstallStatus = (log: any) => {
  if (!logSectionRef.value || logSectionRef.value.activeLogType !== "install") return;

  const msg = log.msg || "";
  const type = log.type || "";

  // 根据日志内容或类型更新安装状态
  if (msg.includes("安装开始") || type === "start") {
    installStatus.value = 1;
    updateDeviceStatus(activeInstallId.value, "running");
  } else if (msg.includes("安装成功") || msg.includes("安装完成") || type === "success") {
    installStatus.value = 2;
    updateDeviceStatus(activeInstallId.value, "success");
  } else if (msg.includes("安装失败") || msg.includes("错误") || msg.includes("Error") || type === "error" || type === "FAILURE") {
    installStatus.value = 3;
    updateDeviceStatus(activeInstallId.value, "error");
  }
};

// 更新设备状态
const updateDeviceStatus = (installId: string, status: string) => {
  const device = deviceServices.value.find((d) => d.installId === installId);
  if (device) {
    device.installStatus = status === "running" ? 1 : status === "success" ? 2 : status === "error" ? 3 : 0;
  }
};

// 更新安装进度
const updateInstallProgress = (installId: string, progress: number) => {
  const device = deviceServices.value.find((d) => d.installId === installId || d.sshId === installId);
  if (device) {
    // 只有当新进度大于当前进度时才更新，防止进度回退
    if (!device.progress || progress > device.progress) {
      device.progress = progress;
      
      // 如果进度达到100%，确保安装状态为成功
      if (progress === 100) {
        device.installStatus = 2; // 成功状态
        installStatus.value = 2;
      }
    }
  }
};

// 处理日志类型变更
const handleLogTypeChange = () => {
  // 重新订阅日志
  subscribeToLogs();
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
  addLog("info", `日志已清空，继续监听${getLogTypeText()}...`);
};

// 导出日志
const exportLogs = () => {
  try {
    // 格式化日志内容
    const logContent = logs.value
      .map((log) => {
        const time = formatTime(log.timestamp || new Date());
        const content = log.msg || "";
        return `[${time}] ${content}`;
      })
      .join("\n");

    // 创建 Blob 对象
    const blob = new Blob([logContent], { type: "text/plain" });

    // 创建下载链接
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${props.software.softServiceName}-${logSectionRef.value?.activeLogType || "install"}-logs-${new Date().toISOString().slice(0, 10)}.txt`;

    // 触发点击事件
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);

    message.success("日志导出成功");
  } catch (error) {
    console.error("导出日志失败:", error);
    message.error("导出日志失败");
  }
};

// 加载安装历史记录
const loadInstallHistory = async () => {
  try {
    deviceServices.value = [
      {
        installId: "loading",
        sshId: "loading",
        sshName: "正在加载...",
        installStatus: 0,
        softServiceId: props.software.softServiceId,
        progress: 0,
      } as ExtendedSoftServiceInstall,
    ];

    // 加载设备服务
    await loadDeviceServices();

    if (deviceServices.value.length > 0 && deviceServices.value[0].installId !== "loading") {
      // 选择第一个设备
      const firstValidDevice = deviceServices.value.find((d) => d.installId && d.installId !== "loading" && d.installId !== "error" && d.installId !== "no-records");

      if (firstValidDevice && firstValidDevice.installId) {
        activeInstallId.value = firstValidDevice.installId;

        // 加载该设备的安装日志
        loadDeviceInstallLog(firstValidDevice.installId);

        // 更新设备状态
        const _device = deviceServices.value.find((d) => d.installId === firstValidDevice.installId);
        if (_device) {
          installStatus.value = _device.installStatus || 0;
        }

        // 订阅设备日志
        subscribeToLogs();
      }
    } else {
      deviceServices.value = [
        {
          installId: "no-records",
          sshId: "no-records",
          sshName: "暂无安装记录",
          installStatus: 0,
          softServiceId: props.software.softServiceId,
          progress: 0,
        } as ExtendedSoftServiceInstall,
      ];
    }
  } catch (error) {
    console.error("加载安装历史记录失败:", error);
    deviceServices.value = [
      {
        installId: "error",
        sshId: "error",
        sshName: "加载失败",
        installStatus: 3,
        softServiceId: props.software.softServiceId,
        progress: 0,
      } as ExtendedSoftServiceInstall,
    ];
    addLog("error", "加载安装记录失败");
  }
};

// 处理选择设备
const handleSelectDevice = async (deviceId: string, installId?: string) => {
  // 使用提供的installId或deviceId作为活动ID
  const activeId = installId || deviceId;
  
  // 检查ID是否有效
  if (!activeId || activeId === "loading" || activeId === "error" || activeId === "load-error" || activeId === "no-records") {
    message.warning("无效的设备ID，无法加载信息");
    return;
  }

  activeInstallId.value = activeId;

  // 查找对应的设备
  const device = deviceServices.value.find((d) => d.installId === activeId || d.sshId === activeId);
  if (device) {
    installStatus.value = device.installStatus || 0;
  }

  // 订阅日志
  subscribeToLogs();

  // 加载该设备的安装日志
  //loadDeviceInstallLog(activeId);

  // 重新加载设备服务信息，确保获取最新的运行状态
  try {
    const res = await fetchSoftServiceInstallByServiceId({
      softServiceId: props.software.softServiceId!,
      installId: activeId,
    });

    if (res.code === "00000" && res.data) {
      // 更新当前设备的信息
      const updatedDevice = Array.isArray(res.data) ? res.data.find((service: any) => service.installId === activeId || service.sshId === activeId) : res.data;

      if (updatedDevice) {
        // 更新设备信息，包括运行状态
        const index = deviceServices.value.findIndex((d) => d.installId === activeId || d.sshId === activeId);
        if (index !== -1) {
          deviceServices.value[index] = {
            ...deviceServices.value[index],
            ...updatedDevice,
            installRunStatus: updatedDevice.installRunStatus || 0,
          };
        }
      }
    }
  } catch (error) {
    console.error("更新设备服务状态失败:", error);
    addLog("error", "更新设备服务状态失败");
  }

  // 当选择设备并且有服务数据时自动显示服务区域
  if (deviceServices.value.length > 0) {
    servicesVisible.value = true;
  }
};

// 删除服务
const handleDeleteService = async (service: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除服务 "${service.sshName}" 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await fetchSoftServiceInstallDelete({ installId: service.installId });

    if (res.code === "00000") {
      message.success("删除服务成功");
      loadDeviceServices();
    } else {
      message.error(res.msg || "删除服务失败");
    }
  } catch (error) {
    console.error("删除服务失败:", error);
    if (error !== "cancel") {
      message.error("删除服务失败");
    }
  }
};

// 添加服务
const handleAddService = () => {
  isEditService.value = false;
  serviceForm.installId = activeInstallId.value;
  serviceForm.softServiceId = props.software.softServiceId || 0;
  serviceForm.sshName = "";
  serviceForm.sshHost = "";
  serviceForm.sshPort = 22;
  serviceForm.sshUsername = "root";
  serviceForm.sshPassword = "";
  serviceForm.installPath = "";
  serviceForm.installVersion = "";
  serviceForm.installRunStatus = 0;
  serviceForm.installStatus = 0;
  serviceForm.installConfigPath = "";
  serviceForm.remark = "";
  serviceFormVisible.value = true;
};

// 编辑服务
const handleEditService = (service: any) => {
  isEditService.value = true;
  currentServiceId.value = service.installId;
  serviceForm.installId = service.installId;
  serviceForm.softServiceId = service.softServiceId;
  serviceForm.sshName = service.sshName;
  serviceForm.sshHost = service.sshHost;
  serviceForm.sshPort = service.sshPort;
  serviceForm.sshUsername = service.sshUsername;
  serviceForm.sshPassword = service.sshPassword;
  serviceForm.installPath = service.installPath;
  serviceForm.installVersion = service.installVersion;
  serviceForm.installRunStatus = service.installRunStatus;
  serviceForm.installStatus = service.installStatus;
  serviceForm.installConfigPath = service.installConfigPath;
  serviceForm.remark = service.remark;
  serviceFormVisible.value = true;
};

// 提交服务表单
const submitServiceForm = async (data: any) => {
  try {
    let res;
    if (isEditService.value) {
      res = await fetchSoftServiceInstallUpdate(data);
    } else {
      res = await fetchSoftServiceInstallAdd(data);
    }

    if (res.code === "00000") {
      message.success(isEditService.value ? "更新服务成功" : "添加服务成功");
      serviceFormVisible.value = false;
      loadDeviceServices();
    } else {
      message.error(res.msg || (isEditService.value ? "更新服务失败" : "添加服务失败"));
    }
  } catch (error) {
    console.error("提交服务表单失败:", error);
    message.error(isEditService.value ? "更新服务失败" : "添加服务失败");
  }
};

// 断开WebSocket连接
const disconnectWebSocket = () => {
  if (stompClient.value) {
    unsubscribeFromLogs();
    stompClient.value.close();
    stompClient.value = null;
  }
};

// 组件挂载时加载软件服务列表
onMounted(() => {
  // 无论是安装模式还是查看模式，都连接WebSocket获取日志
  connectWebSocket();

  // 加载软件服务列表
  loadSoftServiceList();

  // 加载设备服务
  loadDeviceServices();
});

// 监听抽屉可见性变化，当打开时自动选择第一个设备
watch(
  () => drawerVisible.value,
  async (visible) => {
    if (visible) {
      // 当抽屉打开时，加载设备服务
      await loadDeviceServices();

      // 如果有指定的设备ID，则选中该设备
      if ((props.software as any).selectedDeviceId) {
        const deviceId = (props.software as any).selectedDeviceId;
        const device = deviceServices.value.find((d) => d.installId === deviceId);
        if (device) {
          handleSelectDevice("", deviceId);
        }
      }
      // 否则自动选择第一个有效的设备
      else if (deviceServices.value.length > 0) {
        const firstDevice = deviceServices.value.find((d) => d.installId !== "loading" && d.installId !== "error" && d.installId !== "no-records");

        if (firstDevice && firstDevice.installId) {
          handleSelectDevice("", firstDevice.installId);
        }
      }
    }
  },
  { immediate: true }
);

// 组件销毁前断开WebSocket连接和移除事件监听器
onBeforeUnmount(() => {
  disconnectWebSocket();
});

// 处理关闭
const handleClose = () => {
  // 断开WebSocket连接
  disconnectWebSocket();

  // 关闭抽屉
  drawerVisible.value = false;

  // 发送完成事件
  emit("finish");
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return "ep:loading";
    case "running":
      return "ep:loading";
    case "success":
      return "ep:check";
    case "error":
      return "ep:close";
    default:
      return "ep:info";
  }
};

// 获取当前设备名称
const getCurrentDeviceName = () => {
  if (!activeInstallId.value) return "未选择设备";

  const device = deviceServices.value.find((d) => d.installId === activeInstallId.value);
  return device ? device.sshName : "未知设备";
};

// 获取当前设备信息
const getCurrentDeviceInfo = () => {
  if (!activeInstallId.value) return "";

  const device = deviceServices.value.find((d) => d.installId === activeInstallId.value);
  if (!device) return "";

  const parts = [];
  if (device.sshPort) parts.push(`端口: ${device.sshPort}`);
  if (device.installVersion) parts.push(`版本: ${device.installVersion}`);
  if (device.installPath) parts.push(`路径: ${device.installPath}`);
  if (device.installConfigPath) parts.push(`配置: ${device.installConfigPath}`);
  if (device.installRunStatus !== undefined) parts.push(`运行状态: ${getRunStatusText(device.installRunStatus)}`);

  return parts.join(" | ");
};

// 获取运行状态文本
const getRunStatusText = (status: number) => {
  switch (status) {
    case 0:
      return "已停止";
    case 1:
      return "运行中";
    case 2:
      return "部分运行";
    default:
      return "未知";
  }
};

// 获取状态标签类型
const getStatusTagType = (status: number) => {
  switch (status) {
    case 0:
      return "info";
    case 1:
      return "warning";
    case 2:
      return "success";
    case 3:
      return "danger";
    default:
      return "info";
  }
};

// 获取安装状态文本
const getInstallStatusText = (status: number) => {
  switch (status) {
    case 0:
      return "等待安装";
    case 1:
      return "安装中";
    case 2:
      return "安装成功";
    case 3:
      return "安装失败";
    default:
      return "未知状态";
  }
};

// 添加卸载相关状态
const uninstalling = ref(false);

// 处理卸载
const handleUninstall = async () => {
  try {
    // 获取当前选中的设备
    const currentDevice = deviceServices.value.find((d) => d.installId === activeInstallId.value);
    if (!currentDevice) {
      message.error("未找到设备信息");
      return;
    }

    // 显示确认对话框
    await ElMessageBox.confirm(`确定要卸载 ${props.software.softServiceName} 吗？此操作不可逆。`, "卸载确认", {
      confirmButtonText: "确认卸载",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 开始卸载
    uninstalling.value = true;
    
    // 切换到卸载日志
    if (logSectionRef.value) {
      logSectionRef.value.activeLogType = "uninstall";
      handleLogTypeChange();
    }

    // 添加卸载开始日志
    addLog("info", `开始卸载 ${props.software.softServiceName}...`);

    // 执行卸载操作
    const installId = currentDevice.installId || "";
    const res = await fetchSoftServiceUninstall({ installId: installId });

    if (res.code === "00000") {
      message.success("卸载命令已发送");
      
      // 等待一段时间后刷新设备状态，确保获取最新状态
      setTimeout(async () => {
        await refreshDeviceStatus();
      }, 2000);
    } else {
      message.error(res.msg || "卸载失败");
      addLog("error", `卸载失败: ${res.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("卸载失败:", error);
      message.error("卸载失败");
      addLog("error", `卸载失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  } finally {
    uninstalling.value = false;
  }
};

// 处理启动服务
const handleStartService = async () => {
  try {
    // 获取当前选中的设备
    const device = deviceServices.value.find((d) => d.installId === activeInstallId.value);
    if (!device) {
      message.error("未找到设备信息");
      return;
    }

    // 设置加载状态
    serviceActionLoading.start = true;
    
    // 切换到启动日志
    if (logSectionRef.value) {
      logSectionRef.value.activeLogType = "start";
      handleLogTypeChange();
    }

    // 添加日志
    addLog("info", `正在启动服务 ${props.software.softServiceName}...`);

    // 调用启动服务API
    const res = await fetchSoftServiceStartService({ installId: device.installId });

    if (res.code === "00000") {
      message.success("启动服务命令已发送");
      
      // 等待一段时间后刷新设备状态，确保获取最新状态
      setTimeout(async () => {
        await refreshDeviceStatus();
      }, 2000);
    } else {
      message.error(res.msg || "启动服务失败");
      addLog("error", `启动服务失败: ${res.msg || "未知错误"}`);
    }
  } catch (error) {
    console.error("启动服务失败:", error);
    message.error("启动服务失败");
    addLog("error", `启动服务失败: ${error instanceof Error ? error.message : "未知错误"}`);
  } finally {
    serviceActionLoading.start = false;
  }
};

// 处理停止服务
const handleStopService = async () => {
  try {
    // 获取当前选中的设备
    const device = deviceServices.value.find((d) => d.installId === activeInstallId.value);
    if (!device) {
      message.error("未找到设备信息");
      return;
    }

    // 显示确认对话框
    await ElMessageBox.confirm(`确定要停止 ${props.software.softServiceName} 服务吗？`, "停止服务确认", {
      confirmButtonText: "确认停止",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 设置加载状态
    serviceActionLoading.stop = true;
    
    // 切换到停止日志
    if (logSectionRef.value) {
      logSectionRef.value.activeLogType = "stop";
      handleLogTypeChange();
    }

    // 添加日志
    addLog("info", `正在停止服务 ${props.software.softServiceName}...`);

    // 调用停止服务API
    const res = await fetchSoftServiceStopService({ installId: device.installId });

    if (res.code === "00000") {
      message.success("停止服务命令已发送");
      
      // 等待一段时间后刷新设备状态，确保获取最新状态
      setTimeout(async () => {
        await refreshDeviceStatus();
      }, 2000);
    } else {
      message.error(res.msg || "停止服务失败");
      addLog("error", `停止服务失败: ${res.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("停止服务失败:", error);
      message.error("停止服务失败");
      addLog("error", `停止服务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  } finally {
    serviceActionLoading.stop = false;
  }
};

// 处理重启服务
const handleRestartService = async () => {
  try {
    // 获取当前选中的设备
    const device = deviceServices.value.find((d) => d.installId === activeInstallId.value);
    if (!device) {
      message.error("未找到设备信息");
      return;
    }

    // 显示确认对话框
    await ElMessageBox.confirm(`确定要重启 ${props.software.softServiceName} 服务吗？`, "重启服务确认", {
      confirmButtonText: "确认重启",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 设置加载状态
    serviceActionLoading.restart = true;
    
    // 切换到重启日志
    if (logSectionRef.value) {
      logSectionRef.value.activeLogType = "restart";
      handleLogTypeChange();
    }

    // 添加日志
    addLog("info", `正在重启服务 ${props.software.softServiceName}...`);

    // 调用重启服务API
    const res = await fetchSoftServiceRestartService({ installId: device.installId });

    if (res.code === "00000") {
      message.success("重启服务命令已发送");
      
      // 等待一段时间后刷新设备状态，确保获取最新状态
      setTimeout(async () => {
        await refreshDeviceStatus();
      }, 2000);
    } else {
      message.error(res.msg || "重启服务失败");
      addLog("error", `重启服务失败: ${res.msg || "未知错误"}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重启服务失败:", error);
      message.error("重启服务失败");
      addLog("error", `重启服务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  } finally {
    serviceActionLoading.restart = false;
  }
};

// 添加刷新设备状态的逻辑
const refreshing = ref(false);

const refreshDeviceStatus = async () => {
  try {
    // 获取当前选中的设备
    const device = deviceServices.value.find((d) => d.installId === activeInstallId.value);
    if (!device) {
      message.error("未找到设备信息");
      return;
    }

    // 设置加载状态
    refreshing.value = true;

    // 重新加载设备服务信息，确保获取最新的运行状态
    try {
      const res = await fetchSoftServiceInstallByServiceId({
        softServiceId: props.software.softServiceId!,
        installId: activeInstallId.value,
      });

      if (res.code === "00000" && res.data) {
        // 更新当前设备的信息
        const updatedDevice = Array.isArray(res.data) ? res.data.find((service: any) => service.installId === activeInstallId.value) : res.data;

        if (updatedDevice) {
          // 更新设备信息，包括运行状态
          const index = deviceServices.value.findIndex((d) => d.installId === activeInstallId.value);
          if (index !== -1) {
            deviceServices.value[index] = {
              ...deviceServices.value[index],
              ...updatedDevice,
              installRunStatus: updatedDevice.installRunStatus || 0,
              installStatus: updatedDevice.installStatus || 0,
            };

            // 更新安装状态
            installStatus.value = updatedDevice.installStatus || 0;
          }
        }

        message.success("设备状态刷新成功");
      } else {
        message.error(res.msg || "刷新设备状态失败");
      }
    } catch (error) {
      console.error("更新设备服务状态失败:", error);
      message.error("刷新设备状态失败");
    }
  } catch (error) {
    console.error("刷新设备状态失败:", error);
    message.error("刷新设备状态失败");
  } finally {
    refreshing.value = false;
  }
};

// 配置编辑器相关
const configEditorVisible = ref(false);

// 打开配置编辑器
const handleOpenConfig = () => {
  if (!currentDevice.value?.installConfigPath) {
    message.warning('当前设备未设置配置路径');
    return;
  }
  
  configEditorVisible.value = true;
};

// 处理配置保存
const handleConfigSave = (config: string) => {
  message.success('配置已保存，服务可能需要重启才能生效');
};

// 计算属性: 获取当前安装进度
const currentInstallProgress = computed(() => {
  const device = currentDevice.value;
  if (!device) return 0;
  
  return device.progress || 0;
});
</script>

<style lang="scss" scoped>
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

:deep(.el-drawer__body) {
  padding: 0;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-tag {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.install-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.install-left-sidebar {
  border-right: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 1;
  overflow: hidden;

  .left-sidebar-content {
    padding: 8px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.install-right-content {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  flex: 1;
  overflow: hidden;
}

.install-logs {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.has-active-device {
    padding-top: 0;
  }
}

.install-progress-header {
  background-color: var(--el-bg-color);
  padding: 16px;
  margin: 0 -16px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

  h3 {
    display: flex;
    align-items: center;

    .el-button {
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.device-card-section {
  flex: 1;
  overflow: auto;
  min-height: 300px;
  max-height: 500px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  .icon {
    margin-right: 8px;
    color: var(--el-color-primary);
    font-size: 18px;
  }
}

// 服务控制按钮组样式
.service-control-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
  padding: 4px 8px;
  background-color: var(--el-bg-color-page);
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--el-border-color-lighter);

  .el-button {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

// 动画效果
.log-item {
  transition: all 0.3s ease;

  &.success {
    animation: fadeInSuccess 0.5s forwards;
  }

  &.error {
    animation: fadeInError 0.5s forwards;
  }
}

@keyframes fadeInSuccess {
  from {
    background-color: rgba(var(--el-color-success-rgb), 0.1);
  }
  to {
    background-color: transparent;
  }
}

@keyframes fadeInError {
  from {
    background-color: rgba(var(--el-color-danger-rgb), 0.1);
  }
  to {
    background-color: transparent;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .install-container {
    flex-direction: column;
  }

  .install-left-sidebar {
    width: 100% !important;
    max-height: 300px;
  }

  .service-control-buttons {
    margin-bottom: 8px;
  }
}
</style>
