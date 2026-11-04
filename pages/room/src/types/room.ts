/**
 * @pages/room —— P2P 房间信令协议类型
 *
 * <p>协议对齐后端 `spring-support-socket-websocket-starter` 的
 * {@code com.chua.starter.socket.websocket.room} 信封：
 * <ul>
 *   <li>上行 {@code hello / signal / heartbeat / leave}</li>
 *   <li>下行 {@code welcome / negotiate / peer-ready / peer-left /
 *   peer-disconnected / peer-reconnected / replaced / left / pong / signal / error}</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.46
 */

/* ==================== 上行信令 ==================== */

/** 基础信令信封 */
export interface RoomSignalEnvelope {
  /** 信令类型 */
  type: string;
  /** 信令标识（UUID，对端回复 echo 用） */
  id?: string;
  /** 房间编号 */
  roomId?: string;
  /** 当前端点的 SlotID */
  slotId?: string;
  /** 来源端点的 SlotID（发起方） */
  fromSlotId?: string;
  /** 对等端点的 SessionID */
  peerSessionId?: string;
  /** 恢复令牌（续接旧连接用） */
  resumeToken?: string;
  /** 当前房间代数 */
  epoch?: number;
  /** 发起端点的 SlotID */
  offererSlotId?: string;
  /** 对等端点的直达 ID */
  peerId?: string;
  /** 框架负载（WebRTC offer / answer / candidate） */
  payload?: string;
  /** 离开原因 */
  reason?: string;
  /** 重试时间（ms） */
  retryAfterMs?: number;
}

/** 加入房间 */
export interface HelloSignal extends RoomSignalEnvelope {
  type: "hello";
  /** 房间编号（创建时留空，由服务端生成） */
  roomId?: string;
}

/** WebRTC 信号转发 */
export interface SignalMessage extends RoomSignalEnvelope {
  type: "signal";
}

/** 心跳 / 续期 */
export interface HeartbeatSignal extends RoomSignalEnvelope {
  type: "heartbeat";
}

/** 离开房间 */
export interface LeaveSignal extends RoomSignalEnvelope {
  type: "leave";
}

/* ==================== 下行信封 ==================== */

/** 欢迎信封（第一个端点加入房间） */
export interface WelcomeEnvelope extends RoomSignalEnvelope {
  type: "welcome";
  /** 对端 SlotID */
  peerId?: string;
  /** 发起端点 SlotID */
  offererSlotId?: string;
  /** 房间参与端点总数 */
  peerCount?: number;
  /** 是否续接旧连接 */
  resumed?: boolean;
  /** 是否是发起方 */
  initiator?: boolean;
  /** 恢复令牌 */
  resumeToken?: string;
}

/** 协商信封（对端开始交换信令） */
export interface NegotiateEnvelope extends RoomSignalEnvelope {
  type: "negotiate";
}

/** 对端就绪 */
export interface PeerReadyEnvelope extends RoomSignalEnvelope {
  type: "peer-ready";
}

/** 对端掉线 */
export interface PeerDisconnectedEnvelope extends RoomSignalEnvelope {
  type: "peer-disconnected";
}

/** 对端主动离开 */
export interface PeerLeftEnvelope extends RoomSignalEnvelope {
  type: "peer-left";
}

/** 对端重连 */
export interface PeerReconnectedEnvelope extends RoomSignalEnvelope {
  type: "peer-reconnected";
}

/** 连接被替换（同一端点新连接） */
export interface ReplacedEnvelope extends RoomSignalEnvelope {
  type: "replaced";
}

/** 离开房间 */
export interface LeftEnvelope extends RoomSignalEnvelope {
  type: "left";
}

/** 心跳回应 */
export interface PongEnvelope extends RoomSignalEnvelope {
  type: "pong";
}

/** 错误信封 */
export interface ErrorEnvelope extends RoomSignalEnvelope {
  type: "error";
  /** 错误原因码 */
  reason?: string;
  /** 详细的错误信息 */
  message?: string;
}

/** 信令负载（干活的好像是 payload） */
export interface SignalEnvelope extends RoomSignalEnvelope {
  type: "signal";
}

/** 所有下行信封类型 */
export type RoomMessageEnvelope =
  | WelcomeEnvelope
  | NegotiateEnvelope
  | PeerReadyEnvelope
  | PeerDisconnectedEnvelope
  | PeerLeftEnvelope
  | PeerReconnectedEnvelope
  | ReplacedEnvelope
  | LeftEnvelope
  | PongEnvelope
  | SignalEnvelope
  | ErrorEnvelope;

/** 一次完整画布数据（一条线） */
export interface CanvasFrame {
  /** 画笔颜色 */
  color: string;
  /** 笔刷宽度 */
  lineWidth: number;
  /** 工具：pen 画笔 / eraser 橡皮 */
  tool: "pen" | "eraser";
  /** 坐标点列 */
  points: { x: number; y: number }[];
  /** 时间 */
  time: number;
}

/** 画布线条（一方画入、传递到对端后由 Re 接管） */
export interface CanvasStroke {
  /** 对端 SlotID（发送方） */
  peerId: string;
  /** 画笔颜色 */
  color: string;
  /** 笔刷宽度 */
  lineWidth: number;
  /** 工具：pen 画笔 / eraser 橡皮 */
  tool: "pen" | "eraser";
  /** 坐标点列 */
  points: { x: number; y: number }[];
  /** 时间 */
  time: number;
}

/** 信令 ID（路由专用：需要“重”的话，连个 UUID 返回给客户端，报错 echo 一下】 */
export type RoomSignalType = Exclude<RoomSignalEnvelope["type"], undefined>;

/* ==================== 工作空间 ==================== */

/** 工作空间（页面级页签） */
export enum Workspace {
  /** 聊天 */
  CHAT = "chat",
  /** 文件 */
  FILES = "files",
  /** 视频 */
  VIDEO = "video",
  /** 语音 */
  VOICE = "voice",
  /** 观看 */
  WATCH = "watch",
  /** 协作 */
  COLLABORATE = "collaborate",
  /** 画板 */
  CANVAS = "canvas",
  /** 状态 */
  STATUS = "status",
}

/** 工作空间标签（中 / 英） */
export const WORKSPACE_LABELS: Record<Workspace, string> = {
  [Workspace.CHAT]: "聊天",
  [Workspace.FILES]: "文件",
  [Workspace.VIDEO]: "视频",
  [Workspace.VOICE]: "语音",
  [Workspace.WATCH]: "观看",
  [Workspace.COLLABORATE]: "协作",
  [Workspace.CANVAS]: "画板",
  [Workspace.STATUS]: "状态",
};

/** 状态（端点接入状态） */
export enum RoomStatus {
  /** 未加入 */
  IDLE = "idle",
  /** 连接中 */
  CONNECTING = "connecting",
  /** 等待加入房间（等待对端 enter） */
  WAITING = "waiting",
  /** 已加入 */
  JOINED = "joined",
  /** 邀请中（等待对端 ready） */
  INVITING = "inviting",
  /** 已离开 */
  LEFT = "left",
  /** 断开 */
  DISCONNECTED = "disconnected",
}
