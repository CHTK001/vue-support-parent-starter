/**
 * 爬虫中心路由表 + 静态菜单表。
 *
 * 由 createAppRouter 自动扫描 apps/vue-xx 项目的 router 目录，
 * 此处按 RouteConfigsTable 协议导出，被 main.ts 注入到框架。
 *
 * 静态菜单（spiderMenus）与路由（spiderRoutes）同结构：
 *   - 顶层 /spider 重定向到第一个子页面
 *   - meta.isVisible = "1" 才能在 koi 主题侧边栏中显示
 *   - meta.icon 用 element-plus 图标名（koi 主题支持 iconify / element icon）
 */
import type { RouteConfigsTable } from "@repo/core";

/**
 * 爬虫中心子页面路由。
 *
 * - /spider/definitions       爬虫定义列表
 * - /spider/designer/:code    可视化编排（RelationGraph 拖拽式）
 * - /spider/flow-list         流程定义列表（RelationGraph 编排）
 * - /spider/flow-designer/:code  流程可视化编排
 * - /spider/flow-debug/:code  流程调试执行（节点日志回放）
 * - /spider/data-records      采集数据列表
 * - /spider/executions        执行记录与实时控制
 */
export const spiderRoutes: RouteConfigsTable[] = [
  {
    path: "/spider/definitions",
    name: "SpiderDefinitions",
    component: () => import("../views/DefinitionsView.vue"),
    meta: {
      title: "爬虫定义",
      icon: "Connection",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/spider/designer/:code",
    name: "SpiderDesigner",
    component: () => import("../views/DesignerView.vue"),
    meta: {
      title: "可视化编排",
      icon: "Share",
      showLink: false,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/spider/flow-list",
    name: "SpiderFlowList",
    component: () => import("../views/FlowListView.vue"),
    meta: {
      title: "流程定义",
      icon: "Connection",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/spider/flow-designer/:code",
    name: "SpiderFlowDesigner",
    component: () => import("../views/FlowDesignerView.vue"),
    meta: {
      title: "流程编排",
      icon: "Share",
      showLink: false,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/spider/flow-debug/:code",
    name: "SpiderFlowDebug",
    component: () => import("../views/FlowDebugView.vue"),
    meta: {
      title: "流程调试",
      icon: "VideoPlay",
      showLink: false,
      keepAlive: false,
      isVisible: "1",
    },
  },
  {
    path: "/spider/data-records",
    name: "SpiderDataRecords",
    component: () => import("../views/DataRecordsView.vue"),
    meta: {
      title: "采集数据",
      icon: "Document",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/spider/executions",
    name: "SpiderExecutions",
    component: () => import("../views/ExecutionsView.vue"),
    meta: {
      title: "执行记录",
      icon: "Histogram",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
];

/**
 * 爬虫中心静态菜单。
 *
 * 顶层一级菜单（图标 + 标题），展开后是 4 个二级页面。
 * 与 spiderRoutes 一一对应：
 *   /spider         重定向到 /spider/definitions
 *   /spider/definitions
 *   /spider/designer/:code
 *   /spider/data-records
 *   /spider/executions
 *
 * 注意：registerStaticMenu 会替换全局菜单，所以这里也包含框架默认的
 * /home 菜单项（来自 framework.ts），避免替换后丢失首页入口。
 */
export const spiderMenus = [
  {
    path: "/",
    name: "layout",
    redirect: "/home",
    meta: {
      title: "menu.home.auth",
      icon: "koi-home",
      isVisible: "1",
    },
    children: [
      {
        path: "/home",
        name: "homePage",
        meta: { title: "menu.home.work.name", icon: "koi-work", isVisible: "1" },
      },
    ],
  },
  {
    path: "/spider",
    name: "SpiderRoot",
    redirect: "/spider/definitions",
    meta: {
      title: "爬虫中心",
      icon: "Connection",
      isVisible: "1",
    },
    children: spiderRoutes.map(r => ({
      path: r.path,
      name: r.name,
      meta: { title: (r.meta as any)?.title, icon: (r.meta as any)?.icon, isVisible: "1" },
    })),
  },
];
