/**
 * @pages/room —— P2P 房间路由（路由工厂）
 *
 * <p>页面完整路由 {@code /room}（P2P 房间工作台，页内 8 个工作空间切页签），
 * 由宿主的 {@code router/index.ts} 通过 {@code createRoomRoutes()} 展开。
 * 菜单归「P2P 房间」分组（icon: Connection），房间页是长连接页面（WebSocket
 * + 按需 WebRTC），所以 keepAlive: false（挂起时 WebSocket 与连接无法回收）。</p>
 *
 * <p>宿主只需在 {@code router/index.ts} 里展开本工厂产出的数组，
 * 与其它 {@code pages/xx} 包同一套装配方式。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createRoomRoutes} 可选项 */
export interface RoomRoutesOptions {
  /** 是否在侧边栏菜单显示 {@code /room}（默认 true） */
  showLink?: boolean;
  /** 侧边栏高亮回指的路由路径（默认 /room） */
  activeMenu?: string;
  /** 菜单排序（默认 15，排在文件管理之后） */
  rank?: number;
}

/**
 * 生成 P2P 房间页面路由。
 *
 * @param options 可选项
 * @returns 可直接展开进宿主路由树的数组
 */
export function createRoomRoutes(options: RoomRoutesOptions = {}): RouteConfigsTable[] {
  const { showLink = true, activeMenu = "/room", rank = 15 } = options;

  return [
    {
      path: "/room",
      name: "Room",
      component: () => import("../views/RoomView.vue"),
      meta: {
        title: "P2P 房间",
        icon: "Connection",
        showLink,
        activeMenu,
        rank,
        // 页内 8 个空间按 tab 组织，换了房间要重装（ keepalive 不输血）
        keepAlive: false,
      },
    },
  ];
}
