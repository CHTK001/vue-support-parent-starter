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
