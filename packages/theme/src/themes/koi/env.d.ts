/// <reference types="vite/client" />

/**
 * koi 框架运行环境变量声明
 *
 * 当 koi 被作为 @repo/theme 库引入业务应用时，业务侧的 vite 会注入
 * import.meta.env（VITE_* 等）。此声明仅在无 vite 环境（如纯 TS 校验）时兜底。
 */
declare global {
  interface ImportMetaEnv {
    /** 路由模式：hash / history */
    VITE_ROUTER_MODE?: "hash" | "history";
    /** 网页标题 */
    VITE_WEB_TITLE?: string;
    /** 网页英文标题 */
    VITE_WEB_EN_TITLE?: string;
    /** 登录页标题 */
    VITE_LOGIN_TITLE?: string;
    /** 登录页英文标题 */
    VITE_LOGIN_EN_TITLE?: string;
    /** 接口基础地址 */
    VITE_WEB_BASE_API?: string;
    /** 服务地址（上传/下载等） */
    VITE_SERVER?: string;
  }
}

// element-plus 按需语言包（.mjs）无类型声明，这里兜底
declare module "element-plus/dist/locale/zh-cn.mjs" {
  const locale: Record<string, unknown>;
  export default locale;
}

declare module "element-plus/es/locale/lang/zh-cn" {
  const locale: Record<string, unknown>;
  export default locale;
}

declare module "element-plus/es/locale/lang/en" {
  const locale: Record<string, unknown>;
  export default locale;
}

/**
 * vue-i18n 的全局属性增强
 *
 * koi 布局组件（Header/Tabs/Main 下共 24 个 .vue）在模板里直接用 `$t(...)`，
 * 但都没有 import useI18n —— 它们依赖应用侧 `app.use(i18n)` 注入的全局属性。
 * Vue 只有在该属性被声明进 ComponentCustomProperties 时才认模板里的 `$t`，
 * 否则 vue-tsc 对每一处 `$t` 都报 TS2339（一处不落，几十条）。
 *
 * 这里只声明到「能调用」的最小面：i18n 的 t() 签名很长，绑死具体重载会
 * 在 key 类型校验上引入无谓的严格性，故用宽松签名。
 */
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    /** 当前语言文案 */
    $t: (key: string, ...args: unknown[]) => string;
  }
}

/**
 * 强制登录弹窗服务（koi 主题的 installForcedLogin 注册到 window，核心 @repo/core
 * 通过此句柄拉起 ReDialog + ReLoginForm 组合弹窗）
 */
declare global {
  interface Window {
    /** 强制登录弹窗服务 */
    __reForcedLogin?: {
      /** 打开强制登录弹窗（并行 401/403 只弹一个） */
      show: (callbacks?: { onLogin?: () => void; onClose?: () => void }) => void;
    };
    /** 强制登录弹窗是否打开（主题层状态标记） */
    __reForcedLoginOpen?: boolean;
  }
}

export {};
