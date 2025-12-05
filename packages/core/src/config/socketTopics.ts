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
  video: VideoTopics,
} as const;

/**
 * 主题类型
 */
export type SocketTopicType = typeof SocketTopics;

export default SocketTopics;
