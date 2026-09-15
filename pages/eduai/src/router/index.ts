/**
 * 教育 AI 路由表 + 静态菜单表。
 *
 * 10 个页面：
 * - /edu             工作台（6 卡片入口 + AI 健康 + 队列状态）
 * - /edu/question    题库管理
 * - /edu/paper       AI 组卷
 * - /edu/marking     AI 阅卷
 * - /edu/knowledge   知识库
 * - /edu/wrongbook   错题库
 * - /edu/exam        考试管理
 * - /edu/fun         趣味学习（非 router 方式显示）
 * - /edu/fun/config  趣味模块配置
 * - /edu/fun/insect  昆虫识图
 * - /edu/fun/idiom   成语消消乐
 *
 * isVisible = "1" 才能在 koi 主题侧边栏中显示。
 * remind = true 表示不受菜单控制（独立显示）。
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
  {
    path: "/edu/fun",
    name: "EduFun",
    component: () => import("../views/FunView.vue"),
    meta: {
      title: "趣味学习",
      icon: "MagicStick",
      showLink: true,
      keepAlive: true,
      isVisible: "1",
      remind: true, // 不受菜单控制，独立显示
    },
  },
  {
    path: "/edu/fun/config",
    name: "EduFunConfig",
    component: () => import("../views/FunConfigView.vue"),
    meta: {
      title: "趣味模块配置",
      icon: "Setting",
      showLink: false, // 不在菜单中显示
      keepAlive: true,
      isVisible: "0",
    },
  },
  {
    path: "/edu/fun/insect",
    name: "EduFunInsect",
    component: () => import("../views/InsectView.vue"),
    meta: {
      title: "昆虫识图",
      icon: "Bug",
      showLink: false,
      keepAlive: true,
      isVisible: "0",
    },
  },
  {
    path: "/edu/fun/idiom",
    name: "EduFunIdiom",
    component: () => import("../views/IdiomGameView.vue"),
    meta: {
      title: "成语消消乐",
      icon: "Trophy",
      showLink: false,
      keepAlive: true,
      isVisible: "0",
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
    children: [
      ...eduaiRoutes
        .filter((r) => (r.meta as any)?.showLink !== false)
        .map((r) => ({
          path: r.path,
          name: r.name,
          meta: {
            title: (r.meta as any)?.title,
            icon: (r.meta as any)?.icon,
            isVisible: (r.meta as any)?.isVisible || "1",
            remind: (r.meta as any)?.remind,
          },
        })),
      // 趣味模块子菜单
      {
        path: "/edu/fun/config",
        name: "EduFunConfig",
        meta: {
          title: "趣味模块配置",
          icon: "Setting",
          isVisible: "1",
        },
      },
    ],
  },
];
