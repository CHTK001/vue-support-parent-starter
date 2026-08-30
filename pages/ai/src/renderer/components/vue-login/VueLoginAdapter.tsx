import React, { useEffect, useRef, useState } from 'react';
import { createApp, type App as VueApp } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import ElementPlus from 'element-plus';
// element-plus 模板组件样式由 unplugin-vue-components 按需注入；
// 这里只保留全局 dark css-vars（koi 暗色主题需要），不再引入全量 index.css。
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import pinia from '@repo/pinia';
import i18n from '@repo/languages';
import throttle from '@repo/core/directives/throttle';
import { getConfig } from '@repo/config';
import { bootstrapVueLogin } from './bootstrap';
import VueLoginRoot from './VueLoginRoot.vue';

export interface VueLoginAdapterProps {
  /** 登录成功后的回调（token 已写入 storage 时触发） */
  onSuccess?: () => void;
  /** appName，用于 loadConfig 定位 apps/{appName}/app.yaml */
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
const VueLoginAdapter: React.FC<VueLoginAdapterProps> = ({ onSuccess, appName = 'ai' }) => {
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

        // 拦截 koi 登录成功后的 HOME_URL 跳转（默认 /home），转为通知 React
        router.beforeEach((to, _from, next) => {
          const homePath = getConfig().route?.homePath || '/home';
          if (to.path === homePath) {
            // 登录成功：通知 React 接管导航（跳转 React 首页 /guid 或配置的 homePath）
            queueMicrotask(() => {
              if (!disposed) onSuccessRef.current?.();
            });
            next(false);
            return;
          }
          next();
        });

        routerRef.current = router;

        const vueApp = createApp(VueLoginRoot);
        vueApp.use(pinia);
        vueApp.use(i18n);
        vueApp.use(ElementPlus);
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
          vueApp.component(key, component);
        }
        vueApp.directive('throttle', throttle as never);
        vueApp.use(router);
        vueApp.mount(containerRef.current);
        vueAppRef.current = vueApp;
      } catch (error) {
        console.error('[VueLoginAdapter] bootstrap failed:', error);
        if (!disposed) {
          setBootError(error instanceof Error ? error.message : String(error));
        }
      }
    })();

    return () => {
      disposed = true;
      vueAppRef.current?.unmount();
      vueAppRef.current = null;
      routerRef.current = null;
    };
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
