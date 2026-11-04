/**
 * 用量看板 · 分布聚合与排行口径
 *
 * <p>模型 / 分组 / 应用三种分布只差一个「怎么取 key」的函数，聚合、排序、
 * 取前 N、算占比全部共用这一套。之前这几段逻辑在页面里各自抄了一遍，
 * 结果是「榜序按 Token、占比按全量」这种口径在不同区块之间偷偷分叉。</p>
 */

import type { ChartType, DistRow } from "./types";

/** 排行取前 N 名 */
export const RANK_TOP_N = 5;

/**
 * 把明细行按某个维度归并成分布行，最后按 Token 降序。
 *
 * <p>keyOf 返回 null 表示这条记录不参与该维度（例如没有分组名的脏数据）。</p>
 */
export function rollUp(rows: any[], keyOf: (r: any) => string | null): DistRow[] {
  const map = new Map<string, DistRow>();
  for (const r of rows) {
    const k = keyOf(r);
    if (k == null) continue;
    if (!map.has(k)) {
      map.set(k, { name: k, requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 });
    }
    const a = map.get(k)!;
    a.requests += Number(r.requests) || 0;
    a.promptTokens += Number(r.promptTokens) || 0;
    a.completionTokens += Number(r.completionTokens) || 0;
    a.totalTokens += Number(r.totalTokens) || 0;
    a.cost += Number(r.cost) || 0;
  }
  return [...map.values()].sort((a, b) => b.totalTokens - a.totalTokens);
}

/** 当前口径下某一行的取值 */
export function metricOf(r: { totalTokens?: number; cost?: number }, type: ChartType): number {
  return type === "token" ? Number(r?.totalTokens) || 0 : Number(r?.cost) || 0;
}

/** 当前口径下某一组数据的总量 */
export function totalOf(rows: Array<{ totalTokens?: number; cost?: number }>, type: ChartType): number {
  return rows.reduce((s, x) => s + metricOf(x, type), 0);
}

/**
 * 取前 N 条并按当前口径排序。
 *
 * <p>{@code rollUp} 恒按 token 降序；切到「按费用」时榜序也必须跟着变，
 * 否则会出现「第一名 Token 最多但费用最低」这种自相矛盾的榜单。</p>
 */
export function topBy(rows: DistRow[], rankMetric: ChartType): DistRow[] {
  return [...rows]
    .sort((a, b) => metricOf(b, rankMetric) - metricOf(a, rankMetric))
    .slice(0, RANK_TOP_N);
}

/** 相对榜首的条长：以第一名为满格，视觉上直接读出差距 */
export function rankBarWidth(r: DistRow, list: DistRow[], rankMetric: ChartType): string {
  const top = list[0];
  if (!top) return "0%";
  const t = metricOf(top, rankMetric);
  if (!t || t <= 0) return "0%";
  return `${Math.max(2, Math.round((metricOf(r, rankMetric) / t) * 100))}%`;
}

/** 占**全量**的百分比（不是占榜首）—— 占比要回答「这一项吃掉多少」 */
export function rankPct(r: DistRow, list: DistRow[], rankMetric: ChartType): string {
  const total = totalOf(list, rankMetric);
  if (!total || total <= 0) return "—";
  return `${((metricOf(r, rankMetric) / total) * 100).toFixed(1)}%`;
}

/** 单行占全量的百分比数值 */
export function percentNum(
  row: { totalTokens?: number; cost?: number },
  all: Array<{ totalTokens?: number; cost?: number }>,
  type: ChartType,
): number {
  const total = totalOf(all, type);
  if (total <= 0) return 0;
  return (metricOf(row, type) / total) * 100;
}

/** 单行占全量的百分比文案（一位小数） */
export function percentText(
  row: { totalTokens?: number; cost?: number },
  all: Array<{ totalTokens?: number; cost?: number }>,
  type: ChartType,
): string {
  return percentNum(row, all, type).toFixed(1) + "%";
}

/**
 * 占比条宽度：0% 也留 2px，否则「有一点点」和「真的没有」看起来一样。
 */
export function barWidth(pct: number): string {
  const v = Math.min(100, Math.max(0, pct));
  if (v <= 0) return "0%";
  return Math.max(2, v) + "%";
}

/** 该行在当前口径下是否为 0（¥0 / 0 token 的行需要淡化成浅灰） */
export function isZeroOf(row: { totalTokens?: number; cost?: number }, type: ChartType): boolean {
  return !(metricOf(row, type) > 0);
}

/** 应用标识：分组为空说明数据异常，显式兜底而不是从榜上悄悄消失 */
export const APP_GROUP_ALIAS: Record<string, string> = {
  chat: "self-console",
  bot: "self-console",
};

export function appKeyOf(r: any): string {
  const g = r.group;
  if (!g) return "unknown-app";
  return APP_GROUP_ALIAS[g] || g;
}

/** 应用标识多为英文小写，补中文名；未收录的软件名原样显示，别藏起来 */
export const APP_LABELS: Record<string, string> = {
  "self-console": "本控制台",
  local: "本地工具",
  "unknown-app": "未知应用",
  opencode: "OpenCode",
  "claude-code": "Claude Code",
  codex: "Codex CLI",
  "gemini-cli": "Gemini CLI",
  qwen: "Qwen Code",
  droid: "Droid",
  goose: "Goose",
  kilo: "Kilo Code",
  "roo-code": "Roo Code",
  cline: "Cline",
  "copilot-cli": "Copilot CLI",
  zed: "Zed",
  lmstudio: "LM Studio",
};

export function appLabel(name: string): string {
  return APP_LABELS[name] || name;
}
