// 主布局
import { default as LayoutDefault } from "./index.vue";

// 项目管理页面
import ProjectIndex from "./views/project/index.vue";

// 密钥管理页面
import SecretIndex from "./views/secret/index.vue";

// AI模块页面
import ColorizationIndex from "./views/ai/colorization/index.vue";
import LlmIndex from "./views/ai/llm/index.vue";
import ResolutionIndex from "./views/ai/resolution/index.vue";
import VideoIndex from "./views/ai/video/index.vue";
import VincentIndex from "./views/ai/vincent/index.vue";

// 默认导出主布局
export default LayoutDefault;

// 导出所有页面组件
export {
  ColorizationIndex,
  // AI模块
  LlmIndex,
  // 项目管理
  ProjectIndex,
  ResolutionIndex,
  // 密钥管理
  SecretIndex,
  VideoIndex,
  VincentIndex,
};
