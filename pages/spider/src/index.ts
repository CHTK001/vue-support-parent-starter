import SpiderHomePage from "./index.vue";
import SpiderRoutes from "./router/spider";
import SpiderOverviewPage from "./views/spider/overview/index.vue";
import SpiderManagePage from "./views/spider/manage/index.vue";
import SpiderOrchestrationPage from "./views/spider/orchestration/index.vue";

export default SpiderHomePage;

export {
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
} from "./data/example-flows";
