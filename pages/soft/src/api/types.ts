export interface SoftRepositorySource {
  sourceName?: string;
  sourceType:
    | "MANUAL"
    | "HTTP_JSON"
    | "HTTP_DIR"
    | "LOCAL_DIR"
    | "RPM_REPO"
    | "MIRROR_REPO";
  sourceUrl?: string;
  localDirectory?: string;
  enabled?: boolean;
  sourceConfig?: string;
}

export interface SoftRepository {
  softRepositoryId?: number;
  repositoryName: string;
  repositoryCode: string;
  repositoryType:
    | "MANUAL"
    | "HTTP_JSON"
    | "HTTP_DIR"
    | "LOCAL_DIR"
    | "RPM_REPO"
    | "MIRROR_REPO";
  repositoryUrl?: string;
  localDirectory?: string;
  authType?: string;
  username?: string;
  password?: string;
  token?: string;
  syncCron?: string;
  syncConfig?: string;
  sourceConfigsJson?: string;
  sourceConfigs?: SoftRepositorySource[];
  enabled?: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
}

export interface SoftRepositoryUploadFile {
  fileName?: string;
  localPath?: string;
  size?: number;
}

export interface SoftRepositoryUploadResult {
  repository?: SoftRepository;
  savedFiles?: SoftRepositoryUploadFile[];
  localDirectory?: string;
  message?: string;
}

export interface SoftPackage {
  softPackageId?: number;
  softRepositoryId?: number;
  packageCode: string;
  packageName: string;
  packageCategory?: string;
  profileCode?: string;
  softPackageProfileId?: number;
  osType?: string;
  architecture?: string;
  description?: string;
  iconUrl?: string;
  softwareKey?: string;
}

export interface SoftPackageVersion {
  softPackageVersionId?: number;
  softPackageId?: number;
  versionCode: string;
  versionName: string;
  downloadUrlsJson?: string;
  md5?: string;
  sha256?: string;
  installScript?: string;
  uninstallScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  serviceRegisterScript?: string;
  serviceUnregisterScript?: string;
  logPathsJson?: string;
  configPathsJson?: string;
  capabilityFlagsJson?: string;
  metadataJson?: string;
  enabled?: boolean;
  downloadUrls?: string[];
  packageCode?: string;
  logPaths?: string[];
  configPaths?: string[];
  capabilityFlags?: string[];
}

export interface SoftTarget {
  softTargetId?: number;
  targetName: string;
  targetCode: string;
  targetType: "LOCAL" | "SSH" | "WINRM";
  osType?: string;
  architecture?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  baseDirectory?: string;
  enabled?: boolean;
  description?: string;
  metadataJson?: string;
}

export interface SoftInstallation {
  softInstallationId?: number;
  softPackageId?: number;
  softPackageVersionId?: number;
  softTargetId?: number;
  installationName: string;
  installPath?: string;
  serviceName?: string;
  installOptionsJson?: string;
  serviceOptionsJson?: string;
  configOptionsJson?: string;
  templateSummaryJson?: string;
  installStatus?: string;
  runtimeStatus?: string;
  installedVersion?: string;
  installedTime?: string;
  lastOperationTime?: string;
  lastOperationMessage?: string;
  packageName?: string;
  versionName?: string;
  targetName?: string;
}

export interface SoftOperationLog {
  softOperationLogId?: number;
  softInstallationId?: number;
  softTargetId?: number;
  softPackageVersionId?: number;
  operationType?: string;
  operationStatus?: string;
  operationStage?: string;
  progressPercent?: number;
  operationCommand?: string;
  operationMessage?: string;
  detailMessage?: string;
  operationOutput?: string;
  startTime?: string;
  endTime?: string;
}

export interface SoftConfigSnapshot {
  softConfigSnapshotId?: number;
  softInstallationId?: number;
  configPath?: string;
  snapshotName?: string;
  configContent?: string;
  operationRemark?: string;
  createTime?: string;
}

export interface SoftPackageDetail {
  package: SoftPackage;
  versions: SoftPackageVersion[];
}

export interface SoftPackageVersionUpdateResult {
  package: SoftPackage;
  version: SoftPackageVersion;
}

export interface SoftGuideField {
  fieldKey: string;
  fieldLabel?: string;
  fieldScope?: "install" | "service" | "config" | string;
  componentType?: string;
  groupName?: string;
  fieldDescription?: string;
  sortOrder?: number;
  requiredFlag?: boolean;
  defaultValue?: unknown;
  options?: Array<Record<string, unknown>>;
  validation?: Record<string, unknown>;
  condition?: Record<string, unknown>;
  targetPath?: string;
  metadata?: Record<string, unknown>;
}

export interface SoftGuideTemplate {
  templateScope?: string;
  templateCode?: string;
  templateName?: string;
  templatePath?: string;
  templateEngine?: string;
  templateContent?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface SoftPackageGuide {
  softPackageId?: number;
  softPackageVersionId?: number;
  softPackageProfileId?: number;
  profileCode?: string;
  profileName?: string;
  installFields: SoftGuideField[];
  serviceFields: SoftGuideField[];
  configFields: SoftGuideField[];
  templates: SoftGuideTemplate[];
  versionOverrides?: Record<string, unknown>;
}

export interface SoftRenderedConfigFile {
  templateCode?: string;
  templateName?: string;
  templatePath?: string;
  content?: string;
}

export interface SoftGuidePreviewRequest {
  softPackageVersionId?: number;
  softTargetId?: number;
  installationName?: string;
  installPath?: string;
  serviceName?: string;
  installOptions?: Record<string, unknown>;
  serviceOptions?: Record<string, unknown>;
  configOptions?: Record<string, unknown>;
}

export interface SoftGuidePreviewResponse {
  resolvedVariables?: Record<string, unknown>;
  renderedScripts?: Record<string, string>;
  renderedConfigFiles?: SoftRenderedConfigFile[];
  logPaths?: string[];
  configPaths?: string[];
  templateSummaryJson?: string;
}

export interface SoftInstallationDetail {
  installation: SoftInstallation;
  package: SoftPackage;
  version: SoftPackageVersion;
  target: SoftTarget;
  snapshots: SoftConfigSnapshot[];
}

export interface SoftInstallRequest {
  softPackageId: number;
  softPackageVersionId: number;
  softTargetId: number;
  installationName?: string;
  installPath?: string;
  serviceName?: string;
  installOptions?: Record<string, unknown>;
  serviceOptions?: Record<string, unknown>;
  configOptions?: Record<string, unknown>;
}

export interface SoftConfigResponse {
  configPath?: string;
  configContent?: string;
  availableConfigPaths: string[];
}

export interface SoftConfigWriteRequest {
  configPath?: string;
  configContent: string;
  snapshotName?: string;
  operationRemark?: string;
}

export interface SoftLogResponse {
  logPath?: string;
  lines: string[];
}

export interface SoftOperationTicket {
  operationId: number;
  installationId?: number;
  operationType?: string;
  operationStatus?: string;
  acceptedAt?: string;
}

export interface SoftLogWatchTicket {
  watchId: number;
  installationId: number;
  logPath?: string;
  acceptedAt?: string;
}

export interface SoftRealtimePayload {
  operationId?: number;
  installationId?: number;
  operationType?: string;
  status?: string;
  stage?: string;
  progressPercent?: number;
  message?: string;
  detail?: string;
  line?: string;
  targetType?: string;
  packageCode?: string;
  versionCode?: string;
  finished?: boolean;
}

export interface SoftRealtimeEnvelope {
  module: "SOFT";
  event:
    | "INSTALL_PROGRESS"
    | "INSTALL_LOG"
    | "OPERATION_UPDATE"
    | "RUNTIME_LOG";
  dataId?: string | number;
  data: SoftRealtimePayload;
  timestamp?: number | string;
}
