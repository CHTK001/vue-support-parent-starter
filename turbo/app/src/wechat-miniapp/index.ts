/**
 * @repo/app/wechat-miniapp —— 小程序平台入口
 *
 * <p><b>本入口不含任何 Web / 浏览器依赖</b>（无 vue-router、无 axios、无
 * localStorage、无 Worker / document），可在 uni-app（mp-weixin / H5）中直接打包。</p>
 *
 * <p>业务代码统一写包根 {@code @repo/app} 的 {@code createContextApp}（一行 import）；
 * 小程序工程用 vite alias 把它映射到本文件，见
 * {@code apps/vue-support-ai-miniapp-starter}。</p>
 */
import { createMpApp, MpAppBuilder } from "./createMpApp";
import type { CreateMpAppOptions } from "./types";

export * from "./types";
export { MpHttpError } from "./platformHttp";
export { createMpApp, MpAppBuilder, getMpAppContext, unwrapResult } from "./createMpApp";

/**
 * 小程序端的启动入口（与 {@code @repo/app} 的 createContextApp 同名同参）。
 *
 * @param options 启动选项；{@code platform} 恒为 "wechat-miniapp"
 */
export function createContextApp(options: CreateMpAppOptions = {}): MpAppBuilder {
  return createMpApp({ ...options, platform: "wechat-miniapp" });
}
