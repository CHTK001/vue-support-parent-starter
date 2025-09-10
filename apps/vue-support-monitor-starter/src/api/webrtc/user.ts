/**
 * WebRTC 用户管理 API
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { http } from "@repo/utils";

/**
 * WebRTC用户信息接口
 */
export interface WebRTCUser {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname?: string;
  /** 头像URL */
  avatar?: string;
  /** 当前所在房间ID */
  currentRoomId?: string;
  /** 当前所在房间名称 */
  currentRoomName?: string;
  /** 用户状态：online-在线, offline-离线, busy-忙碌 */
  status: "online" | "offline" | "busy";
  /** 最后活跃时间 */
  lastActiveTime: string;
  /** 设备信息 */
  deviceInfo?: {
    /** 设备类型：desktop-桌面, mobile-移动设备, tablet-平板 */
    deviceType: "desktop" | "mobile" | "tablet";
    /** 浏览器信息 */
    browser: string;
    /** 操作系统 */
    os: string;
  };
  /** 媒体权限 */
  permissions: {
    /** 摄像头权限 */
    camera: boolean;
    /** 麦克风权限 */
    microphone: boolean;
    /** 屏幕共享权限 */
    screenShare: boolean;
  };
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  /** 页码 */
  page?: number;
  /** 每页大小 */
  size?: number;
  /** 用户名（模糊查询） */
  username?: string;
  /** 用户状态 */
  status?: "online" | "offline" | "busy";
  /** 房间ID */
  roomId?: string;
}

/**
 * 更新用户状态参数
 */
export interface UpdateUserStatusParams {
  /** 用户状态 */
  status: "online" | "offline" | "busy";
}

/**
 * 更新媒体权限参数
 */
export interface UpdatePermissionsParams {
  /** 摄像头权限 */
  camera?: boolean;
  /** 麦克风权限 */
  microphone?: boolean;
  /** 屏幕共享权限 */
  screenShare?: boolean;
}

/**
 * 获取在线用户列表
 * @param params 查询参数
 * @returns 用户列表
 */
export const getOnlineUsers = (params?: UserListParams) => {
  return http.request<{
    total: number;
    records: WebRTCUser[];
  }>("get", "/webrtc/users/online", { params });
};

/**
 * 获取用户详情
 * @param userId 用户ID
 * @returns 用户详情
 */
export const getUserDetail = (userId: string) => {
  return http.request<WebRTCUser>("get", `/webrtc/users/${userId}`);
};

/**
 * 获取当前用户信息
 * @returns 当前用户信息
 */
export const getCurrentUser = () => {
  return http.request<WebRTCUser>("get", "/webrtc/users/current");
};

/**
 * 更新用户状态
 * @param userId 用户ID
 * @param data 状态数据
 * @returns 更新结果
 */
export const updateUserStatus = (userId: string, data: UpdateUserStatusParams) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("put", `/webrtc/users/${userId}/status`, { data });
};

/**
 * 更新当前用户状态
 * @param data 状态数据
 * @returns 更新结果
 */
export const updateCurrentUserStatus = (data: UpdateUserStatusParams) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("put", "/webrtc/users/current/status", { data });
};

/**
 * 更新用户媒体权限
 * @param userId 用户ID
 * @param data 权限数据
 * @returns 更新结果
 */
export const updateUserPermissions = (userId: string, data: UpdatePermissionsParams) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("put", `/webrtc/users/${userId}/permissions`, { data });
};

/**
 * 更新当前用户媒体权限
 * @param data 权限数据
 * @returns 更新结果
 */
export const updateCurrentUserPermissions = (data: UpdatePermissionsParams) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("put", "/webrtc/users/current/permissions", { data });
};

/**
 * 踢出用户
 * @param roomId 房间ID
 * @param userId 用户ID
 * @param reason 踢出原因
 * @returns 踢出结果
 */
export const kickUser = (roomId: string, userId: string, reason?: string) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("post", `/webrtc/rooms/${roomId}/kick`, {
    data: { userId, reason },
  });
};

/**
 * 禁言用户
 * @param roomId 房间ID
 * @param userId 用户ID
 * @param duration 禁言时长（分钟）
 * @returns 禁言结果
 */
export const muteUser = (roomId: string, userId: string, duration: number) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("post", `/webrtc/rooms/${roomId}/mute`, {
    data: { userId, duration },
  });
};

/**
 * 取消禁言
 * @param roomId 房间ID
 * @param userId 用户ID
 * @returns 取消禁言结果
 */
export const unmuteUser = (roomId: string, userId: string) => {
  return http.request<{
    success: boolean;
    message: string;
  }>("post", `/webrtc/rooms/${roomId}/unmute`, {
    data: { userId },
  });
};
