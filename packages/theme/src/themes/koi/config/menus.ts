/**
 * koi 静态菜单数据
 *
 * 基础路由（/login、/、/home）由 core 按 themeId 固定格式生成；
 * 此处仅保留「静态菜单」数据（供 auth store 渲染侧边栏 / 面包屑）。
 */

/** 静态菜单项（结构数据，非完整路由） */
export interface KoiStaticMenu {
  path: string;
  name?: string;
  redirect?: string;
  meta?: Record<string, unknown>;
  children?: KoiStaticMenu[];
}

/** 静态菜单（layout 结构，含首页 home） */
export const staticMenu: KoiStaticMenu[] = [
  {
    path: "/",
    name: "layout",
    redirect: "/home",
    meta: {
      menuId: "-1",
      title: "menu.home.auth",
      icon: "koi-home",
      isVisible: "1",
      linkUrl: "",
      isKeepAlive: "1",
      isTag: "0",
      isAffix: "1",
    },
    children: [
      {
        path: "/home",
        name: "homePage",
        meta: {
          menuId: "-2",
          title: "menu.home.work.name",
          icon: "koi-work",
          isVisible: "1",
          linkUrl: "",
          isKeepAlive: "1",
          isTag: "0",
          isAffix: "1",
        },
      },
    ],
  },
];

/** 静态菜单（向后兼容 staticRouter 命名） */
export const staticRouter = staticMenu;
