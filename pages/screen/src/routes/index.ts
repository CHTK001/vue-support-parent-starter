/**
 * @pages/bigscreen 可视化大屏路由
 *
 * <p>单个展厅页（{@code /bigscreen}），七屏在页内以目录 + 舞台切换，
 * 不再一屏一个菜单项。默认 {@code showLink: false}（不进侧边栏，URL 直达），
 * 宿主可用 {@link createBigScreenRoutes} 的参数打开菜单入口。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createBigScreenRoutes} 参数 */
export interface BigScreenRoutesOptions {
  /** 是否在侧边栏菜单显示 {@code /bigscreen}，默认 {@code false} */
  showLink?: boolean;
  /** 选中时激活的上级菜单路径（可选） */
  activeMenu?: string;
  /** 同级排序值，越大越靠前，默认 {@code 16} */
  rank?: number;
}

/**
 * 可视化大屏路由（单叶子页）
 *
 * @param options 菜单参数
 * @returns 展厅叶子路由
 */
export function createBigScreenRoutes(options: BigScreenRoutesOptions = {}): RouteConfigsTable[] {
  const { showLink = false, activeMenu, rank = 16 } = options;

  return [
    {
      path: "/bigscreen",
      name: "BigScreenGallery",
      component: () => import("../components/BigScreenGallery.vue"),
      meta: {
        title: "可视化大屏",
        icon: "Monitor",
        showLink,
        rank,
        ...(activeMenu ? { activeMenu } : {}),
      },
    },
  ];
}
