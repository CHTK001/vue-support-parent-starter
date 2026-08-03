/**
 * 爬虫中心 HTTP 客户端。
 *
 * 复用 @repo/core 的 getApiHttp() 实例（由 createApp 注入，含加密/拦截器）。
 * 本文件仅暴露业务接口。返回的 Promise 直接 resolve 到 data 字段（业务负载），
 * 由统一拦截器处理非 0 返回值（弹错/跳转登录等）。
 *
 * 用法：
 *   import { spiderApi } from "@repo/spider";
 *   const page = await spiderApi.pageDefinitions(1, 20);
 *   page.records.forEach(...)
 */
import { getApiHttp } from "@repo/core";
import type {
  SpiderDefinition,
  SpiderDefinitionSaveRequest,
  PageResult,
  ExecutionRecord,
  DataRecord,
  ExecutionStatus,
} from "./types";

/** 解包 { code, msg, data } 为 data（拦截器已统一处理非 0） */
function unwrap<T>(r: { data?: T }): T {
  return (r.data as T);
}

/**
 * 爬虫定义 API。
 */
export const spiderApi = {
  /** 分页查询爬虫定义 */
  pageDefinitions: (pageNo = 1, pageSize = 20, keyword?: string) =>
    getApiHttp()
      .get("/spider/definitions/page")
      .query({ pageNo, pageSize, keyword })
      .then<PageResult<SpiderDefinition>>(unwrap),

  /** 详情 */
  getDefinition: (spiderCode: string) =>
    getApiHttp()
      .get("/spider/definitions/detail")
      .query({ spiderCode })
      .then<SpiderDefinition>(unwrap),

  /** 保存 */
  saveDefinition: (req: SpiderDefinitionSaveRequest) =>
    getApiHttp()
      .post("/spider/definitions/save")
      .data(req as unknown as Record<string, unknown>)
      .then<SpiderDefinition>(unwrap),

  /** 删除 */
  deleteDefinition: (spiderCode: string) =>
    getApiHttp()
      .delete("/spider/definitions/delete")
      .query({ spiderCode })
      .then<boolean>(unwrap),

  /** 启停 */
  toggleStatus: (spiderCode: string, spiderStatus: number) =>
    getApiHttp()
      .post("/spider/definitions/status")
      .query({ spiderCode, spiderStatus })
      .then<boolean>(unwrap),

  /** 启动执行 */
  start: (spiderCode: string) =>
    getApiHttp()
      .post("/spider/executions/start")
      .query({ spiderCode })
      .then<string>(unwrap),

  /** 停止执行 */
  stop: (executionNo: string) =>
    getApiHttp()
      .post("/spider/executions/stop")
      .query({ executionNo })
      .then<boolean>(unwrap),

  /** 查询执行进度 */
  status: (executionNo: string) =>
    getApiHttp()
      .get("/spider/executions/status")
      .query({ executionNo })
      .then<ExecutionStatus>(unwrap),

  /** 列出正在运行的爬虫 */
  listRunning: () =>
    getApiHttp()
      .get("/spider/executions/running")
      .then<ExecutionStatus[]>(unwrap),

  /** 采集数据分页 */
  pageDataRecords: (
    spiderDefinitionCode: string,
    spiderExecutionNo?: string,
    depth?: number,
    pageNo = 1,
    pageSize = 50,
  ) =>
    getApiHttp()
      .get("/spider/data-records/page")
      .query({ spiderDefinitionCode, spiderExecutionNo, depth, pageNo, pageSize })
      .then<PageResult<DataRecord>>(unwrap),

  /** 采集数据详情 */
  getDataRecord: (id: number) =>
    getApiHttp()
      .get(`/spider/data-records/${id}`)
      .then<DataRecord>(unwrap),

  /** 执行记录分页 */
  pageExecutions: (spiderDefinitionCode: string, pageNo = 1, pageSize = 20) =>
    getApiHttp()
      .get("/spider/execution-records/page")
      .query({ spiderDefinitionCode, pageNo, pageSize })
      .then<PageResult<ExecutionRecord>>(unwrap),
};

export default spiderApi;
