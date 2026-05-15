import { http, type ReturnResult } from "@repo/utils";

/** 软件分类显示标签映射 */
export const SOFTWARE_CATEGORY_LABELS: Record<string, string> = {
  database: "数据库",
  middleware: "中间件",
  language: "开发语言",
  devops: "运维工具",
  remote: "远程桌面",
  webserver: "Web 服务",
  ops: "运维工具",
};

/**
 * 获取分类显示名称，未知分类返回原值
 */
export const getCategoryLabel = (category?: string): string => {
  if (!category) return "未分类";
  return SOFTWARE_CATEGORY_LABELS[category] || category;
};

/** 预设类型枚举 */
export const PRESET_TYPES: Record<string, string> = {
  ENVIRONMENT: "环境引擎",
  SOFTWARE: "应用软件",
  DOCKERFILE: "Dockerfile构建",
};

/** 获取预设类型显示名称 */
export const getPresetTypeLabel = (type?: string): string => {
  if (!type) return "未知";
  return PRESET_TYPES[type] || type;
};

export interface SoftwarePreset {
  sysProjectContainerSoftwarePresetId?: number;
  softwareCode?: string;
  softwareName?: string;
  serviceName?: string;
  softwareCategory?: string;
  presetType?: string;
  softwareVersion?: string;
  softwareIcon?: string;
  softwareVendor?: string;
  osType?: string;
  softwareArch?: string;
  installPath?: string;
  exposePorts?: string;
  installScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  uninstallScript?: string;
  presetBuiltin?: number;
  presetDelete?: number;
  presetStatus?: number;
  presetSort?: number;
  presetRemark?: string;
  hasPortMapping?: number;
  systemEnvVars?: string;
  dockerEnvVars?: string;
}

export interface SoftwareBinding {
  sysProjectContainerSoftwareBindingId?: number;
  sysProjectId?: number;
  sysProjectContainerSoftwarePresetId?: number;
  softwareCode?: string;
  softwareName?: string;
  serviceName?: string;
  softwareCategory?: string;
  softwareVersion?: string;
  softwareIcon?: string;
  softwareVendor?: string;
  osType?: string;
  softwareArch?: string;
  installPath?: string;
  exposePorts?: string;
  installScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  uninstallScript?: string;
  installStatus?: string;
  runtimeStatus?: string;
  bindingCustom?: number;
  bindingDelete?: number;
  bindingStatus?: number;
  bindingSort?: number;
  bindingRemark?: string;
  hasPortMapping?: number;
  systemEnvVars?: string;
  dockerEnvVars?: string;
  createTime?: string;
  updateTime?: string;
}

export interface SoftwareOperationTicket {
  operationId: string;
  sysProjectId?: number;
  sysProjectContainerSoftwareBindingId?: number;
  action?: string;
  operationStatus?: string;
  progressPercent?: number;
  message?: string;
}

export interface ConfigFieldDef {
  fieldKey: string;
  fieldLabel: string;
  componentType: "input" | "select" | "switch" | "number" | "password";
  groupName: string;
  requiredFlag: boolean;
  defaultValue?: string;
  description?: string;
  options?: { label: string; value: string }[];
}

export type InstallMode = "SYSTEM" | "DOCKER";
export type DockerScriptMode = "script" | "dockerfile";

export interface SoftwareScriptSet {
  installScript: string;
  startScript: string;
  stopScript: string;
  restartScript: string;
  statusScript: string;
  uninstallScript: string;
}

export interface VolumeMapping {
  hostPath: string;
  containerPath: string;
  readOnly?: boolean;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
}

export interface SoftwareDockerDefaults {
  image?: string;
  tags?: string[];
  scriptMode?: DockerScriptMode;
  dockerfileContent?: string;
  env?: Record<string, string>;
  envDescriptions?: Record<string, string>;
  volumeMappings?: VolumeMapping[];
}

export const normalizeDockerScriptMode = (
  value?: string | null,
): DockerScriptMode => (value === "dockerfile" ? "dockerfile" : "script");

export interface SoftwarePresetRemarkData {
  description?: string;
  serviceName?: string;
  supportedModes?: InstallMode[];
  configFields?: ConfigFieldDef[];
  modeConfigFields?: Partial<Record<InstallMode, ConfigFieldDef[]>>;
  modeScripts?: Partial<Record<InstallMode, Partial<SoftwareScriptSet>>>;
  dockerDefaults?: SoftwareDockerDefaults;
}

export const getPresetSupportedModes = (
  preset: { presetRemark?: string; presetType?: string } | null | undefined,
): InstallMode[] => {
  if (preset?.presetType === "DOCKERFILE") {
    return ["DOCKER"];
  }
  if (preset?.presetType === "ENVIRONMENT") {
    return ["SYSTEM"];
  }
  const remark = parseSoftwarePresetRemark(preset?.presetRemark);
  if (remark.supportedModes?.length) {
    return remark.supportedModes.filter(
      (mode): mode is InstallMode => mode === "SYSTEM" || mode === "DOCKER",
    );
  }
  return ["SYSTEM", "DOCKER"];
};

export const createEmptyScriptSet = (): SoftwareScriptSet => ({
  installScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  uninstallScript: "",
});

const normalizeScriptSet = (
  scriptSet?: Partial<SoftwareScriptSet> | null,
): SoftwareScriptSet => ({
  installScript: scriptSet?.installScript || "",
  startScript: scriptSet?.startScript || "",
  stopScript: scriptSet?.stopScript || "",
  restartScript: scriptSet?.restartScript || "",
  statusScript: scriptSet?.statusScript || "",
  uninstallScript: scriptSet?.uninstallScript || "",
});

export const parseSoftwarePresetRemark = (
  remark?: string | null,
): SoftwarePresetRemarkData => {
  if (!remark) return {};
  try {
    const parsed = JSON.parse(remark);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SoftwarePresetRemarkData;
  } catch {
    return { description: remark };
  }
};

export const stringifySoftwarePresetRemark = (
  remark: SoftwarePresetRemarkData,
): string => JSON.stringify(remark);

export const getPresetModeConfigFields = (
  preset: Pick<SoftwarePreset, "presetRemark"> | null | undefined,
  mode: InstallMode,
): ConfigFieldDef[] => {
  if (!getPresetSupportedModes(preset).includes(mode)) {
    return [];
  }
  const remark = parseSoftwarePresetRemark(preset?.presetRemark);
  return remark.modeConfigFields?.[mode] || remark.configFields || [];
};

export const getPresetModeScripts = (
  preset: Partial<SoftwarePreset> | null | undefined,
  mode: InstallMode,
): SoftwareScriptSet => {
  if (!getPresetSupportedModes(preset as Pick<SoftwarePreset, "presetRemark">).includes(mode)) {
    return createEmptyScriptSet();
  }
  const remark = parseSoftwarePresetRemark(preset?.presetRemark);
  const modeScripts = remark.modeScripts?.[mode];
  if (modeScripts) {
    return normalizeScriptSet(modeScripts);
  }
  return normalizeScriptSet({
    installScript: preset?.installScript,
    startScript: preset?.startScript,
    stopScript: preset?.stopScript,
    restartScript: preset?.restartScript,
    statusScript: preset?.statusScript,
    uninstallScript: preset?.uninstallScript,
  });
};

export const hasCompletePresetMode = (
  preset: Partial<SoftwarePreset> | null | undefined,
  mode: InstallMode,
): boolean => {
  if (!getPresetSupportedModes(preset as Pick<SoftwarePreset, "presetRemark">).includes(mode)) {
    return false;
  }
  const scripts = getPresetModeScripts(preset, mode);
  return Object.values(scripts).every((value) => value.trim());
};

export const fetchPresetList = (params?: {
  softwareName?: string;
  presetStatus?: number;
  presetDelete?: number;
}) =>
  http.request<ReturnResult<SoftwarePreset[]>>(
    "get",
    "/v2/project/container/software/preset/list",
    { params },
  );

export const fetchPresetPage = (params: {
  page?: number;
  size?: number;
  softwareName?: string;
  softwareCategory?: string;
}) =>
  http.request<ReturnResult<{ records: SoftwarePreset[]; total: number }>>(
    "get",
    "/v2/project/container/software/preset/page",
    { params },
  );

export const savePreset = (data: Partial<SoftwarePreset>) =>
  http.request<ReturnResult<SoftwarePreset>>(
    "post",
    "/v2/project/container/software/preset/save",
    { data },
  );

export const updatePreset = (data: Partial<SoftwarePreset>) =>
  http.request<ReturnResult<boolean>>(
    "put",
    "/v2/project/container/software/preset/update",
    { data },
  );

export const deletePreset = (id: number) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    "/v2/project/container/software/preset/delete",
    { params: { sysProjectContainerSoftwarePresetId: id } },
  );

export const fetchBindingList = (sysProjectId?: number) =>
  http.request<ReturnResult<SoftwareBinding[]>>(
    "get",
    "/v2/project/container/software/binding/project/list",
    { params: { sysProjectId }, showLoading: false },
  );

export const fetchBindingPage = (params: {
  page?: number;
  size?: number;
  sysProjectId?: number;
  softwareName?: string;
}) =>
  http.request<ReturnResult<{ records: SoftwareBinding[]; total: number }>>(
    "get",
    "/v2/project/container/software/binding/page",
    { params },
  );

export const importPreset = (params: {
  sysProjectId?: number;
  sysProjectContainerSoftwarePresetId: number;
  serviceName?: string;
  exposePorts?: string;
  bindingRemark?: string;
}) =>
  http.request<ReturnResult<SoftwareBinding>>(
    "post",
    "/v2/project/container/software/binding/importPreset",
    { data: params },
  );

export const saveBinding = (params: Partial<SoftwareBinding>) =>
  http.request<ReturnResult<SoftwareBinding>>(
    "post",
    "/v2/project/container/software/binding/save",
    { data: params },
  );

export const updateBinding = (params: Partial<SoftwareBinding>) =>
  http.request<ReturnResult<boolean>>(
    "put",
    "/v2/project/container/software/binding/update",
    { data: params },
  );

export const deleteBinding = (id: number) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    "/v2/project/container/software/binding/delete",
    { params: { sysProjectContainerSoftwareBindingId: id } },
  );

export const operateBinding = (params: {
  sysProjectContainerSoftwareBindingId: number;
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL" | "PURGE" | "ENABLE_AUTOSTART" | "DISABLE_AUTOSTART";
  connectionId?: string;
}) =>
  http.request<ReturnResult<SoftwareOperationTicket>>(
    "post",
    "/v2/project/container/software/binding/operate",
    { data: params },
  );

export const reconfigureBinding = (params: {
  sysProjectContainerSoftwareBindingId: number;
  configValues: Record<string, any>;
}) =>
  http.request<ReturnResult<{
    success: boolean;
    message: string;
    configFilePath?: string;
    configWritten?: boolean;
    restartCommand?: string;
  }>>("post", "/v2/project/container/software/binding/reconfigure", {
    data: params,
  });

export const checkRequirements = (params: {
  exposePorts?: string;
  softwareName?: string;
  serviceName?: string;
  serverId?: number;
  installMode?: InstallMode;
  dockerImage?: string;
  /** 重装时传入当前绑定 ID，排除自身冲突 */
  excludeBindingId?: number;
  /** 项目 ID（用于 DB 级别冲突检查） */
  sysProjectId?: number;
  /** Docker API 连接 ID（用于实时检查 Docker 守护进程、容器名、端口） */
  connectionId?: string;
}) =>
  http.request<
    ReturnResult<{
      portAvailable: boolean;
      conflictPorts: string[];
      alreadyInstalled: boolean;
      serverOs: string;
      serviceNameAvailable?: boolean;
      daemonAvailable?: boolean;
      imageAvailable?: boolean;
      containerNameAvailable?: boolean;
      conflictVolumes?: string[];
      daemonMessage?: string;
    }>
  >("post", "/v2/project/container/software/binding/check-requirements", {
    data: params,
  });

export const fetchOperationLogs = (params: {
  bindingId: number;
  action: string;
  operationId?: string;
}) =>
  http.request<ReturnResult<string[]>>(
    "get",
    "/v2/project/container/software/binding/operation/logs",
    { params },
  );

/** 获取服务运行日志 */
export const fetchRuntimeLogs = (bindingId: number, tailLines?: number, connectionId?: string) =>
  http.request<ReturnResult<string[]>>(
    "get",
    "/v2/project/container/software/binding/runtime/logs",
    { params: { bindingId, tailLines, connectionId } },
  );

export const checkDocker = (sysProjectId?: number, connectionId?: string) =>
  http.request<ReturnResult<{ available: boolean; version: string; message?: string; apiVersion?: string }>>(
    "post",
    "/v2/project/container/software/binding/check-docker",
    { data: { sysProjectId, connectionId } },
  );

export const aiAnalyzeFailure = (params: {
  operationId: string;
  logs: string[];
  softwareName: string;
}) =>
  http.request<
    ReturnResult<{
      analysis: string;
      suggestedFix: string;
      autoFixScript?: string;
    }>
  >("post", "/v2/project/container/software/binding/operation/ai-analyze", {
    data: params,
  });

/** 在 Docker 容器中执行命令 */
export const dockerExec = (bindingId: number, command: string, connectionId?: string) =>
  http.request<ReturnResult<{ output: string; exitCode: number; success: boolean }>>(
    "post",
    "/v2/project/container/software/binding/docker-exec",
    { data: { bindingId, command, connectionId } },
  );

/** 获取容器实时统计信息（CPU/内存/网络） */
export const fetchContainerStats = (bindingId: number, connectionId?: string) =>
  http.request<
    ReturnResult<{
      cpuPercent?: number;
      memoryUsage?: number;
      memoryLimit?: number;
      networkRx?: number;
      networkTx?: number;
      available?: boolean;
      containerName?: string;
      timestamp?: string;
      message?: string;
    }>
  >("get", "/v2/project/container/software/binding/stats", {
    params: { bindingId, connectionId },
    showLoading: false,
  });

export interface DockerRegistry {
  id?: number;
  registryName: string;
  registryUrl: string;
  namespace?: string;
  username?: string;
  password?: string;
  defaultFlag?: number;
  enabled?: number;
  createTime?: string;
  updateTime?: string;
}

export const fetchRegistryList = (params?: { keyword?: string; enabled?: boolean }) =>
  http.request<ReturnResult<DockerRegistry[]>>(
    "get",
    "/docker/registries",
    { params },
  );

export const fetchRegistryDetail = (id: number) =>
  http.request<ReturnResult<DockerRegistry>>(
    "get",
    `/docker/registries/${id}`,
  );

export const createRegistry = (data: Partial<DockerRegistry>) =>
  http.request<ReturnResult<DockerRegistry>>(
    "post",
    "/docker/registries",
    { data },
  );

export const updateRegistry = (id: number, data: Partial<DockerRegistry>) =>
  http.request<ReturnResult<DockerRegistry>>(
    "put",
    `/docker/registries/${id}`,
    { data },
  );

export const deleteRegistry = (id: number) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `/docker/registries/${id}`,
  );

/** ─── Preset Suggestions ──────────────────────────────────────────── */

export interface PresetSuggestion {
  image?: string;
  tags?: string[];
  ports?: string;
  env?: Record<string, string>;
  envDescriptions?: Record<string, string>;
  volumes?: { hostPath: string; containerPath: string; readOnly?: boolean }[];
  installPath?: string;
  systemEnvVars?: string;
  softwareIcon?: string;
}

/** 软件官方 Logo URL 映射 */
export const SOFTWARE_LOGO_URLS: Record<string, string> = {
  mysql: "simple-icons:mysql",
  mariadb: "simple-icons:mariadb",
  postgresql: "simple-icons:postgresql",
  redis: "simple-icons:redis",
  "redis-stack": "simple-icons:redis",
  nginx: "simple-icons:nginx",
  mongodb: "simple-icons:mongodb",
  nacos: "simple-icons:nacos",
  kafka: "simple-icons:apachekafka",
  zookeeper: "simple-icons:apachezookeeper",
  minio: "simple-icons:minio",
  rabbitmq: "simple-icons:rabbitmq",
  elasticsearch: "simple-icons:elasticsearch",
  guacamole: "simple-icons:apacheguacamole",
};

/** 获取软件官方 Logo URL */
export const getSoftwareLogoUrl = (code?: string): string | undefined => {
  if (!code) return undefined;
  return SOFTWARE_LOGO_URLS[code.trim().toLowerCase()];
};

/**
 * Pre-configured defaults for well-known software.
 * Keyed by softwareCode (lowercase).
 */
export const PRESET_SUGGESTIONS: Record<string, PresetSuggestion> = {
  mysql: {
    image: "mysql:8.0",
    tags: ["5.7", "8.0", "8.4", "9.0", "latest"],
    ports: "3306",
    env: {
      MYSQL_ROOT_PASSWORD: "root123456",
      MYSQL_DATABASE: "myapp",
      MYSQL_USER: "appuser",
      MYSQL_PASSWORD: "apppass",
      TZ: "Asia/Shanghai",
      character_set_server: "utf8mb4",
      collation_server: "utf8mb4_unicode_ci",
      lower_case_table_names: "1",
      max_connections: "200",
    },
    volumes: [
      { hostPath: "/data/mysql/data", containerPath: "/var/lib/mysql" },
      { hostPath: "/data/mysql/conf", containerPath: "/etc/mysql/conf.d" },
      { hostPath: "/data/mysql/init", containerPath: "/docker-entrypoint-initdb.d" },
    ],
    installPath: "/usr/local/mysql",
    systemEnvVars: '{"MYSQL_HOME": "/usr/local/mysql", "PATH": "/usr/local/mysql/bin:$PATH"}',
    softwareIcon: "simple-icons:mysql",
  },
  mariadb: {
    image: "mariadb:11",
    ports: "3306",
    env: {
      MYSQL_ROOT_PASSWORD: "root123456",
      MYSQL_DATABASE: "myapp",
      TZ: "Asia/Shanghai",
      character_set_server: "utf8mb4",
      collation_server: "utf8mb4_unicode_ci",
      lower_case_table_names: "1",
    },
    volumes: [
      { hostPath: "/data/mariadb/data", containerPath: "/var/lib/mysql" },
      { hostPath: "/data/mariadb/conf", containerPath: "/etc/mysql/conf.d" },
    ],
    installPath: "/usr/local/mariadb",
    softwareIcon: "simple-icons:mariadb",
  },
  postgresql: {
    image: "postgres:16",
    ports: "5432",
    env: {
      POSTGRES_PASSWORD: "postgres123",
      POSTGRES_DB: "myapp",
      TZ: "Asia/Shanghai",
    },
    volumes: [
      { hostPath: "/data/postgresql/data", containerPath: "/var/lib/postgresql/data" },
      { hostPath: "/data/postgresql/init", containerPath: "/docker-entrypoint-initdb.d" },
    ],
    installPath: "/usr/local/pgsql",
    softwareIcon: "simple-icons:postgresql",
  },
  redis: {
    image: "redis",
    tags: ["7-alpine", "7", "8-alpine", "8", "alpine", "latest"],
    ports: "6379",
    env: { TZ: "Asia/Shanghai" },
    volumes: [
      { hostPath: "/data/redis/data", containerPath: "/data" },
      { hostPath: "/data/redis/conf", containerPath: "/etc/redis" },
    ],
    installPath: "/usr/local/redis",
    softwareIcon: "simple-icons:redis",
  },
  "redis-stack": {
    image: "redis/redis-stack-server",
    tags: ["latest"],
    ports: "6379,8001",
    env: {
      REDIS_ARGS: "--requirepass redis123",
      TZ: "Asia/Shanghai",
    },
    volumes: [
      { hostPath: "/data/redis-stack/data", containerPath: "/data" },
    ],
    installPath: "/usr/local/redis-stack",
    softwareIcon: "simple-icons:redis",
  },
  nginx: {
    image: "nginx",
    tags: ["1.24", "1.25", "alpine", "latest", "alpine-perl"],
    ports: "80,443",
    env: { TZ: "Asia/Shanghai" },
    volumes: [
      { hostPath: "/data/nginx/html", containerPath: "/usr/share/nginx/html" },
      { hostPath: "/data/nginx/conf", containerPath: "/etc/nginx/conf.d" },
      { hostPath: "/data/nginx/logs", containerPath: "/var/log/nginx" },
    ],
    installPath: "/usr/local/nginx",
    softwareIcon: "simple-icons:nginx",
  },
  mongodb: {
    image: "mongo:7",
    ports: "27017",
    env: {
      MONGO_INITDB_ROOT_USERNAME: "admin",
      MONGO_INITDB_ROOT_PASSWORD: "admin123",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/mongodb/data", containerPath: "/data/db" }],
    installPath: "/usr/local/mongodb",
    softwareIcon: "simple-icons:mongodb",
  },
  nacos: {
    image: "nacos/nacos-server:v2.3",
    ports: "8848,9848",
    env: {
      MODE: "standalone",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/nacos/logs", containerPath: "/home/nacos/logs" }],
    installPath: "/usr/local/nacos",
    softwareIcon: "simple-icons:nacos",
  },
  zookeeper: {
    image: "bitnami/zookeeper",
    tags: ["3.8", "3.9", "latest"],
    ports: "2181",
    env: {
      ALLOW_ANONYMOUS_LOGIN: "yes",
      ZOO_MY_ID: "1",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/zookeeper/data", containerPath: "/bitnami/zookeeper" }],
    installPath: "/usr/local/zookeeper",
    softwareIcon: "simple-icons:apachezookeeper",
  },
  kafka: {
    image: "confluentinc/cp-kafka:7",
    ports: "9092",
    env: {
      KAFKA_BROKER_ID: "1",
      KAFKA_ZOOKEEPER_CONNECT: "zookeeper:2181",
      KAFKA_ADVERTISED_LISTENERS: "PLAINTEXT://localhost:9092",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/kafka/data", containerPath: "/var/lib/kafka/data" }],
    installPath: "/usr/local/kafka",
    softwareIcon: "simple-icons:apachekafka",
  },
  minio: {
    image: "minio/minio:latest",
    ports: "9000,9001",
    env: {
      MINIO_ROOT_USER: "minioadmin",
      MINIO_ROOT_PASSWORD: "minioadmin",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/minio/data", containerPath: "/data" }],
    installPath: "/usr/local/minio",
    softwareIcon: "simple-icons:minio",
  },
  rabbitmq: {
    image: "rabbitmq:3-management",
    ports: "5672,15672",
    env: {
      RABBITMQ_DEFAULT_USER: "admin",
      RABBITMQ_DEFAULT_PASS: "admin123",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/rabbitmq/data", containerPath: "/var/lib/rabbitmq" }],
    installPath: "/usr/local/rabbitmq",
    softwareIcon: "simple-icons:rabbitmq",
  },
  elasticsearch: {
    image: "elasticsearch:8",
    ports: "9200,9300",
    env: {
      "discovery.type": "single-node",
      ES_JAVA_OPTS: "-Xms512m -Xmx512m",
      TZ: "Asia/Shanghai",
    },
    volumes: [{ hostPath: "/data/elasticsearch/data", containerPath: "/usr/share/elasticsearch/data" }],
    installPath: "/usr/local/elasticsearch",
    softwareIcon: "simple-icons:elasticsearch",
  },
  guacamole: {
    image: "guacamole/guacamole",
    tags: ["1.5.5", "latest"],
    ports: "8080",
    env: {
      GUACD_HOSTNAME: "guacd",
      MYSQL_HOSTNAME: "mysql",
      MYSQL_PORT: "3306",
      MYSQL_DATABASE: "guacamole_db",
      MYSQL_USER: "guacamole_user",
      MYSQL_PASSWORD: "guacamole_pass",
      TZ: "Asia/Shanghai",
    },
    volumes: [
      { hostPath: "/data/guacamole/config", containerPath: "/config" },
      { hostPath: "/data/guacamole/recordings", containerPath: "/recordings" },
    ],
    installPath: "/usr/local/guacamole",
    softwareIcon: "simple-icons:apacheguacamole",
  },
};

/** Get preset suggestions for a given software code */
export const getPresetSuggestions = (softwareCode?: string): PresetSuggestion | null => {
  if (!softwareCode) return null;
  const key = softwareCode.trim().toLowerCase();
  return PRESET_SUGGESTIONS[key] || null;
};
