/**
 * vue-support-ai-starter 路由菜单映射。
 *
 * 当前 AI 渲染器使用自研 Router（@renderer/components/layout/Router），路由解析在
 * 渲染器内部完成，菜单 key → 路径映射也由 pages/ai/src/renderer 自身维护。
 *
 * 此处保留该结构以便后续切换到 @repo/app 的 createReactApp 体系时作为入口。
 */
const routeMenuMap: Record<string, string> = {
  guid: '/guid',
  chat: '/chat',
  cron: '/cron',
  settings: '/settings',
  modelHub: '/modelHub',
};

export default routeMenuMap;
