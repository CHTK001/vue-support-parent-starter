/**
 * 静态菜单注册表（@repo/pinia）
 *
 * 静态菜单来自业务应用（apps）的路由表，而非通用框架硬编码。
 * 业务应用启动时注册自己的静态菜单（layout / home / 业务页），
 * auth store 用它渲染侧边栏 / 面包屑。
 */

/** 静态菜单项（结构数据，非完整路由） */
export interface StaticMenuItem {
  path: string;
  name?: string;
  redirect?: string;
  component?: unknown;
  meta?: Record<string, unknown>;
  children?: StaticMenuItem[];
}

let staticMenu: StaticMenuItem[] = [];

/** 注册静态菜单（应用入口调用） */
export function registerStaticMenu(menus: StaticMenuItem[]): void {
  staticMenu = menus;
}

/** 获取静态菜单 */
export function getStaticMenu(): StaticMenuItem[] {
  return staticMenu;
}

/** 静态菜单别名（兼容 staticRouter 命名） */
export const staticRouter = staticMenu;
