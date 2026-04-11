import type {
  ServerRemoteConsoleConfig,
  ServerHost,
  ServerMetricsSnapshot,
} from "../api";

export type ViewMode = "split" | "grid";

export type ServerMetricsViewMode = "summary" | "chart";

export type SelectOption = {
  label: string;
  value: string | number;
  icon?: string;
  description?: string;
  disabled?: boolean;
  [key: string]: unknown;
};

export type HostSoftSummary = {
  targets: number;
  installations: number;
  services: number;
};

export type ServerHostListEntry = {
  host: ServerHost;
  snapshot?: ServerMetricsSnapshot | null;
  summary: HostSoftSummary;
  remoteConfig?: ServerRemoteConsoleConfig | null;
};

export type RemoteGatewayFormModel = {
  inheritGlobal?: boolean;
  enabled: boolean;
  provider: string;
  gatewayUrl: string;
  protocol: string;
  launchPath: string;
  websocketPath: string;
  connectionId: string;
};
