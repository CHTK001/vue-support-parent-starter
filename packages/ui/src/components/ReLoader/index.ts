/**
 * ReLoader —— 统一加载组件（默认加载动画）
 *
 * <p>三种用法：</p>
 *
 * ```vue
 * <!-- 1) 声明式遮罩：内容照常渲染，上面盖遮罩 -->
 * <ReLoader v-model:loading="busy" variant="wave" text="正在处理…">
 *   <MyContent />
 * </ReLoader>
 *
 * <!-- 2) 骨架占位：加载期间用骨架承诺"内容要占多大"，避免完成后跳动 -->
 * <ReLoader :loading="busy" mode="skeleton" :skeleton-height="'240px'">
 *   <template #skeleton><MySkeleton /></template>
 *   <MyContent />
 * </ReLoader>
 *
 * <!-- 3) 命令式：调用点与渲染点不在一处时用这个 -->
 * <script setup>
 * import { loader } from "@repo/ui/re-loader";
 * const h = loader.open({ variant: "progress", text: "上传中", timeout: 60000,
 *   onProgress: (p) => console.log(p.percent), onClose: (r) => console.log(r) });
 * h.setProgress(30);
 * </script>
 * ```
 */
import type { App, Plugin } from "vue";
import ReLoader from "./ReLoader.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReLoader", ReLoader);
  },
};

export { plugin as install };
export default ReLoader;

/* 命令式服务与类型 */
export { open, closeAll, count, loader } from "./service";
export type {
  ReLoaderVariant,
  ReLoaderSize,
  ReLoaderSizeValue,
  ReLoaderMode,
  ReLoaderCloseReason,
  ReLoaderHandle,
  ReLoaderServiceOptions,
  ReLoaderProgressPayload,
  ReLoaderSetProgressOptions,
  ReLoaderResetOptions,
} from "./types";

/* 统一加载动画：四个动画的唯一定义处（首屏 loader 与本组件共用同一份样式） */
export {
  LOADER_ANIMATIONS,
  LOADER_ANIMATION_NONE,
  LOADER_ANIMATION_META,
  LOADER_ANIMATION_CSS,
  loaderAnimationMarkup,
  normalizeLoaderAnimation,
  readLoaderAnimation,
  writeLoaderAnimation,
  loaderAnimationStorageKey,
  ensureLoaderAnimationStyle,
  useLoaderAnimation,
  useLoaderDeployPolicy,
  isLoaderAnimationLocked,
  setLoaderAnimation,
} from "./animations";
export type {
  LoaderAnimation,
  LoaderAnimationChoice,
} from "./animations";

/* 进度自适应估算（无真实进度时用） */
export { createProgressEstimator } from "./progressEstimator";
export type { ProgressEstimator, ProgressEstimatorOptions } from "./progressEstimator";

/* 请求层联动：withLoader / withLoaderFn 让业务零样板 */
export {
  withLoader,
  withLoaderFn,
  configureLoaderRequests,
  loaderRequestDefaults,
} from "./request";
export type { LoaderRequestOptions } from "./request";

/* 路由联动：切页自动清理路由级加载态，防遮罩盖住新页面 */
export { attachRouterLoader } from "./router";
export type { RouterLike, RouterLoaderOptions } from "./router";

/* 路由级清理（也可手动调用） */
export { closeRouterScoped } from "./service";

/* 骨架结构推导：按内容结构生成匹配形状的骨架 */
export { buildSkeleton, skeletonVars } from "./skeleton";
export type { SkeletonShape, SkeletonLayout, SkeletonBlock } from "./skeleton";

/* 页面不可见时暂停动画（省电） */
export { bindVisibilityPause, PAUSED_CLASS, pageVisible } from "./visibility";

