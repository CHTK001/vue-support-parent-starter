// APM 相关类型定义

export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 统计
export interface ApmStats {
  transmissionCount: number;
  leakCount: number;
  errorCount: number;
  traceCount: number;
}

// 传输记录
export interface TransmissionRecord {
  id?: string;
  source: string;
  target: string;
  protocol: string;
  callCount: number;
  errorCount: number;
  avgDurationMs: number;
  lastCallAt: string;
}

// 依赖边
export interface DependencyEdge {
  source: string;
  target: string;
  callCount: number;
  errorCount: number;
  avgDurationMs: number;
  lastCallAt: string;
}

// 泄露记录
export interface LeakRecord {
  id?: string;
  resourceType: string;
  resourceName: string;
  ageMs: number;
  stackTrace: string;
  detectedAt: string;
}

// 日志
export interface LogRecord {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  traceId?: string;
  spanId?: string;
}

// 追踪跨度
export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  className: string;
  methodName: string;
  startTime: string;
  durationMs: number;
  status: string;
}

// 查询参数
export interface TransmissionQuery {
  page?: number;
  size?: number;
  source?: string;
  target?: string;
  protocol?: string;
  startTime?: string;
  endTime?: string;
}

export interface LeakQuery {
  page?: number;
  size?: number;
  resourceType?: string;
  minAgeMs?: number;
}