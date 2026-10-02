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

/**
 * 默认主题色
 *
 * <p>取 #2563C9 而非 Element 默认的 #409EFF：后者在白底上只有 2.78 : 1，
 * 低于 WCAG AA 对 14px 普通文本要求的 4.5 : 1。#2563C9 为 5.67 : 1，
 * 在菜单选中底 #EAF4FF 上为 5.09 : 1，白字在按钮填充上同为 5.67 : 1。</p>
 *
 * <p>这是「配置缺失时」的兜底值，与 packages/theme/src/tokens.ts 的
 * colorPrimary 保持一致 —— 两处若不一致，主题色会在换肤时跳变回不达标的值。</p>
 */
export const DEFAULT_THEME: string = "#2563C9";

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
