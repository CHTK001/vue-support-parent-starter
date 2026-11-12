/**
 * @pages/osgi 包入口。
 *
 * 只导出路由与类型：视图走路由懒加载，避免入口静态再导出把页面拖进首屏 chunk。
 */
export { osgiRoutes } from "./routes";
export type { OsgiBundle, OsgiAction } from "./types/osgi";
