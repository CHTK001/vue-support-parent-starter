/**
 * 配置驱动页面路由加载器
 * 从 app.yaml 的 LocalRouteModulePaths 读取页面模块路径，
 * 动态加载对应页面的路由配置。
 *
 * 支持格式:
 *   - @pages/spider  → 匹配 pages/spider/ 下的路由文件
 *   - spider         → 同上（简写格式）
 */
import type { RouteRecordRaw } from "vue-router";

/** 懒加载 glob：匹配所有页面路由文件 */
const pageRouteModules = import.meta.glob(
  [
    "../../../../pages/{common,server,dict,docker,panel,spider,project,loki,hotspot,websocket,bot,monitor,soft,protocol,ai}/src/router.ts",
    "../../../../pages/{common,server,dict,docker,panel,spider,project,loki,hotspot,websocket,bot,monitor,soft,protocol,ai}/src/router/*.ts",
  ],
  { eager: false },
);

/** pageName → loader 映射表 */
const pageRouteLoaderMap = new Map<string, () => Promise<unknown>>();

for (const [key, loader] of Object.entries(pageRouteModules)) {
  const match = key.match(/\/pages\/([^/]+)\/src\/router/);
  if (match) {
    const pageName = match[1];
    // 同名路由文件优先（如 spider → spider.ts）
    // 如果同时匹配到 router.ts 和 router/spider.ts，优先取 router/spider.ts
    const existing = pageRouteLoaderMap.get(pageName);
    if (!existing || key.endsWith(`/${pageName}.ts`)) {
      pageRouteLoaderMap.set(pageName, loader);
    }
  }
}

/**
 * 从 app.yaml 配置加载页面路由
 * @param paths - LocalRouteModulePaths 值，如 ["@pages/spider", "@pages/ai"]
 * @param addRoutes - addAppRoutes 函数引用
 */
export async function loadConfiguredPageRoutes(
  paths: string[],
  addRoutes: (routes: RouteRecordRaw[]) => void,
): Promise<void> {
  for (const path of paths) {
    const pageName = path.replace(/^@pages\//, "").replace(/^pages\//, "");
    const loader = pageRouteLoaderMap.get(pageName);
    if (!loader) {
      continue;
    }

    try {
      const mod = await loader();
      const routes = (mod as { default?: RouteRecordRaw[] }).default;
      if (Array.isArray(routes) && routes.length > 0) {
        addRoutes(routes);
      }
    } catch (e) {
      console.warn(`[PageRoutes] 加载页面模块路由失败: "${path}"`, e);
    }
  }
}
