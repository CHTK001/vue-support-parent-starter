/**
 * Socket.IO 主题命名规范
 * 命名格式: 项目:模块:功能
 * 例如: monitor:docker:pull_progress, system:message:push
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */

/**
 * 系统模块主题 (system)
 * 用于系统级别的通用功能
 */
export const SystemTopics = {
  // 消息相关
  MESSAGE: {
    PUSH: "system:message:push",
    NOTIFICATION: "system:message:notification",
    READ: "system:message:read",
    DELETE: "system:message:delete",
  },
  // 用户相关
  USER: {
    ONLINE: "system:user:online",
    OFFLINE: "system:user:offline",
    STATUS: "system:user:status",
    KICK: "system:user:kick",
  },
  // 配置相关
  CONFIG: {
    UPDATE: "system:config:update",
    VERSION: "system:config:version",
  },
  // 权限相关
  AUTH: {
    TOKEN_EXPIRED: "system:auth:token_expired",
    PERMISSION_CHANGE: "system:auth:permission_change",
  },
} as const;

/**
 * 服务模块主题 (service)
 * 用于服务级别的通用功能
 */
export const ServiceTopics = {
  // 消息相关
  MESSAGE: {
    PUSH: "service:message:push",
    NOTIFICATION: "service:message:notification",
    READ: "service:message:read",
    DELETE: "service:message:delete",
  },
  // 操作相关
  OPERATION: {
    START: "service:operation:start",
    STOP: "service:operation:stop",
    RESTART: "service:operation:restart",
    STATUS: "service:operation:status",
    LOG: "service:operation:log",
    PROGRESS: "service:operation:progress",
    COMPLETE: "service:operation:complete",
    ERROR: "service:operation:error",
  },
} as const;

/**
 * 监控模块主题 (monitor)
 * 用于监控相关功能
 */
export const MonitorTopics = {
  // Docker/容器相关
  DOCKER: {
    IMAGE_PULL_PROGRESS: "monitor:docker:image_pull_progress",
    IMAGE_EXPORT_PROGRESS: "monitor:docker:image_export_progress",
    IMAGE_IMPORT_PROGRESS: "monitor:docker:image_import_progress",
    CONTAINER_STATUS: "monitor:docker:container_status",
    CONTAINER_LOG: "monitor:docker:container_log",
    CONTAINER_STATISTICS: "monitor:docker:container_statistics",
    CONTAINER_EVENTS: "monitor:docker:container_events",
    START: "monitor:docker:start",
    PROGRESS: "monitor:docker:progress",
    COMPLETE: "monitor:docker:complete",
    ERROR: "monitor:docker:error",
  },
  // 服务器相关
  SERVER: {
    STATUS: "monitor:server:status",
    METRICS: "monitor:server:metrics",
    ALERT: "monitor:server:alert",
    TERMINAL: "monitor:server:terminal",
    SSH_CONNECT: "monitor:server:ssh_connect",
    SSH_DISCONNECT: "monitor:server:ssh_disconnect",
    RDP_CONNECT: "monitor:server:rdp_connect",
    VNC_CONNECT: "monitor:server:vnc_connect",
    CONNECTION_STATUS: "monitor:server:connection_status",
    CONNECTION_TEST: "monitor:server:connection_test",
    HEALTH: "monitor:server:health",
  },
  // 软件相关
  SOFTWARE: {
    INSTALL_PROGRESS: "monitor:software:install_progress",
    SYNC_PROGRESS: "monitor:software:sync_progress",
  },
  // 操作进度
  OPERATION: {
    PROGRESS: "monitor:operation:progress",
    COMPLETE: "monitor:operation:complete",
    ERROR: "monitor:operation:error",
    UPDATE: "monitor:operation:update",
  },
  // WebRTC相关
  WEBRTC: {
    USER_JOINED: "monitor:webrtc:user_joined",
    USER_LEFT: "monitor:webrtc:user_left",
    OFFER: "monitor:webrtc:offer",
    ANSWER: "monitor:webrtc:answer",
    ICE_CANDIDATE: "monitor:webrtc:ice_candidate",
    AUDIO_TOGGLE: "monitor:webrtc:audio_toggle",
    VIDEO_TOGGLE: "monitor:webrtc:video_toggle",
    SCREEN_SHARE_START: "monitor:webrtc:screen_share_start",
    SCREEN_SHARE_STOP: "monitor:webrtc:screen_share_stop",
  },
  // 数据同步相关
  SYNC: {
    STATUS: "monitor:sync:status",
    LOG: "monitor:sync:log",
    PROGRESS: "monitor:sync:progress",
    METRICS: "monitor:sync:metrics",
    ERROR: "monitor:sync:error",
  },
  // 爬虫相关
  SPIDER: {
    STATUS: "monitor:spider:status",
    LOG: "monitor:spider:log",
    PROGRESS: "monitor:spider:progress",
    METRICS: "monitor:spider:metrics",
    DATA: "monitor:spider:data",
    ERROR: "monitor:spider:error",
  },
} as const;

/**
 * 远程连接模块主题 (rc - Remote Connection)
 * 用于远程服务器连接 (SSH/RDP/VNC)
 */
export const RcTopics = {
  // SSH 相关
  SSH: {
    CONNECT: "rc:ssh:connect",
    DATA: "rc:ssh:data",
    INPUT: "rc:ssh:input",
    DISCONNECT: "rc:ssh:disconnect",
    RESIZE: "rc:ssh:resize",
    ERROR: "rc:ssh:error",
  },
  // RDP 相关
  RDP: {
    CONNECT: "rc:rdp:connect",
    DATA: "rc:rdp:data",
    INPUT: "rc:rdp:input",
    DISCONNECT: "rc:rdp:disconnect",
    RESIZE: "rc:rdp:resize",
    ERROR: "rc:rdp:error",
  },
  // VNC 相关
  VNC: {
    CONNECT: "rc:vnc:connect",
    DATA: "rc:vnc:data",
    INPUT: "rc:vnc:input",
    DISCONNECT: "rc:vnc:disconnect",
    RESIZE: "rc:vnc:resize",
    ERROR: "rc:vnc:error",
  },
} as const;

/**
 * 视频模块主题 (video)
 * 用于视频监控相关功能
 */
export const VideoTopics = {
  // 设备相关
  DEVICE: {
    STATUS: "video:device:status",
    ONLINE: "video:device:online",
    OFFLINE: "video:device:offline",
    ALARM: "video:device:alarm",
  },
  // 录像相关
  RECORD: {
    START: "video:record:start",
    STOP: "video:record:stop",
    PROGRESS: "video:record:progress",
  },
  // 流媒体相关
  STREAM: {
    START: "video:stream:start",
    STOP: "video:stream:stop",
    ERROR: "video:stream:error",
  },
} as const;

/**
 * 所有主题的集合
 */
export const SocketTopics = {
  system: SystemTopics,
  service: ServiceTopics,
  monitor: MonitorTopics,
  rc: RcTopics,
  video: VideoTopics,
} as const;

/**
 * 主题类型
 */
export type SocketTopicType = typeof SocketTopics;

/**
 * 生成带用户ID的消息推送主题
 * 格式: service:message:push@{userId}
 * 
 * @param userId 用户ID，0表示广播消息
 * @returns 带用户ID的主题字符串
 */
export function getMessageTopicWithUser(userId: number | string): string {
  return `${ServiceTopics.MESSAGE.PUSH}@${userId}`;
}

/**
 * 生成带用户ID的消息删除/撤回主题
 * 格式: service:message:delete@{userId}
 * 
 * @param userId 用户ID，0表示广播消息
 * @returns 带用户ID的主题字符串
 */
export function getMessageDeleteTopicWithUser(userId: number | string): string {
  return `${ServiceTopics.MESSAGE.DELETE}@${userId}`;
}

/**
 * 解析带用户ID的主题，提取基础主题和用户ID
 * 
 * @param topic 带用户ID的主题字符串
 * @returns { baseTopic: string, userId: string | null }
 */
export function parseTopicWithUser(topic: string): { baseTopic: string; userId: string | null } {
  const atIndex = topic.lastIndexOf('@');
  if (atIndex === -1) {
    return { baseTopic: topic, userId: null };
  }
  return {
    baseTopic: topic.substring(0, atIndex),
    userId: topic.substring(atIndex + 1),
  };
}

export default SocketTopics;
