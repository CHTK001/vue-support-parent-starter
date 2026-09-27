import { createApp } from "vue";

import App from "./App.vue";
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/auth";
import NProgress from "nprogress";

import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "./tailwind.css";
import "./styles/refactor.css";
import "./styles/markdown-doc.css";
import "nprogress/nprogress.css";
// 组件库统一卡片视觉基线（ReStatCard 风格：re-surface / --hover / --dense）
import "@repo/ui/surface";

import { apiService } from "@/services/ApiService";
import { bootstrapFramework, hasToken } from "@/framework/context";
import { isAdmin } from "@repo/core";
import { applyBranding, watchBranding } from "@/utils/branding";
import { initGlobalErrorHandler } from "@/utils/globalErrorHandler";
import { useLayoutStore } from "./stores/layout";
import {
  backendReady,
  backendError,
  isElectron,
} from "@/composables/useBackendStatus";
import { i18n } from "./locales";

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
        path: "session-trace",
        name: "SessionTrace",
        meta: { title: "执行轨迹", requiresAuth: true },
        component: () => import("./components/management/SessionTracePage.vue"),
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
    path: "/test",
    name: "Test",
    meta: { title: "UI 测试" },
    component: () => import("./components/test/ui.vue"),
  },
  {
    path: "/splitpanes-test",
    name: "SplitpanesTest",
    meta: { title: "Splitpanes 性能测试" },
    component: () => import("./components/test/SplitpanesPerfTest.vue"),
  },
  {
    path: "/simple-test",
    name: "SimpleTest",
    meta: { title: "简单测试" },
    component: () => import("./components/test/SimpleTest.vue"),
  },
  {
    path: "/input-test",
    name: "InputTest",
    meta: { title: "Contenteditable 输入测试" },
    component: () => import("./components/test/InputTest.vue"),
  },
  {
    path: "/empty",
    name: "Empty",
    component: () => import("./components/BackendWaitingOverlay.vue"),
  },
];

// 根据环境动态选择路由模式
// Electron 环境使用 Hash 模式（file:// 协议不支持 History 模式）
// Web 环境使用 History 模式（URL 更美观）
const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // 仅在非 Electron 环境下显示进度条
  if (!isElectron) {
    NProgress.start();
  }
  // 真登录守卫：业务路由必须持有框架令牌（@repo/utils token 模块）
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
  if (requiresAuth && !hasToken()) {
    return next({ path: "/login", query: { redirect: to.fullPath } });
  }
  // 管理员专属路由：非管理员直接回到首页，不暴露管理面
  const adminOnly = to.matched.some((record) => record.meta?.adminOnly);
  if (adminOnly && !isAdmin()) {
    return next({ path: "/" });
  }
  if (to.path === "/login" && hasToken()) {
    const redirect = to.query?.redirect;
    return next(typeof redirect === "string" && redirect ? redirect : "/");
  }
  next();
});

// 全局后置守卫
router.afterEach(() => {
  // 仅在非 Electron 环境下结束进度条
  if (!isElectron) {
    NProgress.done();
  }
});

/**
 * 启动流程：先装配框架上下文（统一配置 / 框架 storage / token 管理器 /
 * 带鉴权拦截器的请求模块），业务侧所有请求（含 SSE）都必须晚于它，
 * 再挂载 Vue 应用。
 */
async function bootstrapAndMount() {
  await bootstrapFramework();
  // app.yaml 已加载：将标题 / favicon 从 getConfig('app') 同步到浏览器，
  // 并订阅后续配置变更（远程设置 / 环境级 yaml 覆盖）保持品牌同步。
  applyBranding();
  watchBranding();

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);
  app.use(i18n);

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
}

void bootstrapAndMount().catch((error) => {
  console.error("应用启动失败（框架上下文装配异常）:", error);
});
