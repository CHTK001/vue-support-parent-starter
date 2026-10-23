/**
 * APM 告警 API（@repo/core）
 *
 * <p>顶栏告警角标的数据来源。与天气/台风不同，这类接口**不属于"可选增强"**：
 * 后端没引入 APM 时直接 404。因此这里刻意不登记到 BACKEND_CAPABILITIES，
 * 而是靠「app.yaml 的 other.toolbar.items 显式列出 alerts」作开关——
 * 应用写了就说明它的后端确实有 APM，不写则连请求都不会发。</p>
 *
 * <p>路径与返回结构对齐 {@code pages/hotsport/src/api/apmApi.ts}：
 * {@code GET /api/apm/alerts?limit=N} → {@code { code, msg, data: ApmAlert[] }}。
 * 那套客户端是 axios 实例 + 页面级配置源（可指向独立观测服务），
 * 顶栏只需要"当前同源后端的最新告警"，故在此用框架 http 重写一份最小实现，
 * 避免 theme 反向依赖 pages。</p>
 *
 * @since 4.0.0.43
 */
import { http } from "./index";
import type { ApiResult } from "./index";

/** 后端 APM 前缀（与页面层 APM_PREFIX 保持一致） */
export const APM_PREFIX = "/api/apm";

/** 告警事件列表路径 */
export const APM_ALERTS_PATH = `${APM_PREFIX}/alerts`;

/** 告警状态机 */
export type ApmAlertStatus = "OPEN" | "ACKNOWLEDGED" | "MUTED" | "IGNORED";

/** 告警级别 */
export type ApmAlertSeverity = "WARNING" | "CRITICAL";

/** 一条告警事件（与后端 ApmQueryService 返回结构对齐） */
export interface ApmAlert {
  id: number;
  /** 触发时间戳（毫秒） */
  ts: number;
  /** 指标名（如 heap.usage / error.rate） */
  metric: string;
  /** 当前值 */
  current: number;
  /** 阈值 */
  threshold: number;
  severity: ApmAlertSeverity;
  message: string;
  /** 状态机；后端未返回时按 OPEN 处理 */
  status?: ApmAlertStatus;
  statusTs?: number;
}

/**
 * 拉取最新告警事件（新的在前）。
 *
 * <p>失败一律静默返回空数组：顶栏是增强信息，后端没有 APM、网络抖动、
 * 未登录都只应表现为"没有角标"，不该弹提示或打断用户。</p>
 *
 * @param limit 拉取条数（用于统计未处置数量，默认 50）
 * @returns 告警列表；请求失败时返回空数组
 */
export async function getApmAlerts(limit = 50): Promise<ApmAlert[]> {
  try {
    const res = await http()
      .get(APM_ALERTS_PATH)
      .query({ limit })
      // 后端未引入 APM 时是 404，属预期情况，不要弹全局提示
      .noToast(true)
      .then<ApiResult<ApmAlert[]>>((r) => r.data);
    const data = res?.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * 统计"需要人处理"的告警。
 *
 * <p>只有 OPEN（以及后端没给 status 的历史数据）才算待处置：
 * ACKNOWLEDGED 是"已认领但未恢复"，MUTED / IGNORED 是用户主动静音，
 * 这三种都不该继续在顶栏红着。</p>
 *
 * @param alerts 告警列表
 * @returns 待处置数量与最高级别
 */
export function summarizeAlerts(alerts: readonly ApmAlert[]): {
  open: number;
  critical: number;
  warning: number;
  maxSeverity: ApmAlertSeverity | null;
} {
  let critical = 0;
  let warning = 0;
  for (const alert of alerts) {
    const status = alert?.status ?? "OPEN";
    if (status !== "OPEN") continue;
    if (alert.severity === "CRITICAL") critical++;
    else warning++;
  }
  const open = critical + warning;
  return {
    open,
    critical,
    warning,
    maxSeverity: critical > 0 ? "CRITICAL" : warning > 0 ? "WARNING" : null,
  };
}
