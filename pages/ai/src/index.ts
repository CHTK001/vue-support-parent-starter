/**
 * @pages/ai 包对外导出
 *
 * vue-support-ai-starter 通过该入口获取：
 *   - aiRoutes：单页面应用路由表（顶级路由）
 *   - router：vue-router 实例（含守卫/模式）
 *   - App：vue 根组件（独立可挂载的版本）
 *   - 视图 / 设置面板：在 main.ts 里按需 import 路径
 */
export { default as router, default, aiRoutes } from './router';
export { default as App } from './App.vue';
