/**
 * 绯荤粺绠＄悊妯″潡璺敱閰嶇疆锛園pages/system锛? *
 * 涓€浠?routes 鍚屾椂鎵挎媴涓や釜瑙掕壊锛? *   1) 璺敱琛細閫氳繃 router.addRoute("layout", route) 鎶婃瘡涓瓙椤甸潰鎸傚埌 koi 甯冨眬涓嬶紝淇濈暀渚ц竟鏍? *   2) 闈欐€佽彍鍗曪細閫氳繃 systemMenus 瀵煎嚭锛屼紶鍏?registerStaticMenu() 璁╀晶杈规爮娓叉煋
 *
 * 娉ㄦ剰锛氳矾鐢辨槸鎵佸钩缁撴瀯锛堢洿鎺?path=/system/user锛夛紝涓嶆槸宓屽鐨?/system + children 褰㈠紡銆? *       杩欐槸涓轰簡閫傞厤 vue-router 鐨?addRoute("layout", item) 鐢ㄦ硶銆? *       渚ц竟鏍忕殑灞傜骇鐢?systemMenus 鐨?children 琛ㄨ揪锛岃矾鐢卞眰绾х敱 addRoute 鑷姩骞抽摵銆? */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 绯荤粺绠＄悊璺敱锛堝彾瀛愯矾鐢憋紝鐩存帴鎸傚埌 koi layout 涔嬩笅锛? *
 * 浣跨敤鏂瑰紡锛堝湪搴旂敤 main.ts锛夛細
 *   const { context } = await createContextApp({});
 *   for (const r of systemRoutes) {
 *     context.router.addRoute("layout", r as never);
 *   }
 */
export const systemRoutes: RouteConfigsTable[] = [
  {
    path: "/personage",
    name: "SystemPersonage",
    component: () => import("../views/Personage.vue"),
    meta: {
      title: "涓汉涓績",
      icon: "User",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/settings",
    name: "SystemSettings",
    component: () => import("../views/PersonalSettings.vue"),
    meta: {
      title: "涓汉璁剧疆",
      icon: "Setting",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/user",
    name: "SystemUser",
    component: () => import("../views/UserManage.vue"),
    meta: {
      title: "menu.system.user.name",
      icon: "User",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/role",
    name: "SystemRole",
    component: () => import("../views/RoleManage.vue"),
    meta: {
      title: "menu.system.role.name",
      icon: "UserFilled",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/menu",
    name: "SystemMenu",
    component: () => import("../views/MenuManage.vue"),
    meta: {
      title: "menu.system.menu.name",
      icon: "Menu",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/dept",
    name: "SystemDept",
    component: () => import("../views/DeptManage.vue"),
    meta: {
      title: "menu.system.dept.name",
      icon: "OfficeBuilding",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/dict",
    name: "SystemDict",
    component: () => import("../views/DictManage.vue"),
    meta: {
      title: "menu.system.dictType.name",
      icon: "Collection",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/online",
    name: "SystemOnline",
    component: () => import("../views/OnlineUser.vue"),
    meta: {
      title: "menu.monitor.online.name",
      icon: "Connection",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/setting",
    name: "SystemSetting",
    component: () => import("../views/SettingManage.vue"),
    meta: {
      title: "menu.tools.config.name",
      icon: "Tools",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/announcement",
    name: "SystemAnnouncement",
    component: () => import("../views/AnnouncementManage.vue"),
    meta: {
      title: "鍏憡绠＄悊",
      icon: "Bell",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/feedback",
    name: "SystemFeedback",
    component: () => import("../views/FeedbackManage.vue"),
    meta: {
      title: "鍙嶉绠＄悊",
      icon: "ChatLineSquare",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/post",
    name: "SystemPost",
    component: () => import("../views/PostManage.vue"),
    meta: {
      title: "宀椾綅绠＄悊",
      icon: "Postcard",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/message",
    name: "SystemMessage",
    component: () => import("../views/MessageManage.vue"),
    meta: {
      title: "娑堟伅绠＄悊",
      icon: "Message",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/error-log",
    name: "SystemErrorLog",
    component: () => import("../views/ErrorLogManage.vue"),
    meta: {
      title: "寮傚父鏃ュ織",
      icon: "Warning",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/cache",
    name: "SystemCache",
    component: () => import("../views/CacheManage.vue"),
    meta: {
      title: "缂撳瓨绠＄悊",
      icon: "Coin",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/ip",
    name: "SystemIp",
    component: () => import("../views/IpManage.vue"),
    meta: {
      title: "IP绠＄悊",
      icon: "Lock",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/monitor",
    name: "SystemMonitor",
    component: () => import("../views/MonitorManage.vue"),
    meta: {
      title: "绯荤粺鐩戞帶",
      icon: "Monitor",
      showLink: true,
      keepAlive: true,
    },
  },
];

/**
 * 闈欐€佽彍鍗曪紙鐢ㄤ簬 registerStaticMenu锛岄┍鍔ㄤ晶杈规爮锛? *
 * 鐖剁骇"绯荤粺绠＄悊"鑺傜偣 + 7 涓瓙鑺傜偣锛岀粨鏋勪笌 systemRoutes 瀵瑰簲銆? */
export const systemMenus: StaticMenuItem[] = [
  {
    path: "/system",
    name: "System",
    redirect: "/system/user",
    meta: { title: "menu.system.auth", icon: "Setting", isVisible: "1" },
    children: [
      {
        path: "/user",
        name: "SystemUser",
        meta: { title: "menu.system.user.name", icon: "User", isVisible: "1" },
      },
      {
        path: "/role",
        name: "SystemRole",
        meta: { title: "menu.system.role.name", icon: "UserFilled", isVisible: "1" },
      },
      {
        path: "/menu",
        name: "SystemMenu",
        meta: { title: "menu.system.menu.name", icon: "Menu", isVisible: "1" },
      },
      {
        path: "/dept",
        name: "SystemDept",
        meta: { title: "menu.system.dept.name", icon: "OfficeBuilding", isVisible: "1" },
      },
      {
        path: "/dict",
        name: "SystemDict",
        meta: { title: "menu.system.dictType.name", icon: "Collection", isVisible: "1" },
      },
      {
        path: "/online",
        name: "SystemOnline",
        meta: { title: "menu.monitor.online.name", icon: "Connection", isVisible: "1" },
      },
      {
        path: "/setting",
        name: "SystemSetting",
        meta: { title: "menu.tools.config.name", icon: "Tools", isVisible: "1" },
      },
      {
        path: "/announcement",
        name: "SystemAnnouncement",
        meta: { title: "鍏憡绠＄悊", icon: "Bell", isVisible: "1" },
      },
      {
        path: "/feedback",
        name: "SystemFeedback",
        meta: { title: "鍙嶉绠＄悊", icon: "ChatLineSquare", isVisible: "1" },
      },
      {
        path: "/post",
        name: "SystemPost",
        meta: { title: "宀椾綅绠＄悊", icon: "Postcard", isVisible: "1" },
      },
      {
        path: "/message",
        name: "SystemMessage",
        meta: { title: "娑堟伅绠＄悊", icon: "Message", isVisible: "1" },
      },
      {
        path: "/error-log",
        name: "SystemErrorLog",
        meta: { title: "寮傚父鏃ュ織", icon: "Warning", isVisible: "1" },
      },
      {
        path: "/cache",
        name: "SystemCache",
        meta: { title: "缂撳瓨绠＄悊", icon: "Coin", isVisible: "1" },
      },
      {
        path: "/ip",
        name: "SystemIp",
        meta: { title: "IP绠＄悊", icon: "Lock", isVisible: "1" },
      },
      {
        path: "/monitor",
        name: "SystemMonitor",
        meta: { title: "绯荤粺鐩戞帶", icon: "Monitor", isVisible: "1" },
      },
    ],
  },
];

