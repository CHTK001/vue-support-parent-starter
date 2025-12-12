import { http } from "@repo/utils";

/**
 * WebRTC 用户信息
 */
export interface WebRTCUser {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  online: boolean;
  lastActiveTime?: string;
}

/**
 * 房间信息
 */
export interface RoomInfo {
  id: string;
  name: string;
  type: "video" | "audio" | "screen";
  maxUsers: number;
  currentUsers: number;
  creator: string;
  createTime: string;
  status: "active" | "closed";
  users?: WebRTCUser[];
}

/**
 * 创建房间参数
 */
export interface CreateRoomParams {
  name: string;
  type: "video" | "audio" | "screen";
  maxUsers?: number;
  password?: string;
}

/**
 * 房间列表查询参数
 */
export interface RoomListParams {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  keyword?: string;
}

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
 * 获取系统统计信息
 */
export function getSystemStatistics() {
  return http.get<SystemStatistics>("/webrtc/statistics");
}

/**
 * 获取实时监控数据
 */
export function getRealtimeMonitoring() {
  return http.get("/webrtc/monitoring/realtime");
}

/**
 * 获取在线用户列表
 */
export function getOnlineUsers() {
  return http.get<WebRTCUser[]>("/webrtc/users/online");
}

/**
 * 获取房间列表
 */
export function getRoomList(params?: RoomListParams) {
  return http.get<{ list: RoomInfo[]; total: number }>("/webrtc/rooms", { params });
}

/**
 * 创建房间
 */
export function createRoom(data: CreateRoomParams) {
  return http.post<RoomInfo>("/webrtc/rooms", data);
}

/**
 * 加入房间
 */
export function joinRoom(roomId: string, password?: string) {
  return http.post(`/webrtc/rooms/${roomId}/join`, { password });
}

/**
 * 离开房间
 */
export function leaveRoom(roomId: string) {
  return http.post(`/webrtc/rooms/${roomId}/leave`);
}

/**
 * 关闭房间
 */
export function closeRoom(roomId: string) {
  return http.delete(`/webrtc/rooms/${roomId}`);
}
