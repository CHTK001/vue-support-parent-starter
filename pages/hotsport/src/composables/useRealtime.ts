/**
 * useRealtime.ts —— 实时数据流统一 composable
 *
 * 封装 realtimeService，提供带自动清理、生命周期绑定的订阅能力。
 * 视图不再各自创建 EventSource / WebSocket，统一走单例实时通道。
 *
 * @since 4.2.0
 */
import { onBeforeUnmount, type Ref, ref, shallowRef } from "vue";
import {
  realtimeService,
  type RealtimeEvent,
  type RealtimeEventHandler,
  type RealtimeEventType,
} from "../services/realtimeService";

/** 订阅某个实时事件；返回退订函数 */
export function useRealtimeEvent(
  type: RealtimeEventType,
  handler: RealtimeEventHandler,
): () => void {
  realtimeService.on(type, handler);
  const off = () => realtimeService.off(type, handler);
  onBeforeUnmount(off);
  return off;
}

/** 订阅全部实时事件；返回退订函数 */
export function useRealtimeAll(handler: RealtimeEventHandler): () => void {
  realtimeService.onAll(handler);
  const off = () => realtimeService.offAll(handler);
  onBeforeUnmount(off);
  return off;
}

/** 当前单例的连接状态（模板可直接使用） */
export function useRealtimeStatus() {
  return {
    connected: realtimeService.connected,
    wsConnected: realtimeService.wsConnected,
    reconnectAttempts: realtimeService.reconnectAttemptsRef,
  };
}

/**
 * 实时日志流：订阅服务端 `log` 事件并维护最近 N 条列表。
 *
 * - 列表自动去重（同 timestamp + message 视为同一条）
 * - start/stop 幂等
 * - 组件卸载自动停止
 */
export interface UseRealtimeLogOptions {
  /** 最多保留条数，默认 50 */
  maxItems?: number;
  /** 是否立即开始接收，默认 false */
  autoStart?: boolean;
}

export interface UseRealtimeLogReturn {
  /** 推流是否开启 */
  active: Ref<boolean>;
  /** 实时日志列表（最新在前） */
  items: Ref<LogRecordLike[]>;
  /** 收到事件总数（累计计数，便于 UI 显示吞吐） */
  receivedCount: Ref<number>;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  clear: () => void;
}

/** 与日志行兼容的最小字段（不强依赖具体类型，避免循环依赖） */
export interface LogRecordLike {
  level?: string;
  message?: string;
  timestamp?: string | number;
  logger?: string;
  traceId?: string;
  [key: string]: unknown;
}

export function useRealtimeLog(options: UseRealtimeLogOptions = {}): UseRealtimeLogReturn {
  const { maxItems = 50, autoStart = false } = options;
  const active = ref(false);
  const items = shallowRef<LogRecordLike[]>([]);
  const receivedCount = ref(0);

  function start() {
    if (active.value) return;
    active.value = true;
    realtimeService.on("log", onLogEvent);
  }

  function stop() {
    if (!active.value) return;
    active.value = false;
    realtimeService.off("log", onLogEvent);
  }

  function clear() {
    items.value = [];
    receivedCount.value = 0;
  }

  function toggle() {
    active.value ? stop() : start();
  }

  function onLogEvent(event: RealtimeEvent) {
    if (!active.value) return;
    try {
      const batch = normalizeLogBatch(event.data);
      if (!batch.length) return;
      let list = items.value;
      for (const rec of batch) {
        receivedCount.value += 1;
        // 去重：与当前最新一条完全相同的帧不重复入列
        if (
          list.length &&
          list[0].timestamp === rec.timestamp &&
          list[0].message === rec.message
        ) {
          continue;
        }
        list = [rec, ...list];
      }
      if (list.length > maxItems) list = list.slice(0, maxItems);
      // shallowRef 整体替换触发更新，避免深响应开销
      items.value = list;
    } catch {
      /* 忽略畸形帧 */
    }
  }

  /**
   * 归一化一帧日志负载。
   *
   * <p>服务端 {@code /stream/logs} 每帧是 {@code { items: [...], lastSeq }}，
   * items 是这一轮新增的**全部**日志行；只取第一条会丢日志，必须整批展开。</p>
   */
  function normalizeLogBatch(raw: unknown): LogRecordLike[] {
    if (!raw || typeof raw !== "object") return [];
    const obj = raw as { items?: unknown[] } & LogRecordLike;
    const frames = Array.isArray(obj.items) ? obj.items : [obj];
    const out: LogRecordLike[] = [];
    for (const frame of frames) {
      const rec = normalizeLogRecord(frame);
      if (rec && (rec.level || rec.message)) {
        out.push(rec);
      }
    }
    return out;
  }

  /**
   * 归一化单条日志记录。
   *
   * <p>服务端标准输出帧的字段是 {@code { seq, timestamp, source, level, line }}，
   * 正文在 {@code line} 上，需要映射到统一契约的 {@code message}。</p>
   */
  function normalizeLogRecord(raw: unknown): LogRecordLike | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as LogRecordLike & { line?: unknown; source?: unknown };
    if (obj.message == null && typeof obj.line === "string") {
      return {
        ...obj,
        message: obj.line,
        logger: obj.logger ?? (typeof obj.source === "string" ? obj.source : undefined),
      };
    }
    return obj;
  }

  if (autoStart) start();
  onBeforeUnmount(() => stop());

  return {
    active,
    items,
    receivedCount,
    start,
    stop,
    toggle,
    clear,
  };
}