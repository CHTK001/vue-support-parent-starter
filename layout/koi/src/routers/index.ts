import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import { layoutRouter, staticRouter, errorRouter } from "../routers/modules/staticRouter";
import nprogress from "../utils/nprogress";
import { RouteLocationNormalized } from "vue-router";
import useUserStore from "../stores/modules/user.ts";
import useAuthStore from "../stores/modules/auth.ts";
import { LOGIN_URL, ROUTER_WHITE_LIST } from "../config/index.ts";
import { koiMsgWarning } from "../utils/koi.ts";
import { ElMessageBox } from 'element-plus';
import { useDebounceFn } from '@vueuse/core';
import { initDynamicRouter, isDynamicRoutesMissing } from "../routers/modules/dynamicRouter.ts";
import { getMenuLanguage, isPathMatch } from "../utils/index.ts";
import i18n from '../languages/index.ts';

// .env配置文件读取
const mode = import.meta.env.VITE_ROUTER_MODE || "hash";

// 路由访问两种模式：带#号的哈希模式，正常路径的web模式。
const routerMode: any = {
  hash: () => createWebHashHistory(),
  history: () => createWebHistory()
};

// 创建路由器对象
const router = createRouter({
  // 路由模式hash或者默认不带#
  history: routerMode[mode](),
  routes: [...layoutRouter, ...staticRouter, ...errorRouter],
  strict: false,
  // 滚动行为
  scrollBehavior() {
    return {
      left: 0,
      top: 0
    };
  }
});

/**
 * @description 前置路由
 * Vue Router 4.x 新语法：不再使用 next() 回调，直接返回路由对象或 true/false
 */
router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();

  // 1、NProgress 开始
  nprogress.start();
  // 2、标题切换，没有放置后置路由，是因为页面路径不存在，title会变成undefined
  document.title = getMenuLanguage(to.meta?.title as string) || "KOI-ADMIN";

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

  // 4、判断访问页面是否在路由白名单地址[静态路由]中，如果存在直接放行。
  if (ROUTER_WHITE_LIST.some((pattern: any) => isPathMatch(pattern, to.path))) {
    return true; // 允许访问白名单路由
  }

  // 5、判断是否有 Token，没有重定向到 login 页面。
  if (!userStore.token) {
    return { path: LOGIN_URL, replace: true }; // 重定向到登录页
  }

  // 6、无菜单数据，或菜单在 store 中但路由未注册（如 resetRouter 后），需重新拉取/注册动态路由
  const menuList = authStore.getMenuList;
  if (!menuList.length || isDynamicRoutesMissing(menuList)) {
    try {
      await initDynamicRouter();
      if (!userStore.token) {
        return { path: LOGIN_URL, replace: true };
      }
      return { ...to, replace: true };
    } catch {
      return { path: LOGIN_URL, replace: true };
    }
  }
  
  // 7、正常访问页面。
  return true; // 允许访问
});

/**
 * @description 重置路由
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

/**
 * @description 路由跳转错误
 */
router.onError((error: any) => {
  // 结束全屏动画
  nprogress.done();
  console.warn("路由错误", error.message);
  // 匹配动态导入模块失败的特定错误信息
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // 调用防抖后的刷新函数
    failFetchModule();
  }
});

/**
 * @description 后置路由
 */
// @ts-ignore
router.afterEach(() => {
  // 结束全屏动画
  nprogress.done();
});

/**
 * 处理路由模块加载失败的逻辑
 * @description 当动态导入的组件（路由懒加载）加载失败时，提示用户并刷新页面
 */
export const failFetchModule = useDebounceFn(() => {
  ElMessageBox.confirm('页面加载失败，是否刷新?', '提示', {
    type: 'warning',
    // 确认按钮的文本
    confirmButtonText: '刷新',
    // 取消按钮的文本
    cancelButtonText: '取消'
  })
    .then(() => {
      // 确认刷新，强制重新加载整个页面
      window.location.reload();
    })
    .catch(() => {
      // 用户点击取消，可以在这里记录错误日志或执行其他逻辑
      console.log('用户取消了刷新');
    });
}, 1500);

export default router;
