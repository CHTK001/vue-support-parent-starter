/**
 * @repo/app/platform —— Web 平台实现（浏览器）
 *
 * <p>唯一职责：把启动选项交给 {@code createVueApp} 装配
 * （vue-router / pinia / axios / localStorage）。
 * 只在 Web 入口（{@code @repo/app} 包根）被引用，<b>不会</b>进入小程序包。</p>
 */
import { createVueApp, VueAppBuilder } from "../createVueApp";
import type { AppFramework, CreateAppOptions } from "../types";
import type { AppPlatformAdapter } from "./types";

/** Web 平台适配器 */
export const webAdapter: AppPlatformAdapter<CreateAppOptions, VueAppBuilder> = {
  platform: "web",

  create(options: CreateAppOptions): VueAppBuilder {
    const framework: AppFramework = options.framework ?? "vue";
    if (framework === "react") {
      throw new Error(
        '[createContextApp] React 入口已独立：请改用 `import { createReactApp } from "@repo/app/react"`',
      );
    }
    return createVueApp(options);
  },
};
