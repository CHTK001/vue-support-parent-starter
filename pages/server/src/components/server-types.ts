import type {
  ServerFileEntry,
  ServerRemoteConsoleConfig,
  ServerServiceOperationLog,
  ServerService,
  ServerSoftInstallation,
  ServerSoftOperation,
  ServerHost,
  ServerMetricsSnapshot,
} from "../api";
import type { SoftGuideField } from "../../../soft/src/api";

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

export type GuideScope = "install" | "service" | "config";

export type GuideSection = {
  key: string;
  title: string;
  hint: string;
  scope: GuideScope;
  fields: SoftGuideField[];
};

export type ServerInstallTask = {
  operationId?: number;
  installationId?: number;
  status?: string;
  stage?: string;
  progressPercent?: number;
  message?: string;
};

export type FileViewMode = "list" | "tree";

export type ServerFileEntryCard = ServerFileEntry & {
  relativePath: string;
  icon: string;
};

export type ServerSoftInstallationCard = {
  item: ServerSoftInstallation;
  title: string;
  subtitle: string;
  backupCount: number;
  upgradeText: string;
  statusText: string;
  metaText: string;
};

export type ServerSoftServiceCard = {
  item: ServerService;
  title: string;
  subtitle: string;
  statusText: string;
  metaText: string;
  primaryChip: string;
  secondaryChip?: string;
  running: boolean;
  canRegister: boolean;
  canUnregister: boolean;
  loadingStatus: boolean;
  loadingStartStop: boolean;
  loadingRestart: boolean;
  loadingRegister: boolean;
  loadingUnregister: boolean;
};

export type ServerSoftOperationCard = {
  item: ServerSoftOperation;
  title: string;
  message: string;
  statusText: string;
  timeText: string;
};

export type ServerServiceLogCard = {
  item: ServerServiceOperationLog;
  title: string;
  createTime: string;
  success: boolean;
  message: string;
  aiReason?: string | null;
  aiSolution?: string | null;
  knowledgeId?: number | null;
  expireAt?: string | null;
  output: string;
};
