/**
 * 发布管理 · 项目 Actuator 接口。
 *
 * <p>项目跑在目标主机上，后端拿到的是主机内 {@code 127.0.0.1:port/actuator}，
 * 所以这里只发「项目 id + 端点路径」，不做前端直连。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { http, unwrapResult } from "@repo/utils";

const BASE = "/ms/server/release";

/** 一条日志级别记录（后端已把 loggers 原始 JSON 压成这个结构） */
export interface ActuatorLoggerRow {
  name: string;
  configuredLevel: string;
  effectiveLevel: string;
}

/** 一次 Actuator 读取的结果 */
export interface ActuatorPayload {
  endpoint: string;
  url: string;
  /** HTTP 状态码；0 表示目标不可达 */
  status: number;
  /** 原始响应体（文本，可能是 JSON 也可能是错误页）；loggers 端点为空 */
  body: string;
  elapsedMs: number;
  message?: string;
  /** 仅 loggers：可选级别集合 */
  levels?: string[];
  /** 仅 loggers：日志名与级别 */
  loggers?: ActuatorLoggerRow[];
  /** 仅 loggers：列表是否被截断（响应体过大） */
  truncated?: boolean;
  /** 仅 httptrace/httpexchanges：后端压好的逐条请求记录（body 已清空） */
  records?: ActuatorHttpRecord[];
}

/** 一条 httptrace / httpexchanges 请求记录（后端压缩，丢弃了占体积的 headers） */
export interface ActuatorHttpRecord {
  method: string;
  uri: string;
  status?: number;
  timeTaken?: number;
  /** 原始时间戳（ISO 字符串），前端解析成毫秒 */
  timestamp?: string;
}

/** 热更新日志级别的结果 */
export interface ActuatorLogLevelResult {
  logger: string;
  level: string;
  status: number;
  ok: boolean;
  elapsedMs: number;
  message?: string;
}

/**
 * 读取一个 Actuator 端点。
 *
 * <p>失败不抛错：调用方要展示「端点未暴露 / 不可达」的具体原因，
 * 抛异常会把后端的说明变成一句泛化网络错误。</p>
 *
 * @param projectId 项目 ID
 * @param path      端点路径，如 metrics / metrics/jvm.memory.used / loggers
 * @returns 读取结果
 */
export const fetchActuator = async (projectId: number, path: string): Promise<ActuatorPayload> => {
  const res = await http().get(`${BASE}/project/${projectId}/actuator`).query({ path });
  return (unwrapResult<ActuatorPayload>(res) || {
    endpoint: path,
    url: "",
    status: 0,
    body: "",
    elapsedMs: 0,
  }) as ActuatorPayload;
};

/**
 * 热更新日志级别（Actuator loggers，不用重启）。
 *
 * @param projectId 项目 ID
 * @param name      日志名称，如 com.chua.demo；ROOT 写 ROOT
 * @param level     目标级别；空串表示清除项目级配置、继承上级
 * @returns 修改结果
 */
export const setActuatorLogLevel = async (
  projectId: number,
  name: string,
  level: string,
): Promise<ActuatorLogLevelResult> => {
  const res = await http()
    .post(`${BASE}/project/${projectId}/actuator/log-level`)
    .data({ name, level });
  return (unwrapResult<ActuatorLogLevelResult>(res) || {
    logger: name,
    level,
    status: 0,
    ok: false,
    elapsedMs: 0,
  }) as ActuatorLogLevelResult;
};
