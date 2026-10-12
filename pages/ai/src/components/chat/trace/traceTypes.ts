/**
 * 会话执行轨迹：类型定义与 span 配对逻辑。
 *
 * 后端存的是「点事件 + 可选区间」：一行一条 AgentTrace，带 span_id 的属于某个区间，
 * 其中 span_end=true 的那条是区间的结束标记。甘特图上的横条由同一 span_id 的
 * 开始/结束配对而成；没有配对结束事件的退化为点事件——不对缺失的时长做推算，
 * 因为编一个数字出来比空着更容易误导人。
 */

/** 单条轨迹（与后端 sys_ai_session_trace 一一对应） */
export interface SessionTrace {
  /** 类别：agent_start/agent_end/turn/thinking/text/tool_call/tool_args/tool_result/usage/hint/edge */
  kind: string
  agentId?: string | null
  /** 所属区间标识；为空表示独立的点事件 */
  spanId?: string | null
  /** 是否区间结束标记 */
  spanEnd: boolean
  toolName?: string | null
  text?: string | null
  /** 事件发生时间戳（毫秒） */
  eventTime: number
  /** 区间结束时间戳（毫秒）；0 表示点事件 */
  spanEndTime?: number | null
  /** 同一次运行内的递增序号 */
  seq: number
  /** 区间时长（毫秒）；点事件为 null */
  durationMs?: number | null
}

/** 泳道 */
export type TraceLane = "input" | "model" | "tool";

/** 泳道定义（顺序即渲染顺序） */
export const TRACE_LANES: ReadonlyArray<{ key: TraceLane; label: string }> = [
  { key: "input", label: "输入" },
  { key: "model", label: "模型" },
  { key: "tool", label: "工具" },
];

/** 轨迹类别的中文名 */
export const KIND_LABELS: Record<string, string> = {
  agent_start: "Agent 启动",
  agent_end: "Agent 结束",
  turn: "模型调用",
  usage: "用量",
  thinking: "深度思考",
  text: "助手输出",
  tool_call: "工具调用",
  tool_args: "工具入参",
  tool_result: "工具结果",
  hint: "提示",
  edge: "边缘事件",
};

/**
 * 类别 → 泳道。
 *
 * agent_start / agent_end 不在此表：它们标记的是整次运行的起止，
 * 拿它们当横条会横跨全程、把其它泳道压成看不见的一条线，
 * 所以改为按点事件渲染，整体窗口由它们界定。
 */
const LANE_BY_KIND: Record<string, TraceLane> = {
  thinking: "input",
  text: "input",
  hint: "input",
  edge: "input",
  turn: "model",
  usage: "model",
  tool_call: "tool",
  tool_args: "tool",
  tool_result: "tool",
};

/** 明细分组 */
export type TraceGroup = "system" | "context" | "assistant" | "tool";

/** 明细分组定义（顺序即渲染顺序） */
export const TRACE_GROUPS: ReadonlyArray<{ key: TraceGroup; label: string }> = [
  { key: "system", label: "系统" },
  { key: "context", label: "上下文" },
  { key: "assistant", label: "助手" },
  { key: "tool", label: "工具" },
];

/** 类别 → 明细分组 */
const GROUP_BY_KIND: Record<string, TraceGroup> = {
  agent_start: "system",
  agent_end: "system",
  usage: "system",
  hint: "system",
  edge: "system",
  thinking: "context",
  tool_call: "tool",
  tool_args: "tool",
  tool_result: "tool",
  turn: "assistant",
  text: "assistant",
};

/** 取轨迹类别对应的泳道 */
export function laneOfKind(kind: string): TraceLane {
  return LANE_BY_KIND[kind] ?? "input";
}

/** 取轨迹类别对应的明细分组 */
export function groupOfKind(kind: string): TraceGroup {
  return GROUP_BY_KIND[kind] ?? "system";
}

/** 取轨迹类别的中文名 */
export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

/** 一条配对后的区间（甘特图上的一根横条） */
export interface TraceSpan {
  spanId: string;
  /** 区间首条事件的类别，用于明细分组 */
  kind: string;
  lane: TraceLane;
  agentId?: string | null;
  toolName?: string | null;
  /** 区间内第一条事件的文字，作为横条标题 */
  label: string;
  /** 开始时间（毫秒） */
  start: number;
  /** 结束时间（毫秒）；未闭合为 null */
  end: number | null;
  /** 时长（毫秒）；未闭合为 null——不推算 */
  durationMs: number | null;
  /** 是否已闭合 */
  closed: boolean;
  /** 轮次序号：按模型泳道的区间出现顺序从 1 开始；非模型泳道为 null */
  turn: number | null;
  /** 区间内的全部文字（参数 / 结果 / 思考增量） */
  texts: string[];
}

/** 一条明细点 */
export interface TracePoint {
  kind: string;
  label: string;
  group: TraceGroup;
  lane: TraceLane;
  agentId?: string | null;
  toolName?: string | null;
  text?: string | null;
  /** 发生时间（毫秒） */
  time: number;
  /** 相对整次运行起点的偏移（毫秒） */
  offsetMs: number;
  seq: number;
}

/** 轨迹视图模型 */
export interface TraceModel {
  spans: TraceSpan[];
  points: TracePoint[];
  /** 整次运行的起点（毫秒） */
  start: number;
  /** 整次运行的终点（毫秒） */
  end: number;
  /** 整次运行时长（毫秒） */
  totalMs: number;
  /** 模型调用轮数 */
  turnCount: number;
  /** 工具调用次数 */
  callCount: number;
  /** 是否为空 */
  empty: boolean;
}

/**
 * 把点事件列表整理成甘特图所需的区间 + 明细。
 *
 * 配对规则：同一 spanId 的事件归为一个区间；开始时间取区间内最早的事件时间，
 * 结束时间只认 spanEnd=true 那条自带的时间戳。没有 spanEnd 标记的区间视为未闭合，
 * 时长留空。
 *
 * @param items 后端返回的轨迹列表
 * @returns 视图模型
 */
export function buildTraceModel(items: SessionTrace[]): TraceModel {
  const sorted = [...items].sort(
    (a, b) => a.eventTime - b.eventTime || (a.seq ?? 0) - (b.seq ?? 0),
  );

  const groups = new Map<string, SessionTrace[]>();
  for (const item of sorted) {
    if (!item.spanId) continue;
    // Agent 起止只用来界定整次运行的时间窗口，不参与横条配对：
    // 它横跨全程，画成横条会把其它泳道压成看不见的一条线。
    if (item.kind === "agent_start" || item.kind === "agent_end") continue;
    const bucket = groups.get(item.spanId);
    if (bucket) bucket.push(item);
    else groups.set(item.spanId, [item]);
  }

  const spans: TraceSpan[] = [];
  for (const [spanId, bucket] of groups) {
    // 开始时间取最早事件；结束时间只认显式的 spanEnd 标记，不按相邻事件推算
    const start = bucket.reduce(
      (min, it) => Math.min(min, it.eventTime),
      Number.POSITIVE_INFINITY,
    );
    const endMark = bucket.find((it) => it.spanEnd);
    const end = endMark && endMark.spanEndTime ? endMark.spanEndTime : null;
    const head = bucket[0];
    spans.push({
      spanId,
      kind: head.kind,
      lane: laneOfKind(head.kind),
      agentId: head.agentId,
      toolName: head.toolName,
      label: head.toolName || kindLabel(head.kind),
      start,
      end,
      durationMs: end !== null ? Math.max(0, end - start) : null,
      closed: end !== null,
      turn: null,
      texts: bucket
        .map((it) => it.text)
        .filter((t): t is string => !!t && t.length > 0),
    });
  }
  spans.sort((a, b) => a.start - b.start);

  // 轮次：模型泳道的区间按出现顺序编号
  let turn = 0;
  for (const span of spans) {
    if (span.lane === "model") {
      turn += 1;
      span.turn = turn;
    }
  }

  // 整次运行窗口：优先用 Agent 起止轨迹界定，没有就用所有事件的极值
  const starts = sorted.filter((it) => it.kind === "agent_start");
  const ends = sorted.filter((it) => it.kind === "agent_end");
  const start =
    starts.length > 0
      ? Math.min(...starts.map((it) => it.eventTime))
      : sorted.length > 0
        ? sorted[0].eventTime
        : 0;
  const end =
    ends.length > 0
      ? Math.max(...ends.map((it) => it.eventTime))
      : sorted.length > 0
        ? sorted[sorted.length - 1].eventTime
        : 0;

  // 明细点 = 没有归属区间的轨迹，外加标记整次运行起止的两条
  // （它们带着 run 区间标识，但该区间横跨全程，不适合当横条展示）
  const pairedIds = new Set(spans.map((s) => s.spanId));
  const isRunEdge = (it: SessionTrace) => it.kind === "agent_start" || it.kind === "agent_end";
  const points: TracePoint[] = sorted
    .filter((it) => !it.spanId || !pairedIds.has(it.spanId) || isRunEdge(it))
    .map((it) => ({
      kind: it.kind,
      label: kindLabel(it.kind),
      group: groupOfKind(it.kind),
      lane: laneOfKind(it.kind),
      agentId: it.agentId,
      toolName: it.toolName,
      text: it.text,
      time: it.eventTime,
      offsetMs: it.eventTime - start,
      seq: it.seq ?? 0,
    }));
  points.sort((a, b) => a.time - b.time || a.seq - b.seq);

  return {
    spans,
    points,
    start,
    end: Math.max(end, start),
    totalMs: Math.max(0, Math.max(end, start) - start),
    turnCount: turn,
    callCount: spans.filter((s) => s.lane === "tool").length,
    empty: sorted.length === 0,
  };
}

/** 一次 Agent 运行（轨迹表里的一整段） */
export interface TraceRun {
  /** 稳定标识：优先用 run 区间标识，否则用起始时间戳 */
  key: string;
  /** 本次运行的起点（毫秒） */
  start: number;
  /** 本次运行的终点（毫秒） */
  end: number;
  /** 本次运行的所有轨迹 */
  items: SessionTrace[];
}

/**
 * 把一个会话的轨迹切分成若干次运行。
 *
 * 轨迹表是**按会话**累积的，一次会话往往聊了十几轮，全铺在一根时间轴上，
 * 横条之间是几分钟到几小时的空档，甘特图会被压成几条看不清的细线。
 * 所以以 agent_start 为界把轨迹切成一段段运行，界面一次只画一段。
 *
 * 界的取法：每条 agent_start 开一段，其后的事件归到最近的那一段；
 * 早于第一条 agent_start 的（理论上不该有）单独兜成一段，不丢数据。
 */
export function groupTraceRuns(items: SessionTrace[]): TraceRun[] {
  const sorted = [...items].sort(
    (a, b) => a.eventTime - b.eventTime || (a.seq ?? 0) - (b.seq ?? 0),
  );
  if (sorted.length === 0) return [];

  const starts = sorted.filter((it) => it.kind === "agent_start");
  const bounds = starts.length > 0 ? starts.map((it) => it.eventTime) : [];

  const runs: TraceRun[] = [];
  const current: SessionTrace[][] = [];
  for (const item of sorted) {
    let slot = -1;
    for (let i = 0; i < bounds.length; i += 1) {
      if (item.eventTime >= bounds[i]) slot = i;
      else break;
    }
    if (slot < 0) {
      // 第一条 agent_start 之前的事件：并入一个「未标记」段，不静默丢弃
      if (!runs.length) {
        runs.push({ key: "orphan", start: item.eventTime, end: item.eventTime, items: [] });
        current.push(runs[0].items);
      }
      current[0].push(item);
      continue;
    }
    if (!current[slot]) {
      const marker = starts[slot];
      runs.push({
        key: marker.spanId || `run-${marker.eventTime}`,
        start: marker.eventTime,
        end: marker.eventTime,
        items: [],
      });
      current[slot] = runs[runs.length - 1].items;
    }
    current[slot].push(item);
  }

  for (const run of runs) {
    const ends = run.items.filter((it) => it.kind === "agent_end");
    const last = run.items[run.items.length - 1];
    run.end = ends.length > 0
      ? Math.max(...ends.map((it) => it.eventTime))
      : (last?.eventTime ?? run.start);
    run.start = Math.min(...run.items.map((it) => it.eventTime));
  }
  // 新的在前：界面默认展示最近一次运行
  return runs.reverse();
}

/**
 * 把毫秒格式化成人类可读的时长。
 *
 * @param ms 时长（毫秒）
 * @returns 例如 820ms / 3.4s / 1m 12s
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
}

/**
 * 把时间戳格式化成墙钟时刻。
 *
 * @param time 时间戳（毫秒）
 * @returns HH:mm:ss.SSS
 */
export function formatClock(time: number): string {
  const d = new Date(time);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}
