/**
 * @pages/ai —— AI 控制台共享业务包
 *
 * <p><strong>边界</strong>：本包只暴露<b>可复用业务</b>（页面 / 组件 / API），
 * 不暴露应用入口 {@code mountAiApp}、不暴露 App.vue 壳。</p>
 *
 * <p>AI 控制台独立应用（apps/vue-support-ai-starter）需要完整启动装配
 * （createApp / 自研路由 / i18n / branding / Electron 后端状态），该装配物理上在
 * {@code ./main.js} 与 {@code ./App.vue}；它们由<strong>应用壳深导入</strong>触发，
 * 不是本包对外的公共 API。若在这里 {@code export { mountAiApp }}，宿主导入 {@code @pages/ai}
 * 会被同步拖入整个 AI 壳与全局样式（element-plus / tailwind / refactor），污染宿主应用。</p>
 *
 * <p>宿主内嵌 AI 业务页请走：
 * <ul>
 *   <li>{@code import "@pages/ai/menu"} —— 注册「后端菜单 → AI 页面」映射；</li>
 *   <li>{@code import "@pages/ai/embed"} —— 合并 AI 语言包并采用宿主框架上下文；</li>
 *   <li>{@code @pages/ai/components/...} —— 直接复用业务组件。</li>
 * </ul></p>
 */
export { default as ModelsPage } from "./components/models/ModelsPage.vue";
export { default as SystemSettings } from "./components/setting/SystemSettings.vue";
export { default as DefaultModelSettings } from "./components/setting/DefaultModelSettings.vue";
export { default as PaperConfigPanel } from "./components/setting/PaperConfigPanel.vue";
export { default as ModelsProviderList } from "./components/setting/ModelsProviderList.vue";