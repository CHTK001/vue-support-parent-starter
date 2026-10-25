/**
 * Hotsport 路由 — 消费 {@code @pages/hotsport} 包。
 *
 * <p>独立部署形态：整套观测页面统一挂在 {@code /hotsport/*} 前缀下
 * （与包内 {@code ROUTE_PREFIX} 一致，页面之间的跳转自动对齐）。
 * 路由与页面组件全部来自包，本文件只做入口重定向 —— 改页面只需改包，
 * 本应用与其他集成方同步获得最新版本。</p>
 *
 * @since 2.0.0
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { hotsportRoutes } from "@pages/hotsport";

/** 首页重定向：/ → 包路由的默认首页（总览看板） */
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/hotsport/dashboard",
  },
  ...(hotsportRoutes as unknown as RouteRecordRaw[]),
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
