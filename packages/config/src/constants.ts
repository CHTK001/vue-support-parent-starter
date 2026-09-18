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

/**
 * 菜单缺省图标（菜单未配置 icon 时兜底显示，避免图标位空白）。
 *
 * 可在 app.yaml 的 menuConfig.defaultIcon 覆盖；解析入口见 @repo/config 的
 * resolveMenuDefaultIcon()（配置优先，未配置回退本常量）。
 * 默认值取自 @repo/assets/src/icons（koi 主题本地 svg sprite，<use> 引用 #icon-koi-*）。
 */
export const DEFAULT_MENU_ICON: string = "koi-text-menu";
