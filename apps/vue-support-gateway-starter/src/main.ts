/**
 * vue-support-gateway-starter 应用入口
 *
 * 单页面模式：直接挂载 RemoteControl（左侧 ConnectionForm 配置 + 右侧 Viewer 远控画面），
 * 不经过 Layout/Sidebar/Router/Koi，打开 http://localhost:7788/ 即可看到完整远控界面。
 *
 * 通过 install 回调传入自定义主题安装器，跳过 koi 完整框架（single 模式无需 layout/router）。
 */
import { createContextApp } from "@repo/app";
import ElementPlus from "element-plus";
import { RemoteControl } from "@repo/gateway";
import { log } from "@repo/utils";

(window as any).__main = "started";
log.info("main", "createContextApp begin");

// 自定义主题安装器：仅注册 ElementPlus，不加载 koi 布局/路由（ReCard 由 ConnectionForm 局部加载）
async function installGatewayTheme(app: unknown, _ctx: unknown): Promise<void> {
  const vueApp = app as import("vue").App;
  vueApp.use(ElementPlus);
}

const { vueApp } = await createContextApp({
  mode: "single",
  install: installGatewayTheme as never,
})
  .app(RemoteControl as never)
  .mount("#app");

log.info("main", "mount done");
(window as any).__main = "mounted";