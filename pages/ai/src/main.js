/**
 * AI 控制台独立应用启动装配（物理上归档在 @pages/ai，但**不是包级公共 API**）。
 *
 * <p><strong>归属约定</strong>：本文件是 vue-support-ai-starter 的应用入口装配
 * （createApp / 框架路由与守卫 / i18n / branding / Electron 后端状态），由
 * apps/vue-support-ai-starter/src/main.js 深导入 {@code @pages/ai/main.js} 触发。
 * 包根 {@code index.ts} 不 re-export 本文件（避免共享包 @pages/ai 被误用时
 * 整壳 + element-plus/tailwind/refactor 样式污染宿主）。</p>
 *
 * <p><strong>框架边界</strong>：登录页（koi ReLoginForm）、路由守卫、白名单、
 * token 存储与 401 跳转全部来自 vue 框架（@repo/core / @repo/theme / @repo/pinia）；
 * 本应用只提供首页布局与业务路由，不再自写第二套登录与守卫。</p>
 *
 * <p>宿主（system / eduai）要复用 AI 业务页，应走 /menu、/embed 或具体组件路径。</p>
 */
import { createApp } from "vue";
// Element Plus 全局插件（所有 el-* 组件 / 指令 / ElMessage 的 DOM 与尺寸）：
// 页面代码此前只导入了 element-plus 的 CSS 与个别组件（ElConfigProvider），
// 从没有 app.use(ElementPlus) —— 导致全部 el-* 退化成 0×0 的未解析自定义元素，
// 验收测试里点击它们永远报 "element is not visible"。
import ElementPlus from "element-plus";

import App from "./App.vue";
// 路由与守卫统一由 vue 框架提供（@repo/core 的 createAppRouter /
// setupRouterGuard）。本应用不再自建 createRouter + beforeEach：
// 登录拦截、白名单、document.title、401 后的跳转都走框架同一套实现。
import { createAppRouter, isAdmin, setRouter, setupPermissionDirectives } from "@repo/core";
// 框架登录页（ReLoginForm）登录成功后会走 initAuthRouter → authStore.listRouters，
// 其中的「菜单 → 路由」解析器由主题注册。本应用使用静态路由、不消费框架菜单，
// 这里注册一个空解析器即可；否则会抛「菜单解析器未注册」，
// 把一次成功的登录误判成「登录后初始化路由失败」而停回登录页。
import { registerMenuResolver } from "@repo/pinia";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/auth";
// 会话 ID 哈希：地址栏不暴露明文会话 ID（用户口径 2026-11-13）
import { sessionHash, isSessionHash } from "./utils/sessionHash";
import NProgress from "nprogress";

import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
// koi 登录页（packages/theme）用 Uno 原子类；虚拟样式必须早于 tailwind.css，
// 让同名工具类与 reset 由 Tailwind 决定（本应用主体仍是 Tailwind v4）。
import "virtual:uno.css";
import "./tailwind.css";
// 设计令牌（体系真源）：--brand-* / --bg-* / --text-* / --border-* / --radius-* /
// --shadow-* / --status-*，与 monitor / hotspot / collect 同源。
// **必须在 refactor.css 之前**引入 —— 后者把 --color-* 改为引用这里的体系令牌，
// 顺序反了会拿到未定义值（var() 回退到无声明 → 颜色失效）。
import "./styles/tokens.css";
import "./styles/refactor.css";
// 知识库 · 编辑部设计层（作用域 .kb-refactor，只影响知识库各页与弹层）
import "./styles/kb-refactor.css";
// 服务配置 · 调度台账设计层（作用域 .svc，只影响服务配置页）
import "./styles/svc-refactor.css";
import "./styles/markdown-doc.css";
// @ 风格选择面板：必须全局引入，面板 Teleport 到 body，scoped 样式匹配不上
import "./styles/generate-style-panel.css";
// 页面标题统一层：把 8 个页面各自的标题规格（16/18/22px 混用）拉齐成一档。
// 修的是缺陷不是风格，因此默认生效，不依赖设计变体。
import "./styles/page-title-unify.css";
import "nprogress/nprogress.css";
// 组件库统一卡片视觉基线（ReStatCard 风格：re-surface / --hover / --dense）
import "@repo/ui/surface";
// 焦点样式全站移除：必须最后引入，才能压过各组件 scoped 的 :focus-visible 规则
import "./styles/focus-reset.css";

import { apiService } from "@/services/ApiService";
import { bootstrapFramework, currentToken } from "@/framework/context";
import { applyBranding, watchBranding } from "@/utils/branding";
import { initGlobalErrorHandler } from "@/utils/globalErrorHandler";
import { useLayoutStore } from "./stores/layout";
import {
  backendReady,
  backendError,
  isElectron,
} from "@/composables/useBackendStatus";
import { i18n } from "./locales";
// 路由级加载态清理：切页时收掉跨页请求遗留的遮罩（见 afterEach 注释）
import { closeRouterScoped } from "@repo/ui/re-loader";

// 本应用不使用框架侧边栏/远程菜单：注册空解析器，满足框架登录流程
// （initAuthRouter → authStore.listRouters）对菜单解析器的最小依赖。
registerMenuResolver({
  generateRoutes: () => [],
  generateFlattenRoutes: () => [],
});

// 页面刷新标志：首次导航时强制服务端验证 token，后续路由切换不再重复验证
let isInitialPageLoad = true;

// Electron 环境下：同步查询后端状态，在 Vue 挂载前确定初始值（防刷新闪烁）
if (isElectron && window.electronAPI?.getBackendStatusSync) {
  const status = window.electronAPI.getBackendStatusSync();
  backendReady.value = status.ready;
  // 刷新场景：后端已在运行，同步 IPC 已携带真实端口。
  // 立即设置 baseURL，确保首屏请求（checkAuth / loadAppearanceSettings）
  // 不会抢在异步获取端口前打到默认的 localhost:3000
  if (status.ready && status.port) {
    apiService.initBackendUrl(status.port);
  }
}
// 刷新场景兜底：后端已就绪但端口未知时，再走异步获取
if (isElectron && backendReady.value) {
  apiService.initBackendUrl();
}

// 配置 NProgress
NProgress.configure({
  easing: "ease-in-out",
  speed: 1000,
  showSpinner: false,
  trickle: true,
  trickleSpeed: 200,
  minimum: 0.08,
  // 在 Electron 环境下完全禁用进度条
  disabled: isElectron,
});

const routes = [
  {
    path: "/",
    // 框架路由桥接（core/router/themeBridge 的 hasBaseRoutes）按 name 识别
    // 「布局 / 登录页」是否已由业务提供；这里显式声明 layout，避免框架再补一套
    // koi 的首页/布局路由（那会把 AI 控制台的主页换成 koi 工作台）。
    name: "layout",
    component: () => import("./components/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Home",
        redirect: "/chat/new-session",
      },
      {
        path: "chat/:sessionId?",
        name: "Chat",
        meta: { titleKey: "common.route.chat", requiresAuth: true },
        component: () => import("./components/chat/ChatPage.vue"),
      },
      {
        path: "characters/:tab?",
        name: "Characters",
        meta: { titleKey: "common.route.characters", requiresAuth: true },
        component: () => import("./components/characters/CharactersPage.vue"),
      },
      {
        path: "bots/:tab?",
        name: "Bots",
        meta: { titleKey: "common.route.bots", requiresAuth: true },
        component: () => import("./components/bot/BotCenterPage.vue"),
      },
      {
        path: "tavern/:groupId?",
        name: "Tavern",
        meta: { title: "酒馆", requiresAuth: true },
        component: () => import("./components/tavern/TavernPage.vue"),
      },
      {
        path: "world-sim/:worldId?",
        name: "WorldSim",
        meta: { title: "模拟", requiresAuth: true },
        component: () => import("./components/world-sim/WorldSimPage.vue"),
      },
      {
        path: "setting/:tab?",
        name: "SystemSettings",
        meta: { title: "系统设置", requiresAuth: true },
        component: () => import("./components/setting/SystemSettings.vue"),
      },
      {
        path: "plugins/:tab?",
        name: "Plugins",
        meta: { titleKey: "common.route.plugins", requiresAuth: true },
        component: () => import("./components/plugins/PluginsPage.vue"),
      },
      {
        path: "knowledge-base/:id?",
        name: "KnowledgeBase",
        meta: { titleKey: "common.route.knowledgeBase", requiresAuth: true },
        component: () =>
          import("./components/knowledge-base/KnowledgeBasePage.vue"),
      },
      {
        path: "scheduler",
        name: "Scheduler",
        meta: { titleKey: "common.route.scheduler", requiresAuth: true },
        component: () => import("./components/scheduler/SchedulerPage.vue"),
      },
      {
        path: "models",
        name: "Models",
        meta: { title: "模型管理", requiresAuth: true },
        component: () => import("./components/models/ModelsPage.vue"),
      },
      {
        // 路由实时拓扑：入站 AppKey → 路由组 → 上游成员，
        // 数据来自 /api/providers/{id}/router-group/topology 单次聚合。
        path: "route",
        name: "RouterTopology",
        // 管理员专属：拓扑会暴露上游地址与分组构成，普通账号不参与路由编排
        meta: { title: "路由", requiresAuth: true, adminOnly: true },
        component: () => import("./components/management/RouterTopologyPage.vue"),
      },
      {
        // 服务管理：系统核心页（实例 / AppKey / 分组 / 访问日志 / 运行日志）。
        // 原先只是「系统设置」里的一个 tab，被设置页的双层外壳压窄；
        // 提到一级菜单后与定稿的「网关控制台」版式一致。
        path: "services",
        name: "Services",
        // 管理员专属：实例/AppKey/日志是网关侧系统配置，普通账号没有可管的服务
        meta: { title: "服务管理", requiresAuth: true, adminOnly: true },
        component: () => import("./components/management/ServicesAdminPage.vue"),
      },
      {
        path: "image-generate",
        name: "ImageGenerate",
        meta: { title: "图像生成", requiresAuth: true },
        component: () => import("./components/generate/ImageGeneratePage.vue"),
      },
      {
        path: "face-search",
        name: "FaceSearch",
        meta: { title: "人脸识别", requiresAuth: true },
        component: () => import("./components/management/FaceSearchPage.vue"),
      },
      {
        // 人脸重识别：与「人脸识别」并列的另一条业务 —— 跨摄像头/跨帧追踪同一个人
        path: "face-reid",
        name: "FaceReid",
        meta: { title: "人脸重识别", requiresAuth: true },
        component: () => import("./components/management/ReidPage.vue"),
      },
      {
        path: "audio-recognition",
        name: "AudioRecognition",
        meta: { title: "音频识别", requiresAuth: true },
        component: () => import("./components/management/AudioRecognitionPage.vue"),
      },
      {
        path: "text-to-speech",
        name: "TextToSpeech",
        meta: { title: "语音合成", requiresAuth: true },
        component: () => import("./components/management/TextToSpeechPage.vue"),
      },
      {
        path: "image-search",
        name: "ImageSearch",
        meta: { title: "以图搜图", requiresAuth: true },
        component: () => import("./components/search/ImageSearchPage.vue"),
      },
      {
        // 图像库：把「以图搜图」的底库从设置里的一个面板升为独立整页
        // （台账 / 画布 + 特征空间），与「以图搜图」并列为同一个图像段。
        path: "image-library",
        name: "ImageLibrary",
        meta: { title: "图像库", requiresAuth: true },
        component: () => import("./components/library/ImageLibraryPage.vue"),
      },
      {
        // OCR 与「以图搜图 / 人脸识别」同属图像类，放在同一段路由里便于对照
        path: "ocr",
        name: "Ocr",
        meta: { title: "OCR 识别", requiresAuth: true },
        component: () => import("./components/management/OcrPage.vue"),
      },
      {
        path: "image-colorize",
        name: "ImageColorize",
        meta: { title: "图像上色", requiresAuth: true },
        component: () => import("./components/generate/ImageColorizePage.vue"),
      },
      {
        path: "app-keys",
        name: "AppKeys",
        meta: { title: "AppKey管理", requiresAuth: true },
        component: () => import("./components/management/AppKeysPage.vue"),
      },
      {
        path: "manufacturer-keys",
        name: "ManufacturerKeys",
        meta: { title: "厂商Key管理", requiresAuth: true },
        component: () => import("./components/management/ManufacturerKeysPage.vue"),
      },
      {
        path: "roles",
        name: "Roles",
        meta: { title: "角色管理", requiresAuth: true },
        component: () => import("./components/management/RolesPage.vue"),
      },
      {
        path: "mcp",
        name: "Mcp",
        meta: { title: "MCP管理", requiresAuth: true },
        component: () => import("./components/management/McpPage.vue"),
      },
      {
        path: "agents",
        name: "Agents",
        meta: { title: "Agent管理", requiresAuth: true },
        component: () => import("./components/management/AgentsPage.vue"),
      },
      {
        path: "usage",
        name: "Usage",
        meta: { title: "用量管理", requiresAuth: true },
        component: () => import("./components/management/UsagePage.vue"),
      },
      {
        path: "connectors",
        name: "Connectors",
        meta: { title: "连接器", requiresAuth: true },
        component: () => import("./components/connectors/ConnectorsPage.vue"),
      },
      {
        path: "connectors/chat/:id",
        name: "ConnectorChat",
        meta: { title: "连接器聊天", requiresAuth: true },
        component: () => import("./components/connectors/ConnectorChatPage.vue"),
      },
      {
        path: "usage/sync-logs",
        name: "UsageSyncLogs",
        meta: { title: "同步日志", requiresAuth: true },
        component: () => import("./components/management/UsageSyncLogsPage.vue"),
      },
      {
        path: "skills",
        name: "Skills",
        meta: { title: "Skills管理", requiresAuth: true },
        component: () => import("./components/management/SkillsPage.vue"),
      },
      {
        path: "capabilities/:pipeline",
        name: "Capabilities",
        meta: { title: "视觉管线", requiresAuth: true },
        component: () => import("./components/management/CapabilityPage.vue"),
      },
    ],
  },
  {
    path: "/models/embed",
    name: "ModelsEmbed",
    meta: { title: "模型管理", requiresAuth: true, embed: true },
    // 独立顶层路由：iframe 嵌入时不带 MainLayout / GlobalSidebar / FloatingChatPanel
    component: () => import("./components/models/ModelsEmbedPage.vue"),
  },
  {
    path: "/login",
    name: "Login",
    meta: { titleKey: "common.route.login" },
    component: () => import("./components/LoginPage.vue"),
  },
  {
    path: "/password",
    name: "Password",
    meta: { titleKey: "common.route.password" },
    component: () => import("./components/PasswordPage.vue"),
  },
  {
    // 框架登录表单（ReLoginForm）成功后固定跳 HOME_URL="/home"，
    // 本应用首页是 /chat/new-session，这里做一次静默改道，避免落到 404。
    path: "/home",
    name: "home",
    redirect: "/chat/new-session",
    meta: { title: "首页" },
  },
  {
    path: "/empty",
    name: "Empty",
    component: () => import("./components/BackendWaitingOverlay.vue"),
  },
];

/**
 * 创建应用路由（必须在 bootstrapFramework() 之后调用）。
 *
 * <p>守卫、白名单、标题、401 后的登录跳转全部由框架
 * {@code @repo/core} 的 createAppRouter / setupRouterGuard 统一提供；
 * 本应用只声明「布局路由 + 登录页 + 业务路由 + fallback」，不再自写
 * beforeEach/afterEach 两套守卫。</p>
 */
function createAiRouter() {
  return createAppRouter({
    // Electron 环境使用 Hash 模式（file:// 协议不支持 History 模式），
    // Web 环境使用 History 模式（URL 更美观）
    mode: isElectron ? "hash" : "history",
    // 本应用的布局/登录/密码页/独立嵌入页全部由自己提供，
    // 框架不会再补一套 koi 布局与首页。
    layoutRoutes: routes,
    // 框架默认 fallback 是 /404；本应用没有 404 页，收敛到首页避免重定向环
    fallback: [{ path: "/:pathMatch(.*)*", name: "NotFound", redirect: "/" }],
    getAccessToken: currentToken,
    hooks: {
      // 页面标题也交给框架守卫：App.vue 里的第二条 beforeEach 删除，
      // 避免「业务 shell 自维护一套路由钩子」的旧形态。
      resolveTitle: (to) => {
        const meta = to.meta || {};
        if (meta.titleKey) return i18n.global.t(meta.titleKey);
        if (typeof meta.title === "function") return meta.title(to);
        return typeof meta.title === "string" ? meta.title : undefined;
      },
      onBeforeEach: () => {
        if (!isElectron) NProgress.start();
      },
      onAfterEach: () => {
        if (!isElectron) NProgress.done();
        // 切换页面后收掉「路由级」加载态：用户可能在请求未返回时就点了别的菜单，
        // 那个请求的 finally 迟迟不执行（后端挂住 / 断网无超时），遮罩会一直盖在
        // 新页面上导致全站不可用。只关 routerScoped 的实例，页面内局部加载态不受影响。
        closeRouterScoped("auto");
        // 登录页已交给框架 ReLoginForm：令牌与用户信息由框架写入 storage，
        // 这里把业务 store 的镜像同步回来（isAuthenticated / user 才会立即更新）。
        useAuthStore().syncFromFramework();
      },
      onError: () => {
        if (!isElectron) NProgress.done();
      },
      beforeEach: (to) => {
        // 管理员专属路由：非管理员直接回到首页，不暴露管理面
        if (to.matched.some((record) => record.meta?.adminOnly) && !isAdmin()) {
          return { path: "/" };
        }
        // 会话 ID 不明文（用户口径 2026-11-13）：/chat/<真实ID> 统一改写成 /chat/<md5>。
        // 已是 32 位十六进制哈希、或 'new-session' 的不再改写，避免重定向环。
        if (to.name === "Chat") {
          const raw = Array.isArray(to.params.sessionId) ? to.params.sessionId[0] : to.params.sessionId;
          if (raw && raw !== "new-session" && !isSessionHash(raw)) {
            return {
              name: "Chat",
              params: { ...to.params, sessionId: sessionHash(raw) },
              query: to.query,
              hash: to.hash,
              replace: true,
            };
          }
        }
      },
    },
  });
}

/** 路由实例在 bootstrapFramework() 之后创建（配置就绪后才读得到白名单等） */
let router = null;

/**
 * 启动流程：先装配框架上下文（统一配置 / 框架 storage / token 管理器 /
 * 带鉴权拦截器的请求模块），业务侧所有请求（含 SSE）都必须晚于它，
 * 再挂载 Vue 应用。
 */
async function bootstrapAndMount() {
  await bootstrapFramework();
  // 路由必须在 app.yaml 加载之后创建：白名单 / loginPath / homePath 均来自配置
  router = createAiRouter();
  // 覆盖 core 内部 createApp 创建的占位 router：http 拦截器 401/403 跳登录、
  // resetRouter 等全局能力必须作用在本应用真正安装的路由实例上。
  setRouter(router);
  // app.yaml 已加载：将标题 / favicon 从 getConfig('app') 同步到浏览器，
  // 并订阅后续配置变更（远程设置 / 环境级 yaml 覆盖）保持品牌同步。
  applyBranding();
  watchBranding();

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);
  app.use(i18n);
  // 注册 Element Plus 全局插件：没有它，所有 <el-* /> 渲染成 0×0 的未解析自定义元素
  // （<el-dialog /> 类直引的组件除外，如 ReDialog 直引 ElDialog）。
  app.use(ElementPlus);
  // 注册 vue 体系权限指令（v-admin / v-superadmin / v-role / v-perm / v-menu）。
  // 不注册时模板里的 v-admin 会被 Vue 当成「未解析指令」直接跳过（控制台
  // Failed to resolve directive: admin），元素对所有人可见 —— GlobalSidebar 的
  // 「管理员」标签就踩在这里。
  setupPermissionDirectives(app);

  // 初始化全局错误处理器（在 router 挂载后）
  initGlobalErrorHandler(router);

  // 刷新场景：用后端 /v2/user/me 校验令牌，失效则清除登录态，由守卫跳登录页
  await useAuthStore().initializeAuth();

  // 加载链接打开方式设置（从后端同步到 localStorage 缓存）。
  // 必须在后端就绪后调用：冷启动时若抢在 NestJS 监听端口之前发请求，
  // 会产生 ERR_CONNECTION_REFUSED 噪音日志（功能无影响，但干扰排查）。
  function loadLinkOpenModeWhenReady() {
    import("@/utils/workspacePreview").then(({ loadLinkOpenMode }) => {
      loadLinkOpenMode();
    });
  }

  // 后端未就绪时才注册异步等待（已就绪说明是刷新场景，无需再监听）
  if (isElectron && !backendReady.value && window.electronAPI?.waitBackendReady) {
    // 超时保护：60 秒后显示错误
    const timeoutId = setTimeout(() => {
      if (!backendReady.value) {
        backendError.value = "后端启动超时，请检查后端进程或重启应用";
        // 兜底：后端超时仍尝试加载（内部 catch 会降级到 localStorage 缓存）
        loadLinkOpenModeWhenReady();
      }
    }, 60000);

    window.electronAPI.waitBackendReady().then((data) => {
      clearTimeout(timeoutId);
      if (backendError.value) return; // 已显示超时错误，不再覆盖
      if (data.port) {
        console.log(` 后端已就绪，端口: ${data.port}`);
        apiService.initBackendUrl().then(() => {
          backendReady.value = true;
          loadLinkOpenModeWhenReady();
          // 如果当前在加载页，跳回原始目标
          if (router.currentRoute.value.path === "/empty") {
            const redirect = router.currentRoute.value.query.redirect || "/";
            router.replace(typeof redirect === "string" ? redirect : "/");
          }
        });
      } else {
        console.error("❌ 后端启动失败:", data.error);
        backendError.value = data.error || "后端启动失败";
      }
    });
  } else {
    // 非 Electron（Web 直连）或后端已就绪（刷新场景）：直接加载
    loadLinkOpenModeWhenReady();
  }

  app.mount("#app");

  // 收首屏遮罩的时机：**不能**在 mount 之后立刻收。
  // mount 只保证根组件挂上，首次路由导航（含异步路由 chunk）此时可能还没完成，
  // 遮罩一撤就是整片白（本应用实测踩过）。等 router.isReady()（首屏路由已解析）
  // 再等两帧（patch 后的 DOM 真正画出来），然后才淡出。
  // 10s 兜底：守卫卡死时宁可露出内容也不能让遮罩永久盖住整站。
  void Promise.race([
    router.isReady().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 10000)),
  ])
    .then(
      () =>
        new Promise((resolve) => {
          if (typeof requestAnimationFrame !== "function") return resolve();
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    )
    .then(() => {
      // 隐藏首屏全屏 loader（public/loader.js 注入）。淡出期间它不再拦截点击。
      if (typeof window.hideAppLoader === "function") {
        window.hideAppLoader();
      }
    });
}

/**
 * 同一入口可能被两处触发，必须**单飞**（同一容器只能挂一个 Vue app）：
 *   - apps/vue-support-ai-starter/src/main.js 深导入后 `void mountAiApp()`；
 *   - 本文件末尾的「独立运行兜底」自动调一次。
 * 2026-11-05 实测：两个调用各跑一次 `createApp(...).mount('#app')`，第二个 app
 * 往已有 DOM 的容器里追加根节点，随后 patch/unmount 收尾命中
 * `removeFragment → nextSibling` 的空指针（dist 产物必崩、dev 靠时序侥幸不崩），
 * 表现为「启动失败：Cannot read properties of null (reading 'nextSibling')」、
 * #app 空白。收敛成一次挂载后两条入口路径都正常。
 *
 * 失败时清空单飞标记，允许后续重新进入页面再试（例如后端尚未就绪）。
 */
let mountPromise = null;

export function mountAiApp() {
  if (!mountPromise) {
    window.__aiAppMounted = true;
    mountPromise = bootstrapAndMount().catch((e) => {
      mountPromise = null;
      // 单点记录：调用方无需再各自 catch（重复挂载已消除，错误只在这里落一次）
      console.error("❌ AI 控制台启动失败:", e);
    });
  }
  return mountPromise;
}

// 独立运行兜底：dev site / 验收专线里 pages/ai 就是站点的入口，没有任何人
// 调 mountAiApp 则 Vue 应用永远不会挂载，#app 里剩下 loader 遮罩。走 apps 壳
// 深导入时这一步与壳的调用合并成同一次挂载（见上方单飞注释）。
// 宿主应用（system / eduai）走 @pages/ai/menu、@pages/ai/embed 或具体组件路径
// 复用，不会 import 这里的入口，所以不污染任何宿主。
if (typeof window !== "undefined" && !window.__aiAppMounted) {
  void mountAiApp();
}

