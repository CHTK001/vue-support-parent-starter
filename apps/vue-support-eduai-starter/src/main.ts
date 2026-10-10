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
import { aiRoutes } from "@pages/ai";
import type { App as VueApp } from "vue";
import { installKoi } from "@repo/theme/koi/framework";
import { installUi } from "@repo/ui";
import { getAccessToken } from "@repo/utils";
import { useAuthStore } from "@repo/pinia";
import { getRouter } from "@repo/core";

/** 教育 AI 页面用到的 Re* 组件（ReKit 提供 ReTableColumn 等表格子组件） */
const EDUAI_RE_COMPONENTS = ["ReButton", "ReCron", "ReInput", "ReSelect", "ReSearch", "ReTable", "ReKit", "ReSwitch", "ReTag"];

async function installEduAi(app: VueApp): Promise<void> {
  await installKoi(app);
  await installUi(app, { components: EDUAI_RE_COMPONENTS });
}

const instance = await createContextApp({
  install: installEduAi,
  // 代码级默认配置（优先级最低，app.yaml 可覆盖）：
  // 分组导航增强 —— 分组标题按分区标题排版（加大/加粗/深色）+ 底部带文字的「设置」条目。
  // 框架默认即 true，这里显式声明是为了让本应用「菜单长相」的意图在入口处可见。
  defaults: { menu: { groupNav: true } },
})
  .routes([...eduaiRoutes, ...aiRoutes] as never)
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

/**
 * 登录后的补灌（修「登录后侧边栏空壳，必须按 F5 才出菜单」）。
 *
 * 上面那次灌入只在应用启动时执行一次，而整页加载时通常还没有令牌
 * （条件里的 getAccessToken() 为 false），于是被跳过；
 * 真正的登录是在 SPA 内完成的、不会重启应用，因此这条路径永远没人灌菜单，
 * 侧边栏就只剩 logo 与底部「设置」。
 * 按 F5 之所以能恢复，正是因为重启后启动时有令牌、上面那次补救生效了。
 *
 * 这里监听首次路由跳转：登录成功必定紧跟一次跳转（进首页），
 * 此刻已持有令牌，补灌一次即可，行为与刷新后完全一致。
 */
if (!guardOwnsMenu) {
  let menuSeeded = Boolean(getAccessToken());
  getRouter().afterEach(() => {
    if (menuSeeded || !getAccessToken()) {
      return;
    }
    menuSeeded = true;
    void useAuthStore(instance.pinia).listRouters();
  });
}
