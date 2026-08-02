import { http } from "@/utils/http";
import type {
  PageResult,
  SpiderDataRecord,
  SpiderDefinition,
  SpiderDefinitionSaveRequest,
  SpiderExecutionRecord,
} from "@/types/spider";

export function pageDefinitions(
  pageNo = 1,
  pageSize = 20,
  keyword?: string
): Promise<PageResult<SpiderDefinition>> {
  return http.get<PageResult<SpiderDefinition>>(
    "/spider/definitions/page",
    { params: { pageNo, pageSize, keyword } }
  ).then(res => res.data);
}

export function getDefinition(spiderCode: string): Promise<SpiderDefinition | null> {
  return http.get<SpiderDefinition | null>(
    "/spider/definitions/detail",
    { params: { spiderCode } }
  ).then(res => res.data);
}

export function saveDefinition(req: SpiderDefinitionSaveRequest): Promise<SpiderDefinition> {
  return http.post<SpiderDefinition>(
    "/spider/definitions/save",
    req
  ).then(res => res.data);
}

export function deleteDefinition(spiderCode: string): Promise<boolean> {
  return http.delete<boolean>("/spider/definitions/delete", {
    params: { spiderCode },
  }).then(res => res.data);
}

export function toggleStatus(spiderCode: string, spiderStatus: 0 | 1): Promise<boolean> {
  return http.post<boolean>("/spider/definitions/status", null, {
    params: { spiderCode, spiderStatus },
  }).then(res => res.data);
}

export function pageDataRecords(
  pageNo = 1,
  pageSize = 50,
  spiderDefinitionCode: string,
  spiderExecutionNo?: string,
  depth?: number
): Promise<PageResult<SpiderDataRecord>> {
  return http.get<PageResult<SpiderDataRecord>>(
    "/spider/data-records/page",
    {
      params: {
        pageNo,
        pageSize,
        spiderDefinitionCode,
        spiderExecutionNo,
        depth,
      },
    }
  ).then(res => res.data);
}

export function pageExecutions(
  pageNo = 1,
  pageSize = 20,
  spiderDefinitionCode: string
): Promise<PageResult<SpiderExecutionRecord>> {
  return http.get<PageResult<SpiderExecutionRecord>>(
    "/spider/execution-records/page",
    { params: { pageNo, pageSize, spiderDefinitionCode } }
  ).then(res => res.data);
}