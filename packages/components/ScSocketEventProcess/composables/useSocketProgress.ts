import { ref, inject, watch, onMounted, onUnmounted } from "vue";
import { useSocket } from "@repo/core";

export interface LogItem {
  time: Date;
  message: string;
  indent: number;
}

export interface ProgressData {
  name?: string;
  eventId?: string | number;
  message?: string;
  step?: number;
  total?: number;
  status?: string;
  percentage?: number;
  [key: string]: any;
}

export interface UseSocketProgressOptions {
  eventId: string | number;
  eventName: string | string[];
  dataType: "socket" | "default";
  socketKey?: string;
  layout?: string;
  onData?: (data: ProgressData) => void;
}

export function useSocketProgress(options: UseSocketProgressOptions) {
  const { eventId, eventName, dataType, socketKey, layout, onData } = options;

  // Socket实例
  const socketService = ref<any>(null);

  // 进度状态
  const percentage = ref(0);
  const status = ref("waiting");
  const message = ref("");
  const currentStep = ref("");
  const showProgress = ref(false);
  const logs = ref<LogItem[]>([]);
  const progressData = ref<ProgressData>({});

  // 处理接收到的数据
  const handleProgressData = (data: ProgressData) => {
    if (!data || data.eventId !== eventId) return;

    showProgress.value = true;
    progressData.value = data;

    // 触发数据回调
    if (onData) {
      onData(data);
    }

    // 处理消息
    if (data.message) {
      message.value = data.message;

      // 如果是日志布局，添加到日志列表
      if (layout === "log") {
        const indent = data.step && data.step <= 0 ? Math.abs(data.step) : 0;
        logs.value.push({
          time: new Date(),
          message: data.message,
          indent
        });

        // 限制日志数量
        if (logs.value.length > 100) {
          logs.value = logs.value.slice(-100);
        }
      }
    }

    // 处理进度
    if (data.total && data.total > 0) {
      percentage.value = Math.min(100, Math.round(((data.step || 0) / data.total) * 100));
    } else if (data.percentage !== undefined) {
      percentage.value = Math.min(100, Math.round(data.percentage));
    }

    // 处理步骤
    if (data.step !== undefined) {
      if (data.step > 0 && data.total) {
        currentStep.value = `${data.step}/${data.total}`;
      } else if (data.step <= 0) {
        currentStep.value = data.message || "";
      }
    }

    // 处理状态
    if (data.status) {
      status.value = data.status;

      // 如果完成或失败，5秒后自动隐藏
      if (data.status === "success" || data.status === "error") {
        setTimeout(() => {
          if (status.value === data.status) {
            showProgress.value = false;
          }
        }, 5000);
      }
    } else {
      if (percentage.value > 0 && percentage.value < 100) {
        status.value = "processing";
      } else if (percentage.value >= 100) {
        status.value = "success";
      }
    }
  };

  // 监听socket事件
  const setupSocketListener = () => {
    if (dataType !== "socket") return;

    // 获取socket实例
    if (socketKey) {
      socketService.value = useSocket(socketKey);
    } else {
      // 尝试从inject获取默认socket
      const injectedSocket = inject("socket", null);
      socketService.value = injectedSocket ? { socket: injectedSocket } : useSocket();
    }

    if (!socketService.value || !socketService.value.socket) {
      console.warn("Socket service not available");
      return;
    }

    // 支持多个事件名称
    const eventNames = Array.isArray(eventName) ? eventName : [eventName];

    eventNames.forEach(name => {
      socketService.value.socket.on(name, (data: ProgressData) => {
        handleProgressData(data);
      });
    });
  };

  // 移除socket监听
  const removeSocketListener = () => {
    if (dataType !== "socket" || !socketService.value || !socketService.value.socket) return;

    const eventNames = Array.isArray(eventName) ? eventName : [eventName];

    eventNames.forEach(name => {
      socketService.value.socket.off(name);
    });
  };

  // 手动更新进度
  const updateProgress = (data: ProgressData) => {
    if (dataType === "default") {
      handleProgressData({
        ...data,
        eventId
      });
    }
  };

  // 重置进度
  const resetProgress = () => {
    percentage.value = 0;
    status.value = "waiting";
    message.value = "";
    currentStep.value = "";
    logs.value = [];
    showProgress.value = false;
    progressData.value = {};
  };

  // 显示进度条
  const show = () => {
    showProgress.value = true;
  };

  // 隐藏进度条
  const hide = () => {
    showProgress.value = false;
  };

  // 添加日志
  const addLog = (logMessage: string, indent: number = 0) => {
    if (layout === "log") {
      logs.value.push({
        time: new Date(),
        message: logMessage,
        indent
      });
    }
  };

  // 清空日志
  const clearLogs = () => {
    logs.value = [];
  };

  // 组件挂载
  onMounted(() => {
    setupSocketListener();
  });

  // 组件卸载
  onUnmounted(() => {
    removeSocketListener();
  });

  // 监听属性变化
  watch([() => eventName, () => dataType], () => {
    removeSocketListener();
    setupSocketListener();
  });

  return {
    // 状态
    percentage,
    status,
    message,
    currentStep,
    showProgress,
    logs,
    progressData,
    socketService,

    // 方法
    updateProgress,
    resetProgress,
    show,
    hide,
    addLog,
    clearLogs
  };
}
