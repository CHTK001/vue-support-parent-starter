/**
 * @pages/ai 路由树（同时是侧边栏菜单树）—— 与 @pages/eduai 同一套两级分组约定。
 *
 * 宿主应用只需把 aiRoutes 并进自己的路由树（菜单由 buildMenuFromRoutes 自动推导）：
 *   createContextApp({ install })
 *     .routes([...hostRoutes, ...aiRoutes] as never)
 *     .mount("#app");
 *
 * 结构约定（详见 pages/eduai/src/router/index.ts 头注释）：
 *   - 一级 = 分组父节点：meta.isGroup=true，只有 title/icon，不可点击；
 *   - 二级 = 叶子页面：带 component，是菜单唯一可点击的一层；
 *   - 隐藏路由必须放顶层（菜单只过滤顶层节点）。
 *
 * 登录路由由宿主应用提供，本包不携带。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 分组父节点（仅菜单标题，不注册为路由） */
function group(
  path: string,
  name: string,
  title: string,
  icon: string,
  children: NonNullable<RouteConfigsTable["children"]>,
): RouteConfigsTable {
  return {
    path,
    name,
    meta: { title, icon, isGroup: true, showLink: true },
    children,
  };
}

/** AI 配置菜单：提供商管理 / 模型管理 / 默认模型配置（三块独立组件，也可单独 import 装配） */
export const aiRoutes: RouteConfigsTable[] = [
  group("/grp-ai", "GroupAiAdmin", "AI 配置", "Connection", [
    {
      path: "/ai/providers",
      name: "AiProviders",
      component: () => import("../views/AiProviderView.vue"),
      meta: {
        title: "提供商管理",
        icon: "Shop",
        showLink: true,
        keepAlive: true,
        isVisible: "1",
      },
    },
    {
      path: "/ai/models",
      name: "AiModels",
      component: () => import("../views/AiModelView.vue"),
      meta: {
        title: "模型管理",
        icon: "Cpu",
        showLink: true,
        keepAlive: true,
        isVisible: "1",
      },
    },
    {
      path: "/ai/defaults",
      name: "AiDefaults",
      component: () => import("../views/AiDefaultConfigView.vue"),
      meta: {
        title: "默认模型配置",
        icon: "SetUp",
        showLink: true,
        keepAlive: true,
        isVisible: "1",
      },
    },
  ]),
];
