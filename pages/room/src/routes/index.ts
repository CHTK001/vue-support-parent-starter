/**
 * @pages/room —— P2P 房间路由（路由工厂）
 *
 * <p><b>默认挂载方式不是路由</b>：房间是 Server 接口的一种能力，宿主
 * （{@code vue-support-monitor-starter}）把它嵌进「服务管理」页的工作区里，
 * 以页签打开（{@code ScServiceManage.vue} 的 {@code kind === 'room'}），
 * 既没有独立菜单，也没有 {@code /room} 路由。</p>
 *
 * <p>本工厂只服务「想把房间当独立页面挂」的宿主：产出单条 {@code /room} 路由，
 * 由宿主自己决定放进哪个分组。<b>不要</b>在 monitor 宿主里再挂它——那会出现
 * 「服务管理」下多一个独立菜单项，与页内页签重复。</p>
 *
 * <p>房间页是长连接页面（WebSocket + 按需 WebRTC），所以 {@code keepAlive: false}
 * （挂起时 WebSocket 与连接无法回收）。</p>
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
  /**
   * 菜单排序权重（默认 16）。
   *
   * <p>「服务管理」分组及其子页用 15，这里紧随其后取 16；侧边栏实际顺序
   * 由宿主分组 children 的数组顺序决定（本工厂产出排在 /services 之后）。</p>
   */
  rank?: number;
}

/**
 * 生成 P2P 房间页面路由。
 *
 * @param options 可选项
 * @returns 可直接展开进宿主路由树的数组
 */
export function createRoomRoutes(options: RoomRoutesOptions = {}): RouteConfigsTable[] {
  const { showLink = true, activeMenu = "/room", rank = 16 } = options;

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
