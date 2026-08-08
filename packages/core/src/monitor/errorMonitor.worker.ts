/**
 * 全局异常监控 Worker（errorMonitor.worker.ts）
 *
 * 职责：在独立线程内接收主线程捕获的异常记录，做三件事后再批量回传：
 *   1. 去重：同窗口（dedupWindow）内相同指纹只保留一条，累计 count
 *   2. 采样：sampleRate<1 时随机丢弃部分低优先级异常，避免高峰淹没服务端
 *   3. 缓冲/批量：缓冲达到 batchSize 立即回传；否则按 reportInterval 节流回传
 *
 * 独立线程的收益：去重与缓冲不占主线程 JS 执行时间，异常风暴下 UI 不卡顿。
 * 回传后由主线程统一按 monitor.reportUrl 上报服务端（见 ./index.ts）。
 *
 * 协议：
 *   主线程 → Worker：{ type: "start", config } / { type: "report", record } / { type: "flush" }
 *   Worker → 主线程：{ type: "batch", records }
 */
import type {
  ErrorRecord,
  ErrorMonitorWorkerMessage,
  MonitorBatchResponse,
} from "./types";

/** 默认去重窗口（毫秒，60s 内同错误记一次） */
const DEFAULT_DEDUP_WINDOW = 60_000;
/** 默认批量节流间隔（毫秒） */
const DEFAULT_REPORT_INTERVAL = 5_000;
/** 默认单批上限 */
const DEFAULT_BATCH_SIZE = 20;
/** 默认采样率（1=全量） */
const DEFAULT_SAMPLE_RATE = 1;
/** 默认缓冲上限（超出丢弃最旧） */
const DEFAULT_MAX_BUFFER = 200;

/** Worker 内持有配置 */
interface WorkerOptions {
  batchSize: number;
  reportInterval: number;
  dedupWindow: number;
  sampleRate: number;
  maxBuffer: number;
}

/** 当前生效配置（未 start 时用默认值兜底） */
let options: WorkerOptions = {
  batchSize: DEFAULT_BATCH_SIZE,
  reportInterval: DEFAULT_REPORT_INTERVAL,
  dedupWindow: DEFAULT_DEDUP_WINDOW,
  sampleRate: DEFAULT_SAMPLE_RATE,
  maxBuffer: DEFAULT_MAX_BUFFER,
};

/** 缓冲队列（首批在前，超出 maxBuffer 丢弃最旧） */
let buffer: ErrorRecord[] = [];

/** 去重索引：指纹 → { 记录下标, 首次时间 } */
const dedupIndex = new Map<string, { index: number; firstAt: number }>();

/** 节流定时器 */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** 重置配置与缓冲（start 重新下发时调用） */
function resetState(): void {
  buffer = [];
  dedupIndex.clear();
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

/** 采样：返回是否保留该条 */
function sample(): boolean {
  return options.sampleRate >= 1 || Math.random() < options.sampleRate;
}

/** 计算节流等待：距该条最早记录的时间差（保证窗口内至少停留 dedupWindow/2） */
function nextFlushDelay(): number {
  const first = buffer.length > 0 ? buffer[0].firstAt : Date.now();
  const elapsed = Date.now() - first;
  const minWait = Math.min(options.reportInterval, options.dedupWindow / 2);
  return Math.max(0, minWait - elapsed);
}

/** 排定节流定时器（幂等） */
function scheduleFlush(delay = options.reportInterval): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushBatch();
  }, delay);
}

/** 批量回传主线程并清空缓冲 */
function flushBatch(): void {
  if (buffer.length === 0) return;
  const records = buffer;
  buffer = [];
  dedupIndex.clear();
  const response: MonitorBatchResponse = { type: "batch", records };
  self.postMessage(response);
}

/** 接收一条异常记录：去重 → 采样 → 缓冲 → 触发批量 */
function pushRecord(record: ErrorRecord): void {
  // 采样不通过则丢弃
  if (!sample()) return;

  const now = Date.now();
  const dup = dedupIndex.get(record.key);
  if (dup) {
    // 去重窗口内再次出现：累计次数、刷新时间，不新增
    const existing = buffer[dup.index];
    if (existing && now - dup.firstAt <= options.dedupWindow) {
      existing.count += 1;
      existing.firstAt = dup.firstAt;
      return;
    }
    dedupIndex.delete(record.key);
  }

  // 新记录：写入缓冲（超上限丢弃最旧）
  if (buffer.length >= options.maxBuffer) {
    const dropped = buffer.shift();
    if (dropped) dedupIndex.delete(dropped.key);
  }
  const fresh: ErrorRecord = { ...record, firstAt: now, count: 1 };
  buffer.push(fresh);
  dedupIndex.set(record.key, { index: buffer.length - 1, firstAt: now });

  // 达到单批上限立即回传；否则按节流间隔排定
  if (buffer.length >= options.batchSize) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushBatch();
  } else {
    scheduleFlush(nextFlushDelay());
  }
}

self.onmessage = (event: MessageEvent<ErrorMonitorWorkerMessage>) => {
  const msg = event.data ?? {};
  if (msg.type === "start") {
    // 重新下发配置：清空旧状态
    resetState();
    options = {
      batchSize: msg.config.batchSize ?? DEFAULT_BATCH_SIZE,
      reportInterval: msg.config.reportInterval ?? DEFAULT_REPORT_INTERVAL,
      dedupWindow: msg.config.dedupWindow ?? DEFAULT_DEDUP_WINDOW,
      sampleRate: msg.config.sampleRate ?? DEFAULT_SAMPLE_RATE,
      maxBuffer: msg.config.maxBuffer ?? DEFAULT_MAX_BUFFER,
    };
  } else if (msg.type === "report" && msg.record) {
    pushRecord(msg.record);
  } else if (msg.type === "flush") {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushBatch();
  }
};
