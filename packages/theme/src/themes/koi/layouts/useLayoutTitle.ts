/**
 * 页面标题解析（koi 主题）
 *
 * 首页等基础路由的 meta 只有占位 title（如 "home"）且无图标，
 * 统一从菜单树补齐标题并通过 getMenuLanguage 翻译，保证
 * 浏览器标签页标题与侧边栏/Tab 一致。
 */
import { getMenuLanguage, translateConfigText } from "@repo/languages";
import useAuthStore from "@repo/pinia/modules/auth";
import { getConfig } from "@repo/config";
import { resolveAssetUrl, defaultLogoUrl } from "@repo/assets";

/** 在递归菜单树中按路径精确查找菜单 meta */
function findMetaExact(
  menus: any[] | undefined,
  targetPath: string
): Record<string, any> | null {
  if (!Array.isArray(menus) || !targetPath) return null;
  for (const menu of menus) {
    if (String(menu?.path) === String(targetPath)) {
      return menu.meta || null;
    }
    if (menu?.children) {
      const child = findMetaExact(menu.children, targetPath);
      if (child) return child;
    }
  }
  return null;
}

/** 在递归菜单树中按前缀查找菜单 meta（最长前缀优先，参数路由兜底） */
function findMetaByPrefix(
  menus: any[] | undefined,
  targetPath: string
): Record<string, any> | null {
  if (!Array.isArray(menus) || !targetPath) return null;
  let bestMatch: Record<string, any> | null = null;
  let bestLen = 0;
  const walk = (items: any[]) => {
    for (const menu of items) {
      const menuPath = String(menu?.path || "");
      // menuPath 必须是 targetPath 的前缀目录（如 /system/user 匹配 /system/user/123）
      if (menuPath && menuPath !== "/" && targetPath.startsWith(menuPath + "/")) {
        if (menuPath.length > bestLen) {
          bestLen = menuPath.length;
          bestMatch = menu.meta || null;
        }
      }
      if (menu?.children) {
        walk(menu.children);
      }
    }
  };
  walk(menus);
  return bestMatch;
}

/**
 * 在递归菜单树中按路径查找菜单 meta
 * 支持精确匹配 → 前缀匹配（参数路由如 /system/user/123 匹配 /system/user）
 */
export function findMenuMetaByPath(
  menus: any[] | undefined,
  targetPath: string
): Record<string, any> | null {
  // 1. 精确匹配（优先）
  const exact = findMetaExact(menus, targetPath);
  if (exact) return exact;
  // 2. 前缀匹配（参数路由兜底）
  return findMetaByPrefix(menus, targetPath);
}

/**
 * 解析路由对应的菜单 meta（考虑 activeMenu + 路径匹配）
 * 优先用 activeMenu 匹配（详情页指向父菜单），回退到 route.path / fullPath。
 * @param route 当前路由对象（需含 path / fullPath / meta）
 * @param menus 菜单树
 */
export function resolveRouteMenuMeta(
  route: { path: string; fullPath?: string; meta?: Record<string, any> },
  menus: any[]
): Record<string, any> | null {
  // 1. 优先用 activeMenu 匹配（详情页指向父菜单）
  const activeMenu = route.meta?.activeMenu as string | undefined;
  if (activeMenu) {
    const meta = findMenuMetaByPath(menus, activeMenu);
    if (meta) return meta;
  }
  // 2. 用 route.path 匹配
  const meta = findMenuMetaByPath(menus, route.path);
  if (meta) return meta;
  // 3. 用 fullPath 去掉 query/hash 后匹配
  const cleanPath = route.fullPath?.split("?")[0]?.split("#")[0];
  if (cleanPath && cleanPath !== route.path) {
    const meta2 = findMenuMetaByPath(menus, cleanPath);
    if (meta2) return meta2;
  }
  return null;
}

/**
 * 解析页面标题：优先路由 meta.title（首页占位 "home" 视为无效），
 * 否则回退菜单树标题，再经 getMenuLanguage 翻译。
 * @param routePath 路由路径（路由记录 path，参数路由为原始模式串）
 * @param metaTitle 路由 meta.title
 */
export function resolvePageTitle(
  routePath: string,
  metaTitle?: string,
  activeMenu?: string
): string {
  // 登录页：使用品牌名（app.yaml loginConfig.brandName），未配置时回退翻译后的登录标题
  const cfg = getConfig();
  if (routePath === cfg.route.loginPath) {
    return translateConfigText(cfg.login.title) || cfg.login.brandName || "login";
  }
  const authStore = useAuthStore();
  // 优先用 activeMenu 查找菜单（详情页场景），回退到 routePath
  const menuMeta = activeMenu
    ? findMenuMetaByPath(authStore.recursiveMenuList, activeMenu)
    : null;
  const fallbackMeta = !menuMeta
    ? findMenuMetaByPath(authStore.recursiveMenuList, routePath)
    : null;
  const resolvedMeta = menuMeta || fallbackMeta;
  const title =
    metaTitle && metaTitle !== "home" ? metaTitle : (resolvedMeta?.title as string) ?? "";
  const finalTitle = getMenuLanguage(title ?? "");
  return finalTitle === "home" || !finalTitle ? "" : finalTitle;
}

/** 同步浏览器标签页图标（favicon）：跟随 app.yaml loginConfig.logoUrl，未配置则回退打包 logo */
export function setDocumentFavicon(): void {
  try {
    const logoUrl = getConfig().login.logoUrl;
    const resolved = logoUrl ? resolveAssetUrl(logoUrl) : defaultLogoUrl;
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = resolved;
  } catch {
    // 忽略：favicon 非关键资源
  }
}

/** 设置浏览器标题：`页面标题 - 应用标题`，应用标题缺省用 config.app.title */
export function setDocumentTitle(
  routePath: string,
  metaTitle?: string,
  activeMenu?: string
): void {
  const appTitle = getConfig().app.title;
  const title = resolvePageTitle(routePath, metaTitle, activeMenu);
  document.title = title && title !== appTitle ? `${title} - ${appTitle}` : appTitle;
}
