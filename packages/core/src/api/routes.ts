import { getConfig } from "@repo/config";
import { http, type ReturnResult } from "@repo/utils";

type Result = {
  success: boolean;
  data: Array<any>;
};

/**
 * 获取本地路由配置
 * 从 /src/router/modules 目录动态导入所有路由模块
 */
const getLocalRoutes = async () => {
  const modules = import.meta.glob("/src/router/modules/*.ts", { eager: true });
  const localRoutes: any[] = [];

  Object.keys(modules).forEach((key) => {
    const mod = modules[key] as any;
    const routes = mod.default || mod;
    if (Array.isArray(routes)) {
      localRoutes.push(...routes);
    } else if (routes) {
      localRoutes.push(routes);
    }
  });

  return localRoutes;
};

/**
 * 获取异步路由
 * 支持三种模式：
 * 1. RemoteMenu=false: 仅使用本地路由
 * 2. RemoteMenu=true, MergeLocalMenu=false: 仅使用远程路由
 * 3. RemoteMenu=true, MergeLocalMenu=true: 远程路由 + 本地路由（合并模式）
 */
export const getAsyncRoutes = async () => {
  const config = getConfig();

  // 模式1: 不使用远程菜单，返回空（由路由系统自动加载本地路由）
  if (!config.RemoteMenu) {
    return new Promise<ReturnResult<Result>>(resolve => {
      resolve({
        data: [],
        success: true
      } as any);
    });
  }

  // 模式2和3: 使用远程菜单
  try {
    const remoteResult = await http.request<ReturnResult<Result>>("get", "/v2/user/menu");

    // 模式2: 仅使用远程菜单
    if (!config.MergeLocalMenu) {
      return remoteResult;
    }

    // 模式3: 合并远程菜单和本地菜单
    const localRoutes = await getLocalRoutes();
    const remoteRoutes = remoteResult.data || [];

    // 合并路由：远程路由优先，本地路由作为补充
    const mergedRoutes = [...remoteRoutes, ...localRoutes];

    return {
      ...remoteResult,
      data: mergedRoutes,
      success: true
    } as any;
  } catch (error) {
    console.error("[路由加载] 远程菜单加载失败:", error);

    // 如果启用了混合模式，降级到本地路由
    if (config.MergeLocalMenu) {
      console.warn("[路由加载] 降级使用本地路由");
      const localRoutes = await getLocalRoutes();
      return {
        data: localRoutes,
        success: true
      } as any;
    }

    // 否则返回空
    return {
      data: [],
      success: false,
      msg: "远程菜单加载失败"
    } as any;
  }
};
