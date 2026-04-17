export type Task = Record<string, any>;
export type LogRecord = Record<string, any>;

export type RailTabName = "overview" | "detail" | "logs" | "settings";

export interface JobConsoleProps {
  defaultApiRoot: string;
  storageKey: string;
}

export interface JobConsoleSettings {
  apiRoot: string;
  authHeaderName: string;
  authHeaderValue: string;
}

export interface JobConsoleForm {
  jobNo: string;
  jobName: string;
  jobScheduleType: string;
  jobScheduleTime: string;
  jobGlueType: string;
  jobGlueSource: string;
  jobExecuteBean: string;
  jobDispatchMode: string;
  jobStorageMode: string;
  jobTriggerStatus: string;
  jobAuthor: string;
  jobDesc: string;
}

export interface ConsoleMetricItem {
  label: string;
  value: string | number;
}
