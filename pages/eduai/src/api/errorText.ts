/**
 * 接口异常文案提取。
 *
 * <p>框架的响应拦截器（`packages/core/src/httpCrypto.ts`）在 5xx / 502 / 503 / 504 时
 * 会弹一次通用 toast，并**故意把 `error.message` 置为 `undefined`**
 * （注释写明是「防止调用方 ElMessage.error 直接展示原始错误」）。页面若沿用
 * `e instanceof Error ? e.message : String(e)` 的老写法，5xx 场景就会弹成
 * 「提交失败: undefined」——用户既看不到后端原因，也会被弹两次提示。</p>
 *
 * <p>后端业务码与 msg 并没有丢，仍在 `error.response.data` 里，因此按
 * `response.data.msg` → `bizMsg` → `message` 的顺序取；全都取不到时返回空串，
 * 由调用方决定不再重复弹窗（框架已经提示过）。</p>
 */
import { ElMessage } from "element-plus";

/** axios / 框架异常的最小结构（只取需要的字段，避免依赖具体类型） */
export interface ApiErrorLike {
  message?: string;
  bizMsg?: string;
  response?: { data?: { msg?: string; message?: string } };
}

/** 取出后端/异常里的可读文案；没有任何可用文案时返回空串 */
export function errText(e: unknown): string {
  const err = e as ApiErrorLike | null | undefined;
  if (!err) return "";
  const candidates = [err.response?.data?.msg, err.bizMsg, err.message];
  for (const c of candidates) {
    const t = typeof c === "string" ? c.trim() : "";
    // 框架置空后是 undefined；也要挡掉字面量 "undefined"/"null" 这类占位
    if (t && t !== "undefined" && t !== "null") return t;
  }
  return "";
}

/**
 * 统一的失败提示：只在拿得到文案时弹一次。
 *
 * @param prefix 业务前缀，如「提交失败」
 * @param e 捕获到的异常
 */
export function failToast(prefix: string, e: unknown): void {
  const text = errText(e);
  if (text) ElMessage.error(`${prefix}: ${text}`);
}
