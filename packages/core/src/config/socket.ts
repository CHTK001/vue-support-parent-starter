import { getToken } from "@repo/core";
import { message, uu4 } from "@repo/utils";
import { io } from "socket.io-client";
import { inject, provide, ref, type InjectionKey } from "vue";

/**
 * 全局Socket服务接口
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */
export interface GlobalSocketService {
  socket: any;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  on: (event: string, callback: Function) => void;
  off: (event: string) => void;
  emit: (event: string, data?: any) => void;
  close: () => void;
}

// 全局Socket注入键
export const GlobalSocketKey: InjectionKey<GlobalSocketService> = Symbol("GlobalSocket");

// Socket注入键Map，用于存储多个Socket实例
const socketKeyMap = new Map<string, InjectionKey<GlobalSocketService>>();

/**
 * 创建全局Socket服务
 * @param urls Socket服务器地址数组
 * @param context Socket.IO路径
 * @param query 查询参数
 * @param options Socket选项
 */
export function createGlobalSocketService(
  urls: string[],
  context = "/socket.io",
  query = {},
  options = {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  }
): GlobalSocketService {
  let socketInstance: any = null;
  const isConnected = ref(false);

  /**
   * 连接Socket
   */
  const connect = () => {
    if (socketInstance) {
      console.warn("Global Socket已连接");
      return;
    }

    // 使用原有的socket工厂函数创建连接
    socketInstance = socket(urls, context, query, options);

    // 监听连接状态
    socketInstance.on("connect", () => {
      isConnected.value = true;
    });

    socketInstance.on("disconnect", () => {
      isConnected.value = false;
    });
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (socketInstance) {
      socketInstance.close();
      socketInstance = null;
      isConnected.value = false;
    }
  };

  /**
   * 监听事件
   */
  const on = (event: string, callback: Function) => {
    if (socketInstance) {
      socketInstance.on(event, callback);
    }
  };

  /**
   * 移除事件监听
   */
  const off = (event: string) => {
    if (socketInstance) {
      socketInstance.off(event);
    }
  };

  /**
   * 发送事件
   */
  const emit = (event: string, data?: any) => {
    if (socketInstance) {
      socketInstance.emit(event, data);
    }
  };

  /**
   * 关闭连接
   */
  const close = () => {
    disconnect();
  };

  return {
    get socket() {
      return socketInstance;
    },
    get isConnected() {
      return isConnected.value;
    },
    connect,
    disconnect,
    on,
    off,
    emit,
    close,
  };
}

/**
 * 提供全局Socket服务
 * @param urls Socket服务器地址数组
 * @param context Socket.IO路径
 * @param query 查询参数
 * @param options Socket选项
 */
export function provideGlobalSocket(urls: string[], context?: string, query?: any, options?: any) {
  const socketService = createGlobalSocketService(urls, context, query, options);
  provide(GlobalSocketKey, socketService);
  return socketService;
}

/**
 * 注入全局Socket服务
 */
export function useGlobalSocket(): GlobalSocketService {
  const socketService = inject(GlobalSocketKey);
  if (!socketService) {
    console.log("Global Socket服务未提供，请确保在父组件中调用了provideGlobalSocket()");
    return null;
  }
  return socketService;
}

/**
 * 创建或获取指定名称的SocketKey
 * @param keyName Socket键名称
 * @returns InjectionKey<GlobalSocketService>
 */
export function createSocketKey(keyName: string): InjectionKey<GlobalSocketService> {
  if (!socketKeyMap.has(keyName)) {
    socketKeyMap.set(keyName, Symbol(`Socket_${keyName}`));
  }
  return socketKeyMap.get(keyName)!;
}

/**
 * 提供指定名称的Socket服务
 * @param keyName Socket键名称
 * @param urls Socket服务器地址数组
 * @param context Socket.IO路径
 * @param query 查询参数
 * @param options Socket选项
 */
export function provideSocket(
  keyName: string,
  urls: string[],
  context?: string,
  query?: any,
  options?: any
): GlobalSocketService {
  const socketKey = createSocketKey(keyName);
  const socketService = createGlobalSocketService(urls, context, query, options);
  provide(socketKey, socketService);
  return socketService;
}

/**
 * 注入指定名称的Socket服务
 * @param keyName Socket键名称，不传则使用GlobalSocketKey
 */
export function useSocket(keyName?: string): GlobalSocketService | null {
  if (!keyName) {
    return useGlobalSocket();
  }
  
  const socketKey = createSocketKey(keyName);
  const socketService = inject(socketKey);
  
  if (!socketService) {
    console.warn(`Socket服务"${keyName}"未提供，请确保在父组件中调用了provideSocket("${keyName}", ...)`);
    return null;
  }
  
  return socketService;
}

export const socket = (
  urls,
  context = "/socket.io",
  query: {},
  options = {
    transports: ["websocket"],
    autoConnect: true, // 是否自动连接
    reconnection: true, // 是否自动重新连接
    reconnectionAttempts: 3, // 重新连接尝试次数
    reconnectionDelay: 1000, // 重新连接延迟时间（毫秒）
  }
) => {
  const newOptions = {
    query: null,
    path: context,
  };
  Object.assign(newOptions, options);
  const token = getToken();
  newOptions.query = { "x-oauth-token": token?.accessToken };
  Object.assign(newOptions.query, query);
  const random = Math.random() * urls.length;
  const url = urls[~~random];
  const session = io(url, newOptions);
  const socketWrapper = {
    on: function (event, callback) {
      session.on(event, async (row) => {
        if (!row) {
          return;
        }
        try {
          if (typeof row === "string") {
            try {
              row = JSON.parse(row);
            } catch (error) {
              callback(row);
              return;
            }
          }
          const data = await uu4(row);
          if (typeof data === "object") {
            callback(data);
            return;
          }
          const line = data?.data || "";
          if ((line.startsWith("{") || line.startsWith("[")) && (line.endsWith("]") || line.endsWith("}"))) {
            callback(JSON.parse(line));
            return;
          }
          callback(line);
        } catch (e) {}
      });
    },
    off: function (event) {
      session?.off(event);
    },
    close: function () {
      session?.close();
    },
    emit: function (event, data) {
      session?.emit(event, data);
    },
  };
  socketWrapper.on("connect", (data) => {
    console.log("连接成功", data);
  });
  socketWrapper.on("connecting", (data) => {
    console.log("正在连接", data);
  });
  socketWrapper.on("disconnect", (data) => {
    console.log("断开连接", data);
    if (data === "io server disconnect") {
      // the disconnection was initiated by the server, you need to reconnect manually
      session?.connect();
    }
  });
  socketWrapper.on("connect_failed", (data) => {
    console.log("连接失败", data);
  });
  socketWrapper.on("error", (data) => {
    console.log("错误", data);
  });
  socketWrapper.on("reconnect_failed", (data) => {
    console.log("重连失败", data);
  });
  socketWrapper.on("reconnect", (data) => {
    console.log("成功重连", data);
  });
  socketWrapper.on("reconnecting", (data) => {
    console.log("正在重连", data);
  });

  if (window.Notification && Notification.permission === "denied") {
    Notification.requestPermission();
  }

  socketWrapper.on("online", (data) => {
    // 浏览器支持且用户没有禁止浏览器通知的情况下执行
    if (window.Notification && Notification.permission !== "denied") {
      const data1 = JSON.parse(data?.data);
      Notification.requestPermission(function () {
        new Notification("上线通知", {
          body: data1?.message,
        });
      });
    } else {
      const data1 = JSON.parse(data);
      message(data1?.message, { type: "success" });
    }
  });
  socketWrapper.on("offline", (data) => {
    // 浏览器支持且用户没有禁止浏览器通知的情况下执行
    if (window.Notification && Notification.permission !== "denied") {
      const data1 = JSON.parse(data?.data);
      Notification.requestPermission(function () {
        new Notification("下线通知", {
          body: data1?.message,
        });
      });
    } else {
      const data1 = JSON.parse(data);
      message(data1?.message, { type: "success" });
    }
  });
  return socketWrapper;
};
