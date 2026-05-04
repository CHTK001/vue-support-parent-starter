import { http, type ReturnResult } from "@repo/utils";

export interface ProjectContainerSoftwarePreset {
  sysProjectContainerSoftwarePresetId?: number;
  softwareCode?: string;
  softwareName?: string;
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

export interface ProjectContainerSoftwareBinding {
  sysProjectContainerSoftwareBindingId?: number;
  sysProjectId?: number;
  sysProjectContainerSoftwarePresetId?: number;
  softwareCode?: string;
  softwareName?: string;
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

export interface ProjectContainerSoftwareOperationTicket {
  operationId: string;
  sysProjectId?: number;
  sysProjectContainerSoftwareBindingId?: number;
  action?: string;
  operationStatus?: string;
  progressPercent?: number;
  message?: string;
}

export interface ProjectContainerSoftwareTopologyStepRequest {
  sysProjectContainerSoftwareBindingId: number;
  nodeKind?: "SOFTWARE" | "PROJECT";
  remoteProjectId?: string;
  order?: number;
  required?: boolean;
  failurePolicy?: "stop" | "continue";
  startDelaySec?: number;
  label?: string;
}

export interface ProjectContainerSoftwareTopologyOperationRequest {
  sysProjectId: number;
  action: "START" | "STOP" | "RESTART";
  steps: ProjectContainerSoftwareTopologyStepRequest[];
}

export interface ProjectContainerServiceTopology {
  sysProjectContainerServiceTopologyId?: number;
  sysProjectId?: number;
  topologyName?: string;
  editorNodesJson?: string;
  editorEdgesJson?: string;
  importedProjectsJson?: string;
  nodeConfigJson?: string;
  topologyDelete?: number;
  topologyStatus?: number;
  topologyRemark?: string;
}

export interface ProjectContainerSoftwareRealtimePayload {
  operationId?: string;
  action?: string;
  sysProjectId?: number;
  sysProjectContainerSoftwareBindingId?: number;
  softwareName?: string;
  softwareCode?: string;
  runtimeStatus?: string;
  installStatus?: string;
  progressPercent?: number;
  status?: string;
  message?: string;
  output?: string;
  exitCode?: number;
  stream?: string;
  line?: string;
  timestamp?: number;
}

export interface ProjectContainerSoftwareRealtimeEnvelope {
  module: "PROJECT";
  event:
    | "CONTAINER_SOFTWARE_PROGRESS"
    | "CONTAINER_SOFTWARE_LOG"
    | "CONTAINER_SOFTWARE_RESULT";
  dataId?: string | number;
  data: ProjectContainerSoftwareRealtimePayload;
  timestamp?: number | string;
}

export const fetchProjectContainerSoftwarePresetList = (params?: {
  softwareName?: string;
  presetStatus?: number;
  presetDelete?: number;
}) =>
  http.request<ReturnResult<ProjectContainerSoftwarePreset[]>>(
    "get",
    "/v2/project/container/software/preset/list",
    { params },
  );

export const fetchProjectContainerSoftwareBindingList = (sysProjectId: number) =>
  http.request<ReturnResult<ProjectContainerSoftwareBinding[]>>(
    "get",
    "/v2/project/container/software/binding/project/list",
    { params: { sysProjectId }, showLoading: false },
  );

export const fetchImportProjectContainerSoftwarePreset = (params: {
  sysProjectId: number;
  sysProjectContainerSoftwarePresetId: number;
  bindingRemark?: string;
}) =>
  http.request<ReturnResult<ProjectContainerSoftwareBinding>>(
    "post",
    "/v2/project/container/software/binding/importPreset",
    { data: params },
  );

export const fetchSaveProjectContainerSoftwareBinding = (
  params: Partial<ProjectContainerSoftwareBinding>,
) =>
  http.request<ReturnResult<ProjectContainerSoftwareBinding>>(
    "post",
    "/v2/project/container/software/binding/save",
    { data: params },
  );

export const fetchUpdateProjectContainerSoftwareBinding = (
  params: Partial<ProjectContainerSoftwareBinding>,
) =>
  http.request<ReturnResult<boolean>>(
    "put",
    "/v2/project/container/software/binding/update",
    { data: params },
  );

export const fetchDeleteProjectContainerSoftwareBinding = (
  sysProjectContainerSoftwareBindingId: number,
) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    "/v2/project/container/software/binding/delete",
    { params: { sysProjectContainerSoftwareBindingId } },
  );

export const fetchOperateProjectContainerSoftwareBinding = (params: {
  sysProjectContainerSoftwareBindingId: number;
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL";
}) =>
  http.request<ReturnResult<ProjectContainerSoftwareOperationTicket>>(
    "post",
    "/v2/project/container/software/binding/operate",
    { data: params },
  );

export const fetchOperateProjectContainerSoftwareTopology = (
  params: ProjectContainerSoftwareTopologyOperationRequest,
) =>
  http.request<ReturnResult<ProjectContainerSoftwareOperationTicket>>(
    "post",
    "/v2/project/container/software/binding/topology/operate",
    { data: params },
  );

export const fetchProjectContainerServiceTopologyDetail = (sysProjectId: number) =>
  http.request<ReturnResult<ProjectContainerServiceTopology>>(
    "get",
    "/v2/project/container/service/topology/detail",
    { params: { sysProjectId }, showLoading: false },
  );

export const fetchSaveProjectContainerServiceTopology = (
  params: Partial<ProjectContainerServiceTopology>,
) =>
  http.request<ReturnResult<ProjectContainerServiceTopology>>(
    "post",
    "/v2/project/container/service/topology/save",
    { data: params },
  );
