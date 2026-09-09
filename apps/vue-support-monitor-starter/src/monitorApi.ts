import { http } from "@repo/core";
import { unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 监控项（/ms/monitor） */
export interface MonitorItem {
  id: number;
  monitorName: string;
  monitorHost: string;
  monitorPort: number;
  serviceType: string;
  serverType: string;
  monitorEnabled: number;
}

/** 告警事件（/ms/monitor/alarm/event） */
export interface AlarmEvent {
  id: number;
  msMonitorAlarmEventMonitorId: number;
  msMonitorAlarmEventMonitorName: string;
  msMonitorAlarmEventMetricName: string;
  msMonitorAlarmEventAlarmValue: number;
  msMonitorAlarmEventThreshold: number;
  msMonitorAlarmEventLevel: string;
  msMonitorAlarmEventStatus: string;
  msMonitorAlarmEventTriggerTime: string;
}

export const fetchMonitors = () =>
  http().get("/ms/monitor").then(r => unwrap<MonitorItem[]>(r));

export const fetchAlarmEvents = () =>
  http().get("/ms/monitor/alarm/event").then(r => unwrap<AlarmEvent[]>(r));

/** 处理告警事件（remark 备注，falseAlarm 标记误报）—— design.md §4.4 */
export const handleAlarmEvent = (id: number, remark: string, falseAlarm: boolean) =>
  http()
    .post(`/ms/monitor/alarm/event/${id}/handle?remark=${encodeURIComponent(remark)}&falseAlarm=${falseAlarm}`)
    .then(r => unwrap<boolean>(r));

/** 告警级别（P0~P4，兜底 P3） */
export function alarmLevel(e: AlarmEvent): string {
  const lv = String(e.msMonitorAlarmEventLevel || "").toUpperCase();
  return /^P[0-4]$/.test(lv) ? lv : "P3";
}

/** 是否未处理 */
export function isUnhandled(e: AlarmEvent): boolean {
  return String(e.msMonitorAlarmEventStatus || "").toUpperCase() === "NEW";
}

// ==================== 告警策略 / 规则（/ms/monitor/alarm） ====================

/** 告警策略 */
export interface AlarmPolicy {
  id: number;
  msMonitorAlarmPolicyName: string;
  msMonitorAlarmPolicyEnabled: number;
  msMonitorAlarmPolicyRemark: string;
}

/** 告警规则 */
export interface AlarmRule {
  id: number;
  msMonitorAlarmRulePolicyId: number;
  msMonitorAlarmRuleMonitorId: number | null;
  msMonitorAlarmRuleMetricName: string;
  msMonitorAlarmRuleCondition: string; // GT/GE/EQ/LE/LT
  msMonitorAlarmRuleThreshold: number;
  msMonitorAlarmRuleConsecutiveCount: number;
  msMonitorAlarmRuleSilenceMinutes: number;
  msMonitorAlarmRuleLevel: string; // P0~P4
  msMonitorAlarmRuleEnabled: number;
}

export const fetchAlarmPolicies = () =>
  http().get("/ms/monitor/alarm/policy").then(r => unwrap<AlarmPolicy[]>(r));
export const saveAlarmPolicy = (id: number | null, d: Partial<AlarmPolicy>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/policy/${id}`).data(d).then(r => unwrap<AlarmPolicy>(r))
    : http().post("/ms/monitor/alarm/policy").data(d).then(r => unwrap<AlarmPolicy>(r));
export const delAlarmPolicy = (id: number) =>
  http().delete(`/ms/monitor/alarm/policy/${id}`).then(r => unwrap<boolean>(r));

export const fetchAlarmRules = (policyId?: number) =>
  http()
    .get(`/ms/monitor/alarm/rule${policyId ? `?policyId=${policyId}` : ""}`)
    .then(r => unwrap<AlarmRule[]>(r));
export const saveAlarmRule = (id: number | null, d: Partial<AlarmRule>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/rule/${id}`).data(d).then(r => unwrap<AlarmRule>(r))
    : http().post("/ms/monitor/alarm/rule").data(d).then(r => unwrap<AlarmRule>(r));
export const delAlarmRule = (id: number) =>
  http().delete(`/ms/monitor/alarm/rule/${id}`).then(r => unwrap<boolean>(r));
export const testAlarmRule = (ruleId: number, metricName?: string, value?: number) =>
  http()
    .get(`/ms/monitor/alarm/rule/${ruleId}/test?metricName=${encodeURIComponent(metricName ?? "")}&value=${value ?? 0}`)
    .then(r => unwrap<boolean>(r));

// ==================== 系统 Redis 信息（当前应用自身连接的 Redis，与监控资产/Agent 无关） ====================

/** 当前系统 Redis 指标（INFO 解析后的 key 数值表） */
export interface SystemRedisInfo {
  connected_clients?: number;
  used_memory?: number;
  used_memory_human?: string;
  os?: string;
  redis_version?: string;
  uptime_in_seconds?: number;
  instantaneous_ops_per_sec?: number;
  keyspace_hits?: number;
  keyspace_misses?: number;
  total_connections_received?: number;
  total_commands_processed?: number;
  role?: string;
  [key: string]: number | string | undefined;
}

export const fetchSystemRedisInfo = () =>
  http()
    .get("/ms/monitor/system/redis-info")
    .then(r => unwrap<SystemRedisInfo | null>(r));
