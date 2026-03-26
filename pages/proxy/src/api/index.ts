export interface ProxyServer {
  systemServerId?: number;
  systemServerName?: string;
  systemServerHost?: string;
  systemServerPort?: number;
  systemServerType?: string;
  systemServerContextPath?: string;
  systemServerStatus?:
    | "STOPPED"
    | "RUNNING"
    | "STARTING"
    | "STOPPING"
    | "ERROR";
  systemServerDescription?: string;
  systemServerConfig?: string;
  systemServerAutoStart?: boolean;
  systemServerMaxConnections?: number;
  systemServerTimeout?: number;
  filterCount?: number;
  createTime?: string;
  updateTime?: string;
}

export interface ProxyServerPage {
  records: ProxyServer[];
  total: number;
}

export interface ProxyServerStatistics {
  total: number;
  running: number;
  stopped: number;
  error: number;
}

export interface ProxyServerTypeOption {
  name?: string;
  value?: string;
  label?: string;
  displayName?: string;
  describe?: string;
  describeType?: string;
  describeDetail?: string;
  supportedTypes?: string[];
}

export interface ProxyServerSetting {
  systemServerSettingId?: number;
  systemServerSettingServerId?: number;
  systemServerSettingName?: string;
  systemServerSettingType?: string;
  systemServerSettingDescription?: string;
  systemServerSettingEnabled?: boolean;
  systemServerSettingOrder?: number;
  systemServerSettingConfig?: string;
  systemServerSettingClassName?: string;
  systemServerSettingVersion?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ProxyServerLog {
  id?: number;
  serverId?: number;
  filterType?: string;
  processStatus?: string;
  clientIp?: string;
  clientGeo?: string;
  accessTime?: string;
  durationMs?: number;
  storeTime?: string;
}

export function resolveProxyOptionValue(
  option: ProxyServerTypeOption | string,
) {
  if (typeof option === "string") {
    return option;
  }
  return (
    option.value || option.name || option.label || option.displayName || ""
  );
}

export function resolveProxyOptionLabel(
  option: ProxyServerTypeOption | string,
) {
  if (typeof option === "string") {
    return option;
  }
  return (
    option.label ||
    option.displayName ||
    option.name ||
    option.value ||
    "未命名类型"
  );
}
