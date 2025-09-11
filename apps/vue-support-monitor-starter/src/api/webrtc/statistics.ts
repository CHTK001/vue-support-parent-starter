/**
 * WebRTC 统计数据 API
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { http } from "@repo/utils";

/**
 * 房间统计信息接口
 */
export interface RoomStatistics {
  /** 房间ID */
  roomId: string;
  /** 房间名称 */
  roomName: string;
  /** 总使用时长（分钟） */
  totalDuration: number;
  /** 总用户数 */
  totalUsers: number;
  /** 峰值用户数 */
  peakUsers: number;
  /** 平均用户数 */
  averageUsers: number;
  /** 创建时间 */
  createTime: string;
  /** 最后使用时间 */
  lastUsedTime: string;
  /** 使用次数 */
  usageCount: number;
}

/**
 * 系统统计信息接口
 */
export interface SystemStatistics {
  /** 总房间数 */
  totalRooms: number;
  /** 活跃房间数 */
  activeRooms: number;
  /** 总用户数 */
  totalUsers: number;
  /** 在线用户数 */
  onlineUsers: number;
  /** 今日新增房间数 */
  todayNewRooms: number;
  /** 今日活跃用户数 */
  todayActiveUsers: number;
  /** 系统总使用时长（小时） */
  totalSystemDuration: number;
  /** 平均房间使用时长（分钟） */
  averageRoomDuration: number;
  /** 服务器资源使用情况 */
  serverResources: {
    /** CPU使用率 */
    cpuUsage: number;
    /** 内存使用率 */
    memoryUsage: number;
    /** 网络带宽使用（Mbps） */
    networkUsage: number;
    /** 并发连接数 */
    concurrentConnections: number;
  };
}

/**
 * 用户统计信息接口
 */
export interface UserStatistics {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 总在线时长（分钟） */
  totalOnlineTime: number;
  /** 参与房间数 */
  joinedRooms: number;
  /** 创建房间数 */
  createdRooms: number;
  /** 最后活跃时间 */
  lastActiveTime: string;
  /** 首次使用时间 */
  firstUsedTime: string;
  /** 平均每次使用时长（分钟） */
  averageSessionDuration: number;
}

/**
 * 时间范围统计查询参数
 */
export interface StatisticsTimeRangeParams {
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 时间粒度：hour-小时, day-天, week-周, month-月 */
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * 时间序列统计数据
 */
export interface TimeSeriesStatistics {
  /** 时间点 */
  timestamp: string;
  /** 活跃房间数 */
  activeRooms: number;
  /** 在线用户数 */
  onlineUsers: number;
  /** 新增房间数 */
  newRooms: number;
  /** 新增用户数 */
  newUsers: number;
  /** 系统资源使用情况 */
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
  };
}

/**
 * 获取系统统计信息
 * @returns 系统统计信息
 */
export const getSystemStatistics = () => {
  return http.request<SystemStatistics>('get', '/webrtc/statistics/system');
};

/**
 * 获取房间统计列表
 * @param params 查询参数
 * @returns 房间统计列表
 */
export const getRoomStatistics = (params?: {
  page?: number;
  size?: number;
  roomName?: string;
  startTime?: string;
  endTime?: string;
}) => {
  return http.request<{
    total: number;
    records: RoomStatistics[];
  }>('get', '/webrtc/statistics/rooms', { params });
};

/**
 * 获取用户统计列表
 * @param params 查询参数
 * @returns 用户统计列表
 */
export const getUserStatistics = (params?: {
  page?: number;
  size?: number;
  username?: string;
  startTime?: string;
  endTime?: string;
}) => {
  return http.request<{
    total: number;
    records: UserStatistics[];
  }>('get', '/webrtc/statistics/users', { params });
};

/**
 * 获取时间序列统计数据
 * @param params 时间范围参数
 * @returns 时间序列统计数据
 */
export const getTimeSeriesStatistics = (params: StatisticsTimeRangeParams) => {
  return http.request<TimeSeriesStatistics[]>('get', '/webrtc/statistics/timeseries', { params });
};

/**
 * 获取房间详细统计
 * @param roomId 房间ID
 * @param params 时间范围参数
 * @returns 房间详细统计
 */
export const getRoomDetailStatistics = (roomId: string, params?: StatisticsTimeRangeParams) => {
  return http.request<{
    roomInfo: RoomStatistics;
    timeSeries: TimeSeriesStatistics[];
    userStatistics: {
      userId: string;
      username: string;
      joinTime: string;
      leaveTime?: string;
      duration: number;
    }[];
  }>('get', `/webrtc/statistics/rooms/${roomId}`, { params });
};

/**
 * 获取用户详细统计
 * @param userId 用户ID
 * @param params 时间范围参数
 * @returns 用户详细统计
 */
export const getUserDetailStatistics = (userId: string, params?: StatisticsTimeRangeParams) => {
  return http.request<{
    userInfo: UserStatistics;
    roomHistory: {
      roomId: string;
      roomName: string;
      joinTime: string;
      leaveTime?: string;
      duration: number;
    }[];
    dailyUsage: {
      date: string;
      onlineTime: number;
      roomsJoined: number;
    }[];
  }>('get', `/webrtc/statistics/users/${userId}`, { params });
};

/**
 * 导出统计报告
 * @param type 报告类型：system-系统, rooms-房间, users-用户
 * @param params 查询参数
 * @returns 导出结果
 */
export const exportStatisticsReport = (type: 'system' | 'rooms' | 'users', params?: StatisticsTimeRangeParams) => {
  return http.request<{
    downloadUrl: string;
    fileName: string;
  }>('post', '/webrtc/statistics/export', {
    data: { type, ...params }
  });
};

/**
 * 获取房间历史数据
 * @param roomId 房间ID
 * @param params 时间范围参数
 * @returns 房间历史数据
 */
export const getRoomHistory = (roomId: string, params?: StatisticsTimeRangeParams) => {
  return http.request<{
    roomId: string;
    roomName: string;
    history: {
      timestamp: string;
      userCount: number;
      duration: number;
      events: {
        type: 'user_joined' | 'user_left' | 'room_created' | 'room_closed';
        timestamp: string;
        userId?: string;
        username?: string;
        description: string;
      }[];
    }[];
  }>('get', `/webrtc/statistics/rooms/${roomId}/history`, { params });
};

/**
 * 获取实时监控数据
 * @returns 实时监控数据
 */
export const getRealtimeMonitoring = () => {
  return http.request<{
    timestamp: string;
    activeRooms: number;
    onlineUsers: number;
    systemResources: {
      cpuUsage: number;
      memoryUsage: number;
      networkUsage: number;
      concurrentConnections: number;
    };
    recentEvents: {
      type: 'room_created' | 'room_joined' | 'room_left' | 'user_online' | 'user_offline';
      timestamp: string;
      description: string;
    }[];
  }>('get', '/webrtc/statistics/realtime');
};