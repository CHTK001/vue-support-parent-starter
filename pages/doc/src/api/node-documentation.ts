import { http, type ReturnResult } from "@repo/utils";
import type { ApiGroup, ApiInfo, ApiResponse } from "../types";

export interface NodeApiExecuteRequest {
  nodeId: string;
  nodeAddress: string;
  contextPath: string;
  api: ApiInfo;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody: string;
  headers?: Record<string, string>;
}

export const fetchNodeApiDocs = (
  nodeId: string,
  nodeAddress: string,
  contextPath: string,
) => {
  return http.request<ReturnResult<ApiGroup[]>>(
    "get",
    "/v1/monitor/nodes/api-docs",
    {
      params: {
        nodeId,
        nodeAddress,
        contextPath,
      },
      headers: {
        "x-remote-animation": "false",
      },
    },
  );
};

export const fetchNodeApiList = (
  nodeId: string,
  nodeAddress: string,
  contextPath: string,
) => {
  return http.request<ReturnResult<ApiInfo[]>>(
    "get",
    "/v1/monitor/nodes/api-list",
    {
      params: {
        nodeId,
        nodeAddress,
        contextPath,
      },
      headers: {
        "x-remote-animation": "false",
      },
    },
  );
};

export const fetchNodeSwaggerResources = (
  nodeId: string,
  nodeAddress: string,
  contextPath: string,
) => {
  return http.request<ReturnResult<any[]>>(
    "get",
    "/v1/monitor/nodes/swagger-resources",
    {
      params: {
        nodeId,
        nodeAddress,
        contextPath,
      },
      headers: {
        "x-remote-animation": "false",
      },
    },
  );
};

export const executeNodeApi = (request: NodeApiExecuteRequest) => {
  return http.request<ApiResponse>("post", "/v1/monitor/nodes/execute-api", {
    data: request,
    headers: {
      "x-remote-animation": "false",
    },
  });
};

export const getNodeHealth = (nodeId: string) => {
  return http.request<ReturnResult<any>>(
    "get",
    `/v1/monitor/nodes/${nodeId}/health`,
    {
      headers: {
        "x-remote-animation": "false",
      },
    },
  );
};

export const getNodeInfo = (nodeId: string) => {
  return http.request<ReturnResult<any>>(
    "get",
    `/v1/monitor/nodes/${nodeId}/info`,
    {
      headers: {
        "x-remote-animation": "false",
      },
    },
  );
};
