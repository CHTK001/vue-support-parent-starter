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
import { loginView } from "@repo/theme/koi/framework";
// 本路由树直接引 @pages/collect 的 view 文件（如 CollectorView.vue），
// 走的是「别名 → 具体文件」，不会经过 @pages/collect 包的 index.ts，
// 那里的副作用 import "./styles/collect.css" 因此从不执行，
// 表现为顶部工具栏没有任何样式：控件竖着堆、边框圆角背景全无。
// 与 @pages/job 的处理一致（其 src/index.ts:24 同样显式引这一行）。
// koi-tech-console.css 是后面新增的皮肤层：采集侧页面的深色科技风外观
// （令牌、卡片 / 表格 / 工具条 / 状态层）全部在它里面，少引它这几个页面
// 会「有骨架没颜色」。顺序与 @pages/collect 包的入口保持一致。
import "@pages/collect/src/styles/koi-tech-console.css";
import "@pages/collect/src/styles/collect.css";

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
      // 采集管理统一走 @pages/collect 的采集器管理页。
      //
      // 原先这里是 eduai 自研的 CollectTaskView.vue，打 /v2/edu/collect/*，
      // 数据模型是「单来源 + 学科/学段/难度」的扁平任务表 edu_collect_task。
      // 采集能力已统一到采集平台模块（@pages/collect + /v2/collect/**），
      // 那套是「采集器 + 流程 DSL + 调度」三层，自研那套属于同一能力的两份实现，
      // 继续并存只会让两边的调度语义、节点体系越走越远，故此处收敛到唯一一份实现。
      //
      // 页面路径保持 /edu/collect 不变：侧边栏入口、深链、历史书签都不断。
      path: "/edu/collect",
      name: "EduCollect",
      component: () => import("@pages/collect/src/views/CollectorView.vue"),
      meta: { title: "采集管理", icon: "Download", showLink: true, keepAlive: true, isVisible: "1" },
    },
    // 采集器列表里的「运行记录」「采集结果」两个按钮要落到页面，
    // CollectorView 用命名路由 CollectRun / CollectRecord 跳转，宿主注册同名路由即可。
    //
    // 为什么必须注册：原先它们写死 /collect/run、/collect/record，
    // eduai 只挂 /edu/collect，点这两个按钮直接 404（实测）。
    //
    // showLink:false —— 不进侧边栏。本次只把「采集管理」收敛过来，
    // 菜单结构保持 eduai 原样；这两个页面只作为列表按钮的下游落点。
    {
      path: "/edu/collect/run",
      name: "CollectRun",
      component: () => import("@pages/collect/src/views/TaskView.vue"),
      meta: { title: "运行记录", icon: "Timer", showLink: false, keepAlive: true, isVisible: "1" },
    },
    {
      path: "/edu/collect/record",
      name: "CollectRecord",
      component: () => import("@pages/collect/src/views/RecordView.vue"),
      meta: { title: "采集结果", icon: "Files", showLink: false, keepAlive: true, isVisible: "1" },
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
      // 汉字库：字 / 读音 / 笔顺（顺序）/ 字画 / 释义 的基础数据维护
      path: "/edu/hanzi",
      name: "EduHanzi",
      component: () => import("../views/HanziBankView.vue"),
      meta: { title: "汉字库", icon: "EditPen", showLink: true, keepAlive: true, isVisible: "1" },
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
    // 成语接龙：学生端模块卡的实际落点，题目由服务端自动生成（首尾相接）
    path: "/edu/fun/idiom-chain",
    name: "EduFunIdiomChain",
    component: () => import("../views/IdiomChainView.vue"),
    meta: { title: "成语接龙", icon: "Connection", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 汉字识字：消费「汉字库」的读音/笔顺/字画/释义，题目由服务端自动生成
    path: "/edu/fun/hanzi",
    name: "EduFunHanzi",
    component: () => import("../views/HanziGameView.vue"),
    meta: { title: "汉字识字", icon: "Reading", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 古诗补全：给一句诗选下一句（趣味学习组，学生端消费）
    path: "/edu/fun/poem",
    name: "EduFunPoem",
    component: () => import("../views/PoemGameView.vue"),
    meta: { title: "古诗补全", icon: "Reading", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 古诗文闯关：七种玩法合一（诗句排序 / 飞花令 / 看句猜题 / 诗归其主 / 朝代溯源 / 题材归类 / 炼字填空）
    path: "/edu/fun/poem-challenge",
    name: "EduFunPoemChallenge",
    component: () => import("../views/PoemChallengeView.vue"),
    meta: { title: "古诗文闯关", icon: "Medal", showLink: false, isVisible: "0", keepAlive: true },
  },
  {
    // 学生登录页：独立全屏（position:fixed 脱离管理后台外壳）。
    // 账号可用学号或家长手机号。
    //
    // meta.position="top" → 走框架既有的「顶部菜单」通道（packages/core/src/router/menu.ts
    // 的 _position()），由 ReTopMenus 渲染到顶栏，不占侧边栏；icon 走标准菜单图标，
    // 未配 icon 时框架会用 resolveMenuDefaultIcon() 兜底。
    path: "/edu/student-login",
    name: "EduStudentLogin",
    component: () => import("../views/portal/StudentLoginView.vue"),
    meta: {
      title: "学生端",
      icon: "Student",
      position: "top",
      showLink: false,
      isVisible: "0",
      keepAlive: false,
    },
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
    // 老师端：独立全屏页面，只看本人带的班级。
    // position:"top" 与「学生端」走同一顶部菜单通道 —— 否则老师端只有知道 URL 才进得来
    // （用户反馈「老师的页面呢」正是因为没有可见入口）。
    path: "/edu/teacher",
    name: "EduTeacherPortal",
    component: () => import("../views/portal/TeacherPortalView.vue"),
    meta: { title: "老师端", icon: "Reading", position: "top", showLink: false, isVisible: "0", keepAlive: false },
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
  {
    // 后台登录页。路径必须与 config.route.loginPath（默认 /login）一致：
    // 路由守卫把「无令牌」的访问重定向到这里并直接放行（guard.ts 第 95-101 行），
    // 但本路由树原先没有这条路由，于是未登录访问任何页面都会落到一个
    // 没有组件匹配的地址 —— Vue Router 渲染出空白页，而不是登录表单。
    // 组件复用框架主题包自带的 loginView，与其它应用同一份实现与同一套登录样式。
    path: "/login",
    name: "EduLogin",
    component: loginView,
    meta: { title: "登录", showLink: false, isVisible: "0", keepAlive: false },
  },
];
