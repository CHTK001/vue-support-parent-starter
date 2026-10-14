/**
 * Kafka 控制台 API（@pages/datasource）
 *
 * <p>Kafka 是可选中间件能力包，前端不直接调用旧版 Kafka 专属接口，而是走宿主的
 * 通用中间件 SPI 面：{@code /ms/monitor/middleware/**}。这样 Kafka 模块未安装时，
 * 后端会按契约返回「功能未开放」业务结果，前端原样展示而不是猜一个 500 页面。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

const MIDDLEWARE_BASE = "/ms/monitor/middleware";

/** 中间件能力声明，与后端 MiddlewareCapability 契约一致 */
export interface KafkaCapability {
  topNodeSupported: boolean;
  childNodeSupported: boolean;
  querySupported: boolean;
  documentSupported: boolean;
  topNodeLabel: string;
  childNodeLabel: string;
  queryHint: string;
  queryDescription: string;
}

/** 中间件树节点：Kafka 顶层是 Topic、子节点是 Partition */
export interface KafkaTreeNode {
  key: string;
  label: string;
  comment?: string | null;
  estimatedCount?: number | null;
}

/** 中间件只读查询结果 */
export interface KafkaQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  totalRows: number;
  executionTimeMs: number;
  message: string;
}

/** 中间件连接测试结果 */
export interface KafkaTestResult {
  connected: boolean;
  version: string;
  detail: string;
  message: string;
}

/** 查询 Kafka 中间件能力声明（不需要真实 Broker 连接） */
export const fetchKafkaCapability = () =>
  http()
    .get(`${MIDDLEWARE_BASE}/capability`)
    .query({ type: "kafka" })
    .noToast(true)
    .then(r => unwrap<KafkaCapability>(r));

/** 测试 Kafka 连接 */
export const testKafkaConnection = (datasourceId?: number) =>
  http()
    .post(`${MIDDLEWARE_BASE}/test`)
    .query({ type: "kafka" })
    .data({ datasourceId })
    .noToast(true)
    .then(r => unwrap<KafkaTestResult>(r));

/** 列出 Kafka 顶层节点（Topic） */
export const fetchKafkaTopNodes = (datasourceId?: number) =>
  http()
    .get(`${MIDDLEWARE_BASE}/nodes`)
    .query({ type: "kafka", datasourceId })
    .noToast(true)
    .then(r => unwrap<KafkaTreeNode[]>(r));

/** 列出 Topic 下的子节点（Partition） */
export const fetchKafkaChildren = (parentKey: string, datasourceId?: number) =>
  http()
    .get(`${MIDDLEWARE_BASE}/children`)
    .query({ type: "kafka", parentKey, datasourceId })
    .noToast(true)
    .then(r => unwrap<KafkaTreeNode[]>(r));

/** 执行 Kafka 只读查询（topics / brokers / groups / describe <topic> / preview <topic>） */
export const queryKafka = (expression: string, datasourceId?: number, limit = 100) =>
  http()
    .post(`${MIDDLEWARE_BASE}/query`)
    .query({ type: "kafka", expression, limit })
    .noToast(true)
    .then(r => unwrap<KafkaQueryResult>(r));
