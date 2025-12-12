// 主布局
import { default as LayoutDefault } from "./index.vue";

// 项目管理页面
import ProjectIndex from "./views/project/index.vue";

// 密钥管理页面
import SecretIndex from "./views/secret/index.vue";

// AI模块页面
import ColorizationIndex from "./views/ai/colorization/index.vue";
import VincentIndex from "./views/ai/generation/index.vue";
import ImageDetectIndex from "./views/ai/image/detect/index.vue";
import LlmNewIndex from "./views/ai/llm-new/index.vue";
import ResolutionIndex from "./views/ai/resolution/index.vue";
import VideoIndex from "./views/ai/video/index.vue";
import DeviceIndex from "./views/device/index.vue";
import DevicePreview from "./views/template/device/preview/index.vue";
import DeviceTemplate from "./views/template/device/index.vue";
import EmailTemplate from "./views/template/email/index.vue";
import SmsTemplate from "./views/template/sms/index.vue";

// 默认导出主布局
export default LayoutDefault;

// 导出所有页面组件
export {
  ColorizationIndex,
  DeviceIndex,
  DevicePreview,
  DeviceTemplate,
  EmailTemplate,
  // 人脸检测
  ImageDetectIndex,
  // AI模块
  LlmNewIndex,
  // 项目管理
  ProjectIndex,
  ResolutionIndex,
  // 密钥管理
  SecretIndex,
  SmsTemplate,
  VideoIndex,
  VincentIndex,
};
