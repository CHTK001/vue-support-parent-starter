import SpiderHomePage from "./index.vue";
import SpiderConsolePage from "./SpiderConsolePage.vue";
import SpiderRoutes from "./router/spider";
import SpiderOverviewPage from "./views/spider/overview/index.vue";
import SpiderManagePage from "./views/spider/manage/index.vue";
import SpiderOrchestrationPage from "./views/spider/orchestration/index.vue";

export default SpiderConsolePage;

export {
  SpiderConsolePage,
  SpiderHomePage,
  SpiderRoutes,
  SpiderOverviewPage,
  SpiderManagePage,
  SpiderOrchestrationPage,
};

export * from "./api/spider";
export * from "./types/orchestration";
export { spiderNodePalette } from "./data/node-palette";
export {
  baiduPanExampleFlow,
  giteeExploreExampleFlow,
  giteeMineExampleFlow,
  agentBrowserSmokeTaskFlow,
} from "./data/example-flows";
