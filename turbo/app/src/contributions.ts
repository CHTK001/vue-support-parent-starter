/**
 * app 级扩展点贡献
 *
 * <p>各 {@code pages/xx} 模块可以向宿主贡献能力（当前是 home widget 目录），
 * 接线方式是 {@code createContextApp().widgets(...)}：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { collectWidgets } from "@pages/collect/widgets";
 *
 * createContextApp({ appName: "xxx" })
 *   .routes(routes)
 *   .widgets([defineWidgetContribution(collectWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p><b>为什么贡献契约定义在 {@code @repo/app} 而不是各主题里：</b>
 * 主题是可插拔的（仓内 26 个），若 app 构建器直接 import 某个主题的注册表，
 * 就等于把「默认主题=koi」焊死在组合根上，换主题时必然出错。所以这里只声明一个
 * <b>结构最小</b>的契约（namespace + register），由各主题/模块各自实现自己那一份
 * register（见 {@code @repo/theme/koi} 的 {@code defineWidgetContribution}）。
 * app 只负责在 mount() 时按调用顺序执行。</p>
 */
export interface AppContribution {
  /** 扩展点命名空间（如 {@code "home-widgets"}），用于排错与日志 */
  readonly namespace: string;
  /** 幂等注册；宿主保证在 mount() 中按调用顺序各执行一次 */
  register(): void;
}
