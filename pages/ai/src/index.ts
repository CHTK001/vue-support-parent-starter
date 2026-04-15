import AiHomePage from "./index.vue";
import AiRoutes from "./router/ai";
import ColorizationIndex from "./views/ai/colorization/index.vue";
import VincentIndex from "./views/ai/generation/index.vue";
import ImageDetectIndex from "./views/ai/image/detect/index.vue";
import LlmNewIndex from "./views/ai/llm-new/index.vue";
import ResolutionIndex from "./views/ai/resolution/index.vue";
import VideoIndex from "./views/ai/video/index.vue";
export default AiHomePage;

export {
  AiHomePage,
  AiRoutes,
  ColorizationIndex,
  ImageDetectIndex,
  LlmNewIndex,
  ResolutionIndex,
  VideoIndex,
  VincentIndex,
};
export * from "./api/manage/project-ai-module";
