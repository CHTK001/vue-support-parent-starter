import { unwrapResult } from "@repo/utils";

/** 解包 { code, msg, data }（兼容 AxiosResponse 双层包装）为业务负载 */
export function unwrap<T>(r: unknown): T {
  return unwrapResult<T>(r);
}
