import type { ReturnResult } from "@repo/utils";
import { datalakeRequest } from "./request";
import type { QueryRequest, QueryResult, AggregationRequest, AggregationResult, DataEnvelope } from "../types";

/** 数据查询 */
export const fetchDataQuery = (data: QueryRequest) =>
  datalakeRequest<ReturnResult<QueryResult>>("post", "/v2/datalake/data/query", { data, timeout: 120000 });

/** 聚合查询 */
export const fetchDataAggregate = (data: AggregationRequest) =>
  datalakeRequest<ReturnResult<AggregationResult>>("post", "/v2/datalake/data/aggregate", { data });

/** 链路追踪 */
export const fetchTrace = (traceId: string) =>
  datalakeRequest<ReturnResult<DataEnvelope>>("get", `/v2/datalake/data/trace/${traceId}`, { timeout: 120000 });
