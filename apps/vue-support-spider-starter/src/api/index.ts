import { ElMessage } from "element-plus";
import { createHttp } from "@repo/utils";
import type { ApiResult } from "@/types/spider";

/**
 * 爬虫中心 Http 客户端。
 *
 * 统一走 @repo/utils 的 Http（http.ts），url 均为 /spider-api/* 完整路径
 * （Vite proxy 转发到 19091 后端），baseUrl 不参与拼接。
 */
export const http = createHttp();

/**
 * 解包后端响应。
 *
 * <p>支持两种格式：</p>
 * <ul>
 *   <li>标准 Result 包装：{ success, code, msg, data }，非成功码抛错</li>
 *   <li>裸数据对象（如 PageResult），无 success 字段时直接返回</li>
 * </ul>
 */
function unwrap<T>(r: { data: ApiResult<T> | T }): T {
  const body = r.data as ApiResult<T> | undefined;
  if (body && typeof body === "object" && "success" in body) {
    const result = body as ApiResult<T>;
    if (!result.success) {
      const msg = result.msg || `请求失败 (code=${result.code})`;
      ElMessage.error(msg);
      throw new Error(msg);
    }
    return result.data as T;
  }
  return body as T;
}

/**
 * 爬虫定义 API。
 */
export const definitionApi = {
  page: (pageNo = 1, pageSize = 20, keyword?: string) =>
    http
      .get("/spider-api/spider/definitions/page")
      .query({ pageNo, pageSize, keyword })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  detail: (spiderCode: string) =>
    http
      .get(`/spider-api/spider/definitions/detail`)
      .query({ spiderCode })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  save: (data: Record<string, unknown>) =>
    http
      .post("/spider-api/spider/definitions/save")
      .data(data)
      .then<ApiResult>(unwrap) as Promise<unknown>,

  remove: (spiderCode: string) =>
    http
      .delete("/spider-api/spider/definitions/delete")
      .query({ spiderCode })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  status: (spiderCode: string, spiderStatus: 0 | 1) =>
    http
      .post("/spider-api/spider/definitions/status")
      .query({ spiderCode, spiderStatus })
      .then<ApiResult>(unwrap) as Promise<unknown>,
};

/**
 * 代理池 API。
 */
export const proxyPoolApi = {
  page: (pageNo = 1, pageSize = 20, keyword?: string) =>
    http
      .get("/spider-api/spider/proxy-pools/page")
      .query({ pageNo, pageSize, keyword })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  save: (data: Record<string, unknown>) =>
    http
      .post("/spider-api/spider/proxy-pools/save")
      .data(data)
      .then<ApiResult>(unwrap) as Promise<unknown>,

  remove: (poolCode: string) =>
    http
      .delete("/spider-api/spider/proxy-pools/delete")
      .query({ poolCode })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  /**
   * 测试代理池所有节点连通性。
   *
   * @returns 多节点测试结果 { total, success, nodes: [{host, port, ok, status, elapsedMs, error}] }
   */
  test: (poolCode: string) =>
    http
      .post("/spider-api/spider/proxy-pools/test")
      .query({ poolCode })
      .then<ApiResult>(unwrap) as Promise<unknown>,
};

/**
 * 执行记录 API。
 */
export const executionApi = {
  page: (pageNo = 1, pageSize = 20, spiderCode?: string) =>
    http
      .get("/spider-api/spider/executions/page")
      .query({ pageNo, pageSize, spiderCode })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  detail: (executionNo: string) =>
    http
      .get("/spider-api/spider/executions/detail")
      .query({ executionNo })
      .then<ApiResult>(unwrap) as Promise<unknown>,

  /**
   * 触发爬虫执行（异步）。
   *
   * @param spiderCode 爬虫编码
   * @returns 后端返回 { executionNo, status, startTime }
   */
  run: (spiderCode: string) =>
    http
      .post("/spider-api/spider/executions/run")
      .query({ spiderCode })
      .then<ApiResult>(unwrap) as Promise<unknown>,
};

export default http;
