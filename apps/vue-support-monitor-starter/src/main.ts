/**
 * vue-support-monitor-starter 入口 —— 壳（app shell）
 *
 * <p>本应用只做三件事：<b>选主题 / 装组件 / 挂路由</b>。</p>
 * <ul>
 *   <li>业务功能全在 {@code @pages/xx}（视图 + API + 路由工厂三者同源），本文件不抄第二份；</li>
 *   <li>Re* 组件清单由 {@code @repo/ui} 的 preset 维护，本文件只声明预设名；</li>
 *   <li>菜单默认项、分组导航等策略已内置于框架（{@code @repo/config} 的 defaultAppConfig），
 *       运维侧仍可用 app.yaml 覆盖 —— 不在本文件重复声明。</li>
 * </ul>
 *
 * <p>路由模式：hash（routerMode: "hash"）；菜单由路由树自动推导。</p>
 */
import { createContextApp } from "@repo/app";
import "./styles/pages.css";
import "./styles/telemetry.css";
import ProcessHost from "./components/ProcessHost.vue";
import monitorRoutes from "./router";

await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "router",
  routerMode: "hash",
})
  .ui({ preset: "monitor" })
  .host(ProcessHost)
  .routes(monitorRoutes)
  .mount("#app");
