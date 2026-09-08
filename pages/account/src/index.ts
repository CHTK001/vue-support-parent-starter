/**
 * @pages/account 自动注册账号管理页面模块
 *
 * 提供 Grok 等大模型平台的账号注册、账号池管理和配置持久化功能。
 * 通过 SPI 扩展，支持多平台（Grok/Twitter/Discord 等）。
 */
import { registerMenuViewModules } from "@repo/core";
import "./styles/index.css";

registerMenuViewModules({
  "views/account/index.vue": () => import("./views/AccountManage.vue"),
});

export { accountRoutes, accountMenus } from "./routes";
