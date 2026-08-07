/**
 * @repo/signin - Sign-in shared package
 *
 * Provides:
 *   - SignInMine.vue: User sign-in page (calendar grid + streak + points + socket push)
 *   - SignInManage.vue: Admin summary page (user / days / points)
 *   - API: /signin/do, /signin/today, /signin/calendar, /signin/stats, /signin/users/page
 *   - Socket: signin:done event listener
 */
import { registerMenuViewModules } from "@repo/core";

registerMenuViewModules({
  "views/signin/mine/index.vue": () => import("./views/SignInMine.vue"),
  "views/signin/manage/index.vue": () => import("./views/SignInManage.vue"),
});

export { signinRoutes, signinMenus } from "./routes";
export * from "./api/types";
export * from "./api/signinApi";