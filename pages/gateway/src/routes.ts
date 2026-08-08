/**
 * gateway 共享包路由
 *
 * 业务应用只需把 gatewayRoutes 注册到布局的子路由即可。
 *   router.addRoute("layout", ...gatewayRoutes);
 *
 * 路由结构：
 *   /gateway           —— 网关管理（控制端/被控端点）
 *   /remote            —— 远程控制主页（3 步流程）
 *   /remote/monitor    —— 会话监控（占位）
 *   /remote/config     —— 网关配置（占位）
 *   /conference/join   —— 加入会议（无登录入口）
 *
 * 主页面已迁移到 /views/RemoteControl.vue（3 步流程版本）。
 * 原 views/remote/index.vue（侧边栏 + 右侧 Viewer 双栏布局）保留兼容，
 * 可以通过 /remote/legacy 访问（已注释）。
 */
import type { RouteConfigsTable } from "@repo/core";

export const gatewayRoutes: RouteConfigsTable[] = [
  {
    path: "/gateway",
    name: "gateway",
    component: () => import("./views/GatewayManage.vue"),
    meta: {
      title: "网关管理",
      icon: "Connection",
      showLink: true,
    },
  },
  {
    path: "/remote",
    name: "remote",
    component: () => import("./views/RemoteControl.vue"),
    meta: {
      title: "远程控制",
      icon: "Monitor",
      showLink: true,
    },
  },
  {
    path: "/remote/legacy",
    name: "remote-legacy",
    component: () => import("./views/remote/index.vue"),
    meta: {
      title: "远程控制（旧版）",
      icon: "Monitor",
      showLink: false,
    },
  },
  {
    path: "/remote/monitor",
    name: "remote-monitor",
    component: () => import("./views/monitor/index.vue"),
    meta: {
      title: "会话监控",
      icon: "DataLine",
      showLink: true,
    },
  },
  {
    path: "/remote/config",
    name: "remote-config",
    component: () => import("./views/config/index.vue"),
    meta: {
      title: "网关配置",
      icon: "Setting",
      showLink: true,
    },
  },
  {
    path: "/conference/join",
    name: "conference-join",
    component: () => import("./views/conference-join/index.vue"),
    meta: {
      title: "加入会议",
      icon: "VideoCamera",
      showLink: false,
    },
  },
];