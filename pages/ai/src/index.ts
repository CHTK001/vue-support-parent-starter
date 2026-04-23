import AiHomePage from "./index.vue";
import AiRoutes from "./router/ai";
import ChatIndex from "./views/ai/chat/index.vue";
import ImageIndex from "./views/ai/image/index.vue";
import VideoIndex from "./views/ai/video/index.vue";
import FaceIndex from "./views/ai/face/index.vue";
import ColorizationIndex from "./views/ai/colorization/index.vue";
import ResolutionIndex from "./views/ai/resolution/index.vue";
import SettingsIndex from "./views/ai/settings/index.vue";

export default AiHomePage;

export {
  AiHomePage,
  AiRoutes,
  ChatIndex,
  ImageIndex,
  VideoIndex,
  FaceIndex,
  ColorizationIndex,
  ResolutionIndex,
  SettingsIndex,
  ChatIndex as LlmNewIndex,
  ImageIndex as VincentIndex,
  FaceIndex as ImageDetectIndex,
};

export * from "./api/ai/module";
export * from "./api/ai/chat";
export * from "./api/ai/session";
export * from "./api/ai/task";
