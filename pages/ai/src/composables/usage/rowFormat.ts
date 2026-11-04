/**
 * 明细行语义格式化
 *
 * <p>明细表里每一个「带颜色的数字」其实都是一个业务判断：这个速率可信吗、
 * 这个耗时算快还是慢、这条记录是流式还是非流式。判断口径集中在这里，
 * 表格组件只负责把颜色画出来。</p>
 */

/** 解码速率灰显阈值：超过即物理不可信（见 AiUsage.tokensPerSecond 窗口保护），标灰不误读 */
const SPEED_SUSPICIOUS = 1000;
/** 总耗时极短阈值：<1s 的整请求视为「秒回」——缓存命中、代理回放等场景 */
const TOTAL_LATENCY_SUSPICIOUS = 1000;

/** 延迟指示器阈值：上下两段各自一套 */
const FIRST_THRESHOLDS = { ok: 1500, warn: 4000 };
const TOTAL_THRESHOLDS = { ok: 8000, warn: 25000 };

const PLACEHOLDER = "var(--el-text-color-placeholder)";

/** 整请求总耗时是否 <1s（秒回/疑似缓存或回放） */
export function isShortTotalLatency(row: any): boolean {
  const total = Number(row?.sysAiUsageTotalLatency);
  return Number.isFinite(total) && total > 0 && total < TOTAL_LATENCY_SUSPICIOUS;
}

/**
 * 是否判定为不可信速率：命中「解码窗口窄窗口假象」（>1000）
 * 或「整请求秒回」（总耗时<1s）都标灰，不再按快/中/慢着色。
 */
export function isSuspiciousSpeed(row: any): boolean {
  const n = Number(row?.sysAiUsageTokensPerSecond);
  return Number.isFinite(n) && n > 0 && (n > SPEED_SUSPICIOUS || isShortTotalLatency(row));
}

/** 速率着色：解码速率阈值参考实测基线（约 80~105 tok/s） */
export function speedColor(row: any): string {
  const n = Number(row?.sysAiUsageTokensPerSecond);
  if (!Number.isFinite(n) || n <= 0) return PLACEHOLDER;
  // 口径假象保护：解码窗口被批量块压到 1s 内时，存储值是总耗时口径近似值，
  // >1000 的标灰不参与快慢着色。整请求总耗时<1s（秒回/缓存/回放）同样标灰。
  if (isSuspiciousSpeed(row)) return PLACEHOLDER;
  if (n >= 80) return "var(--el-color-success)";
  if (n >= 40) return "var(--el-color-warning)";
  return "var(--el-color-danger)";
}

/** 速率悬浮提示：标灰的不可信速率给出原因与总耗时口径近似值 */
export function speedTitle(row: any): string {
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

/** 解码窗口 = 总耗时 − 首字耗时；任一缺失或首字≥总耗时时退化为总耗时 */
export function decodeWindowMs(row: any): number | null {
  const total = Number(row?.sysAiUsageTotalLatency);
  const ttft = Number(row?.sysAiUsageFirstTokenLatency);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (Number.isFinite(ttft) && ttft > 0 && ttft < total) return total - ttft;
  return total;
}

/** 解码窗口着色：<1s 多为批量推送假象，标灰（与速率标灰同口径） */
export function decodeWindowColor(row: any): string {
  const ms = decodeWindowMs(row);
  if (ms == null || ms <= 0) return PLACEHOLDER;
  if (ms < 1000) return PLACEHOLDER;
  if (ms < 2000) return "var(--el-color-success)";
  if (ms < 6000) return "var(--el-color-warning)";
  return "var(--el-color-danger)";
}

export function latencyColor(ms: number | null | undefined, t: { ok: number; warn: number }): string {
  if (ms == null || ms <= 0) return PLACEHOLDER;
  if (ms < t.ok) return "var(--el-color-success)";
  if (ms < t.warn) return "var(--el-color-warning)";
  return "var(--el-color-danger)";
}

export function getFirstColor(row: any): string {
  return latencyColor(row?.sysAiUsageFirstTokenLatency, FIRST_THRESHOLDS);
}

export function getTotalColor(row: any): string {
  return latencyColor(row?.sysAiUsageTotalLatency, TOTAL_THRESHOLDS);
}

/** 缓存读取占总 Token 的比例（百分数，未夹取），不可算时返回 -1 */
export function cacheRateNum(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): number {
  const total = Number(row?.sysAiUsageTotalTokens) || 0;
  if (!(total > 0)) return -1;
  const cached = Number(row?.sysAiUsageCachedTokens) || 0;
  return Math.min(100, Math.max(0, (cached / total) * 100));
}

/** 缓存率进度条宽度（0–100）；不可算时画 0 宽，但文案会显示「—」 */
export function cacheRatePct(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): number {
  const v = cacheRateNum(row);
  return v < 0 ? 0 : v;
}

/** 缓存率文案，一位小数；不可算时显示「—」而不是 0.0% */
export function cacheRateText(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): string {
  const v = cacheRateNum(row);
  return v < 0 ? "—" : v.toFixed(1) + "%";
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

export function formatTypeLabel(t: string | null | undefined): string {
  if (t == null || t === "") return "—";
  const key = String(t).trim().replace(/-/g, "_").toLowerCase();
  return TYPE_LABEL_MAP[key] || t;
}

export function typeTagType(t: string | null | undefined): "primary" | "info" | "warning" | "success" {
  if (t === "chat_stream" || t === "chat") return "primary";
  if (t === "external" || t === "third_party") return "info";
  if (t === "memory_extract" || t === "summary") return "warning";
  return "success";
}

/** 调用类型（流式口径） */
export function callModeLabel(row: any): string {
  const t = String(row?.sysAiUsageType || row?.sysAiUsageCallType || "").toLowerCase();
  if (t.includes("non_stream") || t.includes("nostream") || t.includes("nonstream")) return "非流式";
  return "流式";
}

export function callModeTag(row: any): "success" | "info" {
  return callModeLabel(row) === "流式" ? "success" : "info";
}

/** 端点展示：统一加「入站:」前缀；缺失时兜底控制台默认对话端点 */
export function endpointDisplay(row: any): string {
  const ep = String(row?.sysAiUsageEndpoint || "").trim();
  return "入站:" + (ep || "/v1/chat/completions");
}
