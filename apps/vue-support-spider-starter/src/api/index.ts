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
 * 解包后端统一响应为业务数据。
 *
 * <p>非成功码（{@code code !== "00000"}）抛错并 toast 提示。</p>
 */
function unwrap<T>(r: { data: ApiResult<T> }): T {
  const body = r.data;
  if (!body || !body.success) {
    const msg = body?.msg || `请求失败 (code=${body?.code})`;
    ElMessage.error(msg);
    throw new Error(msg);
  }
  return body.data as T;
}

/**
 * 爬虫定义 API。
 */
export const definitionApi = {
  page: (pageNo = 1, pageSize = 20) =>
    http
      .get("/spider-api/spider/definitions/page")
      .query({ pageNo, pageSize })
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
  page: (pageNo = 1, pageSize = 20) =>
    http
      .get("/spider-api/spider/proxy-pools/page")
      .query({ pageNo, pageSize })
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
