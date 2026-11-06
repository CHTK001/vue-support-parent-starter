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
import { useGlobalStore, useUserStore } from "@repo/pinia";
// 路由级加载态兜底（见文件末的 attachRouterLoader 说明）
import { attachRouterLoader } from "@repo/ui/re-loader";
// 挂载完成后预热路由 chunk（菜单 hover 时 theme 层也会预取，见 routePrefetch.ts）
import {
  prefetchRecentlyVisited,
  prefetchRoute,
  prefetchRoutesIdle,
  rememberRouteVisits,
} from "@repo/theme/koi/layouts/components/Menu/routePrefetch";
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
import "@pages/system/src/styles/system-page.css";
// 调试中心（CDP）页面样式：el-tab 基色 / 页头分页布局 / 日志列表等。
import "@pages/debug/src/styles/debug.css";
// P2P 房间页面样式（rm- 前缀，自包含）
import "@pages/room/src/styles/room.css";
import ProcessHost from "./components/ProcessHost.vue";
import monitorRoutes from "./router";
// 监控大屏卡片的领域贡献：卡片元数据 + 组件加载器留在各自 pages 包里，
// 由应用入口在 mount 前注册（与首页 widget 同一套 contributions 机制）。
// 大屏本体（@pages/system）不认识任何具体卡片，也不 import 这两个包。
import { actuatorContribution } from "@pages/actuator";
import { apmContribution } from "@pages/apm/src/monitor";

const app = await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "router",
  routerMode: "hash",
})
  .widgets([actuatorContribution, apmContribution])
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

// 操作日志需要操作人：后端从 X-User-Name 头取（见 ProjectOpLogServiceImpl）。
// 在挂载后统一给所有请求补上当前登录账号：登录前 username 为空则跳过，
// 不依赖每个调用点各自加头，避免新增接口漏传导致日志里操作人为空。
const userStore = useUserStore(app.pinia);
app.context.http.getInstance().interceptors.request.use((config) => {
  // 登录返回的 username 字段可能为空，真实账号在 userInfo.sysUserUsername
  const info = userStore.userInfo as { sysUserUsername?: string } | undefined;
  const name = userStore.username || info?.sysUserUsername || userStore.nickname;
  if (name) {
    const headers = config.headers as
      | { set?: (key: string, value: string) => void }
      | Record<string, unknown>
      | undefined;
    if (headers && typeof (headers as { set?: unknown }).set === "function") {
      (headers as { set: (key: string, value: string) => void }).set("X-User-Name", name);
    } else {
      config.headers = { ...(headers as Record<string, unknown>), "X-User-Name": name } as never;
    }
  }
  return config;
});

// 把 ReLoader 挂到路由上：切页时收掉「路由级」加载态。
//
// 要防的事故：数据源中心点「打开管理」会先盖一层遮罩再去取目标页 chunk
// （见 ScDataSourceView 的 openManager）。若用户在这期间点了侧栏跳到别处，
// 发起加载的那个组件已被卸载，而遮罩是**全局单例** —— 它不会跟着组件消失，
// 会一直盖在新页面上，全站不可点。打了 routerScoped 的遮罩正是由这里在
// 路由切换后统一收掉的；页面内的局部加载态不受影响（否则切回来会看到永远转圈）。
attachRouterLoader(app.context.router);

// 应用挂载后预热路由 chunk：开发态与生产态成本不同，**按环境分开**。
//
// 页面代码全是懒加载（() => import(...)），点菜单才开始下载/编译，期间右侧先显示路由骨架
// —— 用户看到的就是「点了菜单在等待」。实测 70 个菜单项，未预热时首次访问 0.2s~37s。
//
// 但两种环境的「预热成本」差了一个数量级：
//   - 生产：chunk 已预构建，取回来就是一次静态文件请求，全量预取几乎零成本；
//   - 开发：每条 import() 都要 Vite 现场编译。全量扫 70 个页面会把 CPU 打满，
//     用户当前正在看的页面反而更慢（实测全量预取期间点新页面仍在 30s 量级）。
//     开发时真正反复打开的只有那几页，所以只回填「最近访问过的页面」。
//
// 因此这里：
//   1) 用 rememberRouteVisits 把访问过的路径记到 localStorage（跨刷新保留）；
//   2) 立即预取「主机资产」—— 它是本应用的落首页，#/assets 直接进入时本就要加载；
//   3) 生产走全量空闲预取（并发 2），开发走「最近访问页面」预取（并发 1 + 延迟 1.5s）；
//   4) 想临时切策略：VITE_ROUTE_PREFETCH=off|recent|all pnpm dev。
//
// 预取只加载页面外壳代码，不触发页面里的接口请求；数据仍由各页 onMounted 异步请求。
// 开发态即使一条记录都没有，菜单 hover 预取仍在生效 —— 鼠标移到菜单上就开始编译，
// 比点下去再编译要早 100~300ms。
//
// 注意：不能只放在 router.afterEach 里 —— 用户直接进入首页时首次导航已经结束，afterEach
// 只会在“点击菜单之后”才触发，等于没有预热。这里在挂载完成时就主动发起，登录页也提前
// 预热，用户输完账号时 chunk 通常已经就绪。

/** 路由预热策略：off 只留 hover；recent 只回填最近访问页面；all 全量叶子路由 */
type PrefetchMode = "off" | "recent" | "all";

/**
 * 解析预热策略：环境变量优先，未设置时按环境给默认值（开发 recent / 生产 all）。
 *
 * <p>开发态默认 recent 而不是 all：all 在 dev 下是「用整机 CPU 换一个用户未必会点的页面」，
 * 实测会明显拖慢当前页面；需要复现全量效果时显式设 VITE_ROUTE_PREFETCH=all 即可。</p>
 */
function resolvePrefetchMode(): PrefetchMode {
  const raw = String((import.meta.env as Record<string, unknown>).VITE_ROUTE_PREFETCH ?? "").toLowerCase();
  if (raw === "off" || raw === "recent" || raw === "all") return raw;
  return import.meta.env.DEV ? "recent" : "all";
}

const router = app.context.router;
const prefetchMode = resolvePrefetchMode();

// 访问历史：先记当前页，之后每次路由切换都追加（写入失败不影响任何功能）
rememberRouteVisits(router);

// 落首页：无论哪种策略都立即取一次（它本就会被当前导航加载，属于零额外成本）
prefetchRoute(router, "/assets");

if (prefetchMode === "all") {
  // 生产默认：全部叶子路由，空闲 + 并发 2
  prefetchRoutesIdle(router);
} else if (prefetchMode === "recent") {
  // 开发默认：只回填最近访问的 8 个页面，并发 1 + 延迟 1.5s，给首屏编译让路
  prefetchRecentlyVisited(router);
}
