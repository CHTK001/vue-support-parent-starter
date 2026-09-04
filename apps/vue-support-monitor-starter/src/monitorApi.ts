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
