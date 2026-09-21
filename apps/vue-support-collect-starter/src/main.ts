/**
 * 采集调度一体化平台前端入口（路由模式 + koi 布局）。
 *
 * 路由树即菜单树：.routes() 注入后由 createVueApp 平铺挂到 layout 之下并推导侧边栏。
 * install 阶段只需 installKoi（Element Plus 全量 + 图标 + koi 主题）；
 * 页面控件一律显式引入 @repo/ui 的 Re* 组件，不依赖全局注册。
 *
 * 登录不走路由：采集模块用自身 Servlet 会话，鉴权门是挂在 body 上的全屏浮层，
 * 未登录（含会话过期后接口返回 401）时盖住界面，不参与导航。
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import { createVNode, render } from "vue";
import { installKoi } from "@repo/theme/koi/framework";
import AuthGate from "./views/AuthGate.vue";
import { collectRoutes } from "./routes";
import "./styles/collect.css";

/**
 * 挂载采集控制台登录浮层（与主 app 共享 context，才能用 Element Plus 组件）。
 *
 * @param app 主 Vue 应用
 */
function mountAuthGate(app: VueApp): void {
  const container = document.createElement("div");
  container.setAttribute("data-collect-auth-gate", "");
  document.body.appendChild(container);
  const vnode = createVNode(AuthGate);
  vnode.appContext = (app as unknown as { _context: unknown })._context as never;
  render(vnode, container);
}

/**
 * 安装 koi 主题与 Element Plus。
 *
 * @param app Vue 应用实例
 */
async function installCollect(app: VueApp): Promise<void> {
  await installKoi(app);
  mountAuthGate(app);
}

await createContextApp({
  appName: "vue-support-collect-starter",
  title: "采集调度一体化平台",
  mode: "router",
  routerMode: "hash",
  install: installCollect,
})
  .routes(collectRoutes as never)
  .mount("#app");
