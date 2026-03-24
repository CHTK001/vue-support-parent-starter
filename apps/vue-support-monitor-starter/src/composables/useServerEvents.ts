import { ref, onMounted, onUnmounted } from 'vue';
import { useServerWebSocket } from './useServerWebSocket';
import { message } from '@repo/utils';
import type { ServerWebSocketMessage } from '@/api/server';

/**
 * 服务器事件处理 Composable
 * 处理服务器创建、更新、健康状态等事件
 */
export function useServerEvents() {
  const { onMessage, MESSAGE_TYPE } = useServerWebSocket();
  
  // 存储取消订阅函数
  const unsubscribeFunctions = new Set<() => void>();

  /**
   * 监听服务器创建事件
   */
  const onServerCreated = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.SERVER_CREATED, (message) => {
      console.log('服务器创建事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听服务器更新事件
   */
  const onServerUpdated = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.SERVER_UPDATED, (message) => {
      console.log('服务器更新事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听服务器健康状态事件
   */
  const onServerHealth = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.SERVER_HEALTH, (message) => {
      console.log('服务器健康状态事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听服务器延迟事件
   */
  const onServerLatency = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.SERVER_LATENCY, (message) => {
      console.log('服务器延迟事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听批量服务器延迟事件
   */
  const onBatchServerLatency = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.BATCH_SERVER_LATENCY, (message) => {
      console.log('批量服务器延迟事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听服务器在线事件
   */
  const onServerOnline = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.SERVER_ONLINE, (message) => {
      console.log('服务器上线事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听服务器离线事件
   */
  const onServerOffline = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.SERVER_OFFLINE, (message) => {
      console.log('服务器离线事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听连接状态变化事件
   */
  const onConnectionStatusChange = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.CONNECTION_STATUS_CHANGE, (message) => {
      console.log('连接状态变化事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 监听连接测试结果事件
   */
  const onConnectionTestResult = (handler: (message: ServerWebSocketMessage) => void) => {
    const unsubscribe = onMessage(MESSAGE_TYPE.CONNECTION_TEST_RESULT, (message) => {
      console.log('连接测试结果事件:', message);
      handler(message);
    });
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  /**
   * 清理所有订阅
   */
  const cleanup = () => {
    unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('清理订阅失败:', error);
      }
    });
    unsubscribeFunctions.clear();
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    // 事件监听器
    onServerCreated,
    onServerUpdated,
    onServerHealth,
    onServerLatency,
    onBatchServerLatency,
    onServerOnline,
    onServerOffline,
    onConnectionStatusChange,
    onConnectionTestResult,
    
    // 工具方法
    cleanup
  };
}

/**
 * 服务器事件自动处理 Composable
 * 自动处理常见的服务器事件，如显示通知等
 */
export function useServerEventHandlers() {
  const {
    onServerCreated,
    onServerUpdated,
    onServerHealth,
    onServerLatency,
    onServerOnline,
    onServerOffline,
    onConnectionStatusChange
  } = useServerEvents();

  // 自动处理服务器创建事件
  onServerCreated((msg) => {
    if (msg.data?.success) {
      message.success(`服务器 "${msg.serverName}" 创建成功`);
    } else {
      message.error(`服务器 "${msg.serverName}" 创建失败: ${msg.errorMessage || '未知错误'}`);
    }
  });

  // 自动处理服务器更新事件
  onServerUpdated((msg) => {
    if (msg.data?.success) {
      message.success(`服务器 "${msg.serverName}" 更新成功`);
      if (msg.errorMessage) {
        message.info(msg.errorMessage);
      }
    } else {
      message.error(`服务器 "${msg.serverName}" 更新失败: ${msg.errorMessage || '未知错误'}`);
    }
  });

  // 自动处理服务器健康状态事件
  onServerHealth((msg) => {
    if (msg.data?.isHealthy === false) {
      message.warning(`服务器 "${msg.serverName}" 健康检查失败`);
    }
  });

  // 自动处理服务器上线事件
  onServerOnline((msg) => {
    message.success(`服务器 "${msg.serverName}" 已上线`);
  });

  // 自动处理服务器离线事件
  onServerOffline((msg) => {
    message.warning(`服务器 "${msg.serverName}" 已离线`);
  });

  // 自动处理连接状态变化事件
  onConnectionStatusChange((msg) => {
    if (msg.connectionStatus === 1) { // 在线
      message.success(`服务器 "${msg.serverName}" 连接成功`);
    } else if (msg.connectionStatus === 0) { // 离线
      message.warning(`服务器 "${msg.serverName}" 连接断开`);
    } else if (msg.connectionStatus === 3) { // 连接失败
      message.error(`服务器 "${msg.serverName}" 连接失败: ${msg.errorMessage || '未知错误'}`);
    }
  });

  return {
    // 可以返回一些状态或方法供外部使用
  };
}
