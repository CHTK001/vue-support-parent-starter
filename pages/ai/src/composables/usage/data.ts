/**
 * 用量看板 · 数据加载
 *
 * <p>一次 refresh 并发拉四份数据：统计快照、分组明细、每日趋势、每日模型趋势。
 * 四者同属一个时间窗，串行拉会让首屏多等三个往返。</p>
 */

import { ref, onMounted } from "vue";
import { message } from "@repo/core";
import { usageApi } from "@/services/javaApi";
import type { ModelTrendRow, TimeParams, TrendRow } from "./types";
import type { UsageStats } from "./stats";

/** 服务商 id → 中文名。后端 GET /v2/usage/providers 列表回填，未命中兜底原样显示 */
const FALLBACK_PROVIDERS: Record<string, string> = {
  "1791352877398": "gavinchen",
};

export function useUsageData(deps: {
  timeParams: () => TimeParams;
  stats: UsageStats;
  runCountUp: () => void;
}) {
  // ---------- 数据 ----------
  const summaryRows = ref<any[]>([]);
  const trendData = ref<TrendRow[]>([]);
  const modelTrendRows = ref<ModelTrendRow[]>([]);
  const providerNameMap = ref<Record<string, string>>({});
  let providerNameLoaded = false;

  /** 是否正在拉数（驱动顶栏底边的 2px 流光条） */
  const refreshing = ref(false);

  function providerDisplay(p: string | null | undefined): string {
    if (!p) return "-";
    return providerNameMap.value[p] || FALLBACK_PROVIDERS[p] || p;
  }

  /** 服务商名称映射：一次性加载，失败静默（表格里显示原始 id 即可） */
  function loadProviderNames() {
    if (providerNameLoaded) return;
    providerNameLoaded = true;
    usageApi.usageProviders().then((res: any) => {
      const list: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      for (const p of list) {
        const id = p?.id ?? p?.provider_id;
        const name = p?.name;
        if (id && name) providerNameMap.value[String(id)] = String(name);
      }
    }).catch(() => { /* 兜底显示原始 id，不弹错 */ });
  }

  /** 每日趋势行按天归并（后端可能给到小时粒度，这里按日期聚合） */
  function normalizeTrend(dailyRows: any[]): TrendRow[] {
    const map = new Map<string, TrendRow>();
    for (const r of dailyRows) {
      const raw = String(r.date || "");
      const d = raw.length > 10 && raw.includes(":") ? raw.slice(0, 13) : raw.slice(0, 10);
      if (!d) continue;
      if (!map.has(d)) map.set(d, { date: d, input: 0, output: 0, cached: 0, total: 0 });
      const a = map.get(d)!;
      a.input += Number(r.promptTokens) || 0;
      a.output += Number(r.completionTokens) || 0;
      // cachedTokens 后端 /usage/trend 早就返回了，只是之前没接进图里
      a.cached += Number(r.cachedTokens) || 0;
      a.total += Number(r.totalTokens) || 0;
    }
    return [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async function loadData() {
    refreshing.value = true;
    try {
      // 服务商名称映射与用量快照并行：映射失败不阻断表格。
      loadProviderNames();
      const [statRes, sumRes, trendRes, modelTrendRes]: any[] = await Promise.all([
        usageApi.statistics(deps.timeParams()),
        usageApi.list(deps.timeParams()),
        usageApi.trend(deps.timeParams()),
        usageApi.modelTrend(deps.timeParams()),
      ]);
      Object.assign(deps.stats, statRes.data || {});
      // 数字滚动：数据落定后再动画，否则会滚到一半被下一次刷新打断
      deps.runCountUp();
      summaryRows.value = sumRes.data || [];
      modelTrendRows.value = (modelTrendRes?.data || []).map((r: any) => ({
        date: String(r?.date || "").slice(0, 10),
        model: r?.model,
        provider: r?.provider,
        totalTokens: Number(r?.totalTokens) || 0,
        totalCost: Number(r?.totalCost) || 0,
        // null 保持 null（而不是 0）：没实测样本时延迟图应断点，不能画成 0ms
        avgFirstTokenLatency: r?.avgFirstTokenLatency == null ? null : Number(r.avgFirstTokenLatency),
        avgTotalLatency: r?.avgTotalLatency == null ? null : Number(r.avgTotalLatency),
      }));
      trendData.value = normalizeTrend(trendRes.data || []);
    } catch (e: any) {
      message.error("加载用量数据失败: " + (e?.message || e));
    } finally {
      refreshing.value = false;
    }
  }

  return {
    summaryRows,
    trendData,
    modelTrendRows,
    refreshing,
    providerDisplay,
    loadData,
  };
}

/** 主题观察：图表里需要「卡片底色」做扇区/柱子间隙，主题切换时要跟着更新 */
export function useSurfaceBg() {
  const surfaceBg = ref("#ffffff");

  function readSurfaceBg() {
    const host = document.querySelector(".usage-page") || document.documentElement;
    const v = getComputedStyle(host).getPropertyValue("--el-bg-color").trim();
    surfaceBg.value = v || "#ffffff";
  }

  let observer: MutationObserver | null = null;

  onMounted(() => {
    readSurfaceBg();
    observer = new MutationObserver(readSurfaceBg);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
  });

  function dispose() {
    observer?.disconnect();
    observer = null;
  }

  return { surfaceBg, dispose };
}
