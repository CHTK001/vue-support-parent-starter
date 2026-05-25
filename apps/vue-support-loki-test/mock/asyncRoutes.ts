import { defineFakeRoute } from "vite-plugin-fake-server/client";

const lokiRouter = {
  path: "/loki",
  meta: {
    title: "Loki 日志",
    icon: "ri:database-2-line",
    rank: 1
  },
  children: [
    {
      path: "/loki/log-query",
      name: "LokiLogQuery",
      meta: { title: "日志查询", icon: "ri:search-line" }
    },
    {
      path: "/loki/streaming",
      name: "LokiStreaming",
      meta: { title: "实时日志", icon: "ri:live-line" }
    },
    {
      path: "/loki/labels",
      name: "LokiLabels",
      meta: { title: "标签浏览", icon: "ri:price-tag-3-line" }
    },
    {
      path: "/loki/dashboard",
      name: "LokiDashboard",
      meta: { title: "仪表盘", icon: "ri:dashboard-3-line" }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        success: true,
        data: [lokiRouter]
      };
    }
  }
]);
