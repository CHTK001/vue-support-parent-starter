/**
 * vue-support-eduai-starter 应用入口。
 *
 * .routes(路由树)：路由树即菜单树，自动挂到 layout 之下，并驱动侧边栏，
 * 无需再手动 registerStaticMenu / addRoute。
 */
import { createContextApp } from "@repo/app";
import { eduaiRoutes } from "@repo/eduai";

createContextApp()
  .routes(eduaiRoutes as never)
  .mount("#app");
