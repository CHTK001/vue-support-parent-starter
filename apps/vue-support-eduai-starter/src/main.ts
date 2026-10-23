/**
 * vue-support-eduai-starter 应用入口。
 *
 * .routes(路由树)：路由树即菜单树（两级分组导航），自动挂到 layout 之下并驱动侧边栏；
 * 路由树未含 homePath 时由 buildMenuFromRoutes 补上框架默认导航项「工作台」(/home)。
 *
 * 主题与组件：app.yaml themeId=koi，主题安装器（ElementPlus/图标/指令/ReIcon/ScrollNav/
 * Drawer）由 createContextApp 按 themeId 自动解析；业务用到的其余 Re* 组件收敛为
 * @repo/ui core preset + 少量追加，main.ts 不再 installKoi/installUi 手写组件清单。
 */
import { createContextApp } from "@repo/app";
import { eduaiRoutes } from "@pages/eduai";
import { getAccessToken } from "@repo/utils";
import { useAuthStore } from "@repo/pinia";
import { getRouter } from "@repo/core";
// AI 提供商管理（pages/ai 的模型管理页）以内部普通页面组件嵌入本应用，
// 深导入 /embed 而非包根：它在 import 时合并 pages/ai 语言包，不拖 AI 控制台整壳。
import "@pages/ai/embed";
import { adoptHostFramework } from "@pages/ai/embed";

const instance = await createContextApp({
  // 代码级默认配置（优先级最低，app.yaml 可覆盖）：
  // 分组导航增强 —— 分组标题按分区标题排版（加大/加粗/深色）+ 底部带文字的「设置」条目。
  // 框架默认即 true，这里显式声明是为了让本应用「菜单长相」的意图在入口处可见。
  defaults: { menu: { groupNav: true } },
})
  .routes(eduaiRoutes as never)
  // Re* 组件清单：core preset（CRUD 基础件）+ ReTime（采集器「下次执行」倒计时列）、
  // ReAsync（AI 提供商页异步加载用）。清单由 @repo/ui 维护，避免在壳里抄一份漂移。
  .ui({ preset: "core", components: ["ReTime", "ReAsync"] })
  .mount("#app");

// pages/ai 内嵌页（ModelsPage）显式采用本应用框架上下文：请求管线本就可经宿主
// 默认实例回退拿到（见 pages/ai/framework/context.ts），这里再保证 pages/ai
// 直接读 context 的能力与宿主一致；语言包已在 import "@pages/ai/embed" 时合并。
adoptHostFramework(instance.context);

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
