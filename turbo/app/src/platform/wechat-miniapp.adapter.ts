/**
 * @repo/app/platform —— 微信小程序平台实现（uni-app / mp-weixin）
 *
 * <p>唯一职责：把启动选项交给 {@code createMpApp} 装配
 * （uni storage / uni.request / token），并把 {@code platform} 钉死为
 * {@code "wechat-miniapp"}，避免调用方漏传导致走 Web 分支。</p>
 *
 * <p>小程序入口 {@code @repo/app/wechat-miniapp} 直接使用本实现，
 * 不经过 registry，因此包内不会出现 createVueApp / element-plus。</p>
 */
import { createMpApp, MpAppBuilder } from "../wechat-miniapp/createMpApp";
import type { CreateMpAppOptions } from "../wechat-miniapp/types";
import type { AppPlatformAdapter } from "./types";

/** 微信小程序平台适配器 */
export const wechatMiniappAdapter: AppPlatformAdapter<CreateMpAppOptions, MpAppBuilder> = {
  platform: "wechat-miniapp",

  create(options: CreateMpAppOptions): MpAppBuilder {
    return createMpApp({ ...options, platform: "wechat-miniapp" });
  },
};
