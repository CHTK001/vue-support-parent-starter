import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import { MonitorGlobalSocketPlugin } from "./plugins/globalSocket";
import acmeRoutes from "./router/modules/acme";
import serverRoutes from "./router/modules/server";
import { AiRoutes } from "@pages/ai";
import "./utils/sso";
import "./styles/app.css";

/**
 * 启动运维管理应用
 *
 * @author CH
 */
createStandardApp({
  enableElementPlusX: true,
  /** 静态路由：ACME证书管理 + 服务器管理 + AI中心 */
  appRoutes: [...acmeRoutes, ...serverRoutes, ...AiRoutes],
  socketPlugins: [MonitorGlobalSocketPlugin],
  socketSetup: setupFullscreenSocket,
  setup(app) {
    setupDirectives(app);
  },
})
  .then((bootstrap) => {
    return bootstrap.mount("#app");
  })
  .catch((error) => {
    console.error("[MonitorBootstrap] main:bootstrap-failed", error);
  });
