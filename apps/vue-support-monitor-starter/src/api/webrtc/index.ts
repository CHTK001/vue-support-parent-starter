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
  id?: string;
  roomId?: string;
  name?: string;
  roomName?: string;
  type?: "video" | "audio" | "screen";
  roomType?: "video_call" | "video_conference";
  maxUsers: number;
  currentUsers: number;
  creator?: string;
  creatorName?: string;
  createTime: string;
  status: "active" | "closed" | "inactive";
  description?: string;
  requirePassword?: boolean;
  users?: WebRTCUser[];
}

/**
 * 创建房间参数
 */
export interface CreateRoomParams {
  name?: string;
  roomName?: string;
  type?: "video" | "audio" | "screen";
  roomType?: "video_call" | "video_conference";
  maxUsers?: number;
  description?: string;
  password?: string;
}

/**
 * 房间列表查询参数
 */
export interface RoomListParams {
  page?: number;
  size?: number;
  pageSize?: number;
  type?: string;
  roomType?: string;
  status?: string;
  keyword?: string;
  roomName?: string;
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
export function joinRoom(params: { roomId: string; password?: string }) {
  return http.post(`/webrtc/rooms/${params.roomId}/join`, { password: params.password });
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

/**
 * 删除房间
 */
export function deleteRoom(roomId: string) {
  return http.delete(`/webrtc/rooms/${roomId}`);
}
