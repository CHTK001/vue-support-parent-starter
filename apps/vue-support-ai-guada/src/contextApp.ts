/**
 * createContextApp - Vue体系集成
 * 
 * 用于创建带有全局上下文的Vue应用，支持后续对接鉴权、用户信息、权限等。
 * 提供统一的应用上下文管理，避免在各个组件中重复注入。
 */

import { createApp, type App, type Component, inject, provide, reactive, readonly } from 'vue';
import type { Router } from 'vue-router';
import type { Pinia } from 'pinia';

// ==================== 类型定义 ====================

/** 用户信息 */
export interface UserInfo {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  roles: string[];
  permissions: string[];
}

/** 鉴权上下文 */
export interface AuthContext {
  /** 是否启用鉴权 */
  enabled: boolean;
  /** 当前用户 */
  user: UserInfo | null;
  /** 访问令牌 */
  token: string | null;
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 登录方法 */
  login: (username: string, password: string) => Promise<boolean>;
  /** 登出方法 */
  logout: () => void;
  /** 检查权限 */
  hasPermission: (permission: string) => boolean;
  /** 检查角色 */
  hasRole: (role: string) => boolean;
  /** 刷新用户信息 */
  refreshUser: () => Promise<void>;
}

/** 应用配置上下文 */
export interface AppConfigContext {
  /** 应用名称 */
  appName: string;
  /** 应用版本 */
  appVersion: string;
  /** API基础URL */
  apiBaseUrl: string;
  /** 是否启用调试模式 */
  debug: boolean;
  /** 主题 */
  theme: 'light' | 'dark' | 'auto';
  /** 语言 */
  locale: string;
}

/** HTTP客户端上下文 */
export interface HttpClientContext {
  /** 请求拦截器 */
  requestInterceptors: Array<(config: any) => any>;
  /** 响应拦截器 */
  responseInterceptors: Array<(response: any) => any>;
  /** 错误处理 */
  errorHandler: (error: any) => void;
}

/** 完整应用上下文 */
export interface AppContext {
  /** 鉴权上下文 */
  auth: AuthContext;
  /** 应用配置 */
  config: AppConfigContext;
  /** HTTP客户端 */
  http: HttpClientContext;
  /** 自定义扩展数据 */
  extensions: Record<string, any>;
}

// ==================== 默认实现 ====================

/** 创建默认鉴权上下文（开发模式，跳过登录） */
function createDefaultAuthContext(): AuthContext {
  const state = reactive({
    user: null as UserInfo | null,
    token: null as string | null,
    isAuthenticated: true, // 开发模式默认已认证
  });

  return {
    enabled: false, // 默认不启用鉴权
    get user() {
      return state.user;
    },
    get token() {
      return state.token;
    },
    get isAuthenticated() {
      return state.isAuthenticated;
    },
    async login(_username: string, _password: string): Promise<boolean> {
      // 开发模式：直接登录成功
      state.user = {
        id: 'dev-user',
        username: 'admin',
        nickname: '管理员',
        roles: ['admin'],
        permissions: ['*'],
      };
      state.token = 'dev-token';
      state.isAuthenticated = true;
      return true;
    },
    logout(): void {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    hasPermission(permission: string): boolean {
      if (!state.user) return false;
      return state.user.permissions.includes('*') || state.user.permissions.includes(permission);
    },
    hasRole(role: string): boolean {
      if (!state.user) return false;
      return state.user.roles.includes('admin') || state.user.roles.includes(role);
    },
    async refreshUser(): Promise<void> {
      // 开发模式：无需刷新
    },
  };
}

/** 创建默认应用配置 */
function createDefaultConfig(): AppConfigContext {
  return reactive({
    appName: 'GuaDa AI',
    appVersion: '1.0.0',
    apiBaseUrl: '/v2',
    debug: import.meta.env?.DEV ?? false,
    theme: 'light',
    locale: 'zh-CN',
  });
}

/** 创建默认HTTP客户端上下文 */
function createDefaultHttpClient(): HttpClientContext {
  return reactive({
    requestInterceptors: [],
    responseInterceptors: [],
    errorHandler: (error: any) => {
      console.error('[HTTP Error]', error);
    },
  });
}

// ==================== Context Injection Key ====================

const APP_CONTEXT_KEY = Symbol('app-context');

// ==================== createContextApp ====================

/**
 * 创建带有全局上下文的Vue应用
 * 
 * @param rootComponent 根组件
 * @param options 应用选项
 * @returns Vue应用实例
 * 
 * @example
 * ```ts
 * import { createContextApp } from './contextApp';
 * import App from './App.vue';
 * import router from './router';
 * import pinia from './pinia';
 * 
 * const app = createContextApp(App, {
 *   router,
 *   pinia,
 *   auth: { enabled: true },
 * });
 * 
 * app.mount('#app');
 * ```
 */
export function createContextApp(
  rootComponent: Component,
  options?: {
    router?: Router;
    pinia?: Pinia;
    auth?: Partial<AuthContext>;
    config?: Partial<AppConfigContext>;
    extensions?: Record<string, any>;
  }
): App {
  // 创建Vue应用
  const app = createApp(rootComponent);

  // 安装插件
  if (options?.router) {
    app.use(options.router);
  }
  if (options?.pinia) {
    app.use(options.pinia);
  }

  // 创建应用上下文
  const authContext = createDefaultAuthContext();
  if (options?.auth) {
    Object.assign(authContext, options.auth);
  }

  const configContext = createDefaultConfig();
  if (options?.config) {
    Object.assign(configContext, options.config);
  }

  const httpContext = createDefaultHttpClient();

  const appContext: AppContext = reactive({
    auth: authContext,
    config: configContext,
    http: httpContext,
    extensions: options?.extensions || {},
  });

  // 提供全局上下文
  app.provide(APP_CONTEXT_KEY, readonly(appContext));

  // 挂载到全局属性（兼容旧代码）
  app.config.globalProperties.$appContext = appContext;
  app.config.globalProperties.$auth = authContext;
  app.config.globalProperties.$config = configContext;

  return app;
}

// ==================== useAppContext ====================

/**
 * 在组件中获取应用上下文
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useAppContext } from './contextApp';
 * 
 * const { auth, config } = useAppContext();
 * console.log(auth.isAuthenticated);
 * console.log(config.appName);
 * </script>
 * ```
 */
export function useAppContext(): AppContext {
  const context = inject<AppContext>(APP_CONTEXT_KEY);
  if (!context) {
    console.warn('[useAppContext] 应用上下文未找到，请确保使用createContextApp创建应用');
    // 返回默认上下文作为降级
    return reactive({
      auth: createDefaultAuthContext(),
      config: createDefaultConfig(),
      http: createDefaultHttpClient(),
      extensions: {},
    }) as AppContext;
  }
  return context;
}

/**
 * 获取鉴权上下文
 */
export function useAuth(): AuthContext {
  return useAppContext().auth;
}

/**
 * 获取应用配置
 */
export function useAppConfig(): AppConfigContext {
  return useAppContext().config;
}

// ==================== 导出类型 ====================

export type {
  UserInfo,
  AuthContext,
  AppConfigContext,
  HttpClientContext,
  AppContext,
};

export default createContextApp;
