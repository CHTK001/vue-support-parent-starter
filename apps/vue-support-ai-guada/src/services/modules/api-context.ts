import type { HttpClient, RequestOptions } from '@/framework/context';

/**
 * 核心上下文 —— 领域 API 方法通过 `this: ApiContext` 访问底层能力。
 * 挂载到 ApiService.prototype 后，`this` 即为 ApiService 实例。
 *
 * 请求出口只有 client（/v2 业务）与 fileClient（文件上传等 axios 风格调用），
 * 两者都建立在 @repo/utils 的请求模块之上，业务侧不得再持有 axios 实例。
 */
export interface ApiContext {
  _request<T = any>(endpoint: string, options?: RequestOptions): Promise<T>;
  /** axios 风格客户端（get/post/put/patch/delete(url, data?, options?)） */
  client: HttpClient;
  baseURL: string;
}
