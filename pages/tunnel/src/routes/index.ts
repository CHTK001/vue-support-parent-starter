/**
 * @pages/tunnel 内网穿透隧道菜单路由
 *
 * <p>ngrok / Cloudflare Tunnel 两种 Provider 的隧道工作台路由，框架侧（{@code @pages/monitor}）
 * 通过 {@code createTunnelRoutes()} 展开挂载到“内网穿透”菜单分组下：</p>
 * <ul>
 *   <li>{@code /grp-tunnel} － 内网穿透（菜单分组，仅标题与折叠，由 {@code children} 中的叶子页驱动菜单渲染）</li>
 *   <li>{@code /tunnels/ngrok} － ngrok 隧道工作台</li>
 *   <li>{@code /tunnels/cloudflared} － Cloudflare Tunnel 隧道工作台</li>
 * </ul>
 *
 * 工作台页面（{@code TunnelWorkbench.vue}）通过 Provider 拆分：
 * {@code NgrokTunnelView.vue} / {@code CloudflaredTunnelView.vue} 再 props 下发 provider；
 * 两组 Tab 各自独立且可保留缓存（keepAlive: true）。
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

/** Provider 分组 Tab 定义 */
const TUNNEL_TABS: { provider: "ngrok" | "cloudflared"; title: string; view: string }[] = [
  { provider: "ngrok", title: "ngrok", view: "NgrokTunnelView" },
  { provider: "cloudflared", title: "Cloudflare Tunnel", view: "CloudflaredTunnelView" },
];

/**
 * 内网穿透隧道工作台路由
 *
 * @param options 菜单参数
 * @returns 分组路由 + Provider 子路由
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
      children: TUNNEL_TABS.map((tab, index) => ({
        path: `/tunnels/${tab.provider}`,
        name: `Tunnel_${tab.provider}`,
        component: () => import(`../views/${tab.view}.vue`),
        meta: {
          title: tab.title,
          icon: "Link",
          showLink: true,
          activeMenu,
          rank: index + 1,
          keepAlive: true,
        },
      })),
    },
  ];
}
