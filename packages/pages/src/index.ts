/**
 * @repo/pages —— 通用页面库
 *
 * 提供跨主题复用的通用页面（错误页等）及其路由配置。
 * 主题特有页面（登录页、布局、仪表盘）保留在各主题内。
 */
import type { RouteConfigsTable } from "@repo/core";

// 暴露单个错误页组件，供 core/theme 在未注册主题错误页时回退使用
export { default as error403 } from "./error/403.vue";
export { default as error404 } from "./error/404.vue";
export { default as error500 } from "./error/500.vue";

/** 错误页路由（403 / 404 / 500 + 兜底） */
export const errorRoutes: RouteConfigsTable[] = [
  {
    path: "/403",
    name: "403",
    component: () => import("./error/403.vue"),
    meta: {
      title: "403",
      icon: "QuestionFilled",
      showLink: false,
    },
  },
  {
    path: "/404",
    name: "404",
    component: () => import("./error/404.vue"),
    meta: {
      title: "404",
      icon: "CircleCloseFilled",
      showLink: false,
    },
  },
  {
    path: "/500",
    name: "500",
    component: () => import("./error/500.vue"),
    meta: {
      title: "500",
      icon: "WarningFilled",
      showLink: false,
    },
  },
  // 找不到 path 将跳转 404 页面
  {
    path: "/:pathMatch(.*)*",
    component: () => import("./error/404.vue"),
  },
];
