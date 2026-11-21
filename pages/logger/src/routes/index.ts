/**
 * 日志中心路由（@pages/logger）。
 *
 * <p>仿 {@code @pages/debug/src/routes} 的「路由工厂」口径：产出**自带分组**的
 * 路由树（分组「日志中心」+ 四个叶子），由宿主（monitor 壳）一行展开 ——
 * 视图 / API / 路由三者同源，宿主不抄第二份。四个叶子复用本包 views/，
 * 顶部导航由宿主布局承担，不挂独立运行用的 LoggerLayout。</p>
 *
 * <p>后端契约：/v2/logger REST + SSE，由 monitor 进程内 logger-starter 服务端
 * 提供（plugin.logger.type=both）；鉴权走宿主 OAuth（REST Authorization 头 /
 * SSE 查询参数，见 api/http.ts 的 tokenProvider）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createLoggerRoutes} 的可选项 */
export interface LoggerRoutesOptions {
  /** 是否进侧边栏（默认 true） */
  showLink?: boolean;
  /** 一级分组菜单排序（默认 7，须在宿主顶层分组中唯一） */
  rank?: number;
}

/**
 * 生成日志中心路由（分组「日志中心」+ 实时控制台 / 日志检索 / 应用实例 / 统计概览）。
 *
 * @param options 可选项
 * @returns 可直接展开进宿主路由数组的分组路由
 */
export function createLoggerRoutes(options: LoggerRoutesOptions = {}): RouteConfigsTable[] {
  const showLink = options.showLink ?? true;
  const rank = options.rank ?? 7;
  return [
    {
      path: "/grp-logger",
      name: "GroupLogger",
      meta: { title: "日志中心", icon: "Document", showLink, rank },
      children: [
        {
          path: "/logger/console",
          name: "LoggerConsole",
          component: () => import("../views/ConsoleView.vue"),
          meta: { title: "实时控制台", icon: "Monitor", showLink: true, rank: 1 },
        },
        {
          path: "/logger/search",
          name: "LoggerSearch",
          component: () => import("../views/SearchView.vue"),
          meta: { title: "日志检索", icon: "Search", showLink: true, rank: 2 },
        },
        {
          path: "/logger/apps",
          name: "LoggerApps",
          component: () => import("../views/AppsView.vue"),
          meta: { title: "应用实例", icon: "Grid", showLink: true, rank: 3 },
        },
        {
          path: "/logger/trace",
          name: "LoggerTrace",
          component: () => import("../views/TraceView.vue"),
          meta: { title: "链路追踪", icon: "Connection", showLink: true, rank: 4 },
        },
        {
          path: "/logger/stats",
          name: "LoggerStats",
          component: () => import("../views/StatsView.vue"),
          meta: { title: "统计概览", icon: "TrendCharts", showLink: true, rank: 5 },
        },
      ],
    },
  ];
}
