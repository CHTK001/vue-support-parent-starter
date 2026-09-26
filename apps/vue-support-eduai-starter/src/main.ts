/**
 * vue-support-eduai-starter 应用入口。
 *
 * .routes(路由树)：路由树即菜单树（两级分组导航），自动挂到 layout 之下并驱动侧边栏；
 * 路由树未含 homePath 时由 buildMenuFromRoutes 补上框架默认导航项「工作台」(/home)。
 *
 * install：koi 框架安装 + 按需注册本应用用到的 Re* 组件（installUi）。
 */
import { createContextApp } from "@repo/app";
import { eduaiRoutes } from "@pages/eduai";
import type { App as VueApp } from "vue";
import { installKoi } from "@repo/theme/koi/framework";
import { installUi } from "@repo/ui";
import { getAccessToken } from "@repo/utils";
import { useAuthStore } from "@repo/pinia";

/** 教育 AI 页面用到的 Re* 组件（ReKit 提供 ReTableColumn 等表格子组件） */
const EDUAI_RE_COMPONENTS = ["ReButton", "ReCron", "ReInput", "ReSelect", "ReSearch", "ReTable", "ReKit", "ReSwitch", "ReTag"];

async function installEduAi(app: VueApp): Promise<void> {
  await installKoi(app);
  await installUi(app, { components: EDUAI_RE_COMPONENTS });
}

const instance = await createContextApp({ install: installEduAi })
  .routes(eduaiRoutes as never)
  .mount("#app");

/**
 * 静态菜单灌入 store 的时机：既没有登录流程（openAuth=false），也没有 initAuthRouter
 * 被触发的整页刷新（带令牌直接进目标路由），都会让侧边栏只剩空壳，故这里自己灌一次。
 * route.mode=static 时 listRouters() 不请求后端（远程菜单只在 remote/all 模式拉）；
 * remote/all 模式交给守卫的 loadRemoteRoutes，避免重复拉取并绕过失败时的强制重登。
 */
const { config } = instance.context;
const menuMode = config.route.mode;
const guardOwnsMenu = menuMode === "remote" || menuMode === "all";
if (!guardOwnsMenu && (!config.app.openAuth || getAccessToken())) {
  await useAuthStore(instance.pinia).listRouters();
}
