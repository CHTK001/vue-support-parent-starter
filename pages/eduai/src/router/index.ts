/**
 * 教育 AI 路由树（同时是侧边栏菜单树）—— 两级分组导航
 *
 * 结构约定（与 apps/vue-support-monitor-starter/src/routes.ts 同一套写法）：
 *   - 一级 = 分组父节点：meta.isGroup=true，只有 title/icon，没有 component 与 redirect。
 *     koi 侧边栏把它渲染成 el-menu-item-group 的小号灰色标题（不可点击），组内子项常显（不折叠）。
 *   - 二级 = 具体页面：叶子路由，带 component，是菜单里唯一可点击的一层。
 *   - 分组父节点既无 component 又无 redirect，registerRoutesUnderLayout 会跳过它，
 *     只作为菜单容器；子节点仍被逐个 addRoute 到 layout 之下（path 以 / 开头 = 绝对路径）。
 *
 * 隐藏路由必须留在顶层：getShowStaticAndDynamicMenuList 只过滤顶层节点，
 * 分组内的子节点不看 isVisible/showLink，放进去就会出现在菜单里。
 *
 * 顶层独立入口 /edu 是教育概览页；框架默认「工作台」(/home) 由 buildMenuFromRoutes
 * 在路由树未含 homePath 时自动补到最前面，无需在此声明。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 分组父节点（仅菜单标题，不注册为路由） */
function group(
  path: string,
  name: string,
  title: string,
  icon: string,
  children: NonNullable<RouteConfigsTable["children"]>
): RouteConfigsTable {
  return {
    path,
    name,
    meta: { title, icon, isGroup: true, showLink: true },
    children,
  };
}

export const eduaiRoutes: RouteConfigsTable[] = [
  {
    path: "/edu",
    name: "EduHome",
    component: () => import("../views/HomeView.vue"),
    meta: { title: "教育概览", icon: "HomeFilled", showLink: true, keepAlive: true, isVisible: "1" },
  },

  // ==================== 题库资源 ====================
  group("/grp-question", "GroupEduQuestion", "题库资源", "Coin", [
    {
      path: "/edu/collect",
      name: "EduCollect",
      component: () => import("../views/CollectTaskView.vue"),
      meta: { title: "采集管理", icon: "Download", showLink: true, keepAlive: true, isVisible: "1" },
    },
  ]),

  // ==================== 考试流程 ====================
  group("/grp-exam", "GroupEduExam", "考试流程", "Document", [
    {
      path: "/edu/paper",
      name: "EduPaper",
      component: () => import("../views/PaperView.vue"),
      meta: { title: "AI 组卷", icon: "MagicStick", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/exam",
      name: "EduExam",
      component: () => import("../views/ExamView.vue"),
      meta: { title: "考试管理", icon: "Tickets", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/marking",
      name: "EduMarking",
      component: () => import("../views/MarkingView.vue"),
      meta: { title: "AI 阅卷", icon: "Reading", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/wrongbook",
      name: "EduWrongbook",
      component: () => import("../views/WrongbookView.vue"),
      meta: { title: "错题库", icon: "Warning", showLink: true, keepAlive: true, isVisible: "1" },
    },
  ]),

  // ==================== 趣味学习 ====================
  group("/grp-fun", "GroupEduFun", "趣味学习", "Sunny", [
    {
      path: "/edu/fun",
      name: "EduFun",
      component: () => import("../views/FunView.vue"),
      meta: { title: "趣味中心", icon: "Star", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/fun/insect",
      name: "EduFunInsect",
      component: () => import("../views/InsectView.vue"),
      meta: { title: "昆虫识图", icon: "Search", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/fun/idiom",
      name: "EduFunIdiom",
      component: () => import("../views/IdiomGameView.vue"),
      meta: { title: "成语消消乐", icon: "Trophy", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/fun/config",
      name: "EduFunConfig",
      component: () => import("../views/FunConfigView.vue"),
      meta: { title: "模块配置", icon: "Setting", showLink: true, keepAlive: true, isVisible: "1" },
    },
  ]),

  // ==================== 数据配置 ====================
  group("/grp-data", "GroupEduData", "数据配置", "Setting", [
    {
      path: "/edu/question",
      name: "EduQuestion",
      component: () => import("../views/QuestionView.vue"),
      meta: { title: "题库管理", icon: "Notebook", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/knowledge",
      name: "EduKnowledge",
      component: () => import("../views/KnowledgeView.vue"),
      meta: { title: "知识库", icon: "DataAnalysis", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/idioms",
      name: "EduIdioms",
      component: () => import("../views/IdiomBankView.vue"),
      meta: { title: "成语库", icon: "Collection", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/data-config",
      name: "EduDataConfig",
      component: () => import("../views/DataConfigView.vue"),
      meta: { title: "维度数据", icon: "Grid", showLink: true, keepAlive: true, isVisible: "1" },
    },
  ]),

  // ==================== 隐藏路由（不进菜单，仍可访问） ====================
  {
    // 昆虫图鉴卡片：昆虫识图配对错误时弹出（remind=true 只注册路由、不进菜单，也不被菜单导航控制）
    path: "/edu/fun/insect-card",
    name: "EduFunInsectCard",
    component: () => import("../views/InsectCardView.vue"),
    meta: { title: "昆虫图鉴卡片", icon: "Reading", remind: true, showLink: false, isVisible: "0", keepAlive: false },
  },
  {
    // 成语学习卡片：消消乐配对错误时弹出（remind=true 只注册路由、不进菜单，也不被菜单导航控制）
    path: "/edu/fun/idiom-card",
    name: "EduFunIdiomCard",
    component: () => import("../views/IdiomCardView.vue"),
    meta: { title: "成语学习卡片", icon: "Reading", remind: true, showLink: false, isVisible: "0", keepAlive: false },
  },
  {
    // 定时任务已并入「采集管理」：一个采集任务就是 job-starter 里的一个调度任务
    path: "/edu/schedule",
    name: "EduSchedule",
    redirect: "/edu/collect",
    meta: { title: "采集管理", icon: "Timer", showLink: false, isVisible: "0", activeMenu: "/edu/collect" },
  },
];
