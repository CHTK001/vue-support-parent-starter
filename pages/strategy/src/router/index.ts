/**
 * 策略模块路由配置
 *
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
export const strategyRoutes = [
  {
    path: "/strategy",
    name: "Strategy",
    meta: {
      title: "策略管理",
      icon: "ri:shield-check-line",
    },
    children: [
      {
        path: "limit",
        name: "StrategyLimit",
        component: () => import("../views/limit/LimitConfigurationIndex.vue"),
        meta: {
          title: "限流配置",
          icon: "ri:speed-line",
        },
      },
      {
        path: "limit-record",
        name: "StrategyLimitRecord",
        component: () => import("../views/limit/LimitRecordIndex.vue"),
        meta: {
          title: "限流记录",
          icon: "ri:history-line",
        },
      },
    ],
  },
];
