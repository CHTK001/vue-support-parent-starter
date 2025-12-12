import { http } from "@repo/utils";

/**
 * 系统统计信息
 */
export interface SystemStatistics {
  totalRooms: number;
  activeRooms: number;
  totalUsers: number;
  onlineUsers: number;
  totalCalls: number;
  averageCallDuration: number;
  peakOnlineUsers: number;
  bandwidth: {
    upload: number;
    download: number;
  };
}

/**
 * 房间统计信息
 */
export interface RoomStatistics {
  roomId: string;
  roomName: string;
  userCount: number;
  duration: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  quality: {
    video: number;
    audio: number;
  };
}

/**
 * 获取系统统计信息
 */
export function getSystemStatistics() {
  return http.get<SystemStatistics>("/webrtc/statistics/system");
}

/**
 * 获取房间统计信息
 */
export function getRoomStatistics(roomId?: string) {
  return http.get<RoomStatistics[]>("/webrtc/statistics/rooms", { params: { roomId } });
}

/**
 * 获取房间历史记录
 */
export function getRoomHistory(params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }) {
  return http.get("/webrtc/statistics/history", { params });
}
