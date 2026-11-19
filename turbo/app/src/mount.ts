/**
 * mountApp —— 便捷入口：创建 + 安装 + 挂载（等价 createContextApp().mount()）
 *
 * 用法：
 *   import { mountApp } from "@repo/app";
 *   import { installKoi } from "@repo/theme/koi/framework";
 *
 *   mountApp({
 *     appName: "xxx",
 *     install: (app, ctx) => installKoi(app, { router: ctx.router }),
 *   });
 *
 * 需要链式配置（routes / app / use / component / css）时，请直接使用
 * createContextApp(...).routes(...).mount("#app")。
 */
import type { AppInstance, CreateAppOptions } from "./createContextApp";
import { createContextApp } from "./createContextApp";

/** mountApp 启动选项 */
export interface MountAppOptions extends CreateAppOptions {
  /** 挂载节点选择器（默认 #app） */
  mountEl?: string;
}

/** 创建 + 安装 + 挂载 */
export async function mountApp(options: MountAppOptions): Promise<AppInstance> {
  const { mountEl, ...rest } = options;
  // 本便捷入口只服务 Web（挂载到选择器）；显式钉住 platform 让返回类型收窄为 VueAppBuilder
  return createContextApp({ ...rest, platform: "web" }).mount(mountEl ?? "#app");
}

export default mountApp;
