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
      path: "/edu/poems",
      name: "EduPoems",
      component: () => import("../views/PoemBankView.vue"),
      meta: { title: "古诗库", icon: "Reading", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/insects",
      name: "EduInsects",
      component: () => import("../views/InsectBankView.vue"),
      meta: { title: "昆虫库", icon: "Aim", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      // 模块管理：配置**每个学段有哪些趣味模块**（学生端首页卡片由此生成）。
      // 这是纯配置页，不是用来打开模块的 —— 模块由学生端自己的页面消费。
      path: "/edu/fun/config",
      name: "EduFunConfig",
      component: () => import("../views/FunConfigView.vue"),
      meta: { title: "模块管理", icon: "Setting", showLink: true, keepAlive: true, isVisible: "1" },
    },
    {
      // 学生管理：学生 / 班级 / 教师档案（学生端绑定与学习数据由学生自己产生）
      path: "/edu/students",
      name: "EduStudents",
      component: () => import("../views/StudentManageView.vue"),
      meta: { title: "学生管理", icon: "User", showLink: true, keepAlive: true, isVisible: "1" },
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
    // 手动组卷：入口在 PaperView 列表工具栏（带当前检索的学科/学段跳转），不进侧边栏菜单
    path: "/eduai/paper-compose",
    name: "EduaiPaperCompose",
    component: () => import("../views/PaperComposeView.vue"),
    meta: { title: "手动组卷", icon: "EditPen", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 趣味中心：管理端不再放入口（模块与菜单由「模块管理」按学段配置，
    // 学生端在 /edu/student 里消费），此路由仅保留可达，供学生端卡片与模块路径引用
    path: "/edu/fun",
    name: "EduFun",
    component: () => import("../views/FunView.vue"),
    meta: { title: "趣味中心", icon: "Star", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 昆虫识图：学生端模块卡的实际落点，管理端不再放菜单入口
    path: "/edu/fun/insect",
    name: "EduFunInsect",
    component: () => import("../views/InsectView.vue"),
    meta: { title: "昆虫识图", icon: "Search", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 成语消消乐：学生端模块卡的实际落点，管理端不再放菜单入口
    path: "/edu/fun/idiom",
    name: "EduFunIdiom",
    component: () => import("../views/IdiomGameView.vue"),
    meta: { title: "成语消消乐", icon: "Trophy", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 古诗补全：给一句诗选下一句（趣味学习组，学生端消费）
    path: "/edu/fun/poem",
    name: "EduFunPoem",
    component: () => import("../views/PoemGameView.vue"),
    meta: { title: "古诗补全", icon: "Reading", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 学生端：独立全屏页面（position:fixed 脱离管理后台外壳），
    // 进入未绑定会先弹登记表单；按档案学段渲染小学/初中/高中三套首页
    path: "/edu/student",
    name: "EduStudentPortal",
    component: () => import("../views/portal/StudentPortalView.vue"),
    meta: { title: "学生端", icon: "Star", showLink: false, isVisible: "0", keepAlive: false },
  },
  {
    // 老师端：独立全屏页面，只看本人带的班级
    path: "/edu/teacher",
    name: "EduTeacherPortal",
    component: () => import("../views/portal/TeacherPortalView.vue"),
    meta: { title: "老师端", icon: "Reading", showLink: false, isVisible: "0", keepAlive: false },
  },
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
