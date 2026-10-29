/**
 * @pages/docker —— Docker 独立页面包
 *
 * <p>页面唯一入口 {@link DockerView}（路由 {@code /docker}），内部按页签拆成
 * 容器 / 镜像 / 网络 / 卷 / 镜像库 / 模板；长耗时动作（安装、卸载、下载、
 * 日志、终端）全部走 SSE。</p>
 *
 * <p>样式 {@code styles/docker.css} 自带 {@code dk-} 前缀，不依赖
 * {@code @pages/server} 的 lab kit，因此本包可以单独挂到任意宿主。</p>
 *
 * <p>对外导出：路由工厂 {@link createDockerRoutes}（宿主装配用）与页面组件
 * （需要直接嵌入时用）。API 与类型一并导出，避免调用方再拼一遍路径。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import "./styles/docker.css";

export { default as DockerView } from "./views/DockerView.vue";
export { default as ContainerWorkspace } from "./views/ContainerWorkspace.vue";
export { default as InstallContainerDialog } from "./views/InstallContainerDialog.vue";
export { default as ImageWorkbench } from "./views/ImageWorkbench.vue";
export { default as RegistryWorkbench } from "./views/RegistryWorkbench.vue";
export { default as TemplateWorkbench } from "./views/TemplateWorkbench.vue";
export { default as ProgressDialog } from "./views/ProgressDialog.vue";

export { createDockerRoutes } from "./routes";
export type { DockerRoutesOptions } from "./routes";

export * from "./api";
