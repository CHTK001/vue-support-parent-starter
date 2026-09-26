/**
 * 采集调度一体化平台前端入口（路由模式 + koi 布局）。
 *
 * 路由树即菜单树：.routes() 注入后由 createVueApp 平铺挂到 layout 之下并推导侧边栏。
 * install 阶段只需 installKoi（Element Plus 全量 + 图标 + koi 主题）；
 * 页面控件一律显式引入 @repo/ui 的 Re* 组件，不依赖全局注册。
 *
 * 登录用框架自带能力：openAuth + /login 路由 + 令牌守卫，登录/登出接口在 app.yaml 的
 * urlConfig 指向框架 oauth 体系的 /v2/user/**，本应用不自带登录界面。
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import { installKoi } from "@repo/theme/koi/framework";
import { getAccessToken } from "@repo/utils";
import { useAuthStore } from "@repo/pinia";
import { collectRoutes } from "./routes";
import { registerCollectKeepAlive } from "./composables/useCollectKeepAlive";
import "./styles/collect.css";
import "./styles/scheduler.css";

/**
 * 安装 koi 主题与 Element Plus。
 *
 * @param app Vue 应用实例
 */
async function installCollect(app: VueApp): Promise<void> {
  await installKoi(app);
}

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
    appName: "vue-support-collect-starter",
    title: "采集调度一体化平台",
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
    install: installCollect,
  })
    .routes(collectRoutes as never)
    .mount("#app");

  // keep-alive 白名单按路由 name 登记，不能依赖标签页流程（见 useCollectKeepAlive）
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
