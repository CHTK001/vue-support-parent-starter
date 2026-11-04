/**
 * @pages/room —— P2P 房间状态（Pinia Store）
 *
 * <p>房间主题的共享状态层：
 * <ul>
 *   <li>连接与信令：{@link RoomSocket} 底的传输层（连接状态由
 *   {@link RoomStore.connectionState} 承载，不往业务状态塞）</li>
 *   <li>房间协议：hello → welcome → negotiate → signal/offer-answer-candidate
 *   → peer-ready → left/peer-left/peer-disconnected（状态机在
 *   {@link handleEnvelope} 里，供页面与组件读）</li>
 *   <li>聊天：按房间积累 {@link messages}（入队时对端不写全局历史，避免大页面卡顿）</li>
 * </ul>
 *
 * 页面进入房间时 `useRoomStore()` 一次即可，各 Workspace 组件读状态、调方法。
 *
 * @author CH
 * @since 4.0.0.46
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { uuid } from "@repo/utils";
import { roomSocket, ConnectionState } from "../services/roomSocket";
import {
  type RoomMessageEnvelope,
  RoomStatus,
  type Workspace,
  Workspace as W,
  type CanvasStroke,
} from "../types/room";

/** 结构化信令事件（WebRTC data channel 消息体） */
interface EventEnvelope {
  /** 事件名 */
  event: string;
  /** 载荷 */
  data?: string;
}

/** 聊天气泡 */
export interface ChatBubble {
  /** 唯一标识（v-for 的 key，不和 time 混用） */
  id?: string;
  /** 发送者工号（我们拿 peerId 区分对方） */
  from: "me" | string;
  /** 文本 */
  text: string;
  /** 时间 */
  time: number;
  /** 方向 */
  direction?: "in" | "out";
}

/** 对端会话元信息 */
export interface PeerInfo {
  /** 对端 SlotID */
  peerId: string;
  /** 状态 */
  connected: boolean;
}

/** 房间状态机需要的内部标记 */
interface RoomFlags {
  /** 收到 negotiate 说明对端已经加入，我们在等 offer */
  negotiated: boolean;
}

export const useRoomStore = defineStore("room", () => {
  /* ==================== 状态 ==================== */

  /** 连接状态（传输层） */
  const connectionState = ref<ConnectionState>(ConnectionState.IDLE);

  /** 房间状态（由下行信令驱动） */
  const status = ref<RoomStatus>(RoomStatus.IDLE);

  /** 房间编号 */
  const roomId = ref<string>();

  /** 当前端点的 SlotID */
  const slotId = ref<string>();

  /** 对端 SlotID */
  const peerId = ref<string>();

  /** 对端会话元信息 */
  const peers = ref<PeerInfo[]>([]);

  /** 发起方 slotId */
  const offererSlotId = ref<string>();

  /** 发起方标记（initiator 信封） */
  const initiator = ref(false);

  /** 是否续接旧连接（resumed 信封） */
  const resumed = ref(false);

  /** 房间代数 */
  const epoch = ref(0);

  /** 恢复令牌 */
  const resumeToken = ref<string>();

  /** 聊天消息 */
  const messages = ref<ChatBubble[]>([]);

  /** 画布数据：对端画入的线条（Canvas 空间驱动） */
  const canvasStrokes = ref<CanvasStroke[]>([]);

  /** 当前工作空间 */
  const workspace = ref<Workspace>(W.CHAT);

  /** 错误信息（ facil 派发） */
  const error = ref<string>();

  /** 收信 Singer（业务层可替换的原始信令处理器） */
  const flags = ref<Partial<RoomFlags>>({});

  /* ==================== 计算 ==================== */

  /** 是否在房间里 */
  const inRoom = computed(() => !!roomId.value);

  /** 对端是否就绪（能做信令/媒体） */
  const peerReady = computed(() => status.value === RoomStatus.JOINED);

  /** 连接是否活着 */
  const connected = computed(() => connectionState.value === ConnectionState.OPEN);

  /** 对方是否在线 */
  const peerOnline = computed(() =>
    peers.value.some((p) => p.connected && p.peerId === peerId.value),
  );

  /* ==================== 连接 ==================== */

  /** 连接 WebSocket */
  function connect(): void {
    roomSocket.connect();
  }

  /** 断开连接 */
  function disconnect(): void {
    roomSocket.disconnect();
    status.value = RoomStatus.LEFT;
  }

  /** 加入房间（创建/续接） */
  function joinRoom(id?: string, resume = resumeToken.value): void {
    error.value = undefined;
    roomSocket.joinRoom(id, resume);
  }

  /** 离开房间 */
  function leaveRoom(reason = "user"): void {
    roomSocket.leaveRoom(reason);
    resetRoom();
  }

  /** 断线续接（leave 不触发，业务层在需要时调用） */
  function reconnect(): void {
    roomSocket.reconnect();
  }

  /** 对整个房间发信号（WebRTC offer/answer/candidate） */
  function signal(payload: string): void {
    roomSocket.signal(payload);
  }

  /** 发聊天 */
  function sendChat(text: string): void {
    if (!text.trim() || !inRoom.value) return;
    messages.value.push({
      from: "me",
      id: uuid(),
      text: text.trim(),
      time: Date.now(),
      direction: "out",
    });
  }

  /** 追加对端的聊天 */
  function appendPeerChat(peer: string, text: string): void {
    if (!text.trim()) return;
    messages.value.push({
      from: peer,
      id: uuid(),
      text: text.trim(),
      time: Date.now(),
      direction: "in",
    });
  }

  /** 追加对端的画布数据 */
  function appendCanvasStroke(peer: string, data: CanvasStroke): void {
    if (!data?.color || data.points?.length < 1) return;
    canvasStrokes.value.push({ ...data, peerId: peer });
  }

  /* ==================== 信号处理 ==================== */

  /** 注册信号监听（在 RoomSocket 构造时绑定） */
  function bindSignals(): () => void {
    const unbinders = [
      roomSocket.on("welcome", onWelcome),
      roomSocket.on("negotiate", onNegotiate),
      roomSocket.on("peer-ready", onPeerReady),
      roomSocket.on("peer-left", onPeerLeft),
      roomSocket.on("peer-disconnected", onPeerDisconnected),
      roomSocket.on("peer-reconnected", onPeerReconnected),
      roomSocket.on("replaced", onReplaced),
      roomSocket.on("left", onLeft),
      roomSocket.on("pong", onPong),
      roomSocket.on("signal", onSignal),
      roomSocket.on("error", onError),
    ];
    return () => unbinders.forEach((u) => u?.());
  }
  /* ==================== 下行信封 ==================== */

  /** welcome（第一个/第二个端点加入房间） */
  function onWelcome(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    roomId.value = msg.roomId;
    slotId.value = msg.slotId;
    offererSlotId.value = msg.offererSlotId;
    epoch.value = msg.epoch ?? 0;
    resumeToken.value = msg.resumeToken ?? "";
    peers.value = [];
    flags.value = {};
    // initiator / resumed 只出现在 welcome 信封里（TS 按 type 归派）
    if (msg.type === "welcome") {
      initiator.value = msg.initiator ?? false;
      resumed.value = msg.resumed ?? false;
    }

    if (msg.peerId) {
      peerId.value = msg.peerId;
      status.value = RoomStatus.JOINED;
    } else {
      status.value = RoomStatus.WAITING;
    }
  }

  /** negotiate（对端加入，通知发起方生成 offer） */
  function onNegotiate(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    peerId.value = msg.slotId;
    epoch.value = msg.epoch ?? 0;
    flags.value.negotiated = true;
    status.value = RoomStatus.INVITING;
  }

  /** peer-ready（对端就绪，房间完成入会） */
  function onPeerReady(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    epoch.value = msg.epoch ?? 0;
    if (msg.peerId) {
      peerId.value = msg.peerId;
      status.value = RoomStatus.JOINED;
      if (!peers.value.some((p) => p.peerId === msg.peerId)) {
        peers.value.push({ peerId: msg.peerId, connected: true });
      }
    }
  }

  /** peer-left（对端主动离开） */
  function onPeerLeft(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    status.value = RoomStatus.LEFT;
    if (msg.peerId) {
      peers.value = peers.value.filter((p) => p.peerId !== msg.peerId);
    }
  }

  /** peer-disconnected（对端非主动断开） */
  function onPeerDisconnected(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    status.value = RoomStatus.DISCONNECTED;
    if (msg.peerId) {
      peerId.value = msg.peerId;
    }
  }

  /** peer-reconnected（对端续接回来了） */
  function onPeerReconnected(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    status.value = RoomStatus.JOINED;
    if (msg.peerId) {
      peerId.value = msg.peerId;
      if (!peers.value.some((p) => p.peerId === msg.peerId)) {
        peers.value.push({ peerId: msg.peerId, connected: true });
      }
    }
  }

  /** replaced（同一端点被新连接替换） */
  function onReplaced(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    status.value = RoomStatus.DISCONNECTED;
  }

  /** left（自己离开后回执） */
  function onLeft(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    resetRoom();
  }

  /** pong（心跳回应） */
  function onPong(msg: RoomMessageEnvelope): void {
    epoch.value = msg.epoch ?? 0;
  }

  /** signal（对端转发的 WebRTC 信令，交给业务层处理） */
  function onSignal(msg: RoomMessageEnvelope): void {
    error.value = undefined;
    if (!msg.payload) return;
    let payload: unknown;
    try {
      payload = JSON.parse(msg.payload);
    } catch {
      // 裸字符串文本：ZestSend 聊天走这一路
      if (msg.slotId) {
        appendPeerChat(msg.slotId, msg.payload);
      }
      return;
    }
    if (typeof payload === "string") {
      if (msg.slotId) {
        appendPeerChat(msg.slotId, payload);
      }
      return;
    }
    // 结构化事件（event/data）
    if (payload && typeof payload === "object" && (payload as EventEnvelope).event) {
      const ev = (payload as EventEnvelope).event;
      if (ev === "chat") {
        if (msg.slotId) {
          appendPeerChat(msg.slotId, (payload as EventEnvelope).data ?? "");
        }
      } else if (ev === "canvas") {
        // 画布数据：{event: "canvas", data: CanvasFrame}
        try {
          if (msg.slotId) {
            appendCanvasStroke(msg.slotId, JSON.parse((payload as EventEnvelope).data ?? ""));
          }
        } catch {
          /* 忽略格式不对的画布数据 */
        }
      }
    }
  }

  /** error（错误信封） */
  function onError(msg: RoomMessageEnvelope): void {
    status.value = RoomStatus.DISCONNECTED;
    if (msg.type === "error") {
      error.value = msg.reason ?? "room.error";
    }
    resetRoom();
  }

  /* ==================== 重置 ==================== */

  /** 清空房间状态 */
  function resetRoom(): void {
    roomId.value = undefined;
    slotId.value = undefined;
    peerId.value = undefined;
    offererSlotId.value = undefined;
    initiator.value = false;
    resumed.value = false;
    epoch.value = 0;
    resumeToken.value = undefined;
    peers.value = [];
    messages.value = [];
    canvasStrokes.value = [];
    status.value = RoomStatus.IDLE;
    error.value = undefined;
    flags.value = {};
    workspace.value = W.CHAT;
  }

  /* ==================== 暴露 ==================== */

  return {
    // 状态
    connectionState,
    status,
    roomId,
    slotId,
    peerId,
    offererSlotId,
    initiator,
    resumed,
    epoch,
    resumeToken,
    peers,
    messages,
    canvasStrokes,
    workspace,
    error,
    // 计算
    inRoom,
    connected,
    peerReady,
    peerOnline,
    // 方法
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    reconnect,
    signal,
    sendChat,
    appendPeerChat,
    bindSignals,
    resetRoom,
  };
});
