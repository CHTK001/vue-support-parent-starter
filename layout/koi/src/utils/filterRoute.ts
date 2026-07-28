import Layout from "../layouts/index.vue";
import { HOME_URL } from "../config/index.ts";

const NotFoundPage = () => import("@/views/error/404.vue");

type ViewModule = () => Promise<unknown>;

/** 动态 import 失败 [文件缺失、语法错误、编译失败等] 时回退 404 */
function wrapPageLoader(loader: ViewModule, moduleKey: string): ViewModule {
  return () =>
    loader().catch((error: unknown) => {
      if (import.meta.env.DEV) {
        console.warn(`[route] 页面加载失败，已使用 404: ${moduleKey}`, error);
      }
      return NotFoundPage();
    });
}

/**
 * 解析后端菜单 component 字段；文件不存在或加载失败时回退 404
 * @param componentTemplate 如 system/user/index → views/system/user/index.vue
 */
function resolveRouteComponent(
  componentTemplate: string | undefined,
  modules: Record<string, ViewModule>
) {
  if (!componentTemplate) {
    return Layout;
  }
  const moduleKey = `/src/views/${componentTemplate}.vue`;
  const loader = modules[moduleKey];
  if (!loader) {
    if (import.meta.env.DEV) {
      console.warn(`[route] 页面不存在，已使用 404: ${moduleKey}`);
    }
    return NotFoundPage;
  }
  return wrapPageLoader(loader, moduleKey);
}

/**
 * 注意：使用console.log("路由数据", JSON.stringify(generateRoutes(res.data, 0))打印会发现子路由的component打印不出来，JSON不能打印出来函数。${data[i].component}
 */
// 递归函数用于生成路由配置，登录的时候也需要调用一次。
export function generateRoutes(data: any[], parentId: any) {
  // 首先把你需要动态路由的组件地址全部获取[vue2中可以直接用拼接的方式，但是vue3中必须用这种方式]
  let modules = import.meta.glob("@/views/**/*.vue");
  const routeList: any = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i] && String(data[i].parentId) === String(parentId)) {
      // console.log("component", data[i].component);
      const componentTemplate = data[i]?.component;
      const route: any = {
        path: `${data[i].path.startsWith("/") ? data[i].path : `/${data[i].path}`}`,
        name: `${data[i].name}`,
        component: resolveRouteComponent(componentTemplate, modules),
        meta: {
          menuId: String(data[i].menuId),
          title: String(data[i]?.menuName),
          icon: data[i]?.icon,
          isVisible: data[i]?.isVisible,
          isKeepAlive: data[i]?.isKeepAlive,
          linkUrl: data[i]?.linkUrl,
          isTag: data[i]?.isTag,
          isAffix: data[i]?.isAffix,
          activeMenu: data[i]?.activeMenu
        }
      };
      // console.log("component", route.component);
      if (data[i].menuType == "1") {
        route.redirect = `${data[i]?.redirect}` || HOME_URL;
      }
      // 递归处理子节点
      const children = generateRoutes(data, data[i].menuId);
      if (children.length > 0) {
        route.children = children;
      }

      routeList.push(route);
    }
  }
  return routeList;
}

/**
 * 初始化动态路由[用于生成扁平化一级路由，将后端一级路由数据转化为前端router格式的一级路由]
 */
export function generateFlattenRoutes(data: any[]) {
  // 首先把你需要动态路由的组件地址全部获取[vue2中可以直接用拼接的方式，但是vue3中必须用这种方式]
  let modules = import.meta.glob("@/views/**/*.vue");
  const routes: any = [];
  for (var i = 0; i < data.length; i++) {
    // console.log("component", data[i].component)
    const componentTemplate = data[i]?.component;
    const route: any = {
      path: `${data[i].path.startsWith("/") ? data[i].path : `/${data[i].path}`}`,
      name: `${data[i].name}`,
      component: resolveRouteComponent(componentTemplate, modules),
      meta: {
        parentId: String(data[i].parentId),
        menuId: String(data[i].menuId),
        title: data[i].menuName,
        icon: data[i]?.icon,
        isVisible: data[i]?.isVisible,
        isKeepAlive: data[i]?.isKeepAlive,
        linkUrl: data[i]?.linkUrl,
        isTag: data[i]?.isTag,
        isAffix: data[i]?.isAffix,
        activeMenu: data[i]?.activeMenu
      }
    };
    // console.log("component", route.component)
    if (data[i].menuType == "1") {
      route.redirect = `${data[i]?.redirect}` || HOME_URL;
    }
    routes.push(route);
  }
  return routes;
}
