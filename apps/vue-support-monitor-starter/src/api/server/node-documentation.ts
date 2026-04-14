export interface ApiParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie" | string;
  required: boolean;
  type?: string;
  description?: string;
}

export interface ApiInfo {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: ApiParameter[];
}

export interface ApiGroup {
  name: string;
  apis: ApiInfo[];
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  data: unknown;
  duration?: number;
}

export interface NodeApiExecuteRequest {
  nodeId: string;
  nodeAddress: string;
  contextPath?: string;
  api: ApiInfo;
  pathParams?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
  requestBody?: unknown;
  headers?: Record<string, string>;
}

export interface NodeApiResult<T> {
  success: boolean;
  msg?: string;
  data: T;
}

const removedHint =
  "pages/doc 已移除，节点文档改为 doc-v2 iframe 模式。";

export async function fetchNodeApiDocs(): Promise<NodeApiResult<ApiGroup[]>> {
  return {
    success: false,
    msg: removedHint,
    data: [],
  };
}

export async function executeNodeApi(
  _request: NodeApiExecuteRequest,
): Promise<NodeApiResult<ApiResponse>> {
  return {
    success: false,
    msg: removedHint,
    data: {
      status: 410,
      statusText: "Gone",
      headers: {},
      data: removedHint,
      duration: 0,
    },
  };
}

export async function fetchNodeApiList() {
  return fetchNodeApiDocs();
}

export async function fetchNodeSwaggerResources() {
  return {
    success: false,
    msg: removedHint,
    data: [],
  };
}

export async function getNodeHealth() {
  return {
    success: false,
    msg: removedHint,
    data: null,
  };
}

export async function getNodeInfo() {
  return {
    success: false,
    msg: removedHint,
    data: null,
  };
}
