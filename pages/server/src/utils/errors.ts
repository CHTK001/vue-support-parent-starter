/**
 * 接口失败提示的统一出口。
 *
 * <p>为什么需要：后端 {@code ReturnResult} 的失败响应会把「为什么失败」写在 {@code msg} 里
 * （例如「目标主机「win101」未开启 SSH…无法执行发布操作」），{@code unwrapResult} 也已把
 * 它挂到 {@code Error.message} 上。页面若写成 {@code catch { message.error('操作失败') }}，
 * 用户就只剩一句无信息量的提示，既判断不出是自己配错还是主机不通，也无法自查。</p>
 *
 * <p>口径：<b>后端有原因就用后端的原话</b>，没有才退回调用方给的兜底文案；
 * 网络层错误（断连/超时）翻成人话，避免把 "Network Error" 直接弹给用户。</p>
 *
 * @since 4.0.0.51
 */
import { message } from "@repo/core";

/**
 * 从异常里取出可展示的原因。
 *
 * @param e        捕获到的异常
 * @param fallback 兜底文案（后端没给原因时使用）
 * @returns 展示用文案
 */
export function errorText(e: unknown, fallback = "操作失败"): string {
  const err = e as { message?: unknown; msg?: unknown; response?: { status?: number } };
  const raw = err?.message ?? err?.msg;
  if (typeof raw === "string" && raw.trim()) {
    const text = raw.trim();
    // axios 的英文原文对用户没意义，换成能定位问题的说法
    if (/^network error$/i.test(text)) {
      return "无法连接后端（网络中断或服务未启动），请稍后重试";
    }
    if (/^timeout of \d+ms exceeded$/i.test(text)) {
      return "请求超时：后端未在预期时间内响应，请稍后重试";
    }
    if (/^request failed with status code (\d+)$/i.test(text)) {
      const status = Number(text.replace(/\D+/g, ""));
      if (status === 401 || status === 403) {
        return "没有权限或登录已过期，请重新登录后再试";
      }
      if (status >= 500) {
        return `后端异常（HTTP ${status}），请查看服务端日志`;
      }
      return fallback;
    }
    return text;
  }
  return fallback;
}

/**
 * 弹出接口失败原因。
 *
 * @param e        捕获到的异常
 * @param fallback 兜底文案
 */
export function toastError(e: unknown, fallback = "操作失败"): void {
  message.error(errorText(e, fallback));
}
