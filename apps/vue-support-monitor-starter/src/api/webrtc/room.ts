/**
 * WebRTC 房间管理 API
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { http } from "@repo/utils";

/**
 * 房间信息接口
 */
export interface RoomInfo {
  /** 房间ID */
  roomId: string;
  /** 房间名称 */
  roomName: string;
  /** 房间类型：video_call-视频通话, video_conference-视频会议 */
  roomType: 'video_call' | 'video_conference';
  /** 房间状态：active-活跃, inactive-非活跃 */
  status: 'active' | 'inactive';
  /** 当前用户数 */
  currentUsers: number;
  /** 最大用户数 */
  maxUsers: number;
  /** 创建时间 */
  createTime: string;
  /** 创建者ID */
  creatorId: string;
  /** 创建者名称 */
  creatorName: string;
  /** 房间描述 */
  description?: string;
  /** 是否需要密码 */
  requirePassword: boolean;
}

/**
 * 创建房间参数
 */
export interface CreateRoomParams {
  /** 房间名称 */
  roomName: string;
  /** 房间类型 */
  roomType: 'video_call' | 'video_conference';
  /** 最大用户数 */
  maxUsers: number;
  /** 房间描述 */
  description?: string;
  /** 房间密码 */
  password?: string;
}

/**
 * 房间列表查询参数
 */
export interface RoomListParams {
  /** 页码 */
  page?: number;
  /** 每页大小 */
  size?: number;
  /** 房间名称（模糊查询） */
  roomName?: string;
  /** 房间类型 */
  roomType?: 'video_call' | 'video_conference';
  /** 房间状态 */
  status?: 'active' | 'inactive';
  /** 创建者ID */
  creatorId?: string;
}

/**
 * 加入房间参数
 */
export interface JoinRoomParams {
  /** 房间ID */
  roomId: string;
  /** 房间密码（如果需要） */
  password?: string;
}

/**
 * 获取房间列表
 * @param params 查询参数
 * @returns 房间列表
 */
export const getRoomList = (params?: RoomListParams) => {
  return http.request<{
    total: number;
    records: RoomInfo[];
  }>('get', '/webrtc/rooms', { params });
};

/**
 * 创建房间
 * @param data 创建房间参数
 * @returns 创建的房间信息
 */
export const createRoom = (data: CreateRoomParams) => {
  return http.request<RoomInfo>('post', '/webrtc/rooms', { data });
};

/**
 * 获取房间详情
 * @param roomId 房间ID
 * @returns 房间详情
 */
export const getRoomDetail = (roomId: string) => {
  return http.request<RoomInfo>('get', `/webrtc/rooms/${roomId}`);
};

/**
 * 加入房间
 * @param data 加入房间参数
 * @returns 加入结果
 */
export const joinRoom = (data: JoinRoomParams) => {
  return http.request<{
    success: boolean;
    message: string;
    roomInfo: RoomInfo;
  }>('post', '/webrtc/rooms/join', { data });
};

/**
 * 离开房间
 * @param roomId 房间ID
 * @returns 离开结果
 */
export const leaveRoom = (roomId: string) => {
  return http.request<{
    success: boolean;
    message: string;
  }>('post', `/webrtc/rooms/${roomId}/leave`);
};

/**
 * 删除房间
 * @param roomId 房间ID
 * @returns 删除结果
 */
export const deleteRoom = (roomId: string) => {
  return http.request<{
    success: boolean;
    message: string;
  }>('delete', `/webrtc/rooms/${roomId}`);
};

/**
 * 更新房间信息
 * @param roomId 房间ID
 * @param data 更新数据
 * @returns 更新后的房间信息
 */
export const updateRoom = (roomId: string, data: Partial<CreateRoomParams>) => {
  return http.request<RoomInfo>('put', `/webrtc/rooms/${roomId}`, { data });
};

/**
 * 获取房间用户列表
 * @param roomId 房间ID
 * @returns 用户列表
 */
export const getRoomUsers = (roomId: string) => {
  return http.request<{
    roomId: string;
    users: {
      userId: string;
      username: string;
      joinTime: string;
      isCreator: boolean;
    }[];
  }>('get', `/webrtc/rooms/${roomId}/users`);
};