/**
 * @pages/tunnel 内网穿透菜单路由
 *
 * <p>侧边栏只有<strong>一个</strong>入口：{@code /tunnel}。ngrok 与 Cloudflare
 * Tunnel 是同一个 SPI 的两种实现（{@code TunnelProvider}），在页面里表现为
 * 「新增映射时选哪个提供方」，而不是两个菜单项 —— 两个菜单时代的页面只是
 * 同一份代码的两个实例。</p>
 *
 * <p>旧路径 {@code /tunnels/ngrok}、{@code /tunnels/cloudflared} 作为历史书签
 * 保留为隐藏重定向（{@code showLink: false}），点进去落回 {@code /tunnel}，
 * 不做 404。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createTunnelRoutes} 参数 */
export interface TunnelRoutesOptions {
  /** 是否在侧边栏菜单显示 {@code /grp-tunnel}，默认 {@code true} */
  showLink?: boolean;
  /** 选中时激活的上级菜单，默认 {@code /grp-tunnel} */
  activeMenu?: string;
  /** 同级排序值，越大越靠前，默认 {@code 15} */
  rank?: number;
}

/**
 * 内网穿透路由（分组 + 单个叶子页）
 *
 * @param options 菜单参数
 * @returns 分组路由 + 合并后的隧道页 + 旧路径重定向
 */
export function createTunnelRoutes(options: TunnelRoutesOptions = {}): RouteConfigsTable[] {
  const { showLink = true, activeMenu = "/grp-tunnel", rank = 15 } = options;

  return [
    {
      path: "/grp-tunnel",
      name: "GroupTunnel",
      meta: {
        title: "内网穿透",
        icon: "Connection",
        showLink,
        activeMenu,
        rank,
      },
      children: [
        {
          path: "/tunnel",
          name: "Tunnel",
          component: () => import("../views/TunnelPage.vue"),
          meta: {
            title: "隧道列表",
            icon: "Link",
            showLink: true,
            activeMenu,
            rank: 1,
            keepAlive: true,
          },
        },
        // 两个提供方各占一个菜单的时代留下的书签：隐藏并重定向，不进侧边栏
        {
          path: "/tunnels/ngrok",
          name: "TunnelNgrokLegacy",
          redirect: "/tunnel",
          meta: { title: "ngrok", showLink: false, activeMenu, rank: 2 },
        },
        {
          path: "/tunnels/cloudflared",
          name: "TunnelCloudflaredLegacy",
          redirect: "/tunnel",
          meta: { title: "Cloudflare Tunnel", showLink: false, activeMenu, rank: 3 },
        },
      ],
    },
  ];
}
