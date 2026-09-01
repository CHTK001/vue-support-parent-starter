import React, { useEffect, useRef, useState } from 'react';
import { createApp, type App as VueApp } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
// element-plus 不再全量引入：模板 el-* 组件由 unplugin-vue-components 按需注入，
// ElMessage/ElMessageBox 等 JS 服务由 unplugin-element-plus 按需转换。
// 这里仅保留全局 dark css-vars（koi 暗色主题需要）。
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import pinia from '@repo/pinia';
import i18n from '@repo/languages';
import throttle from '@repo/core/directives/throttle';
import { getConfig, HOME_URL } from '@repo/config';
import { bootstrapVueLogin } from './bootstrap';
import VueLoginRoot from './VueLoginRoot.vue';

/**
 * 读取登录成功后写入 storage 的 accessToken。
 * key = storage 前缀 + accessTokenKey（getStorageKey 规则），
 * 与 koi userStore.loginByUsername 写 token 用的 key 保持一致。
 */
function readAccessToken(): string | null {
  try {
    const cfg = getConfig();
    const prefix = (cfg.storage?.prefix || cfg.app?.systemCode || 'app').trim();
    const tokenKey = cfg.token?.accessTokenKey || 'accessToken';
    return localStorage.getItem(`${prefix}:${tokenKey}`);
  } catch {
    return null;
  }
}

export interface VueLoginAdapterProps {
  /** 登录成功后的回调（token 已写入 storage 时触发） */
  onSuccess?: () => void;
  /** appName，用于 loadConfig 定位 apps/{appName}/app.yaml；
   *  缺省时由 bootstrapVueLogin 从 VITE_APP_NAME 自动取（apps 宿主注入）。 */
  appName?: string;
}

/**
 * 在 React 页面内嵌 Vue koi 登录页。
 *
 * 装配链（比 @repo/core createApp 精简）：
 *   1. bootstrapVueLogin：loadConfig（app.yaml + setting）+ setApiHttp
 *   2. createVueApp 挂 VueLoginRoot（内部渲染 koi ReLoginForm）
 *   3. 注册 pinia / vue-i18n / element-plus / icons / v-throttle
 *   4. 独立 vue-router：拦截 ReLoginForm 登录后的 router.replace(HOME_URL)，
 *      通过 onSuccess 回调通知 React 侧跳转，避免 React/Vue 两套路由冲突
 */
const VueLoginAdapter: React.FC<VueLoginAdapterProps> = ({ onSuccess, appName }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vueAppRef = useRef<VueApp | null>(null);
  const routerRef = useRef<ReturnType<typeof createRouter> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const [bootError, setBootError] = useState<string | null>(null);

  onSuccessRef.current = onSuccess;

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        if (!containerRef.current) return;
        await bootstrapVueLogin({ appName });

        if (disposed) return;

        const router = createRouter({
          history: createMemoryHistory(),
          routes: [
            { path: '/login', component: { template: '<div />' } },
            { path: '/:pathMatch(.*)*', redirect: '/login' },
          ],
        });
        (router as unknown as { __id: number }).__id = (window as unknown as Record<string, number>).__routerSeq = ((window as unknown as Record<string, number>).__routerSeq ?? 0) + 1;

        // 拦截 koi 登录成功后的 HOME_URL 跳转（默认 /home），转为通知 React
        router.beforeEach((to, _from, next) => {
          const homePath = getConfig().route?.homePath || '/home';
          console.warn('[VueLoginAdapter] navigate to', to.path, 'homePath=', homePath, 'HOME_URL=', HOME_URL);
          // koi 登录成功统一跳 HOME_URL（/home），但宿主首页可能配置为 homePath（如 /guid），
          // 两个都要拦截，避免 koi 落在 Vue 内存路由的空页面
          if (to.path === homePath || to.path === HOME_URL) {
            // 登录成功：通知 React 接管导航（跳转 React 首页 /guid 或配置的 homePath）
            queueMicrotask(() => {
              console.warn('[VueLoginAdapter] onSuccess called, disposed=', disposed);
              if (!disposed) onSuccessRef.current?.();
            });
            next(false);
            return;
          }
          next();
        });

        routerRef.current = router;
        // 便于调试/外部访问（React 侧跳转等）
        if (typeof window !== 'undefined') {
          (window as unknown as Record<string, unknown>).__vueLoginRouter = router;
        }

        const vueApp = createApp(VueLoginRoot);
        vueApp.use(pinia);
        vueApp.use(i18n);
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
          vueApp.component(key, component);
        }
        vueApp.directive('throttle', throttle as never);
        vueApp.use(router);
        vueApp.mount(containerRef.current);
        vueAppRef.current = vueApp;

        // 兜底：koi 登录成功会把 accessToken 写入 storage（getStorageKey 前缀 + "accessToken"）。
        // 某些场景下 koi 登录后的 router.replace(HOME_URL) 因内存路由无业务路由而静默失败，
        // 守卫不触发，这里轮询 storage，发现有效 token 即通知 React 接管跳转，保证登录闭环。
        // 注意：logout 可能只清 cookie 不清 storage token，所以不能用"无→有"判断，
        // 只要存在 token 就通知 React（React 侧会自行决定跳转）。
        let notified = false;
        const tokenWatcher = window.setInterval(() => {
          if (disposed) return;
          if (notified) return;
          if (readAccessToken()) {
            console.warn('[VueLoginAdapter] token present in storage, notify React');
            notified = true;
            onSuccessRef.current?.();
          }
        }, 500);
        (window as unknown as Record<string, number>).__vueLoginTokenWatcher = tokenWatcher;
        return () => {
          window.clearInterval(tokenWatcher);
          disposed = true;
          vueAppRef.current?.unmount();
          vueAppRef.current = null;
          routerRef.current = null;
        };
      } catch (error) {
        console.error('[VueLoginAdapter] bootstrap failed:', error);
        if (!disposed) {
          setBootError(error instanceof Error ? error.message : String(error));
        }
      }
    })();
  }, [appName]);

  if (bootError) {
    return (
      <div className='vue-login-error' role='alert'>
        <p>Login initialization failed: {bootError}</p>
      </div>
    );
  }

  return <div ref={containerRef} className='vue-login-adapter' />;
};

export default VueLoginAdapter;
