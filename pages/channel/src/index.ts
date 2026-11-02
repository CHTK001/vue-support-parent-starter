/**
 * @pages/channel —— 渠道管理页
 *
 * <p><strong>边界</strong>：只暴露渠道管理业务页面（`ChannelManagementPage`）与渠道 API
 * （`channelApi`），页面组成本身不依赖 `pages/ai` 的框架上下文。</p>
 *
 * 页面注册到系统设置「渠道管理」tab（宿主由 `@pages/ai` 的 `SystemSettings` 导入，
 * 路径替换为 `@pages/channel/ChannelManagementPage.vue`）。
 */
export { default as ChannelManagementPage } from './components/ChannelManagementPage.vue';
export * from './channelApi';
