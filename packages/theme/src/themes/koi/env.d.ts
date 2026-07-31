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

export {};
