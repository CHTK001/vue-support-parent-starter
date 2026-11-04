/**
 * 用量看板 · 顶部指标卡 + 数字滚动进场
 *
 * <p>指标口径固定为四项：总 Token（主卡）、总请求数、总消费、平均耗时。
 * 顺序即权重 —— 总 Token 是这页唯一「必须一眼看到」的量，其余是解释它的指标。</p>
 */

import { ref, reactive, computed } from "vue";
import type { UsageFormat } from "./format";

/** 指标卡：视觉层只认这几个字段，不再各自判断 key */
export interface StatCard {
  key: "token" | "requests" | "cost" | "latency";
  label: string;
  value: string;
  unit: string;
  tone: "primary" | "info" | "success" | "warning";
  sub: string[];
}

/** 后端的统计快照（只取用到的字段） */
export interface UsageStats {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  totalCachedTokens: number;
  standardCost: number;
  avgLatency: number;
  avgFirstTokenLatency: number;
}

export function useUsageStats(fmt: UsageFormat) {
  const stats = reactive<UsageStats>({
    totalCalls: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    totalCachedTokens: 0,
    standardCost: 0,
    avgLatency: 0,
    avgFirstTokenLatency: 0,
  });

  /**
   * 数字滚动递增进场。
   *
   * <p>KPI 数字直接从 0 跳到终值会显得「页面卡了一下才出数」，也看不出数据是新来的；
   * 用 rAF 在 ~520ms 内插值到目标值，既提示「这是刚更新的」，又不至于让人等动画。</p>
   *
   * <p>只对**数值型**指标做动画（Token / 请求数）；费用与耗时是格式化字符串，
   * 动画中间态会出现 ¥0.0、0.0ms 这类无意义读数，反而干扰，直接给终值。</p>
   */
  const COUNT_UP_MS = 520;
  const animatedTokens = ref("—");
  const animatedCalls = ref("—");
  let countUpRaf = 0;

  /** 尊重系统「减少动态效果」偏好：关掉动画时直接落终值 */
  function prefersReducedMotion(): boolean {
    return typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** 把 fmtToken 的紧凑读数（3.85M / 145.02K / 453）反解成数值，作为滚动起点 */
  function parseCompact(text: string): number {
    const s = String(text || "").replace(/,/g, "").trim();
    const m = /^(-?\d+(?:\.\d+)?)\s*([KMBT])?$/i.exec(s);
    if (!m) return 0;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return 0;
    const unit = (m[2] || "").toUpperCase();
    const scale = unit === "K" ? 1e3 : unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "T" ? 1e12 : 1;
    return n * scale;
  }

  function runCountUp() {
    if (countUpRaf) cancelAnimationFrame(countUpRaf);
    const toTokens = Number(stats.totalTokens) || 0;
    const toCalls = Number(stats.totalCalls) || 0;
    if (prefersReducedMotion() || (toTokens === 0 && toCalls === 0)) {
      animatedTokens.value = fmt.fmtToken(toTokens);
      animatedCalls.value = fmt.formatNumber(toCalls);
      return;
    }
    // 起点取**当前显示值的数值近似**：连续刷新时从屏幕上的数继续往上走，
    // 而不是每次都从 0 重来（后者在实时推送下会一直闪烁）。
    const fromTokens = parseCompact(animatedTokens.value);
    const fromCalls = parseCompact(animatedCalls.value);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / COUNT_UP_MS);
      // easeOutCubic：开头快、收尾缓，读数停得稳
      const e = 1 - Math.pow(1 - p, 3);
      animatedTokens.value = fmt.fmtToken(fromTokens + (toTokens - fromTokens) * e);
      animatedCalls.value = fmt.formatNumber(Math.round(fromCalls + (toCalls - fromCalls) * e));
      if (p < 1) countUpRaf = requestAnimationFrame(tick);
      else countUpRaf = 0;
    };
    countUpRaf = requestAnimationFrame(tick);
  }

  /** 卸载时必须停掉 rAF，否则页面已销毁还在 set ref */
  function stopCountUp() {
    if (countUpRaf) cancelAnimationFrame(countUpRaf);
    countUpRaf = 0;
  }

  const statCards = computed<StatCard[]>(() => [
    {
      key: "token", label: "总 Token", value: animatedTokens.value, unit: "tokens", tone: "primary",
      sub: ["输入 " + fmt.fmtToken(stats.totalPromptTokens), "输出 " + fmt.fmtToken(stats.totalCompletionTokens)],
    },
    {
      key: "requests", label: "总请求数", value: animatedCalls.value, unit: "", tone: "info",
      sub: ["缓存 " + fmt.fmtToken(stats.totalCachedTokens) + " tokens"],
    },
    {
      key: "cost", label: "总消费", value: fmt.currencySymbol.value + fmt.money(stats.totalCost), unit: "", tone: "success",
      sub: ["标准价 " + fmt.currencySymbol.value + fmt.money(stats.standardCost)],
    },
    {
      key: "latency", label: "平均耗时", value: fmt.money(stats.avgLatency), unit: "ms", tone: "warning",
      sub: ["首字 " + fmt.money(stats.avgFirstTokenLatency) + "ms"],
    },
  ]);

  return { stats, statCards, runCountUp, stopCountUp };
}
