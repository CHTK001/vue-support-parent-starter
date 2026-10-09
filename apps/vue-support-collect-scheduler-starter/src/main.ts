/**
 * 采集调度一体化平台前端入口（薄壳）。
 *
 * 结构对齐后端：一个「采集调度系统」承载部署，能力由两个平级模块提供——
 *   采集侧 @pages/collect（平台总览 + 数据采集分组）
 *   调度侧 @pages/job   （调度中心分组）
 * 本入口只做装配：拼路由树、在挂载后登记 keep-alive 与静态菜单。
 * 视图、API、样式都在各自 pages 包内，这里不写业务代码。
 *
 * koi 主题（ElementPlus / 图标 / 指令 / 组件 / router 守卫）由 createContextApp
 * 按 app.yaml 的 other.themeId 自动解析安装，本入口不手动传递安装器。
 *
 * 路由树即菜单树：.routes() 注入后由 createVueApp 平铺挂到 layout 之下并推导侧边栏。
 * 页面控件一律显式引入 @repo/ui 的 Re* 组件，不依赖全局注册。
 *
 * 登录用框架自带能力：openAuth + /login 路由 + 令牌守卫，登录/登出接口在 app.yaml 的
 * urlConfig 指向框架 oauth 体系的 /v2/user/**，本应用不自带登录界面。
 */
import { createContextApp } from "@repo/app";
import { getAccessToken } from "@repo/utils";
import { useAuthStore } from "@repo/pinia";
import { collectRoutes, collectWidgets, registerCollectKeepAlive } from "@pages/collect";
import { jobRoutes } from "@pages/job";
import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
import { hostRoutes } from "./routes";

/** 应用标识：与目录名、app.yaml 的托管路径一致，改动需三处同步 */
const APP_NAME = "vue-support-collect-scheduler-starter";

/** 应用标题 */
const APP_TITLE = "采集调度一体化平台";

/**
 * 拼装路由树：宿主层（平台总览等跨系统视图）+ 采集侧 + 调度侧。
 * 三个来源各自维护自己的路由，这里只做合并。
 */
const routes = [...hostRoutes, ...collectRoutes, ...jobRoutes];

/**
 * 启动流程整体包在 async IIFE 里，刻意**不用顶层 await**。
 *
 * 顶层 await 会让入口模块长期停在「求值未完成」状态，而框架内部存在跨 chunk 的
 * 动态 import（config → @repo/utils、restoreUserConfig 里那条）。生产构建把入口与
 * 框架拆成多个 chunk 后，一旦动态 import 的目标落在与入口相同的循环依赖里，它就会
 * 一直等一个永远不结束的模块求值——表现为「没有任何 JS 报错、请求也全部 200，
 * 但页面永远停在加载动画」。开发环境模块是逐个按需加载、不存在 chunk 循环，
 * 所以只在构建产物里复现，极难定位。
 */
void (async () => {
  const instance = await createContextApp({
    appName: APP_NAME,
    title: APP_TITLE,
    mode: "router",
    routerMode: "hash",
    /**
     * 资源基础路径，必须显式传。
     *
     * core 的 createApp 里是 `options.baseUrl ?? ""`，缺省空串会让运行时配置请求打到
     * 站点根路径 `/apps/{appName}/app.yaml`。开发环境看不出问题：vite 插件正好把
     * app.yaml 托管在根路径上，所以空 baseUrl 也能取到配置。
     *
     * 一旦部署到带 context-path 的子路径（例如后端托管在 /collect/api/static/），
     * 根路径的 /apps/** 会直接 404，配置加载失败后应用不会抛异常、只是静默不挂载，
     * 表现为一片空白加一个转圈，非常难查。
     *
     * 取值用构建基路径去掉末尾斜杠：
     *   dev（base=/）              -> ""                 行为与原先完全一致
     *   生产（base=/collect/api/static/）-> "/collect/api/static"
     */
    baseUrl: import.meta.env.BASE_URL.replace(/\/+$/, ""),
    // 不传 install：koi 主题由 createContextApp 按 app.yaml 的 other.themeId 自动
    // 解析安装（@repo/theme loadTheme → koi/framework 注册的安装器），带 router 守卫
    // （setRouter + title/favicon 前置）与无静态菜单时的兜底；本入口无需手写安装器。
  })
    .routes(routes as never)
    // 采集侧向 home 仪表板贡献「采集概览」widget。与 .routes() 同构：
    // 在 mount() 阶段完成注册，早于首页首次渲染，贡献方无需关心时序
    .widgets([defineWidgetContribution(collectWidgets)])
    .mount("#app");

  // keep-alive 白名单按路由 name 登记，不能依赖标签页流程（见 @pages/collect 的 useCollectKeepAlive）
  registerCollectKeepAlive();

  /**
   * 静态菜单灌入 store 的时机：守卫只在 remote/all 模式拉菜单，静态路由没人灌进 store 时
   * 侧边栏只剩空壳（整页刷新、直接打开深层路由都会命中）。openAuth 关闭时没有登录流程，
   * 开启时则只认已拿到令牌的场景——未登录会先被守卫弹回登录页，登录后由 initAuthRouter 负责。
   */
  const { config } = instance.context;

  const menuMode = config.route.mode;
  const guardOwnsMenu = menuMode === "remote" || menuMode === "all";
  if (!guardOwnsMenu && (!config.app.openAuth || getAccessToken())) {
    await useAuthStore(instance.pinia).listRouters();
  }
})();
