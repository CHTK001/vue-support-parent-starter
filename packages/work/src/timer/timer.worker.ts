/**
 * 多时区定时器 Worker
 *
 * 在独立线程中每秒计算各时区当前时间，避免主线程 setInterval 节流
 * （后台标签页 / 系统休眠唤醒后误差累积）。
 *
 * 消息协议：
 *   主线程 → Worker：{ type: "start" | "update", zones: number[] }
 *                     { type: "stop" }
 *   Worker → 主线程：{ type: "tick", zones: TimerZoneTime[] }
 *
 * 时区以 UTC 偏移小时表示（-12 ~ +12，最多 3 个），如 +8 = UTC+8。
 */
import type { TimerTick, TimerWorkerMessage } from "./types";

/** 最大时区数量（需求约束：最多三个） */
const MAX_ZONES = 3;
/** 每秒推送一次 */
const TICK_INTERVAL_MS = 1000;
/** 中文星期 */
const WEEKDAY_CN = ["日", "一", "二", "三", "四", "五", "六"] as const;

/** 当前生效的时区偏移列表 */
let zones: number[] = [];
/** 定时器句柄 */
let timer: ReturnType<typeof setInterval> | null = null;

/** 数字补零 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 计算单个时区当前时间（基于 Date.now + 偏移换算，时区无关） */
function buildZone(offset: number): TimerTick["zones"][number] {
  // 先取 UTC 绝对时间（毫秒），再加偏移小时 → 得到该时区墙上时间
  const utcMs = Date.now() + offset * 3600_000;
  const d = new Date(utcMs);
  const sign = offset > 0 ? "+" : "";
  return {
    offset,
    label: `UTC${sign}${offset}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    weekday: `星期${WEEKDAY_CN[d.getUTCDay()]}`,
  };
}

/** 广播当前各时区时间 */
function broadcast(): void {
  const tick: TimerTick = {
    timestamp: Date.now(),
    zones: zones.map(buildZone),
  };
  self.postMessage(tick);
}

/** 启动/重启定时推送（start / update 共用） */
function startTicking(nextZones: number[]): void {
  // 校验：整数 + [-12, 12] + 去重 + 最多 3 个
  const seen = new Set<number>();
  zones = nextZones
    .filter((z) => Number.isInteger(z) && z >= -12 && z <= 12 && !seen.has(z) && seen.add(z))
    .slice(0, MAX_ZONES);

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  broadcast();
  timer = setInterval(broadcast, TICK_INTERVAL_MS);
}

/** 停止推送并清空时区 */
function stopTicking(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  zones = [];
}

self.onmessage = (event: MessageEvent<TimerWorkerMessage>) => {
  const { type, zones: nextZones } = event.data ?? {};
  if (type === "start" || type === "update") {
    startTicking(Array.isArray(nextZones) ? nextZones : []);
  } else if (type === "stop") {
    stopTicking();
  }
};
