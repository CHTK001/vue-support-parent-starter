/**
 * @repo/app/platform —— 平台注册表（分发点）
 *
 * <p>统一入口 {@code createContextApp} 只在这里查表：一行分发，
 * 没有 {@code if (platform === ...)} 的散落分支。新增平台 = 新增一个实现文件 +
 * 在 {@link FACTORIES} 里加一行。</p>
 *
 * <p><b>引用边界：</b>本文件同时引用 web 与小程序实现，所以只有 <b>Web 端包根</b>
 * 可以引用它；小程序入口 {@code @repo/app/wechat-miniapp} 不得引用，
 * 否则会把 createVueApp / element-plus 拖进小程序包。</p>
 */
import { webAdapter } from "./web.adapter";
import { wechatMiniappAdapter } from "./wechat-miniapp.adapter";
import type { AppPlatform } from "./types";
import type { MpAppBuilder } from "../wechat-miniapp/createMpApp";
import type { VueAppBuilder } from "../createVueApp";
import type { CreateAppOptions } from "../types";

/** 平台 → 装配工厂（查表分发，缺省 web） */
const FACTORIES: Record<AppPlatform, (options: CreateAppOptions) => VueAppBuilder | MpAppBuilder> = {
  web: (options) => webAdapter.create(options),
  "wechat-miniapp": (options) => wechatMiniappAdapter.create(options),
};

/**
 * 按平台装配应用构建器。
 *
 * @param options 启动选项；{@code platform} 缺省为 "web"
 * @returns Web → {@link VueAppBuilder}；小程序 → {@link MpAppBuilder}
 */
export function createByPlatform(options: CreateAppOptions = {}): VueAppBuilder | MpAppBuilder {
  return FACTORIES[options.platform ?? "web"](options);
}

export { webAdapter, wechatMiniappAdapter };
