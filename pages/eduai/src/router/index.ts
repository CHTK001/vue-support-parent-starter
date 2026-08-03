/**
 * 教育 AI 路由表 + 静态菜单表。
 *
 * 7 个页面：
 * - /edu             工作台（6 卡片入口 + AI 健康 + 队列状态）
 * - /edu/question    题库管理
 * - /edu/paper       AI 组卷
 * - /edu/marking     AI 阅卷
 * - /edu/knowledge   知识库
 * - /edu/wrongbook   错题库
 * - /edu/exam        考试管理
 *
 * isVisible = "1" 才能在 koi 主题侧边栏中显示。
 */
import type { RouteConfigsTable } from "@repo/core";

export const eduaiRoutes: RouteConfigsTable[] = [
  {
    path: "/edu",
    name: "EduHome",
    component: () => import("../views/HomeView.vue"),
    meta: {
      title: "工作台",
      icon: "HomeFilled",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/edu/question",
    name: "EduQuestion",
    component: () => import("../views/QuestionView.vue"),
    meta: {
      title: "题库管理",
      icon: "Notebook",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/edu/paper",
    name: "EduPaper",
    component: () => import("../views/PaperView.vue"),
    meta: {
      title: "AI 组卷",
      icon: "MagicStick",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/edu/marking",
    name: "EduMarking",
    component: () => import("../views/MarkingView.vue"),
    meta: {
      title: "AI 阅卷",
      icon: "Reading",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/edu/knowledge",
    name: "EduKnowledge",
    component: () => import("../views/KnowledgeView.vue"),
    meta: {
      title: "知识库",
      icon: "DataAnalysis",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/edu/wrongbook",
    name: "EduWrongbook",
    component: () => import("../views/WrongbookView.vue"),
    meta: {
      title: "错题库",
      icon: "Warning",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
  {
    path: "/edu/exam",
    name: "EduExam",
    component: () => import("../views/ExamView.vue"),
    meta: {
      title: "考试管理",
      icon: "Document",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
    },
  },
];

/**
 * 教育 AI 静态菜单。
 *
 * 顶层一级菜单（工作台），展开后是 7 个二级页面。
 * 与 eduaiRoutes 一一对应：/edu 重定向到 /edu 自身（工作台即首页）。
 *
 * 注意：registerStaticMenu 会替换全局菜单，所以这里也包含框架默认的
 * /home 菜单项（来自 framework.ts），避免替换后丢失首页入口。
 */
export const eduaiMenus = [
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
    path: "/edu",
    name: "EduRoot",
    redirect: "/edu",
    meta: {
      title: "教育 AI",
      icon: "Reading",
      isVisible: "1",
    },
    children: eduaiRoutes.map(r => ({
      path: r.path,
      name: r.name,
      meta: { title: (r.meta as any)?.title, icon: (r.meta as any)?.icon, isVisible: "1" },
    })),
  },
];
