/**
 * @pages/channel —— 渠道管理页
 *
 * <p><strong>边界</strong>：只暴露渠道管理业务页面（`ChannelManagementPage`）与渠道 API
 * （`channelApi`），页面组成本身不依赖 `pages/ai` 的框架上下文。</p>
 *
 * 页面注册到系统设置「渠道管理」tab（宿主由 `@pages/ai` 的 `SystemSettings` 深导入
 * `@pages/channel/components/ChannelManagementPage.vue`；本包根入口只有 `index.ts`，
 * 直接 `@pages/channel/ChannelManagementPage.vue` 解析不到）。
 */
export { default as ChannelManagementPage } from './components/ChannelManagementPage.vue';
export * from './channelApi';

// 渠道侧贡献给 home 仪表板的 widget（app 侧用 .widgets(defineWidgetContribution(channelWidgets)) 接线；
// 宿主建议从 ./widgets/channelWidgets 深路径导入，避免连带拖入 ChannelManagementPage 整页）
export { channelWidgets } from "./widgets/channelWidgets";
