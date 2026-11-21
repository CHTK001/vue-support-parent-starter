/**
 * @pages/datasource-hub 路由收敛口。
 *
 * <p>单页应用（无顶部 header，页内四个页签：概览 / Calcite 联邦 / 分库分表 / 物理表管理）。
 * 默认 showLink:false（不占侧边栏），由宿主按需放开或从数据源中心跳转；
 * 视图、API、路由同出一处，宿主只做一行合并。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";

/** 工厂可选项 */
export interface DatasourceHubRoutesOptions {
  /** 是否进侧边栏（默认 false，验收/直达走 URL） */
  showLink?: boolean;
  /** 侧边栏高亮回指路径 */
  activeMenu?: string;
}

/**
 * 生成数据源运行时配置页路由，宿主展开进自己的路由树即可。
 *
 * @param options 可选项
 * @returns 可直接展开的路由数组
 */
export function createDatasourceHubRoutes(options: DatasourceHubRoutesOptions = {}): RouteConfigsTable[] {
  const showLink = options.showLink ?? false;
  return [
    {
      path: "/datasource-hub",
      name: "DatasourceHub",
      component: () => import("./views/DsHubView.vue"),
      meta: {
        title: "数据源运行时",
        icon: "Coin",
        showLink,
        activeMenu: options.activeMenu || "/datasource",
        rank: 2,
      },
    },
  ];
}
