/**
 * 通用常量（从 koi/config 迁移）
 *
 * 这些是框架/主题共用的默认路径与前缀，不属于 app.yaml schema，
 * 以常量形式导出，供各包复用；应用可在 app.yaml 中按需覆盖。
 */

/** 首页地址（默认） */
export const HOME_URL: string = "/home";

/** 跳转子页面静态路由父级节点 */
export const STATIC_URL: string = "/system/static";

/** 登录页地址（默认） */
export const LOGIN_URL: string = "/login";

/** pinia 仓库存储前缀 */
export const CACHE_PREFIX: string = "koi-";

/** 本地 svg 图标前缀（koi- 开头才会生效） */
export const SVG_PREFIX: string = "koi-";

/** 默认主题色 */
export const DEFAULT_THEME: string = "#2992FF";

/** 路由白名单地址 */
export const ROUTER_WHITE_LIST: string[] = ["/500"];
