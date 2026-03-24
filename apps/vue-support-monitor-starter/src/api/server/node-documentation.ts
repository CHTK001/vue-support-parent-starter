import { http, type ReturnResult } from "@repo/utils";

// 类型定义
export interface ApiGroup {
  name: string;
  apis: ApiInfo[];
}

export interface ApiInfo {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: any;
  responses?: any;
}

export interface ApiParameter {
  name: string;
  in: string; // path, query, header, body
  required: boolean;
  type: string;
  description?: string;
}

export interface ApiExecuteRequest {
  nodeId: string;
  nodeAddress: string;
  contextPath: string;
  api: ApiInfo;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody: string;
  headers?: Record<string, string>;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  ok: boolean;
}

/**
 * 获取节点API文档
 */
export const fetchNodeApiDocs = (nodeId: string, nodeAddress: string, contextPath: string) => {
  return http.request<ReturnResult<ApiGroup[]>>("get", "/v1/monitor/nodes/api-docs", {
    params: {
      nodeId,
      nodeAddress,
      contextPath
    },
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取节点接口列表
 */
export const fetchNodeApiList = (nodeId: string, nodeAddress: string, contextPath: string) => {
  return http.request<ReturnResult<ApiInfo[]>>("get", "/v1/monitor/nodes/api-list", {
    params: {
      nodeId,
      nodeAddress,
      contextPath
    },
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取节点Swagger资源信息
 */
export const fetchNodeSwaggerResources = (nodeId: string, nodeAddress: string, contextPath: string) => {
  return http.request<ReturnResult<any[]>>("get", "/v1/monitor/nodes/swagger-resources", {
    params: {
      nodeId,
      nodeAddress,
      contextPath
    },
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 执行节点API
 */
export const executeNodeApi = (request: ApiExecuteRequest) => {
  return http.request<ApiResponse>("post", "/v1/monitor/nodes/execute-api", {
    data: request,
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取节点健康状态
 */
export const getNodeHealth = (nodeId: string) => {
  return http.request<ReturnResult<any>>("get", `/v1/monitor/nodes/${nodeId}/health`, {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取节点基本信息
 */
export const getNodeInfo = (nodeId: string) => {
  return http.request<ReturnResult<any>>("get", `/v1/monitor/nodes/${nodeId}/info`, {
    headers: {
      "x-remote-animation": "false"
    }
  });
};
