/**
 * 远程连接管理 Composable
 * 统一管理 SSH/RDP/VNC 连接的 Socket 通信
 * 
 * @author CH
 * @since 2024-12-27
 */
import { ref, onUnmounted, type Ref } from "vue";
import {
  createNamedSocketService,
  closeNamedSocketService,
  getNamedSocketService,
  parseSocketMessage,
  type SocketTemplate,
  RemoteTopics,
} from "@repo/core";
import { getConfig } from "@repo/config";

/** 连接协议类型 */
export type ConnectionProtocol = "ssh" | "rdp" | "vnc";

/** 连接状态 */
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

/** 远程连接消息 */
export interface RemoteConnectionMessage {
  messageType?: string;
  serverId?: number;
  serverName?: string;
  serverHost?: string;
  serverPort?: number;
  data?: any;
  errorMessage?: string;
  timestamp?: number;
}

/** 远程连接配置 */
export interface RemoteConnectionOptions {
  /** 服务器 ID */
  serverId: number;
  /** 服务器名称 */
  serverName?: string;
  /** 服务器主机 */
  serverHost?: string;
  /** 服务器端口 */
  serverPort?: number;
  /** 连接协议 */
  protocol: ConnectionProtocol;
  /** 连接成功回调 */
  onConnected?: (message: RemoteConnectionMessage) => void;
  /** 断开连接回调 */
  onDisconnected?: (message: RemoteConnectionMessage) => void;
  /** 数据接收回调 */
  onData?: (data: any) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/** 获取协议对应的 Topics */
function getProtocolTopics(protocol: ConnectionProtocol) {
  switch (protocol) {
    case "ssh":
      return RemoteTopics.SSH;
    case "rdp":
      return RemoteTopics.RDP;
    case "vnc":
      return RemoteTopics.VNC;
  }
}

/**
 * 远程连接 Composable
 */
export function useRemoteConnection(options: RemoteConnectionOptions) {
  const { serverId, protocol, onConnected, onDisconnected, onData, onError } = options;
  
  const topics = getProtocolTopics(protocol);
  const socketName = `${protocol}-connection-${serverId}`;
  
  const socketService: Ref<SocketTemplate | null> = ref(null);
  const connectionStatus: Ref<ConnectionStatus> = ref("disconnected");
  const isListenersInitialized = ref(false);

  /**
   * 初始化消息监听器
   * 必须在 socket 连接成功后调用
   */
  const initMessageListeners = () => {
    if (isListenersInitialized.value || !socketService.value) {
      return;
    }

    // 监听连接响应
    socketService.value.on(topics.CONNECT, (rawMessage: any) => {
      try {
        const data = parseSocketMessage(rawMessage);
        if (data?.serverId && data.serverId !== serverId) return;
        
        console.log(`[${protocol.toUpperCase()}] 连接成功:`, data);
        connectionStatus.value = "connected";
        onConnected?.(data as RemoteConnectionMessage);
      } catch (error) {
        console.error(`[${protocol.toUpperCase()}] 解析连接响应失败:`, error);
      }
    });

    // 监听数据
    socketService.value.on(topics.DATA, (rawMessage: any) => {
      try {
        const data = parseSocketMessage(rawMessage);
        if (data?.serverId && data.serverId !== serverId) return;
        
        // 提取实际数据
        let outputData = data?.data;
        if (typeof outputData === "object" && outputData?.output) {
          outputData = outputData.output;
        }
        
        if (outputData) {
          onData?.(outputData);
        }
      } catch (error) {
        console.error(`[${protocol.toUpperCase()}] 解析数据失败:`, error);
      }
    });

    // 监听断开连接
    socketService.value.on(topics.DISCONNECT, (rawMessage: any) => {
      try {
        const data = parseSocketMessage(rawMessage);
        if (data?.serverId && data.serverId !== serverId) return;
        
        console.log(`[${protocol.toUpperCase()}] 连接断开:`, data);
        connectionStatus.value = "disconnected";
        onDisconnected?.(data as RemoteConnectionMessage);
      } catch (error) {
        console.error(`[${protocol.toUpperCase()}] 解析断开消息失败:`, error);
      }
    });

    // 监听错误
    socketService.value.on(topics.ERROR, (rawMessage: any) => {
      try {
        const data = parseSocketMessage(rawMessage);
        if (data?.serverId && data.serverId !== serverId) return;
        
        console.error(`[${protocol.toUpperCase()}] 错误:`, data);
        connectionStatus.value = "error";
        onError?.(data?.errorMessage || "连接错误");
      } catch (error) {
        console.error(`[${protocol.toUpperCase()}] 解析错误消息失败:`, error);
      }
    });

    isListenersInitialized.value = true;
    console.log(`[${protocol.toUpperCase()}] 消息监听器初始化完成`);
  };

  /**
   * 连接远程服务器
   */
  const connect = async (): Promise<boolean> => {
    try {
      // 关闭已存在的连接
      const existing = getNamedSocketService(socketName);
      if (existing) {
        closeNamedSocketService(socketName);
      }

      const config = getConfig();
      connectionStatus.value = "connecting";

      // 创建 Socket 服务
      socketService.value = createNamedSocketService(socketName, {
        protocol: "socketio",
        urls: config.SocketUrl ? config.SocketUrl.split(",") : [],
        query: { serverId: String(serverId) },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
      });

      // 连接 Socket
      socketService.value.connect();

      // 等待 socket 连接成功后初始化监听器并发送连接请求
      return new Promise((resolve) => {
        socketService.value!.on("connect", () => {
          console.log(`[${protocol.toUpperCase()}] Socket 连接成功，初始化监听器并发送连接请求`);
          
          // 先初始化消息监听器
          initMessageListeners();
          
          // 发送连接请求
          socketService.value?.emit(
            topics.CONNECT,
            JSON.stringify({
              serverId: serverId,
              serverHost: options.serverHost,
              serverPort: options.serverPort,
              timestamp: Date.now(),
            })
          );
          
          resolve(true);
        });

        socketService.value!.on("connect_error", (error: any) => {
          console.error(`[${protocol.toUpperCase()}] Socket 连接失败:`, error);
          connectionStatus.value = "error";
          onError?.("Socket 连接失败");
          resolve(false);
        });
      });
    } catch (error) {
      console.error(`[${protocol.toUpperCase()}] 创建连接失败:`, error);
      connectionStatus.value = "error";
      return false;
    }
  };

  /**
   * 发送输入数据
   */
  const sendInput = (input: string): boolean => {
    if (!socketService.value?.isConnected) {
      console.warn(`[${protocol.toUpperCase()}] Socket 未连接，无法发送数据`);
      return false;
    }

    socketService.value.emit(
      topics.INPUT,
      JSON.stringify({
        serverId: serverId,
        data: input,
        timestamp: Date.now(),
      })
    );
    return true;
  };

  /**
   * 调整终端/屏幕大小
   */
  const resize = (cols: number, rows: number): boolean => {
    if (!socketService.value?.isConnected) {
      return false;
    }

    socketService.value.emit(
      topics.RESIZE,
      JSON.stringify({
        serverId: serverId,
        data: { cols, rows },
        timestamp: Date.now(),
      })
    );
    return true;
  };

  /**
   * 断开连接
   */
  const disconnect = (reason?: string) => {
    if (socketService.value?.isConnected) {
      socketService.value.emit(
        topics.DISCONNECT,
        JSON.stringify({
          serverId: serverId,
          errorMessage: reason || "用户主动断开",
          timestamp: Date.now(),
        })
      );
    }

    closeNamedSocketService(socketName);
    socketService.value = null;
    connectionStatus.value = "disconnected";
    isListenersInitialized.value = false;
  };

  /**
   * 检查是否已连接
   */
  const isConnected = (): boolean => {
    return connectionStatus.value === "connected" && socketService.value?.isConnected === true;
  };

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect();
  });

  return {
    socketService,
    connectionStatus,
    connect,
    disconnect,
    sendInput,
    resize,
    isConnected,
  };
}

export default useRemoteConnection;
