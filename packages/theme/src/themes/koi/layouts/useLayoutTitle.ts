/**
 * 页面标题解析（koi 主题）
 *
 * 首页等基础路由的 meta 只有占位 title（如 "home"）且无图标，
 * 统一从菜单树补齐标题并通过 getMenuLanguage 翻译，保证
 * 浏览器标签页标题与侧边栏/Tab 一致。
 */
import { getMenuLanguage } from "@repo/languages";
import useAuthStore from "@repo/pinia/modules/auth";
import { getConfig } from "@repo/config";

/** 在递归菜单树中按路径查找菜单 meta（首页基础路由 meta 无有效 title 时兜底） */
export function findMenuMetaByPath(
  menus: any[] | undefined,
  targetPath: string
): Record<string, any> | null {
  if (!Array.isArray(menus)) return null;
  for (const menu of menus) {
    if (String(menu?.path) === String(targetPath)) {
      return menu.meta || null;
    }
    const child = findMenuMetaByPath(menu?.children, targetPath);
    if (child) return child;
  }
  return null;
}

/**
 * 解析页面标题：优先路由 meta.title（首页占位 "home" 视为无效），
 * 否则回退菜单树标题，再经 getMenuLanguage 翻译。
 * @param routePath 路由路径（路由记录 path，参数路由为原始模式串）
 * @param metaTitle 路由 meta.title
 */
export function resolvePageTitle(routePath: string, metaTitle?: string): string {
  const authStore = useAuthStore();
  const menuMeta = findMenuMetaByPath(authStore.recursiveMenuList, routePath);
  const title =
    metaTitle && metaTitle !== "home" ? metaTitle : (menuMeta?.title as string) ?? metaTitle;
  return getMenuLanguage(title ?? "");
}

/** 设置浏览器标题：`页面标题 - 应用标题`，应用标题缺省用 config.app.title */
export function setDocumentTitle(routePath: string, metaTitle?: string): void {
  const appTitle = getConfig().app.title;
  const title = resolvePageTitle(routePath, metaTitle);
  document.title = title ? `${title} - ${appTitle}` : appTitle;
}
