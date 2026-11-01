/**
 * @pages/tunnel 内网穿透隧道菜单路由
 *
 * <p>ngrok / Cloudflare Tunnel 两种 Provider 的列表工作台路由，
 * 框架侧通过 {@code @pages/monitor/src/router/index.ts} 中的
 * {@code createTunnelRoutes()} 挂载到“内网穿透”分组下：</p>
 * <ul>
 *   <li>{@code /grp-tunnel} － 内网穿透（菜单分组）</li>
 *   <li>{@code /tunnels/ngrok} － ngrok 隧道工作台</li>
 *   <li>{@code /tunnels/cloudflared} － Cloudflare Tunnel 隧道工作台</li>
 * </ul>
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

/** Provider 运行时状态（与 {@code TunnelStatusStream} 保持 1.5s 推流） */
interface TunnelTab {
  /** Provider：ngrok / cloudflared */
  provider: string;
  /** 路由路径 */
  path: string;
  /** 菜单标题 */
  title: string;
}

/** Provider 分组 Tab 定义 */
const TUNNEL_TABS: TunnelTab[] = [
  { provider: "ngrok", path: "/ngrok", title: "ngrok" },
  { provider: "cloudflared", path: "/cloudflared", title: "Cloudflare Tunnel" },
];

/**
 * 内网穿透隧道工作台路由
 *
 * @param options 菜单参数
 * @returns 分组路由 + Provider 子路由
 */
export function createTunnelRoutes(options: TunnelRoutesOptions = {}): RouteConfigsTable[] {
  const { showLink = true, activeMenu = "/grp-tunnel", rank = 15 } = options;

  // 分组路由
  const group: RouteConfigsTable = {
    path: "/grp-tunnel",
    name: "GroupTunnel",
    meta: {
      title: "内网穿透",
      icon: "Connection",
      showLink,
      activeMenu,
      rank,
    },
  };

  return [
    group,
    ...TUNNEL_TABS.map((tab) => ({
      path: `/tunnels${tab.path}`,
      name: `Tunnel_${tab.provider}`,
      redirect: `/tunnels${tab.path}/workbench`,
      meta: {
        title: tab.title,
        icon: "Link",
        showLink: false,
        keepAlive: true,
      },
      children: [
        {
          path: "workbench",
          name: `Tunnel_${tab.provider}_Workbench`,
          component: () => import(`../views/TunnelWorkbench.vue`),
          meta: {
            title: tab.title,
            icon: "Link",
            activeMenu,
          },
          props: { provider: tab.provider } as never,
        },
        {
          path: "",
          redirect: `workbench`,
          meta: { showLink: false, activeMenu },
        },
      ],
    })),
  ];
}
