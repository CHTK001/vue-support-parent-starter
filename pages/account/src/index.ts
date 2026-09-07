/**
 * @pages/account —— 账号自动注册与管理页面
 *
 * 提供 Grok 等第三方平台的账号批量注册、账号池管理、配置持久化功能。
 * 通过 SPI 扩展点支持多平台（Grok/Twitter/Discord 等）。
 */
import { registerMenuViewModules } from "@repo/core";
import "./styles/index.css";

registerMenuViewModules({
  "views/account/index.vue": () => import("./views/AccountManage.vue"),
});

export { accountRoutes, accountMenus } from "./routes";
export * from "./api";
