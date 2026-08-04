/**
 * vue-support-spider-starter 应用入口。
 *
 * createContextApp 由 @repo/app 提供，内部已完成：
 *   - 加载 app.yaml（route/login/http/storage/...）
 *   - 注入 Vue / pinia / i18n / router
 *   - 主题安装器（koi）
 *
 * .routes(路由树)：路由树即菜单树，自动挂到 layout 之下，并驱动侧边栏。
 * 路由在初始导航前即注册完成，因此直接访问业务 URL 不会丢失路径（无需 404 兜底重定向）。
 */
import { createContextApp } from "@repo/app";
import { registerStaticMenu } from "@repo/pinia";
import { spiderRoutes, spiderMenus } from "@repo/spider";

registerStaticMenu(spiderMenus);

createContextApp()
  .routes(spiderRoutes as never)
  .mount("#app");
