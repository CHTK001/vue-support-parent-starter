/**
 * 调试中心路由（@pages/debug）
 *
 * <p>一条叶子路由 {@code /debug}：面板内部用页签区分元素 / 控制台 / 网络 /
 * 应用 / 截屏，不需要为了一个页拆成五个路由。</p>
 *
 * <p>产出的是**扁平叶子路由**（不建自己的分组），由宿主决定挂到哪个分组下。
 * monitor 侧现在把它并入「分析管理」（{@code /grp-capture}），与
 * 「抓包分析」「PCAP 分析」并列 —— 三者都是分析工具，没必要为调试中心单开一个
 * 「运维管理」一级菜单。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createCdpRoutes} 的可选项 */
export interface CdpRoutesOptions {
  /** 是否进侧边栏（默认 true） */
  showLink?: boolean;
  /** 侧边栏高亮回指的路由路径（默认不设置，即高亮自身 /debug） */
  activeMenu?: string;
  /** 菜单排序（默认 3，须在宿主分组内唯一） */
  rank?: number;
}

/**
 * 生成 Debug 面板路由（扁平叶子路由，不自建分组）。
 *
 * @param options 可选项
 * @returns 可直接展开进宿主路由 children 的数组
 */
export function createCdpRoutes(options: CdpRoutesOptions = {}): RouteConfigsTable[] {
  const showLink = options.showLink ?? true;
  const rank = options.rank ?? 3;
  return [
    {
      path: "/debug",
      name: "Debug",
      component: () => import("../views/DebugCenter.vue"),
      meta: {
        title: "调试中心",
        icon: "Tools",
        showLink,
        rank,
        ...(options.activeMenu ? { activeMenu: options.activeMenu } : {}),
      },
    },
  ];
}
