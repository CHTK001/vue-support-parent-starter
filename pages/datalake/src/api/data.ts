import { http, type ReturnResult } from "@repo/utils";
import type { QueryRequest, QueryResult, AggregationRequest, AggregationResult, DataEnvelope } from "../types";

/** 数据查询 */
export const fetchDataQuery = (data: QueryRequest) =>
  http.request<ReturnResult<QueryResult>>("post", "/v2/datalake/data/query", { data });

/** 聚合查询 */
export const fetchDataAggregate = (data: AggregationRequest) =>
  http.request<ReturnResult<AggregationResult>>("post", "/v2/datalake/data/aggregate", { data });

/** 链路追踪 */
export const fetchTrace = (traceId: string) =>
  http.request<ReturnResult<DataEnvelope>>("get", `/v2/datalake/data/trace/${traceId}`);
