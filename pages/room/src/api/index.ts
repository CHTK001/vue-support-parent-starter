/**
 * @pages/room —— P2P 房间 API（房间台账 + 聊天 + 文件）
 *
 * <p>统一前缀 {@code /ms/room}：房间 CRUD / 聊天/文件列表全部走 REST，
 * 信令（WebSocket）走 {@code RoomSocket}。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { http, unwrapResult } from "@repo/utils";

/** 统一前缀 */
const B = "/ms/room";

/** 房间条目 */
export interface RoomInfo {
  /** 房间编号（雪花号） */
  id: string;
  /** 房间名称 */
  name?: string;
  /** 房间编号（可分享码，如 8 位） */
  code?: string;
  /** 房间状态 */
  status?: string;
  /** 参与端点数 */
  peerCount?: number;
  /** 创建者 id */
  creatorId?: string;
  /** 创建时间 */
  createdAt?: string;
}

/** 聊天消息 */
export interface RoomMessage {
  /** 消息编号 */
  id: string;
  /** 房间编号 */
  roomId: string;
  /** 发送者 id */
  senderId: string;
  /** 发送者昵称 */
  senderName?: string;
  /** 内容 */
  content: string;
  /** 发送时间 */
  sentAt?: string;
}

/** 文件条目 */
export interface RoomFile {
  /** 文件编号 */
  id: string;
  /** 房间编号 */
  roomId: string;
  /** 文件名 */
  name: string;
  /** 大小（字节） */
  size?: number;
  /** 类型 */
  type?: string;
  /** 上传时间 */
  uploadedAt?: string;
  /** 上传者 id */
  uploaderId?: string;
}

/** 创建房间 */
export const createRoom = (name?: string) =>
  http()
    .post(`${B}/room`)
    .data({ name } as unknown as Record<string, unknown>)
    .then((r) => unwrapResult<RoomInfo>(r));

/** 房间列表（我的房间） */
export const listRooms = (page = 1, size = 20) =>
  http()
    .get(`${B}/room/list`)
    .query({ page, size })
    .then((r) =>
      unwrapResult<{
        list: RoomInfo[];
        total: number;
        page: number;
        size: number;
      }>(r),
    );

/** 房间详情 */
export const getRoom = (id: string) =>
  http().get(`${B}/room/${encodeURIComponent(id)}`).then((r) => unwrapResult<RoomInfo>(r));

/** 离开房间 */
export const leaveRoom = (id: string) =>
  http()
    .delete(`${B}/room/${encodeURIComponent(id)}`)
    .then((r) => unwrapResult<boolean>(r));

/** 邀请函（生成房间码，出现在二维码里的那串 code） */
export const inviteRoom = (id: string) =>
  http()
    .post(`${B}/room/${encodeURIComponent(id)}/invite`)
    .then((r) => unwrapResult<string>(r));

/* ==================== 聊天 ==================== */

/** 历史消息 */
export const listRoomMessages = (roomId: string, page = 1, size = 50) =>
  http()
    .get(`${B}/room/${encodeURIComponent(roomId)}/messages`)
    .query({ page, size })
    .then((r) => unwrapResult<RoomMessage[]>(r));

/** 发消息 */
export const sendMessage = (roomId: string, content: string) =>
  http()
    .post(`${B}/room/${encodeURIComponent(roomId)}/messages`)
    .data({ content } as unknown as Record<string, unknown>)
    .then((r) => unwrapResult<RoomMessage>(r));

/** 已读（标记群读） */
export const readRoomMessages = (roomId: string) =>
  http()
    .post(`${B}/room/${encodeURIComponent(roomId)}/messages/read`)
    .then((r) => unwrapResult<boolean>(r));

/* ==================== 文件 ==================== */

/** 文件列表 */
export const listRoomFiles = (roomId: string, keyword?: string) =>
  http()
    .get(`${B}/room/${encodeURIComponent(roomId)}/files`)
    .query({ roomId, keyword })
    .then((r) => unwrapResult<RoomFile[]>(r));

/** 上传文件（SSE 回显进度） */
export const uploadRoomFile = (roomId: string, file: File) =>
  http()
    .post(`${B}/room/${encodeURIComponent(roomId)}/files`)
    .data({ file })
    .then((r) => unwrapResult<RoomFile>(r));

/** 下载文件 */
export const downloadRoomFile = (id: string) => `${B}/room/files/${encodeURIComponent(id)}/download`;
