/**
 * koi 路由入口 —— 基于 core 的 createAppRouter 构建
 *
 * 职责划分：
 *   - 路由创建 / 三模式装配 / 基础守卫（token、白名单、权限）由 core 负责
 *   - koi 特有逻辑（i18n 标题、nprogress、菜单注册、失败刷新）通过 hooks 注入
 *
 * 远程模式（config.route.mode=remote）时，业务路由由 loadRemoteRoutes 动态注册到 layout。
 */
import { createAppRouter } from "@repo/core";
import { getConfig } from "@repo/config";
import { layoutRouter, staticRouter, errorRouter } from "@repo/theme/koi/routers/modules/staticRouter";
import nprogress from "@repo/core/progress";
import type { RouteLocationNormalized } from "vue-router";
import useUserStore from "@repo/theme/koi/stores/modules/user.ts";
import useAuthStore from "@repo/theme/koi/stores/modules/auth.ts";
import { LOGIN_URL } from "@repo/theme/koi/config/index.ts";
import { koiMsgWarning } from "@repo/theme/koi/utils/koi.ts";
import { ElMessageBox } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { initDynamicRouter } from "@repo/theme/koi/routers/modules/dynamicRouter.ts";
import { getMenuLanguage } from "@repo/theme/koi/utils/index.ts";
import i18n from "@repo/theme/koi/languages/index.ts";

// .env配置文件读取
const meta = import.meta as unknown as { env?: Record<string, string> };
const mode = meta.env?.VITE_ROUTER_MODE ?? "hash";

/**
 * 处理路由模块加载失败的逻辑
 * @description 当动态导入的组件（路由懒加载）加载失败时，提示用户并刷新页面
 */
export const failFetchModule = useDebounceFn(() => {
  ElMessageBox.confirm("页面加载失败，是否刷新?", "提示", {
    type: "warning",
    // 确认按钮的文本
    confirmButtonText: "刷新",
    // 取消按钮的文本
    cancelButtonText: "取消"
  })
    .then(() => {
      // 确认刷新，强制重新加载整个页面
      window.location.reload();
    })
    .catch(() => {
      // 用户点击取消，可以在这里记录错误日志或执行其他逻辑
      console.log("用户取消了刷新");
    });
}, 1500);

// 创建路由（三模式由 app.yaml 的 route.mode 决定）
const router = createAppRouter({
  // 基础路由：登录页 / Layout / 错误页，始终注册
  layoutRoutes: [...layoutRouter, ...staticRouter, ...errorRouter],
  // 本地业务路由：static/module 模式走代码表；remote 模式由后端菜单动态注册
  routes: [],
  mode: mode === "history" ? "history" : "hash",
  // 令牌来自 koi userStore
  getAccessToken: () => useUserStore().token,
  // 远程模式：拉取菜单并注册到 layout 子路由
  loadRemoteRoutes: async (r) => {
    await initDynamicRouter(r);
  },
  // koi 特有守卫逻辑
  hooks: {
    onBeforeEach() {
      // 1、NProgress 开始
      nprogress.start();
    },
    // 2、标题切换，没有放置后置路由，是因为页面路径不存在，title会变成undefined
    resolveTitle(to) {
      return getMenuLanguage(to.meta?.title as string) || "KOI-ADMIN";
    },
    async beforeEach(to: RouteLocationNormalized, from: RouteLocationNormalized) {
      const userStore = useUserStore();

      // 3、判断是访问登录页，有Token访问当前页面，token过期访问接口，axios封装则自动跳转登录页面，没有Token重置路由到登陆页。
      if (to.path.toLocaleLowerCase() === LOGIN_URL) {
        // 有Token访问当前页面，重定向到之前访问的页面或首页
        if (userStore.token) {
          return from.fullPath && from.fullPath !== LOGIN_URL ? from.fullPath : "/";
        } else {
          koiMsgWarning(i18n.global.t("msg.confirmLogin"));
        }
        // 登录页需要清空路由，否则会显示之前的路由。
        resetRouter();
        return true; // 允许访问登录页
      }

      // 非登录页不拦截，交给 core 守卫继续校验（token / 权限 / 动态路由）
      return undefined;
    },
    onAfterEach() {
      // 结束全屏动画
      nprogress.done();
    },
    onError(error: any) {
      // 结束全屏动画
      nprogress.done();
      console.warn("路由错误", error.message);
      // 匹配动态导入模块失败的特定错误信息
      if (error.message.includes("Failed to fetch dynamically imported module")) {
        // 调用防抖后的刷新函数
        failFetchModule();
      }
    }
  }
});

/**
 * @description 重置路由（登出 / 切号时移除动态注册的路由）
 */
export const resetRouter = () => {
  const authStore = useAuthStore();
  if (!authStore.getMenuList.length) {
    return;
  }
  authStore.getMenuList.forEach((route: any) => {
    const { name } = route;
    if (name && router.hasRoute(name)) {
      router.removeRoute(name);
    }
  });
};

export default router;
