/**
 * 自定义错误类
 *
 * 用于在 API 拦截器中替代动态附加属性到 Error 实例的写法，
 * 使错误类型在编译期可被 TypeScript 追踪。
 */

export class NetworkError extends Error {
  readonly isNetworkError = true;

  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthError extends Error {
  readonly isAuthError = true;
  readonly statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export class ApiError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

/**
 * 从任意错误对象中提取可读的消息文本。
 *
 * <p>后端的失败响应常见形态是 {@code {code, msg}} 信封（axios 抛出时挂在
 * {@code error.response.data} 上），而业务代码里常直接 {@code e?.message ?? e} 拼提示，
 * 当 {@code e} 是普通对象（无 {@code message} 字段）时就显示成生硬的
 * {@code [object Object]}，真实原因（如「用户信息不存在/请重新登录」）被吞掉。</p>
 *
 * <p>提取顺序：HTTP 响应体内的 {@code msg} → {@code message} → {@code error.message}
 * → 已知错误类自身的 {@code message} → 兜底文案。任何一步拿到非空字符串即返回。</p>
 *
 * @param e     任意异常/响应体
 * @param fallback 兜底文案（默认「请求失败」）
 * @returns 可直接展示给用户的错误文本
 */
export function toErrorMessage(e: unknown, fallback = "请求失败"): string {
  if (typeof e === "string") return e || fallback;
  if (!e || typeof e !== "object") return fallback;

  const anyE = e as Record<string, any>;
  // 逐层向下找响应体：axios/框架拦截器可能包多层 response / data
  let cursor: any = anyE;
  for (let i = 0; i < 3 && cursor && typeof cursor === "object"; i++) {
    const hit = cursor.msg ?? cursor.message ?? cursor.error;
    if (typeof hit === "string" && hit.trim()) return hit;
    cursor = cursor.response ?? cursor.data;
  }
  // Error 实例自身的 message（上面循环里 cursor.message 已覆盖它）
  if (typeof anyE.message === "string" && anyE.message.trim()) return anyE.message;
  return fallback;
}
