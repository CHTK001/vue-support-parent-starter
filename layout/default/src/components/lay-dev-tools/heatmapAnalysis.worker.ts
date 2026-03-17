/**
 * 热点分析 Worker
 * 职责：
 * 1. 接收主线程传来的元素标识数据，聚合统计 Top10
 * 2. 定时扫描删除超时数据（默认保留 24h）
 */

/** 超时阈值：24小时 */
const EXPIRE_MS = 24 * 60 * 60 * 1000;

/** 定时清理间隔：5分钟 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export interface ElementRecord {
  label: string;
  tag: string;
  route: string;
  timestamp: number;
  count: number;
}

export interface AggregatedStat {
  label: string;
  tag: string;
  count: number;
  percent: string;
}

export type WorkerInMessage =
  | { type: "aggregate"; records: ElementRecord[]; route: string }
  | { type: "cleanup"; records: ElementRecord[] };

export type WorkerOutMessage =
  | { type: "aggregated"; stats: AggregatedStat[]; total: number }
  | { type: "cleaned"; records: ElementRecord[] }
  | { type: "ping_cleanup" };

/** 聚合统计：按当前路由过滤，合并相同元素 */
function aggregate(records: ElementRecord[], route: string): { stats: AggregatedStat[]; total: number } {
  const map = new Map<string, number>();
  let total = 0;

  for (const r of records) {
    if (r.route !== route) continue;
    const key = `${r.tag}::${r.label}`;
    map.set(key, (map.get(key) ?? 0) + r.count);
    total += r.count;
  }

  const stats: AggregatedStat[] = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [tag, ...rest] = key.split("::");
      return {
        label: rest.join("::"),
        tag,
        count,
        percent: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%",
      };
    });

  return { stats, total };
}

/** 清理超时数据 */
function cleanup(records: ElementRecord[]): ElementRecord[] {
  const now = Date.now();
  return records.filter(r => now - r.timestamp < EXPIRE_MS);
}

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;
  if (msg.type === "aggregate") {
    const result = aggregate(msg.records, msg.route);
    self.postMessage({ type: "aggregated", ...result } satisfies WorkerOutMessage);
  } else if (msg.type === "cleanup") {
    const cleaned = cleanup(msg.records);
    self.postMessage({ type: "cleaned", records: cleaned } satisfies WorkerOutMessage);
  }
};

/** 定时触发清理（发信号让主线程把数据传来做 cleanup） */
setInterval(() => {
  self.postMessage({ type: "ping_cleanup" } satisfies WorkerOutMessage);
}, CLEANUP_INTERVAL_MS);
