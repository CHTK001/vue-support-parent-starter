/**
 * Socket 主题命名规范
 * 命名格式: 项目:模块:功能，例如 system:config:update
 *
 * 配置热重载联动：服务端推送 system:config:update / system:config:version 时，
 * 前端调用 upgrade(version) 触发配置重新拉取。
 */

/** 系统模块主题 (system) */
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
  // 配置相关（热重载联动）
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

/** 所有主题的集合 */
export const SocketTopics = {
  system: SystemTopics,
} as const;

/** 生成带用户ID的消息推送主题，格式: service:message:push@{userId} */
export function getMessageTopicWithUser(userId: number | string): string {
  return `service:message:push@${userId}`;
}

/**
 * 解析带用户ID的主题，提取基础主题和用户ID
 *
 * @param topic 带用户ID的主题字符串
 * @returns { baseTopic: string, userId: string | null }
 */
export function parseTopicWithUser(topic: string): {
  baseTopic: string;
  userId: string | null;
} {
  const atIndex = topic.lastIndexOf("@");
  if (atIndex === -1) {
    return { baseTopic: topic, userId: null };
  }
  return {
    baseTopic: topic.substring(0, atIndex),
    userId: topic.substring(atIndex + 1),
  };
}
