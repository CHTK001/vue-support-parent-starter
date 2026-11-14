/**
 * 用量管理 · 业务逻辑组合式函数
 *
 * <p>「用量管理 UI 重构」探索期的产物：把 {@code UsagePage.vue} 里 <script setup>
 * 的全部业务逻辑（数据加载 / SSE 实时 / 图表 option / 明细分页 / 格式化 / 单位设置）
 * 抽成这里一份，三个设计变体文件各自 <script setup> 里只 import 组件 + 调用本函数，
 * 模板绑定由本函数 {@link useUsageBoard} 的返回值提供。业务功能因此只有一份真源，
 * 变体间切换/落地时不会把逻辑改分叉。</p>
 *
 * <p>约定：本函数在 setup 上下文调用（SSE 连接、主题观察、count-up 动画等都依赖
 * {@code onMounted}/{@code onBeforeUnmount}/{@code watch} 的宿主钩子）。</p>
 */

import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { message } from "@repo/core";
import { http } from "@repo/utils";
import type { EChartsOption } from "echarts";
import type { ReTableColumn } from "@repo/ui/re-table";
import { usageApi } from "@/services/javaApi";

type ChartType = "token" | "cost";
interface DistRow {
  name: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

/**
 * 看板条目（模型/分组的分布一条）。
 *
 * <p>这几个类型原本写在 {@link useUsageBoard} 函数体内，但函数是导出的、返回类型里
 * 又带着它们 —— 生成声明文件时就会报 TS4060「返回类型用了私有名字」。
 * 提到模块作用域并导出即可，语义完全不变。</p>
 */
export interface BoardItem {
  name: string;
  value: number;
  pct: number;
  color: string;
  row: DistRow;
}

/** 看板数据：明细条目 + 环形图切片 + 合计 */
export interface BoardData {
  /** 全部条目（明细表用，按当前指标降序） */
  items: BoardItem[];
  /** 环形图/图例共用的切片（Top N + 「其他」聚合）。 */
  slices: BoardItem[];
  total: number;
}

/** 当前悬停的环形图扇区（null = 没悬停） */
export interface HoverSlice { name: string; pct: number }

/** 刻度尺上的一天：日期 + 当日 Token / 请求数（刻度高度即当日 Token 强度） */
export interface SpineDay {
  date: string;
  tokens: number;
  calls: number;
}

/** treemap 色块的点击详情：自然块（模型级）或「其他 N 项」汇总块（见 {@link TreeMapDetail.members}） */
export interface TreeMapDetail {
  /** 模型名或「其他 N 项」 */
  name: string;
  /** 当前口径占比 */
  pct: number;
  /** 当前口径用量（Token 或费用） */
  value: number;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** 当前口径费用 */
  cost: number;
  /** 仅「其他 N 项」汇总块：目录幕过完整模型列表 */
  members?: Array<{ name: string; pct: number; value: number; cost: number }>;
}

/**
 * treemap 里的一个色块：自然块是模型级（拿着自己的行），汇总块（「其他 N 项」）
 * 则带着目录幕过的那一批模型成员。
 *
 * <p>注意这里不能直接复用 {@link BoardItem}：treemap 的汇总块是它自己包的那
 * 一批模型，不是 `board.modelBoard.items` 逻辑上的一行。</p>
 */
export interface TreeMapBlockItem {
  /** 模型名或「其他 N 项」 */
  name: string;
  /** 当前口径用量（Token 或费用） */
  value: number;
  /** 当前口径占比 */
  pct: number;
  /** 看板调色板色（汇总块用中性灰） */
  color: string;
  /** 汇总块的内部列表：点击时展开的名单 */
  members?: Array<NonNullable<TreeMapDetail["members"]>[number]>;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** 当前口径费用 */
  cost: number;
}

export function useUsageBoard() {
  const stats = reactive({
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
   * 数字滚动递增进场（§6 交互）。
   *
   * <p>KPI 数字直接从 0 跳到终值会显得"页面卡了一下才出数"，也看不出数据是新来的；
   * 用 rAF 在 ~520ms 内插值到目标值，既提示"这是刚更新的"，又不至于让人等动画。</p>
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

  function runCountUp() {
    if (countUpRaf) cancelAnimationFrame(countUpRaf);
    const toTokens = Number(stats.totalTokens) || 0;
    const toCalls = Number(stats.totalCalls) || 0;
    if (prefersReducedMotion() || (toTokens === 0 && toCalls === 0)) {
      animatedTokens.value = fmtToken(toTokens);
      animatedCalls.value = formatNumber(toCalls);
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
      animatedTokens.value = fmtToken(fromTokens + (toTokens - fromTokens) * e);
      animatedCalls.value = formatNumber(Math.round(fromCalls + (toCalls - fromCalls) * e));
      if (p < 1) countUpRaf = requestAnimationFrame(tick);
      else countUpRaf = 0;
    };
    countUpRaf = requestAnimationFrame(tick);
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

  // ---------- 单位设置（来自用量配置，保存后联动）----------
  type CurrencyCode = "CNY" | "USD" | "EUR";
  const currency = ref<CurrencyCode>("CNY");
  const currencySymbol = ref("¥");
  const autoConvert = ref(true);
  const rateUsd = ref(7.1);
  const rateEur = ref(7.8);
  const tokenScale = ref<"auto" | "raw">("auto");
  const fmtToken = (v: number | null | undefined): string =>
    tokenScale.value === "raw" ? formatNumber(v) : formatCompact(v);

  function convertCost(v: number | null | undefined): number {
    const n = Number(v) || 0;
    if (!autoConvert.value || currency.value === "CNY") return n;
    if (currency.value === "USD") return n / rateUsd.value;
    if (currency.value === "EUR") return n / rateEur.value;
    return n;
  }

  function money(v: number | null | undefined): string {
    return convertCost(v).toFixed(2);
  }

  function formatNumber(v: number | null | undefined): string {
    const n = Number(v) || 0;
    return n.toLocaleString("en-US");
  }

  function formatCompact(v: number | null | undefined): string {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return String(n);
  }

  async function loadUnits() {
    try {
      const res: any = await usageApi.config();
      const list = res?.data || res;
      if (Array.isArray(list)) {
        const symMap = { CNY: "¥", USD: "$", EUR: "€" } as Record<string, string>;
        for (const row of list) {
          if (row.field === "usage_currency") {
            const code = (["CNY", "USD", "EUR"].includes(row.value) ? row.value : "CNY") as CurrencyCode;
            currency.value = code;
            currencySymbol.value = symMap[code];
          }
          if (row.field === "usage_currency_auto_convert") {
            autoConvert.value = String(row.value) === "true";
          }
          if (row.field === "usage_rate_usd") {
            const r = Number(row.value);
            if (Number.isFinite(r) && r > 0) rateUsd.value = r;
          }
          if (row.field === "usage_rate_eur") {
            const r = Number(row.value);
            if (Number.isFinite(r) && r > 0) rateEur.value = r;
          }
          if (row.field === "usage_token_scale") {
            tokenScale.value = row.value === "raw" ? "raw" : "auto";
          }
        }
      }
    } catch {
      /* 读取失败沿用默认单位 */
    }
  }

  /**
   * 指标卡数据。
   *
   * <p><b>顺序即权重</b>：第 0 项是主卡（宽度 2×、28px 等宽数字、带迷你环形图），
   * 其余三项为辅卡。总 Token 放主位 —— 它是这个页面唯一"必须一眼看到"的量，
   * 请求数/费用/耗时都是围绕它的解释性指标。</p>
   */
  const statCards = computed(() => [
    {
      key: "token", label: "总 Token", value: animatedTokens.value, unit: "tokens", cls: "", tone: "primary",
      sub: ["输入 " + fmtToken(stats.totalPromptTokens), "输出 " + fmtToken(stats.totalCompletionTokens)],
    },
    {
      key: "requests", label: "总请求数", value: animatedCalls.value, unit: "", cls: "", tone: "info",
      sub: ["缓存 " + fmtToken(stats.totalCachedTokens) + " tokens"],
    },
    {
      key: "cost", label: "总消费", value: currencySymbol.value + money(stats.totalCost), unit: "", cls: "cost", tone: "success",
      sub: ["标准价 " + currencySymbol.value + money(stats.standardCost)],
    },
    {
      key: "latency", label: "平均耗时", value: money(stats.avgLatency), unit: "ms", cls: "", tone: "warning",
      sub: ["首字 " + money(stats.avgFirstTokenLatency) + "ms"],
    },
  ]);

  // 时间筛选：默认「今天」，首屏取数必须带上时间边界——
  // ReTable 的首批取数跑在 setup 期、parent 的 onMounted 之前，
  // 此时 timeParams 还是 {}，会先发出一笔未筛选查询（120 万条全量 COUNT），
  // 晚来的旧响应又正好会覆盖掉 filter 后的 total。
  const activeFilter = ref("today");
  const customRange = ref<[string, string] | null>(null);

  /** 「今天」的时间边界，给 ReTable 的首批取数用（避免首笔发未筛选查询） */
  function defaultTimeParams(): { startTime: string; endTime: string } {
    const now = new Date();
    const d = fmtDate(now);
    return { startTime: `${d} 00:00:00`, endTime: `${d} 23:59:59` };
  }
  const timeParams = ref<{ startTime?: string; endTime?: string }>(defaultTimeParams());

  const quickFilters = [
    { key: "today", label: "今天" },
    { key: "7d", label: "近7天" },
    { key: "30d", label: "近30天" },
    { key: "all", label: "全部" },
  ];

  // ---------- 刻度尺与单日下钻（04 侦察时间轴）----------
  /**
   * 刻度尺的骨架天数：近 30 天（含今天）。
   *
   * <p>刻度尺是页面的主干结构 —— 它回答「这一个月哪几天在烧」，点某一天
   * 整页下钻到该日。它<b>不随筛选变化</b>（否则一筛选刻度尺就瘦成一根
   * 三天的柱子，失去时间轴的意义），所以取数走独立窗口。</p>
   */
  const SPINE_DAYS = 30;
  const spineDays = ref<SpineDay[]>([]);
  /** 下钻到的日期（null = 没下钻）。点刻度尺进入，再点同一天或「返回区间」退出 */
  const drillDay = ref<string | null>(null);
  /** 下钻前的筛选状态，退出时原样还原（下钻是临时视角，不该吃掉用户的筛选） */
  let drillRestore: {
    filter: string;
    params: { startTime?: string; endTime?: string };
    range: [string, string] | null;
  } | null = null;

  // 当前时间范围的人类可读描述（头部副标题）
  const rangeLabel = computed(() => {
    if (drillDay.value) return `单日 · ${drillDay.value}`;
    const map: Record<string, string> = { today: "今天", "7d": "近 7 天", "30d": "近 30 天", all: "全部时间", custom: "自定义区间" };
    const base = map[activeFilter.value] || "自定义区间";
    const { startTime, endTime } = timeParams.value;
    if (activeFilter.value === "today" && startTime) return `${base} · ${startTime.slice(0, 10)}`;
    if (startTime && endTime) return `${base} · ${startTime.slice(0, 10)} 至 ${endTime.slice(0, 10)}`;
    return base;
  });

  function fmtDate(d: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function setQuickFilter(key: string) {
    // 用户主动切范围：下钻视角作废，且不还原到旧范围（否则一点「今天」又被弹回下钻前）
    drillDay.value = null;
    drillRestore = null;
    activeFilter.value = key;
    customRange.value = null;
    const now = new Date();
    if (key === "all") {
      timeParams.value = {};
    } else if (key === "today") {
      const d = fmtDate(now);
      timeParams.value = { startTime: `${d} 00:00:00`, endTime: `${d} 23:59:59` };
    } else {
      const days = key === "7d" ? 7 : 30;
      const start = new Date(now);
      start.setDate(start.getDate() - (days - 1));
      timeParams.value = {
        startTime: `${fmtDate(start)} 00:00:00`,
        endTime: `${fmtDate(now)} 23:59:59`,
      };
    }
    refreshAll();
  }

  function onCustomRange(val: [string, string] | null) {
    if (!val || !val[0] || !val[1]) {
      return;
    }
    activeFilter.value = "custom";
    drillDay.value = null;
    drillRestore = null;
    timeParams.value = {
      startTime: `${val[0]} 00:00:00`,
      endTime: `${val[1]} 23:59:59`,
    };
    refreshAll();
  }

  function refreshAll() {
    loadData();
    // 明细表不用在这里再拉一次：loader 模式下 ReTable 会 watch params 变化
    // （时间范围 / 模型过滤都在 detailQueryParams 里）并自动回到第 1 页重新取数。
    // 此处再调 reloadDetails 会打两次接口。
  }

  /**
   * <p>走 `/usage/export` 拿 blob，再触发一次 `<a download>`。为什么不用
   * `window.open(url)`：该接口要带鉴权头，直接开新窗口拿不到 token，只会下回一个
   * 401 的 JSON。这里复用已装配的请求管线（含鉴权拦截器），拿到二进制后本地存盘。</p>
   *
   * <p>文件名带上时间范围：连续导几个区间时不会互相覆盖，也省得回头猜是哪个区间。</p>
   */
  const exporting = ref(false);
  async function handleExport() {
    if (exporting.value) return;
    exporting.value = true;
    try {
      const res: any = await usageApi.export({ ...timeParams.value });
      // createClient(unwrap:false) 返回的是 axios 的 body；responseType=blob 时即 Blob。
      // 后端若因鉴权/参数返回 JSON 错误，body 也会是 Blob（type=application/json），
      // 这里读出来当错误处理，避免"下载了一个坏文件却毫无提示"。
      const blob: Blob = res instanceof Blob ? res : new Blob([res]);
      if (blob.type.includes("json")) {
        const text = await blob.text();
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed?.msg || parsed?.message || text;
        } catch { /* 非 JSON 就原样展示 */ }
        throw new Error(msg || "导出失败");
      }
      const suffix = (() => {
        const { startTime, endTime } = timeParams.value;
        if (startTime && endTime) return `${startTime.slice(0, 10)}_${endTime.slice(0, 10)}`;
        return "all";
      })();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usage_${suffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 立刻 revoke 会让部分浏览器来不及读流，延后一拍更稳
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message.success("导出已开始下载");
    } catch (e: any) {
      message.error("导出失败: " + (e?.message || e));
    } finally {
      exporting.value = false;
    }
  }

  // ---------- 数据加载 ----------
  const summaryRows = ref<any[]>([]);
  const trendData = ref<Array<{ date: string; input: number; output: number; cached: number; total: number; calls: number }>>([]);

  /** 服务商 id → 中文名。后端 GET /v2/providers 列表回填，未命中兜底原样显示 */
  const providerNameMap = ref<Record<string, string>>({});
  let providerNameLoaded = false;
  function providerDisplay(p: string | null | undefined): string {
    if (!p) return "-";
    // 后端 GET /v2/usage/providers 未上线时兜底：1791352877398=gavinchen（2026-10-14 库实测）。
    const FALLBACK_PROVIDERS: Record<string, string> = {
      "1791352877398": "gavinchen",
    };
    return providerNameMap.value[p] || FALLBACK_PROVIDERS[p] || p;
  }

  /** 各路由拉数状态（独立开关）：任意路由有请求在飞，`refreshing` 都按路由聚合 */
  const routeLoading = reactive<Record<string, boolean>>({
    providers: false,
    statistics: false,
    list: false,
    trend: false,
    modelTrend: false,
    spine: false,
  });
  /** 各路由最近一次的报错，null 表示该路由正常 */
  const routeErrors = reactive<Record<string, string | null>>({
    providers: null,
    statistics: null,
    list: null,
    trend: null,
    modelTrend: null,
    spine: null,
  });
  /** 按路由压缩的“加载中”：驱动顶栏底边 2px 流光条，任一路在飞就亮灯 */
  const refreshing = computed(() => Object.values(routeLoading).some(Boolean));
  /** 快速切时间范围时，只保留最后一次 `loadData` 的响应（旧响应不接管状态） */
  let loadSeq = 0;

  /** 清除上一次的报错记录，避免旧报错一直亮红 */
  function clearRouteErrors() {
    routeErrors.providers = null;
    routeErrors.statistics = null;
    routeErrors.list = null;
    routeErrors.trend = null;
    routeErrors.modelTrend = null;
    routeErrors.spine = null;
  }

  const FAULT_LABELS: Record<string, string> = {
    providers: "服务商映射",
    statistics: "统计快照",
    list: "明细列表",
    trend: "每日趋势",
    modelTrend: "模型趋势",
    spine: "刻度尺",
  };

  /** 本次拉数失败的路由中文说明；没有则返回 null（一次汇总提醒，不做 N 连弹） */
  function aggregatedFaults(): string | null {
    const faults = Object.entries(routeErrors).filter(([, e]) => e);
    if (!faults.length) return null;
    return faults.map(([k, e]) => `${FAULT_LABELS[k] ?? k}：${String(e)}`).join("；");
  }

  /** 服务商参数映射：一次性的备案表，失败不影响表格（兜底显示原始 id） */
  async function loadProviders(seq: number) {
    if (providerNameLoaded) return;
    routeLoading.providers = true;
    try {
      const res: any = await usageApi.usageProviders();
      if (loadSeq !== seq) return;
      const list: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      for (const p of list) {
        const id = p?.id ?? p?.provider_id;
        const name = p?.name;
        if (id && name) providerNameMap.value[String(id)] = String(name);
      }
    } catch (e: any) {
      routeErrors.providers = e?.message || e;
    } finally {
      routeLoading.providers = false;
    }
  }

  /** 统计快照：写 `stats`，触发 KPI 数字滚动 */
  async function loadStatistics(seq: number) {
    routeLoading.statistics = true;
    try {
      const res: any = await usageApi.statistics(timeParams.value);
      if (loadSeq !== seq) return;
      Object.assign(stats, res.data || {});
      // 数字滚动：数据落定后再动画，否则会滚到一半被下一次刷新打断
      runCountUp();
    } catch (e: any) {
      routeErrors.statistics = e?.message || e;
    } finally {
      routeLoading.statistics = false;
    }
  }

  /** 分组明细：驱动分布表/环形图/看板 Top5（后端带时间参数） */
  async function loadList(seq: number) {
    routeLoading.list = true;
    try {
      const res: any = await usageApi.list(timeParams.value);
      if (loadSeq !== seq) return;
      summaryRows.value = res.data || [];
    } catch (e: any) {
      routeErrors.list = e?.message || e;
    } finally {
      routeLoading.list = false;
    }
  }

  /** 每日用量趋势：按日期归并小时粒度 */
  async function loadTrend(seq: number) {
    routeLoading.trend = true;
    try {
      const res: any = await usageApi.trend(timeParams.value);
      if (loadSeq !== seq) return;
      const dailyRows: any[] = res.data || [];
      const map = new Map<string, { date: string; input: number; output: number; cached: number; total: number; calls: number }>();
      for (const r of dailyRows) {
        const raw = String(r.date || ""); const d = raw.length > 10 && raw.includes(":") ? raw.slice(0, 13) : raw.slice(0, 10);
        if (!d) continue;
        if (!map.has(d)) map.set(d, { date: d, input: 0, output: 0, cached: 0, total: 0, calls: 0 });
        const a = map.get(d)!;
        a.input += Number(r.promptTokens) || 0;
        a.output += Number(r.completionTokens) || 0;
        // cachedTokens 后端 /usage/trend 早就返回了，只是之前没接进图里
        a.cached += Number(r.cachedTokens) || 0;
        a.total += Number(r.totalTokens) || 0;
        a.calls += Number(r.totalCalls) || 0;
      }
      trendData.value = [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    } catch (e: any) {
      routeErrors.trend = e?.message || e;
    } finally {
      routeLoading.trend = false;
    }
  }

  /** 每日模型趋势：驱动每日模型用量堆叠图、模型延迟图、平均 tok/s 线 */
  async function loadModelTrend(seq: number) {
    routeLoading.modelTrend = true;
    try {
      const res: any = await usageApi.modelTrend(timeParams.value);
      if (loadSeq !== seq) return;
      modelTrendRows.value = (res?.data || []).map((r: any) => ({
        date: String(r?.date || "").slice(0, 10),
        model: r?.model,
        provider: r?.provider,
        totalTokens: Number(r?.totalTokens) || 0,
        totalCost: Number(r?.totalCost) || 0,
        // null 保持 null（而不是 0）：没实测样本时延迟图应断点，不能画成 0ms
        avgFirstTokenLatency: r?.avgFirstTokenLatency == null ? null : Number(r.avgFirstTokenLatency),
        avgTotalLatency: r?.avgTotalLatency == null ? null : Number(r.avgTotalLatency),
        // 后端统计了 AVG(tokens_per_second)
        avgTokensPerSecond: r?.avgTokensPerSecond == null ? null : Number(r.avgTokensPerSecond),
      }));
    } catch (e: any) {
      routeErrors.modelTrend = e?.message || e;
    } finally {
      routeLoading.modelTrend = false;
    }
  }

  /**
   * 汇总拉数：五路请求独立加载，任一路失败不阻塞其他路。
   *
   * <p>过去一把 `await Promise.all([...])`：四份数据要么全部落盘、要么全部报错；
   * 一条链路卡死（比如后端模型趋势切分统计），整页的 KPI/表格/图表一起挂，还
   * 弹出一行 "加载用量数据失败"。改成逐路独立拉数后，能出的先出，出不了留
   * 空区块；所有路都走完后统一判一次错，不再一路报错全量补偿。</p>
   */
  async function loadData() {
    clearRouteErrors();
    // 版本号 +1：快速连点时，只保留最后一发的响应，避免旧响应覆盖新数据
    loadSeq++;
    const seq = loadSeq;
    await Promise.all([
      loadProviders(seq),
      loadStatistics(seq),
      loadList(seq),
      loadTrend(seq),
      loadModelTrend(seq),
      loadSpine(seq),
    ]);
    // 检查回退到了更晚的版本（本次拉数被覆盖）
    if (loadSeq !== seq) return;
    const faults = aggregatedFaults();
    if (faults) message.warning(`部分数据未加载：${faults}`);
  }

  // ---------- 模型/分组/应用分布 ----------
  function rollUp(rows: any[], keyOf: (r: any) => string | null): DistRow[] {
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

  const modelDist = computed<DistRow[]>(() =>
    rollUp(summaryRows.value, (r) => r.model || "未知"),
  );
  const groupDist = computed<DistRow[]>(() =>
    rollUp(summaryRows.value, (r) => r.group || "默认"),
  );

  // ==================== Top5 排行（模型 / 应用） ====================
  const rankMetric = ref<ChartType>("token");
  const RANK_TOP_N = 5;

  /**
   * 应用排行口径：按「使用模型的软件」roll up。
   *
   * 三方工具（opencode / claude-code / codex 等）同步进来的记录，groupName 就是软件名
   * （后端同步任务用解析器名当分组）；本控制台的 chat（对话）与 bot（机器人）是同一个
   * 软件的两个功能，合并成「本控制台」。其余分组名原样保留。
   */
  const APP_GROUP_ALIAS: Record<string, string> = {
    chat: "self-console",
    bot: "self-console",
  };
  /** 应用标识：分组为空说明数据异常，显式兜底而不是从榜上悄悄消失 */
  function appKeyOf(r: any): string {
    const g = r.group;
    if (!g) return "unknown-app";
    return APP_GROUP_ALIAS[g] || g;
  }
  const appDist = computed<DistRow[]>(() =>
    rollUp(summaryRows.value, appKeyOf),
  );

  /**
   * 取前 N 条并按当前指标排序。
   *
   * <p>{@link rollUp} 恒按 token 降序；切到「按费用」时榜序也必须跟着变，
   * 否则会出现「第一名 Token 最多但费用最低」这种自相矛盾的榜单。</p>
   */
  function topBy(rows: DistRow[]): DistRow[] {
    return [...rows]
      .sort((a, b) => (rankMetric.value === "token" ? b.totalTokens - a.totalTokens : b.cost - a.cost))
      .slice(0, RANK_TOP_N);
  }

  const modelRankTop5 = computed(() => topBy(modelDist.value));
  const appRankTop5 = computed(() => topBy(appDist.value));

  function rankValue(r: DistRow): string {
    return rankMetric.value === "token" ? fmtToken(r.totalTokens) : `${currencySymbol.value}${money(r.cost)}`;
  }

  /** 相对榜首的条长：以第一名为满格，视觉上直接读出差距 */
  function rankBarWidth(r: DistRow, list: DistRow[]): string {
    const top = list[0];
    if (!top) return "0%";
    const v = rankMetric.value === "token" ? r.totalTokens : r.cost;
    const t = rankMetric.value === "token" ? top.totalTokens : top.cost;
    if (!t || t <= 0) return "0%";
    return `${Math.max(2, Math.round((v / t) * 100))}%`;
  }

  /** 占**全量**的百分比，而不是占榜首的 —— 占比要回答「这一项吃掉多少」 */
  function rankPct(r: DistRow, list: DistRow[]): string {
    const total = list.reduce((s, x) => s + (rankMetric.value === "token" ? x.totalTokens : x.cost), 0);
    if (!total || total <= 0) return "—";
    const v = rankMetric.value === "token" ? r.totalTokens : r.cost;
    return `${((v / total) * 100).toFixed(1)}%`;
  }

  /** 应用标识多为英文小写，补中文名；未收录的软件名原样显示，别藏起来 */
  const APP_LABELS: Record<string, string> = {
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
  function appLabel(name: string): string {
    return APP_LABELS[name] || name;
  }

  // ==================== 实时用量（SSE） ====================
  /** 实时开关：默认开启。关掉必须由用户主动操作，否则用户可能不知道数字在实时跳 */
  const liveEnabled = ref(true);
  /** connecting | live | paused | error */
  const liveState = ref<"connecting" | "live" | "paused" | "error">("connecting");
  const liveTodayTokens = ref(0);
  const liveRangeTokens = ref(0);
  /** 每分钟 token 速率（滑窗计算）；0 表示当前没有活动 */
  const liveRate = ref(0);

  let liveEs: { close: () => void } | null = null;
  /** 上一次收到快照的时刻与区间 token，用于算速率 */
  let lastSample = { at: 0, tokens: 0 };
  /** 速率滑窗样本：保留最近 60 秒的增量 */
  const rateWindow: Array<{ at: number; delta: number }> = [];

  const liveLabel = computed(() => {
    switch (liveState.value) {
      case "connecting": return "实时连接中…";
      case "live": return "实时";
      case "paused": return "已暂停";
      default: return "连接失败，已退回定时刷新";
    }
  });

  function closeLiveStream() {
    if (liveEs) {
      liveEs.close();
      liveEs = null;
    }
  }

  /**
   * 速率按 60 秒滑窗算，而不是「上一帧差值」。
   *
   * <p>后端是**按秒合并**推送的，单帧差值在两次推送间隔抖动时会剧烈跳动
   * （这一秒 8k、下一秒 0、下一秒 30k），读数根本没法看。滑窗给出的是
   * 「最近一分钟大致烧了多少」，这才是人真正想知道的量。</p>
   */
  function pushRateSample(now: number, total: number) {
    if (lastSample.at > 0 && total >= lastSample.tokens) {
      rateWindow.push({ at: now, delta: total - lastSample.tokens });
    }
    lastSample = { at: now, tokens: total };
    const cutoff = now - 60_000;
    while (rateWindow.length && rateWindow[0].at < cutoff) rateWindow.shift();
    const sum = rateWindow.reduce((s, x) => s + x.delta, 0);
    liveRate.value = sum;
  }

  function handleLiveFrame(d: any) {
    if (!d || typeof d !== "object") return;
    const today = Number(d.todayTokens);
    if (Number.isFinite(today)) liveTodayTokens.value = today;
    const range = Number(d.totalTokens);
    if (Number.isFinite(range)) {
      pushRateSample(Date.now(), range);
      liveRangeTokens.value = range;
    }
    liveState.value = "live";
  }

  function openLiveStream() {
    closeLiveStream();
    liveState.value = "connecting";
    /**
     * 用共享的 {@code http().sse()} 而不是裸 {@code EventSource}。
     *
     * <p>裸 EventSource **不能带自定义 header**，而本项目所有 /v2/** 都靠
     * {@code x-oauth-token} 鉴权 —— 建连会直接 401，控制台只留一条不显眼的报错，
     * 页面表现是「实时灯一直闪、数字永远不动」。共享客户端走 fetch-based SSE，
     * 鉴权头与自动重连都已经在里面。</p>
     *
     * <p>必须把当前筛选的时间窗带上：否则实时条的「区间 Token」永远是**全时段**总量，
     * 选「今天」时它却显示几个月的数 —— 与同页 KPI 卡片自相矛盾。空对象即「全部时间」。</p>
     */
    liveEs = http()
      // 参数走链式的 .query()，sse() 会把 config.params 拼进最终 URL。
      .get("/v2/usage/live/stream")
      .query({ ...timeParams.value })
      .sse<unknown>({
        onOpen: () => {
          liveState.value = "live";
        },
        onMessage: (ev) => {
          // 后端事件名：首帧 snapshot、后续 update。两者载荷同构，统一处理。
          if (ev.event !== "snapshot" && ev.event !== "update") return;
          handleLiveFrame(ev.data);
        },
        onError: () => {
          liveState.value = "error";
        },
        onClose: () => {
          // 只有主动 close 才是 paused；被动断开走 onError，这里不动状态
        },
        // 后端重启/网关抖动后重连；给足次数，避免短暂抖动就永久断流
        maxReconnectAttempts: 10,
        reconnectInterval: 3000,
      });
  }

  // 暂停/恢复的 watcher：只有开关真的变了才重连，避免每次渲染都建一条新连接
  watch(liveEnabled, (on) => {
    if (on) {
      rateWindow.length = 0;
      lastSample = { at: 0, tokens: 0 };
      openLiveStream();
    } else {
      closeLiveStream();
      liveRate.value = 0;
      liveState.value = "paused";
    }
  });

  /**
   * 时间窗变化时重订阅。
   *
   * <p>SSE 的时间窗是<b>建连时固化</b>的：不重连的话，切「今天」之后实时条还在推
   * 全时段的口径，而且速率滑窗会把两个时间窗的增量混在一起算出一个毫无意义的数字。</p>
   */
  watch(timeParams, () => {
    if (!liveEnabled.value) return;
    rateWindow.length = 0;
    lastSample = { at: 0, tokens: 0 };
    openLiveStream();
  }, { deep: true });

  // ==================== 刻度尺（近 30 天）+ 单日下钻 ====================

  /** 刻度尺的取数窗口：近 {@link SPINE_DAYS} 天整天，固定不动（与时间筛选解耦） */
  function spineWindow(): { startTime: string; endTime: string } {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (SPINE_DAYS - 1));
    return { startTime: `${fmtDate(start)} 00:00:00`, endTime: `${fmtDate(now)} 23:59:59` };
  }

  /**
   * 拉刻度尺数据。
   *
   * <p>口径：`/usage/trend` 近 30 天按天聚合（后端走日汇总表，一次几十行）。
   * 骨架必须补齐 30 根 —— 没用量的一天也要留一根空刻度，否则时间轴会「跳日」，
   * 看起来像那几天不存在，而不是那几天没用。</p>
   */
  async function loadSpine(seq: number) {
    routeLoading.spine = true;
    try {
      const res: any = await usageApi.trend(spineWindow());
      if (loadSeq !== seq) return;
      const rows: any[] = res?.data || [];
      const map = new Map<string, SpineDay>();
      for (const r of rows) {
        const d = String(r?.date || "").slice(0, 10);
        if (!d) continue;
        const cur = map.get(d) || { date: d, tokens: 0, calls: 0 };
        cur.tokens += Number(r?.totalTokens) || 0;
        cur.calls += Number(r?.totalCalls) || 0;
        map.set(d, cur);
      }
      const out: SpineDay[] = [];
      for (let i = SPINE_DAYS - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = fmtDate(d);
        out.push(map.get(key) || { date: key, tokens: 0, calls: 0 });
      }
      spineDays.value = out;
    } catch (e: any) {
      routeErrors.spine = e?.message || e;
    } finally {
      routeLoading.spine = false;
    }
  }

  /**
   * 刻度尺渲染口径。
   *
   * <p>今日那根用实时流的今日增量兜底：日汇总表要等定时任务才落库，当日刻度
   * 否则永远是 0，一整天看着都像「今天没人用」。</p>
   */
  const spineToday = computed(() => fmtDate(new Date()));
  const spineView = computed<SpineDay[]>(() => {
    const today = spineToday.value;
    return spineDays.value.map((d) =>
      d.date === today
        ? { ...d, tokens: Math.max(d.tokens, Number(liveTodayTokens.value) || 0) }
        : d,
    );
  });
  /** 刻度高度的分母：区间内单日最大 Token（含今日实时值），0 时兜底 1 防除零 */
  const spineMax = computed(() => Math.max(1, ...spineView.value.map((d) => d.tokens)));
  /** 区间内合计（刻度尺右侧的「30 天总览」读数） */
  const spineTotal = computed(() => spineView.value.reduce((s, d) => s + d.tokens, 0));

  /**
   * 该天是否落在当前筛选区间内。
   *
   * <p>「全部时间」不在地面上标区间（刻度尺本身只有 30 天，标了反而误导），
   * 所以全部时间视为整条亮起。</p>
   */
  function isSpineInRange(date: string): boolean {
    const { startTime, endTime } = timeParams.value;
    const from = startTime ? startTime.slice(0, 10) : "";
    const to = endTime ? endTime.slice(0, 10) : "";
    if (!from || !to) return true;
    return date >= from && date <= to;
  }

  /**
   * 点刻度尺某天：整页切到那一天（00:00:00–23:59:59）。
   *
   * <p>走 `custom` 而不是新造一个筛选键 —— 时间胶囊、导出文件名、明细查询参数
   * 全都读 `timeParams`，单日就是最窄的自定义区间，没必要为它开一条特殊分支。
   * 退出时还原下钻前的筛选，别让临时视角吃掉用户原本的区间。</p>
   */
  function selectSpineDay(date: string) {
    if (!date) return;
    if (drillDay.value === date) {
      clearDrill();
      return;
    }
    if (!drillRestore) {
      drillRestore = {
        filter: activeFilter.value,
        params: { ...timeParams.value },
        range: customRange.value,
      };
    }
    drillDay.value = date;
    activeFilter.value = "custom";
    customRange.value = [date, date];
    timeParams.value = { startTime: `${date} 00:00:00`, endTime: `${date} 23:59:59` };
    refreshAll();
  }

  /** 退出下钻：回到下钻前的区间与筛选键 */
  function clearDrill() {
    if (!drillDay.value) return;
    drillDay.value = null;
    const back = drillRestore;
    drillRestore = null;
    if (back) {
      activeFilter.value = back.filter;
      timeParams.value = back.params;
      customRange.value = back.range;
    }
    refreshAll();
  }

  // 表面色（用于饼图切片间隔，随主题 / 深色变化）
  const surfaceBg = ref("#ffffff");
  function readSurfaceBg() {
    const host = document.querySelector(".usage-page") || document.documentElement;
    const v = getComputedStyle(host).getPropertyValue("--el-bg-color").trim();
    surfaceBg.value = v || "#ffffff";
  }
  let themeObserver: MutationObserver | null = null;
  onMounted(() => {
    readSurfaceBg();
    themeObserver = new MutationObserver(readSurfaceBg);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    // 实时流与主题无关，但要等首屏数据先落定再连，
    // 否则订阅建立瞬间的快照会覆盖掉刚拉回来的完整数据
    void nextTick(() => {
      if (liveEnabled.value) openLiveStream();
    });
    loadUnits();
    setQuickFilter("today");
  });
  onBeforeUnmount(() => {
    themeObserver?.disconnect();
    // 必须显式断开：EventSource 会一直挂在 window 上，
    // 离开页面不关的话连接数只增不减，服务端的订阅列表也随之膨胀
    closeLiveStream();
  });

  /* ==================== §4 双栏看板：环形总览 + 图例 ==================== */

  /**
   * 看板调色板（§5 视觉体系指定色值）。
   *
   * <p>为什么不用 `--el-color-primary` 这类 CSS 变量：ECharts 是 canvas 渲染，
   * `var()` 在 canvas 语境里不生效，必须给真实色值。这里集中一处，
   * 图例色点、明细表进度条、环形扇区取同一个函数 —— 三处颜色永远一致。</p>
   */
  const BOARD_PALETTE = [
    "#165DFF", // 主色蓝
    "#00B42A", // 成功绿
    "#FF7D00", // 警示橙
    "#722ED1", // 辅助紫
    "#F53F3F", // 危险红
    "#14C9C9", // 青
    "#F7BA1E", // 黄
    "#3491FA", // 浅蓝
    "#9FDB1D", // 黄绿
    "#D91AD9", // 品红
  ];
  /** 第 n 项的稳定配色：按**排序后的名次**取色，不按数组下标，切指标时不跳色 */
  function boardColorByIndex(i: number): string {
    return BOARD_PALETTE[i % BOARD_PALETTE.length];
  }

  const boardTabs = [
    { key: "token" as ChartType, label: "按 Token" },
    { key: "cost" as ChartType, label: "按费用" },
  ];

  /** 环形图最多画几个扇区（其余聚合成「其他」） */
  const RING_TOP_N = 8;
  /** 「其他」扇区的固定色（中性灰，不占调色板名次） */
  const OTHER_SLICE_COLOR = "#C9CDD4";
  /**
   * 模型构成 treemap 最多显示的色块数（模型级自然块）。
   *
   * <p>环形图（与自然图各画各的）只有 8 个扇区，面积图放 10 个：块多了，名
   * 字挤在一起看不清，只有最大的两块好辨认；超出的模型聚合成「其他 N 项」那块
   * 灰块，点它展开看它具体由哪些模型构成（§6.1）。</p>
   */
  const TREEMAP_TOP_N = 10;

  /**
   * 把分布数据整理成看板要的形状：按当前指标降序、算占比、分配稳定颜色。
   */
  function buildBoard(rows: DistRow[], type: ChartType): BoardData {
    const metric = (r: DistRow) => (type === "token" ? r.totalTokens : r.cost);
    const sorted = [...rows].sort((a, b) => metric(b) - metric(a));
    const total = sorted.reduce((s, r) => s + Math.max(0, metric(r)), 0);
    const items = sorted.map((r, i) => ({
      name: r.name,
      value: metric(r),
      pct: total > 0 ? (Math.max(0, metric(r)) / total) * 100 : 0,
      color: boardColorByIndex(i),
      row: r,
    }));
    const slices = items.slice(0, RING_TOP_N);
    const rest = items.slice(RING_TOP_N);
    if (rest.length) {
      slices.push({
        name: `其他 ${rest.length} 项`,
        value: rest.reduce((s, it) => s + it.value, 0),
        pct: rest.reduce((s, it) => s + it.pct, 0),
        color: OTHER_SLICE_COLOR,
        row: rest[0].row,
      });
    }
    return { items, slices, total };
  }

  const modelChartType = ref<ChartType>("token");
  const groupChartType = ref<ChartType>("token");
  const modelBoard = computed(() => buildBoard(modelDist.value, modelChartType.value));
  const groupBoard = computed(() => buildBoard(groupDist.value, groupChartType.value));

  // ==================== 分布三口径（模型 / 分组 / 应用） ====================
  /**
   * 分布面板的口径与指标是**面板自己的**状态，不跟构成图共用。
   *
   * <p>共用会让两个面板互相牵着跳（改构成图口径，分布表也跟着变色重排），
   * 而它们回答的是不同问题：构成图看「面积分布」，分布表看「逐行核对」。</p>
   */
  const distScopes = [
    { key: "model", label: "模型" },
    { key: "group", label: "分组" },
    { key: "app", label: "应用" },
  ] as const;
  type DistScope = (typeof distScopes)[number]["key"];
  const distScope = ref<DistScope>("model");
  const distMetric = ref<ChartType>("token");

  const distRows = computed<DistRow[]>(() => {
    if (distScope.value === "group") return groupDist.value;
    if (distScope.value === "app") return appDist.value;
    return modelDist.value;
  });
  /** 当前口径的看板（颜色/占比/汇总），与构成图同一套算法，颜色能对上 */
  const distBoard = computed(() => buildBoard(distRows.value, distMetric.value));
  /** 分布列表：按当前指标降序（切「费用」时榜序必须跟着变） */
  const distSorted = computed<BoardItem[]>(() =>
    [...distBoard.value.items].sort((a, b) => b.value - a.value),
  );
  /** 行的显示名：应用口径是英文键，补中文名；其余原样 */
  function distName(name: string): string {
    return distScope.value === "app" ? appLabel(name) : name;
  }

  // ==================== 模型构成 treemap 交互（§6.2 / §6.3 / §6.4 / §6.5） ====================

  /**
   * treemap 要画的色块：正值模型（按当前口径降序） + 尾部的「其他 N 项」汇总块。
   *
   * X 的切片固定 8 个扇区给环形图；面积图单独取前 {@code TREEMAP_TOP_N}
   * 条，多出的模型整段包进一块灰区，点它就能看它自己由哪些模型构成（§6.1 汇总块
   * 展开）：</p>
   *
   * <p>〇 是独立统计口径（§6.4）：聚合块不在自然块里面，点击自然块拿自然块的行，
   * 点击聚合块拿整段名册，两不混。</p>
   */
  const treemapBlocks = computed<{ blocks: TreeMapBlockItem[]; total: number }>(() => {
    const items = modelBoard.value.items.filter((it) => Number(it.value) > 0);
    const blocks: TreeMapBlockItem[] = items
      .slice(0, TREEMAP_TOP_N)
      .map((it) => ({
        name: it.name,
        value: Number(it.value),
        pct: Number(it.pct),
        color: it.color,
        requests: it.row.requests,
        promptTokens: it.row.promptTokens,
        completionTokens: it.row.completionTokens,
        totalTokens: it.row.totalTokens,
        cost: it.row.cost,
      }));
    const rest = items.slice(TREEMAP_TOP_N);
    if (!rest.length) return { blocks, total: items.length };
    const mk = (fn: (it: BoardItem) => number) =>
      rest.reduce((s, it) => s + fn(it), 0);
    return {
      total: items.length,
      blocks: [
        ...blocks,
        {
          name: `其他 ${rest.length} 项`,
          value: mk((it) => it.value),
          pct: mk((it) => it.pct),
          color: OTHER_SLICE_COLOR,
          members: rest.map((it) => ({ name: it.name, pct: it.pct, value: it.value, cost: Number(it.row.cost) || 0 })),
          // 汇总块的指标：目录幕过那一整段（自然块的指数不受影响）
          requests: mk((it) => it.row.requests),
          promptTokens: mk((it) => it.row.promptTokens),
          completionTokens: mk((it) => it.row.completionTokens),
          totalTokens: mk((it) => it.row.totalTokens),
          cost: mk((it) => it.row.cost),
        },
      ],
    };
  });

  /** 当前悬停的色块名（null = 没有悬停 — 压暗状态由它驱动） */
  const treemapHover = ref<string | null>(null);
  /** 点击生效的色块详情（null = 弹窗关闭） */
  const treemapSelected = ref<TreeMapDetail | null>(null);
  /** 模型构成详情弹窗 */
  const treemapDetailVisible = ref(false);
  /** 「所有模型」展开弹窗 */
  const treemapMoreVisible = ref(false);

  /**
   * 悬停：echarts 的 `mouseover` 返回色块名，直接比对即可压暗另一头。
   *
   * <p>这里只记名不记值：模型级色块与「其他 N 项」色块都走同一个压暗（悬停那块
   * 全亮，其余压暗）。</p>
   */
  function onTreemapHover(params: any) {
    treemapHover.value = params?.name ?? null;
  }

  function onTreemapOut() {
    treemapHover.value = null;
  }

  /**
   * 点击色块：弹窗展示详情（自然块模型级，汇总块展开成员列表）。
   *
   * <p>null 不设为可选：点中的是省级的参数名 → 映射回 `board.modelBoard.items` 找
   * 对应的行。两类混淆时用中文名区分：参与者叫「其他 N 项」，成员列表压入详情。</p>
   */
  function onTreemapClick(params: any) {
    const name = params?.name;
    if (name == null) return;
    const blocks = treemapBlocks.value.blocks;
    const block = blocks.find((b) => b.name === name);
    if (block == null) return;

    if (block.name.startsWith("其他 ")) {
      // 汇总块：详情里的成员列表就是它自己包的切段（§6.4 分组隔离）
      treemapSelected.value = {
        name: block.name,
        pct: block.pct,
        value: block.value,
        requests: block.requests,
        promptTokens: block.promptTokens,
        completionTokens: block.completionTokens,
        totalTokens: block.totalTokens,
        cost: block.cost,
        members: block.members,
      };
    } else {
      const it = modelBoard.value.items.find((i) => i.name === name);
      if (!it) return;
      treemapSelected.value = {
        name: it.name,
        pct: it.pct,
        value: it.value,
        requests: it.row.requests,
        promptTokens: it.row.promptTokens,
        completionTokens: it.row.completionTokens,
        totalTokens: it.row.totalTokens,
        cost: it.row.cost,
      };
    }
    treemapDetailVisible.value = true;
  }

  /** 点击展示全部模型（ Treemap 「更多」与「其他 N 项」弹窗同源可见） */
  function onTreemapMore() {
    treemapMoreVisible.value = true;
  }

  /** 关闭 treemap 弹窗，恢复所有色块 */
  function closeTreemapDialog() {
    treemapDetailVisible.value = false;
    treemapMoreVisible.value = false;
    treemapSelected.value = null;
    treemapHover.value = null;
  }

  /** 当前悬停的扇区（null = 没悬停，环心回落到 Top1） */
  const modelHover = ref<HoverSlice | null>(null);
  const groupHover = ref<HoverSlice | null>(null);

  function onRingHover(which: "model" | "group", params: any) {
    const target = which === "model" ? modelHover : groupHover;
    if (!params || params.componentType !== "series" || params.name == null) {
      target.value = null;
      return;
    }
    const pct = Number(params.percent);
    target.value = { name: String(params.name), pct: Number.isFinite(pct) ? pct : 0 };
  }

  function onLegendHover(which: "model" | "group", item: BoardItem | null) {
    const target = which === "model" ? modelHover : groupHover;
    target.value = item ? { name: item.name, pct: item.pct } : null;
  }

  /** 环心显示内容：有 hover 用 hover 的，否则用 Top1；空数据给占位符 */
  function ringTop(board: BoardData, hover: HoverSlice | null): { pct: string; name: string } {
    if (hover) return { pct: hover.pct.toFixed(1) + "%", name: hover.name };
    if (!board.items.length) return { pct: "—", name: "暂无数据" };
    const top = board.items[0];
    return { pct: top.pct.toFixed(1) + "%", name: top.name };
  }

  /** 环心 Top1 占比（旧入口，保留给测试与外部引用） */
  function topPct(b: BoardData): string {
    return b.items.length ? b.items[0].pct.toFixed(1) + "%" : "—";
  }
  function topName(b: BoardData): string {
    return b.items.length ? b.items[0].name : "暂无数据";
  }

  /** 名次 → 颜色（明细表用；找不到按末档兜底，避免 undefined 让背景变透明） */
  function boardColorOf(b: BoardData, name: string): string {
    const idx = b.items.findIndex((it) => it.name === name);
    return idx >= 0 ? b.items[idx].color : BOARD_PALETTE[BOARD_PALETTE.length - 1];
  }

  /** 占比条宽度：0% 也留 2px，否则「有一点点」和「真的没有」看起来一样 */
  function barWidth(pct: number): string {
    const v = Math.min(100, Math.max(0, pct));
    if (v <= 0) return "0%";
    return Math.max(2, v) + "%";
  }

  /** 该行在当前指标下是否为 0（¥0 / 0 token 的行按 §4 要求淡化成浅灰） */
  function isZeroCost(row: DistRow, type: ChartType): boolean {
    const v = type === "token" ? row.totalTokens : row.cost;
    return !(Number(v) > 0);
  }

  /**
   * 看板环形图。
   *
   * <p>三点与旧饼图不同：</p>
   * <ol>
   *   <li><b>不要图例</b>：图例改由右侧 DOM 列表承担。</li>
   *   <li><b>中心留空</b>：留给 DOM 覆盖层显示 Top1 占比。</li>
   *   <li><b>只画 {@link RING_TOP_N} 项</b>：其余并成「其他」，右侧图例渲染同一份 slices。</li>
   * </ol>
   */
  function ringOption(b: BoardData, type: ChartType): EChartsOption {
    const data = b.slices.map((it) => ({
      name: it.name,
      value: Number(it.value.toFixed(4)),
      itemStyle: { color: it.color },
    }));
    return {
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: "rgba(255,255,255,0.98)",
        borderColor: "#E5E6EB",
        borderWidth: 1,
        textStyle: { color: "#1D2129", fontSize: 12 },
        extraCssText: "box-shadow:0 6px 20px rgba(15,23,42,.12);border-radius:8px;padding:8px 10px;",
        formatter: (p: any) => {
          const v = type === "token" ? fmtToken(p.value) : `${currencySymbol.value}${money(p.value)}`;
          return `${p.marker}${p.name}<br/><b style="font-size:13px">${v}</b>&nbsp;&nbsp;<span style="color:#86909C">${Number(p.percent).toFixed(1)}%</span>`;
        },
      },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: ["62%", "86%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          // 扇区间隙用页面卡片色（不写死白色，深色模式下才不会露出一圈白边）
          itemStyle: { borderColor: surfaceBg.value, borderWidth: 2, borderRadius: 4 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scaleSize: 6,
            itemStyle: { shadowBlur: 14, shadowColor: "rgba(22,93,255,0.22)" },
          },
          data,
        },
      ],
    };
  }

  const modelRingOption = computed(() => ringOption(modelBoard.value, modelChartType.value));
  const groupRingOption = computed(() => ringOption(groupBoard.value, groupChartType.value));

  /**
   * 主卡右下角的迷你环形图：输入 / 输出占比。
   */
  function miniRingOption(_kind: "input"): EChartsOption {
    const input = Math.max(0, Number(stats.totalPromptTokens) || 0);
    const output = Math.max(0, Number(stats.totalCompletionTokens) || 0);
    const rest = Math.max(0, input + output);
    const data = rest > 0
      ? [
        { name: "输入", value: input, itemStyle: { color: "#165DFF" } },
        { name: "输出", value: output, itemStyle: { color: "#00B42A" } },
      ]
      : [{ name: "暂无", value: 1, itemStyle: { color: "#E5E6EB" } }];
    return {
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (p: any) => `${p.marker}${p.name} ${fmtToken(p.value)}（${Number(p.percent).toFixed(1)}%）`,
      },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: ["66%", "92%"],
          center: ["50%", "50%"],
          silent: true,
          itemStyle: { borderColor: surfaceBg.value, borderWidth: 1.5 },
          label: { show: false },
          labelLine: { show: false },
          data,
        },
      ],
    };
  }

  /** 看板明细表的列定义（比原分布表更紧凑；占比列由插槽画进度条） */
  function boardColumns(nameLabel: string): ReTableColumn[] {
    return [
      { prop: "name", label: nameLabel, minWidth: 120, showOverflowTooltip: true, slot: "name" },
      { prop: "requests", label: "请求", width: 76, align: "right", slot: "requests", sortable: true },
      { prop: "totalTokens", label: "Token", width: 92, align: "right", slot: "totalTokens", sortable: true },
      { prop: "cost", label: `费用(${currencySymbol.value})`, width: 92, align: "right", slot: "cost", sortable: true },
      { prop: "percent", label: "占比", width: 132, slot: "percent" },
    ];
  }

  function percentNum(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): number {
    const total = all.reduce((s, x) => s + (type === "token" ? x.totalTokens : x.cost), 0);
    if (total <= 0) return 0;
    const v = (type === "token" ? row.totalTokens : row.cost) ?? 0;
    return (v / total) * 100;
  }

  function percent(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): string {
    return percentNum(row, all, type).toFixed(1) + "%";
  }

  // ==================== 每日模型用量（堆叠柱状图） ====================
  const modelTrendRows = ref<Array<{
    date: string; model: string; provider: string;
    totalTokens: number; totalCost: number;
    avgFirstTokenLatency: number | null; avgTotalLatency: number | null;
    avgTokensPerSecond: number | null;
  }>>([]);
  const modelBarMetric = ref<ChartType>("token");

  /** 同一模型在不同日期必须拿到同一个颜色，故颜色按模型名做稳定映射而非按下标 */
  const MODEL_COLORS = [
    "#5B8FF9", "#5AD8A6", "#5D7092", "#F6BD16", "#6F5EF9",
    "#6DC8EC", "#945FB9", "#FF9845", "#1E9493", "#FF99C3",
    "#269A99", "#8D6DFF", "#E8684A", "#4EA3D1", "#C9A227",
  ];
  /** 模型名 -> 颜色。按首次出现顺序占坑，保证跨刷新/跨筛选不跳色 */
  const modelColorMap = new Map<string, string>();
  function colorOfModel(model: string): string {
    const key = model || "未知模型";
    let c = modelColorMap.get(key);
    if (!c) {
      c = MODEL_COLORS[modelColorMap.size % MODEL_COLORS.length];
      modelColorMap.set(key, c);
    }
    return c;
  }

  /** 参与堆叠的模型：按区间内总量取前 N 个，其余并成「其他」，避免几十段互相挤压 */
  const MODEL_BAR_TOP_N = 8;

  const modelBarMatrix = computed(() => {
    const metric = modelBarMetric.value;
    const totals = new Map<string, number>();
    const byDate = new Map<string, Map<string, number>>();
    for (const r of modelTrendRows.value) {
      const date = String(r.date || "").slice(0, 10);
      const model = String(r.model || "").trim() || "未知模型";
      const v = metric === "token" ? Number(r.totalTokens) || 0 : Number(r.totalCost) || 0;
      if (!date) continue;
      if (v <= 0) continue;
      totals.set(model, (totals.get(model) || 0) + v);
      let day = byDate.get(date);
      if (!day) { day = new Map(); byDate.set(date, day); }
      day.set(model, (day.get(model) || 0) + v);
    }
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const keep = ranked.slice(0, MODEL_BAR_TOP_N).map(([m]) => m);
    const keepSet = new Set(keep);
    const dates = [...byDate.keys()].sort();
    const otherOf = (day: Map<string, number>) => {
      let sum = 0;
      for (const [m, v] of day) if (!keepSet.has(m)) sum += v;
      return sum;
    };
    const series = keep.map((model) => ({
      model,
      data: dates.map((d) => byDate.get(d)!.get(model) || 0),
    }));
    if (ranked.length > MODEL_BAR_TOP_N) {
      series.push({ model: "其他", data: dates.map((d) => otherOf(byDate.get(d)!)) });
    }
    return { dates, series };
  });

  const modelBarDates = computed(() => modelBarMatrix.value.dates);

  const modelBarOption = computed<EChartsOption>(() => {
    const { dates, series } = modelBarMatrix.value;
    const metric = modelBarMetric.value;
    return {
      tooltip: {
        trigger: "axis",
        confine: true,
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(0,0,0,0.04)" } },
        valueFormatter: (v: any) => (metric === "token" ? fmtToken(v) : `${currencySymbol.value}${money(v)}`),
      },
      legend: { type: "scroll", top: 0, icon: "circle", itemWidth: 8, itemHeight: 8, itemGap: 8, textStyle: { fontSize: 10 } },
      grid: { left: 52, right: 20, top: 28, bottom: 24, containLabel: false },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: {
          hideOverlap: true,
          fontSize: 10,
          formatter: (v: string) => (dates.length > 14 ? String(v).slice(5) : v),
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        name: metric === "token" ? "Token" : `费用(${currencySymbol.value})`,
        nameTextStyle: { fontSize: 11, color: "var(--el-text-color-secondary)" },
        axisLabel: {
          formatter: (v: number) => (metric === "token" ? fmtToken(v) : money(v)),
        },
        splitLine: { lineStyle: { type: "dashed" } },
      },
      series: series.map((s) => ({
        name: s.model,
        type: "bar",
        stack: "usage",
        barMaxWidth: 34,
        itemStyle: {
          color: colorOfModel(s.model),
          borderColor: surfaceBg.value,
          borderWidth: 1,
        },
        emphasis: { focus: "series" },
        data: s.data,
      })),
    };
  });

  /**
   * 趋势图的口径与图形。
   *
   * <p>四个口径里只有 Token / 请求直接来自 {@code /usage/trend}；费用与速度在
   * {@code /usage/model-trend} 里（按模型按天），这里按天汇总：费用求和、速度按
   * Token 加权平均 —— 直接对各模型的 tok/s 取算术平均会被小模型拉偏。</p>
   */
  type TrendMetric = "token" | "cost" | "calls" | "speed";
  const trendMetric = ref<TrendMetric>("token");
  const trendChartType = ref<"line" | "bar">("line");

  const trendAux = computed(() => {
    const cost = new Map<string, number>();
    const speed = new Map<string, { sum: number; weight: number }>();
    for (const r of modelTrendRows.value) {
      const d = r.date;
      cost.set(d, (cost.get(d) || 0) + (Number(r.totalCost) || 0));
      const w = Number(r.totalTokens) || 0;
      const s = Number(r.avgTokensPerSecond);
      if (Number.isFinite(s) && s > 0 && w > 0) {
        const cur = speed.get(d) || { sum: 0, weight: 0 };
        cur.sum += s * w;
        cur.weight += w;
        speed.set(d, cur);
      }
    }
    return { cost, speed };
  });

  const trendOption = computed<EChartsOption>(() => {
    const rows = trendData.value;
    // 单日下钻时后端回的是小时桶（date = "yyyy-MM-dd HH"），轴上标 "HH:00"
    const dates = rows.map((r) => (r.date.length > 10 ? `${r.date.slice(11, 13)}:00` : r.date));
    const metric = trendMetric.value;
    const isBar = trendChartType.value === "bar";
    const fmt = (v: number) =>
      metric === "token"
        ? fmtToken(v)
        : metric === "cost"
          ? `${currencySymbol.value}${money(v)}`
          : metric === "calls"
            ? formatNumber(v)
            : `${Math.round(v)} tok/s`;
    const barBase = { barMaxWidth: 20, itemStyle: { borderRadius: [3, 3, 0, 0] } };
    const lineBase = { smooth: true, showSymbol: false };
    let series: any[];
    if (metric === "token") {
      const mk = (name: string, key: "input" | "output" | "cached", dashed = false) => ({
        name,
        type: trendChartType.value,
        ...(isBar ? { ...barBase, stack: "token" } : lineBase),
        data: rows.map((r) => r[key]),
        ...(dashed ? { lineStyle: { type: "dashed", width: 2 } } : {}),
        ...(isBar ? {} : { areaStyle: { opacity: dashed ? 0.06 : 0.12 } }),
      });
      series = [mk("输入 Token", "input"), mk("输出 Token", "output"), mk("缓存读取", "cached", true)];
    } else if (metric === "cost") {
      series = [{ name: "费用", type: trendChartType.value, ...(isBar ? barBase : lineBase), data: rows.map((r) => Number(trendAux.value.cost.get(r.date) || 0)) }];
    } else if (metric === "calls") {
      series = [{ name: "请求", type: trendChartType.value, ...(isBar ? barBase : lineBase), data: rows.map((r) => r.calls) }];
    } else {
      series = [{
        name: "速度",
        type: trendChartType.value,
        ...(isBar ? barBase : lineBase),
        // 没测到的天给 null：ECharts 会断线，正好表达「那天没有速率样本」
        data: rows.map((r) => {
          const s = trendAux.value.speed.get(r.date);
          return s && s.weight > 0 ? Number((s.sum / s.weight).toFixed(1)) : null;
        }),
      }];
    }
    return {
      tooltip: {
        trigger: "axis",
        confine: true,
        axisPointer: { type: "line", lineStyle: { type: "dashed" } },
        valueFormatter: (v: any) => fmt(Number(v)),
      },
      legend: { show: metric === "token", data: ["输入 Token", "输出 Token", "缓存读取"], top: 0, itemWidth: 14, itemHeight: 8, itemGap: 10, textStyle: { fontSize: 10 } },
      grid: { left: 50, right: 18, top: 32, bottom: 26 },
      xAxis: { type: "category", boundaryGap: isBar, data: dates, axisLabel: { fontSize: 10 } },
      yAxis: { type: "value", axisLabel: { formatter: (v: number) => fmt(v), fontSize: 10 } },
      series,
    };
  });

  /**
   * 模型延迟图：一天一个点、一个模型一条线，纵轴为「平均首字延迟（ms）」。
   *
   * 为什么画首字延迟而不是总耗时：总耗时随输出长度线性增长，同一个模型写得长一点
   * 就会显得「更慢」，跨模型比较没有意义；首字延迟衡量的是「多久开始响应」，
   * 与生成长度无关，才是用户真正感知到的那个「卡不卡」。
   *
   * 缺测的格子返回 null 而不是 0：ECharts 遇 null 会断线，正好表达「这天没测到」。
   */
  const MODEL_LATENCY_TOP_N = 6;

  const latencyMatrix = computed(() => {
    const weight = new Map<string, number>();
    const latencyCell = new Map<string, Map<string, number>>();
    const speedCell = new Map<string, Map<string, number>>();
    for (const r of modelTrendRows.value) {
      const date = String(r.date || "").slice(0, 10);
      const model = String(r.model || "").trim() || "未知模型";
      if (!date) continue;
      weight.set(model, (weight.get(model) || 0) + (Number(r.totalTokens) || 0));
      const v = r.avgFirstTokenLatency;
      if (v == null || !Number.isFinite(v) || v <= 0) continue;
      let day = latencyCell.get(date);
      if (!day) { day = new Map(); latencyCell.set(date, day); }
      day.set(model, Math.round(v));
      // 平均 tok/s 独立一列：null 保持 null，没实测样本时数据断点、垂线断开
      const s = r.avgTokensPerSecond;
      if (s == null || !Number.isFinite(s) || s <= 0) continue;
      let daySp = speedCell.get(date);
      if (!daySp) { daySp = new Map(); speedCell.set(date, daySp); }
      daySp.set(model, s);
    }
    const keep = [...weight.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MODEL_LATENCY_TOP_N)
      .map(([m]) => m);
    const dates = [...latencyCell.keys()].sort();
    const series = keep.map((model) => ({
      model,
      latency: dates.map((d) => latencyCell.get(d)?.get(model) ?? null),
      speed: dates.map((d) => speedCell.get(d)?.get(model) ?? null),
    }));
    return { dates, series };
  });

  const latencyDates = computed(() => latencyMatrix.value.dates);
  /** 有延迟样本的模型数（用来区分「没数据」与「有数据但都没测到延迟」） */
  const latencyModelCount = computed(() => latencyMatrix.value.series.length);

  const latencyOption = computed<EChartsOption>(() => {
    const { dates, series } = latencyMatrix.value;
    return {
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: (params: any) => (Array.isArray(params) ? params : [params])
          .map((p: any) => {
            const px = p.seriesName.endsWith("（tok/s）");
            const v = p.value == null ? null : Number(p.value);
            return `${p.marker}${p.seriesName}: ${px ? (v == null ? "—" : formatSpeed(v)) : (v == null ? "—" : formatLatency(v))}`;
          })
          .join("<br/>"),
      },
      legend: { top: 0, type: "scroll", itemWidth: 14, itemHeight: 8, itemGap: 8, textStyle: { fontSize: 10 } },
      grid: { left: 44, right: 32, top: 26, bottom: 22 },
      xAxis: { type: "category", boundaryGap: false, data: dates.map((d) => (d.length > 10 ? d.slice(11, 16) : d)), axisLabel: { fontSize: 10 } },
      yAxis: [
        { type: "value", name: "ms", position: "left", axisLabel: { formatter: (v: number) => `${v}`, fontSize: 10 } },
        {
          type: "value",
          name: "tok/s",
          position: "right",
          axisLabel: { formatter: (v: number) => `${v}`, fontSize: 10 },
          splitLine: { show: true, lineStyle: { type: "dashed", opacity: 0.3 } },
        },
      ],
      series: series.flatMap((s) => [
        {
          name: s.model,
          type: "line",
          smooth: true,
          showSymbol: true,
          symbolSize: 5,
          connectNulls: false,
          data: s.latency,
          color: colorOfModel(s.model),
        },
        {
          name: s.model + "（tok/s）",
          type: "line",
          smooth: true,
          showSymbol: true,
          symbolSize: 5,
          connectNulls: false,
          data: s.speed,
          color: colorOfModel(s.model),
          // 虚线区分：平均 tok/s 不是首字延迟口径，避免与延迟线混淆
          lineStyle: { type: "dashed" },
        },
      ]),
    };
  });

  // ==================== 明细表 ====================
  const detailRecords = ref<any[]>([]);
  const detailLoading = ref(false);
  const detailTotal = ref(0);
  const detailModelFilter = ref("");
  /**
   * 费用等敏感数据是否可见（默认隐藏）。
   *
   * <p>明细表里费用默认只渲染眼睛图标，点「用量明细」头部的
   * 显示费用开关才露出金额 —— 截屏/分享场景不泄露账单数据。</p>
   */
  const costVisible = ref(false);
  const detailUserFilter = ref("");

  const detailColumns = computed<ReTableColumn[]>(() => [
    // 时间列不钉左：vxe 的固定列是双份渲染（表头/表体各一份），在本页宽度下
    // 表头与表体会整体错开约 40px，且左侧多出一条空白带；整表一起横滚更稳。
    // 时间列钉左：默认皮肤下固定层与主表列宽一致，钉住才不会滚丢时间
    { prop: "time", label: "时间", width: 150, slot: "time", fixed: "left" },
    { prop: "model", label: "模型", minWidth: 180, showOverflowTooltip: true, slot: "model" },
    { prop: "group", label: "分组", width: 140, showOverflowTooltip: true, slot: "group" },
    { prop: "user", label: "账号", width: 90, slot: "user" },
    { prop: "provider", label: "服务商", width: 100, slot: "provider" },
    { prop: "endpoint", label: "端点", width: 185, showOverflowTooltip: true, slot: "endpoint" },
    { prop: "strength", label: "强度", width: 90, slot: "strength" },
    { prop: "ip", label: "请求 IP", width: 130, showOverflowTooltip: true, slot: "ip" },
    { prop: "tokens", label: "Token", width: 170, align: "right", slot: "tokens" },
    { prop: "cost", label: `费用(${currencySymbol.value})`, width: 90, align: "right", slot: "cost" },
    { prop: "latency", label: "耗时", width: 150, slot: "latency" },
    { prop: "type", label: "类型", width: 130, slot: "type" },
    { prop: "callType", label: "调用类型", width: 95, slot: "callType" },
  ]);

  /**
   * 明细表的查询参数（时间范围 + 模型过滤）。
   *
   * <p>作为 ReTable 的 {@code params} 传下去，loader 收到的 {@code params} 里
   * 会带上它（组件会把 params 与 page/pageSize 合并后交给 loader）。</p>
   */
  const detailQueryParams = computed(() => {
    const p: Record<string, unknown> = { ...timeParams.value };
    if (detailModelFilter.value) {
      p.model = detailModelFilter.value;
    }
    return p;
  });

  /**
   * ReTable 的 loader（后端分页）。
   *
   * <p>组件在远程模式下会自己调它取当前页数据，并按返回的 total 算页数 ——
   * 这才是后端分页的正确接法。返回 {@code { total, records }}。</p>
   */
  async function loadDetailPage({ page, pageSize, params }: { page: number; pageSize: number; params: Record<string, unknown> }) {
    detailLoading.value = true;
    try {
      const { page: _p, pageSize: _ps, ...rest } = params as Record<string, unknown>;
      const res: any = await usageApi.detailList({ ...rest, page, size: pageSize });
      const payload = res.data || res || {};
      const records = payload.records || payload.data || payload.list || [];
      detailRecords.value = Array.isArray(records) ? records : [];
      detailTotal.value = Number(payload.total ?? res?.total ?? 0) || 0;
      return { total: detailTotal.value, records: detailRecords.value };
    } catch (e: any) {
      message.error("加载明细失败: " + (e?.message || e));
      return { total: 0, records: [] };
    } finally {
      detailLoading.value = false;
    }
  }

  // ---------- 格式化 ----------
  /**
   * 缓存读取占总 Token 的比例（百分数，未夹取），不可算时返回 -1。
   */
  function cacheRateNum(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): number {
    const total = Number(row?.sysAiUsageTotalTokens) || 0;
    if (!(total > 0)) return -1;
    const cached = Number(row?.sysAiUsageCachedTokens) || 0;
    return Math.min(100, Math.max(0, (cached / total) * 100));
  }

  /** 缓存率进度条宽度（0–100）；不可算时画 0 宽，但文案会显示「—」。 */
  function cacheRatePct(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): number {
    const v = cacheRateNum(row);
    return v < 0 ? 0 : v;
  }

  /** 缓存率文案，一位小数；不可算时显示「—」而不是 0.0%。 */
  function cacheRateText(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): string {
    const v = cacheRateNum(row);
    return v < 0 ? "—" : v.toFixed(1) + "%";
  }

  function formatLatency(ms: number | null | undefined): string {
    if (ms == null || ms === 0) return "—";
    if (ms < 1000) return Math.round(ms) + "ms";
    const s = ms / 1000;
    if (s < 60) return (Math.round(s * 100) / 100) + "s";
    const m = Math.floor(s / 60);
    const rs = Math.round(s % 60);
    if (m < 60) return m + "m " + rs + "s";
    const h = Math.floor(m / 60);
    const rm = Math.round(m % 60);
    return h + "h " + rm + "m";
  }

  /** 速率格式化：无效或缺失值显示占位符 */
  function formatSpeed(v: number | null | undefined): string {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return n.toFixed(1) + " tok/s";
  }

  /** 解码速率灰显阈值：超过即物理不可信（见 AiUsage.tokensPerSecond 窗口保护），标灰不误读 */
  const SPEED_SUSPICIOUS = 1000;
  /** 总耗时极短阈值：<1s 的整请求视为「秒回」——缓存命中、代理回放等场景。 */
  const TOTAL_LATENCY_SUSPICIOUS = 1000;

  /** 整请求总耗时是否 <1s（秒回/疑似缓存或回放） */
  function isShortTotalLatency(row: any): boolean {
    const total = Number(row?.sysAiUsageTotalLatency);
    return Number.isFinite(total) && total > 0 && total < TOTAL_LATENCY_SUSPICIOUS;
  }

  /**
   * 是否判定为不可信速率：命中「解码窗口窄窗口假象」（>1000）
   * 或「整请求秒回」（总耗时<1s）都标灰，不再按快/中/慢着色。
   */
  function isSuspiciousSpeed(row: any): boolean {
    const n = Number(row?.sysAiUsageTokensPerSecond);
    return Number.isFinite(n) && n > 0 && (n > SPEED_SUSPICIOUS || isShortTotalLatency(row));
  }

  /**
   * 速率着色：解码速率阈值参考实测基线（约 80~105 tok/s）。
   */
  function speedColor(row: any): string {
    const n = Number(row?.sysAiUsageTokensPerSecond);
    if (!Number.isFinite(n) || n <= 0) return "var(--el-text-color-placeholder)";
    // 口径假象保护：解码窗口被批量块压到 1s 内时，存储值是总耗时口径近似值，
    // >1000 的标灰不参与快慢着色。整请求总耗时<1s（秒回/缓存/回放）同样标灰。
    if (isSuspiciousSpeed(row)) return "var(--el-text-color-placeholder)";
    const ok = 80;
    const warn = 40;
    if (n >= ok) return "var(--el-color-success)";
    if (n >= warn) return "var(--el-color-warning)";
    return "var(--el-color-danger)";
  }

  /**
   * 速率悬浮提示：标灰的不可信速率给出原因与总耗时口径近似值。
   */
  function speedTitle(row: any): string {
    if (!isSuspiciousSpeed(row)) return "";
    const out = Number(row?.sysAiUsageCompletionTokens);
    const total = Number(row?.sysAiUsageTotalLatency);
    let extra = "";
    if (Number.isFinite(out) && out > 0 && Number.isFinite(total) && total > 0) {
      extra = `；按总耗时口径约 ${(out / (total / 1000)).toFixed(1)} tok/s`;
    }
    const n = Number(row?.sysAiUsageTokensPerSecond);
    const shortTotal = isShortTotalLatency(row);
    if (n > SPEED_SUSPICIOUS && shortTotal) {
      return `解码窗口不足 1s（服务商批量推送的口径假象），且总耗时不足 1s（疑似缓存命中或回放），此速率不可信${extra}`;
    }
    if (n > SPEED_SUSPICIOUS) {
      return `解码窗口不足 1s（服务商批量推送的口径假象），此速率不可信${extra}`;
    }
    return `总耗时不足 1s，疑似缓存命中或回放，不能作为模型解码能力参考${extra}`;
  }

  /**
   * 解码窗口 = 总耗时 − 首字耗时；任一缺失或首字≥总耗时时退化为总耗时。
   */
  function decodeWindowMs(row: any): number | null {
    const total = Number(row?.sysAiUsageTotalLatency);
    const ttft = Number(row?.sysAiUsageFirstTokenLatency);
    if (!Number.isFinite(total) || total <= 0) return null;
    if (Number.isFinite(ttft) && ttft > 0 && ttft < total) return total - ttft;
    return total;
  }

  /** 解码窗口着色：<1s 多为批量推送假象，标灰（与速率标灰同口径） */
  function decodeWindowColor(row: any): string {
    const ms = decodeWindowMs(row);
    if (ms == null || ms <= 0) return "var(--el-text-color-placeholder)";
    if (ms < 1000) return "var(--el-text-color-placeholder)";
    if (ms < 2000) return "var(--el-color-success)";
    if (ms < 6000) return "var(--el-color-warning)";
    return "var(--el-color-danger)";
  }

  // ---------- 延迟指示器：上下两段 + 阈值变色 ----------
  const FIRST_THRESHOLDS = { ok: 1500, warn: 4000 };
  const TOTAL_THRESHOLDS = { ok: 8000, warn: 25000 };

  function latencyColor(ms: number | null | undefined, t: { ok: number; warn: number }): string {
    if (ms == null || ms <= 0) return "var(--el-text-color-placeholder)";
    if (ms < t.ok) return "var(--el-color-success)";
    if (ms < t.warn) return "var(--el-color-warning)";
    return "var(--el-color-danger)";
  }
  function getFirstColor(row: any): string {
    return latencyColor(row?.sysAiUsageFirstTokenLatency, FIRST_THRESHOLDS);
  }
  function getTotalColor(row: any): string {
    return latencyColor(row?.sysAiUsageTotalLatency, TOTAL_THRESHOLDS);
  }

  // ---------- 来源类型中文标签 ----------
  const TYPE_LABEL_MAP: Record<string, string> = {
    chat: "会话",
    chat_stream: "流式会话",
    bot: "连接器",
    memory_extract: "记忆提取",
    optimize: "优化",
    optimization: "优化",
    external: "三方",
    third_party: "三方",
    service: "服务",
  };
  function formatTypeLabel(t: string | null | undefined): string {
    if (t == null || t === "") return "—";
    const key = String(t).trim().replace(/-/g, "_").toLowerCase();
    return TYPE_LABEL_MAP[key] || t;
  }

  /**
   * 调用类型（流式口径）。
   */
  function callModeLabel(row: any): string {
    const t = String(row?.sysAiUsageType || row?.sysAiUsageCallType || "").toLowerCase();
    if (t.includes("non_stream") || t.includes("nostream") || t.includes("nonstream")) return "非流式";
    return "流式";
  }

  function callModeTag(row: any): "success" | "info" {
    return callModeLabel(row) === "流式" ? "success" : "info";
  }

  /**
   * 端点展示：统一加「入站:」前缀；缺失时兜底控制台默认对话端点。
   */
  function endpointDisplay(row: any): string {
    const ep = String(row?.sysAiUsageEndpoint || "").trim();
    return "入站:" + (ep || "/v1/chat/completions");
  }

  function typeTagType(t: string | null | undefined): "primary" | "info" | "warning" | "success" {
    if (t === "chat_stream" || t === "chat") return "primary";
    if (t === "external" || t === "third_party") return "info";
    if (t === "memory_extract" || t === "summary") return "warning";
    return "success";
  }

  function formatTime(v: any): string {
    if (v == null) return "-";
    if (Array.isArray(v)) {
      const p = (x: number) => String(x).padStart(2, "0");
      return `${v[0]}-${p(v[1])}-${p(v[2])} ${p(v[3] || 0)}:${p(v[4] || 0)}:${p(v[5] || 0)}`;
    }
    return String(v).replace("T", " ").slice(0, 19);
  }

  /**
   * 当前区间是否真的有用量数据。
   *
   * <p>三个口径任一非零即认为有数据：KPI 统计快照、明细总数、刻度尺总量。
   * 全为 0 时页面不再铺满一整面 0 和空图，而是收敛成一块整页空态。</p>
   */
  const hasAnyUsage = computed(
    () =>
      Number(stats.totalCalls) > 0 ||
      Number(stats.totalTokens) > 0 ||
      Number(stats.totalCost) > 0 ||
      detailTotal.value > 0,
  );

  return {
    stats, statCards, animatedTokens, animatedCalls,
    activeFilter, customRange, timeParams, quickFilters, rangeLabel,
    setQuickFilter, onCustomRange, refreshAll, refreshing, handleExport, exporting,
    spineView, spineMax, spineTotal, drillDay, selectSpineDay, clearDrill, isSpineInRange,
    modelDist, groupDist, appDist,
    distScopes, distScope, distMetric, distRows, distBoard, distSorted, distName,
    modelRankTop5, appRankTop5, rankMetric, rankValue, rankBarWidth, rankPct, appLabel,
    liveEnabled, liveState, liveTodayTokens, liveRangeTokens, liveRate, liveLabel,
    boardTabs, modelChartType, groupChartType, modelBoard, groupBoard,
    modelHover, groupHover, onRingHover, onLegendHover, ringTop, topPct, topName,
    treemapBlocks, treemapHover, treemapSelected, treemapDetailVisible, treemapMoreVisible,
    onTreemapHover, onTreemapOut, onTreemapClick, onTreemapMore,
    closeTreemapDialog,
    OTHER_SLICE_COLOR, boardColorOf, barWidth, isZeroCost,
    modelRingOption, groupRingOption, miniRingOption, boardColumns, percentNum, percent,
    modelBarMetric, modelBarDates, modelBarOption,
    trendData, trendOption, trendMetric, trendChartType,
    latencyDates, latencyModelCount, latencyOption,
    detailRecords, detailLoading, detailTotal, detailModelFilter, costVisible,
    detailColumns, detailQueryParams, loadDetailPage, hasAnyUsage,
    fmtToken, formatNumber, money, formatLatency, formatSpeed,
    speedColor, speedTitle, decodeWindowMs, decodeWindowColor, getFirstColor, getTotalColor,
    formatTypeLabel, typeTagType, callModeLabel, callModeTag, cacheRatePct, cacheRateText,
    endpointDisplay, providerDisplay, isSuspiciousSpeed, formatTime,
    currencySymbol,
    routeErrors,
  };
}
