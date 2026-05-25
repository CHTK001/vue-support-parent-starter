import SpiderHomePage from "./index.vue";
import SpiderConsolePage from "./SpiderConsolePage.vue";
import SpiderRoutes from "./router/spider";
import SpiderOverviewPage from "./views/spider/overview/index.vue";
import SpiderManagePage from "./views/spider/manage/index.vue";
import SpiderOrchestrationPage from "./views/spider/orchestration/index.vue";
import SpiderMonitorPage from "./views/spider/monitor/index.vue";

export default SpiderConsolePage;

export {
  SpiderConsolePage,
  SpiderHomePage,
  SpiderRoutes,
  SpiderOverviewPage,
  SpiderManagePage,
  SpiderOrchestrationPage,
  SpiderMonitorPage,
};

export * from "./api/spider/index";
export * from "./types/orchestration";
export { spiderNodePalette } from "./data/node-palette";
export { giteeExploreExampleFlow } from "./data/example-flows";
