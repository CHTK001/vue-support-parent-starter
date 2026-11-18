/**
 * 页面标题解析（koi 主题）
 *
 * 首页等基础路由的 meta 只有占位 title（如 "home"）且无图标，
 * 统一从菜单树补齐标题并通过 getMenuLanguage 翻译，保证
 * 浏览器标签页标题与侧边栏/Tab 一致。
 */
import { getMenuLanguage, translateConfigText } from "@repo/languages";
import useAuthStore from "@repo/pinia/modules/auth";
import { getConfig, getAppTitle, defaultAppConfig } from "@repo/config";
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

/** 同步浏览器标签页图标（favicon）：跟随 getConfig().login.logoUrl，未配置则回退打包 logo */
export function setDocumentFavicon(): void {
  try {
    const logoUrl = getConfig()?.login?.logoUrl;
    const resolved = logoUrl ? resolveAssetUrl(logoUrl) : defaultLogoUrl;
    // 归一为绝对地址：相对值（如 "logo.svg"）会随当前页面 URL 解析，history 子路径下会错位
    const href = new URL(resolved, document.baseURI).href;
    // 更新页面上已有的全部图标链接（含 index.html 的静态兜底 link），没有才新建，
    // 避免出现「一个链接是静态兜底、另一个是配置值」的双链接各持旧值
    const targets = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]'),
    );
    if (!targets.some((link) => (link.rel || "").split(/\s+/).includes("icon"))) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
      targets.push(icon);
    }
    for (const link of targets) {
      if (resolved.endsWith(".svg")) link.type = "image/svg+xml";
      else link.removeAttribute("type");
      link.href = href;
    }
  } catch {
    // 忽略：favicon 非关键资源
  }
}

/**
 * 解析标题后缀用的应用名。
 *
 * <p>先取 {@code getAppTitle()}；它若只拿到框架占位「应用」，再读全局桥
 * {@code globalThis.__reAppTitle}。为什么需要这一步：dev 下本包在
 * {@code optimizeDeps.include} 里，Vite 会把依赖的 {@code @repo/config} 预打包成
 * 独立 chunk，主题侧拿到的可能是**另一份**实例（也可能还是旧预构建产物），
 * 读不到应用壳 {@code applyTitle} 写进源码那份的声明名。全局桥与模块实例无关，
 * 是两条写点唯一稳定的共同来源。</p>
 *
 * @returns 非空的应用名；都取不到时回退默认占位
 */
export function resolveShellAppTitle(): string {
  const fromConfig = getAppTitle();
  if (fromConfig && fromConfig !== defaultAppConfig.app.title) return fromConfig;
  try {
    const bridged = (globalThis as Record<string, unknown>).__reAppTitle;
    if (typeof bridged === "string" && bridged.trim()) return bridged.trim();
  } catch {
    // 读全局失败：按配置值处理
  }
  return fromConfig;
}

/**
 * 设置浏览器标题：`页面标题 - 应用标题`
 *
 * <p>应用标题取 {@link resolveShellAppTitle}，与 core 守卫
 * {@code packages/core/src/router/guard.ts} 同一取数口，
 * 避免两条路径一个用路由 meta、一个用站点默认名。</p>
 */
export function setDocumentTitle(
  routePath: string,
  metaTitle?: string,
  activeMenu?: string
): void {
  const appTitle = resolveShellAppTitle();
  const title = resolvePageTitle(routePath, metaTitle, activeMenu);
  document.title = title && title !== appTitle ? `${title} - ${appTitle}` : appTitle;
}
