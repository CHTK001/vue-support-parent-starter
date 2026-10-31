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
import { useGlobalStore } from "@repo/pinia";
// 路由级加载态兜底（见文件末的 attachRouterLoader 说明）
import { attachRouterLoader } from "@repo/ui/re-loader";
// ── 本应用壳级布局 / 遥测样式（app 私有，见 src/styles） ─────────────
import "./styles/pages.css";
import "./styles/telemetry.css";

// ── @pages/* 的全局样式：为什么由壳 main.ts 显式引入？ ─────────────
// pages 包按约定只放「视图 + API + 路由工厂 + 样式文件」，不持有 App.vue/main.ts 入口；
// 因此包内 .css（tokens / page / dialog）没有自己的挂载时机，必须在壳入口 import 才会
// 被打包进产物。这四条是 pages/server / pages/monitor / pages/system 的页面依赖的全局样式：
//   - tokens.css  定义包级 CSS 变量色板（侧边栏/卡片/表格的 --el-* 覆盖），
//                 供两个包的所有 .vue 的 <style> 使用，必须全局可用；
//   - page.css    主机资产管理等页面的通用版式类（只读全局类，不 scoped）；
//   - dialog.css  主机表单 / 详情弹窗的统一视觉（变量驱动，不 scoped）；
//   - system-page.css 系统日志 / 登录日志页面的空态 & 页头布局类（只读全局类，不 scoped）。
// 唯一归属在壳、不归 pages 的理由：样式的「消费方」是壳整体装配出的应用，
// 页面只声明依赖、由应用入口统一收集，避免每页重复 import 造成重复打包。
import "@pages/monitor/src/styles/tokens.css";
import "@pages/server/src/styles/tokens.css";
import "@pages/server/src/styles/page.css";
import "@pages/server/src/styles/dialog.css";
import "@pages/system/styles/system-page.css";
// 调试中心（CDP）页面样式：el-tab 基色 / 页头分页布局 / 日志列表等。
import "@pages/debug/src/styles/debug.css";
import ProcessHost from "./components/ProcessHost.vue";
import monitorRoutes from "./router";

const app = await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "router",
  routerMode: "hash",
})
  .ui({ preset: "monitor" })
  .host(ProcessHost)
  .routes(monitorRoutes)
  .mount("#app");

// 默认导航布局改为「分组导航」。
//
// 为什么放在这里而不是改 @repo/pinia 的 global.ts：
//   - global.ts 的默认值是全仓共享的，直接改成 group 会影响设备/采集/系统等所有
//     没有显式覆盖布局的应用；
//   - 这里只对 monitor 这一壳设置，用户仍可在顶部「主题设置」手动切换并把选择持久化；
//   - 设值放在 mount 之后，保证 pinia 实例已就绪，也避免 before mount 与布局组件读取
//     同一 store 时产生时序竞争。
useGlobalStore(app.pinia).setGlobalState("layout", "group");

// 把 ReLoader 挂到路由上：切页时收掉「路由级」加载态。
//
// 要防的事故：数据源中心点「打开管理」会先盖一层遮罩再去取目标页 chunk
// （见 ScDataSourceView 的 openManager）。若用户在这期间点了侧栏跳到别处，
// 发起加载的那个组件已被卸载，而遮罩是**全局单例** —— 它不会跟着组件消失，
// 会一直盖在新页面上，全站不可点。打了 routerScoped 的遮罩正是由这里在
// 路由切换后统一收掉的；页面内的局部加载态不受影响（否则切回来会看到永远转圈）。
attachRouterLoader(app.context.router);
