/**
 * @pages/achievement - Achievement management shared package
 *
 * Provides:
 *   - AchievementManage.vue: Admin CRUD for achievement tiers
 *   - AchievementMine.vue: User's own achievements with real-time socket push
 *   - API: /achievement/tiers/*, /achievement/my/*, /achievement/stats/*
 *   - Socket: achievement:unlock event listener
 */
import { registerMenuViewModules } from "@repo/core";

registerMenuViewModules({
  "views/achievement/manage/index.vue": () => import("./views/AchievementManage.vue"),
  "views/achievement/mine/index.vue": () => import("./views/AchievementMine.vue"),
});

export { achievementRoutes, achievementMenus } from "./routes";
export * from "./api/types";
export * from "./api/achievementApi";
