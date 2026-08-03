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
  SpiderFlow,
  FlowAggregate,
  FlowNodeEntity,
  FlowEdgeEntity,
  FlowNodeLog,
  FlowHistory,
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

  /* ========== 可视化编排（RelationGraph 流程） ========== */

  /** 流程分页列表 */
  pageFlows: (pageNo = 1, pageSize = 20, keyword?: string) =>
    getApiHttp()
      .get("/spider/flows/page")
      .query({ pageNo, pageSize, keyword })
      .then<PageResult<SpiderFlow>>(unwrap),

  /** 完整加载流程（节点 + 边 + graphJson） */
  getFlow: (flowCode: string) =>
    getApiHttp()
      .get("/spider/flows/detail")
      .query({ flowCode })
      .then<FlowAggregate>(unwrap),

  /** 保存流程（含节点 + 边） */
  saveFlow: (aggregate: FlowAggregate, changeNote?: string, changeUser?: string) =>
    getApiHttp()
      .post("/spider/flows/save")
      .query({ changeNote, changeUser })
      .data(aggregate as unknown as Record<string, unknown>)
      .then<number>(unwrap),

  /** 启停切换 */
  toggleFlow: (flowCode: string, status: number) =>
    getApiHttp()
      .post("/spider/flows/status")
      .query({ flowCode, status })
      .then<boolean>(unwrap),

  /** 删除流程 */
  deleteFlow: (flowCode: string) =>
    getApiHttp()
      .delete(`/spider/flows/${flowCode}`)
      .then<boolean>(unwrap),

  /** 同步执行流程（返回 executionNo） */
  runFlow: (flowCode: string) =>
    getApiHttp()
      .post("/spider/flows/run")
      .query({ flowCode })
      .then<string>(unwrap),

  /** 调试执行（返回所有节点日志） */
  debugFlow: (flowCode: string) =>
    getApiHttp()
      .post("/spider/flows/debug")
      .query({ flowCode })
      .then<FlowNodeLog[]>(unwrap),

  /** 历史版本 */
  flowHistory: (flowCode: string) =>
    getApiHttp()
      .get("/spider/flows/history")
      .query({ flowCode })
      .then<FlowHistory[]>(unwrap),

  /** 回滚到指定版本 */
  rollbackFlow: (flowCode: string, version: number) =>
    getApiHttp()
      .post("/spider/flows/rollback")
      .query({ flowCode, version })
      .then<number>(unwrap),

  /** 节点类型清单 */
  flowNodeTypes: () =>
    getApiHttp()
      .get("/spider/flows/node-types")
      .then<Record<string, { type: string; className: string }>>(unwrap),

  /** 节点执行日志 */
  flowNodeLogs: (params?: { executionNo?: string; flowId?: number }) =>
    getApiHttp()
      .get("/spider/flows/node-logs")
      .query(params || {})
      .then<FlowNodeLog[]>(unwrap),
};

export default spiderApi;
