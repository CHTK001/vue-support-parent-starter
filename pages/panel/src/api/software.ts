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

export interface SoftwarePreset {
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
  presetBuiltin?: number;
  presetDelete?: number;
  presetStatus?: number;
  presetSort?: number;
  presetRemark?: string;
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

export interface SoftwareDockerDefaults {
  image?: string;
  scriptMode?: DockerScriptMode;
  dockerfileContent?: string;
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
  preset: Pick<SoftwarePreset, "presetRemark"> | null | undefined,
): InstallMode[] => {
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
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL" | "PURGE";
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
}) =>
  http.request<
    ReturnResult<{
      portAvailable: boolean;
      conflictPorts: string[];
      alreadyInstalled: boolean;
      serverOs: string;
      serviceNameAvailable?: boolean;
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
export const fetchRuntimeLogs = (bindingId: number, tailLines?: number) =>
  http.request<ReturnResult<string[]>>(
    "get",
    "/v2/project/container/software/binding/runtime/logs",
    { params: { bindingId, tailLines } },
  );

export const checkDocker = (sysProjectId?: number) =>
  http.request<ReturnResult<{ available: boolean; version: string; message?: string }>>(
    "post",
    "/v2/project/container/software/binding/check-docker",
    { data: { sysProjectId } },
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

/** ─── Docker Registry ─────────────────────────────────────────────── */

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
