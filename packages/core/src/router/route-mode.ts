export type RouteSourceMode = "local-only" | "remote-only" | "hybrid";

export type RouteModeConfig = {
  RemoteMenu?: boolean;
  MergeLocalMenu?: boolean;
  LocalRouteModulePaths?: string | string[];
};

export const resolveLocalRouteModulePaths = (
  config: RouteModeConfig = {},
): string[] => {
  const source = config.LocalRouteModulePaths;
  if (!source) return [];
  const values = Array.isArray(source) ? source : [source];
  return values
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
};

/** @deprecated 仅由 PermissionStore 内部使用，请勿在新代码中引用 */
export const isAlwaysAvailableStaticRoute = (route: any): boolean => {
  if (!route) {
    return false;
  }

  if (route.meta?.alwaysIncludeStatic === true) {
    return true;
  }

  if (Array.isArray(route.children)) {
    return route.children.some((child) => isAlwaysAvailableStaticRoute(child));
  }

  return false;
};

export const resolveRouteSourceMode = (
  config: RouteModeConfig = {},
): RouteSourceMode => {
  if (!config.RemoteMenu) {
    return "local-only";
  }

  return config.MergeLocalMenu ? "hybrid" : "remote-only";
};

export const shouldLoadLocalBusinessRoutes = (
  config: RouteModeConfig = {},
): boolean => resolveRouteSourceMode(config) !== "remote-only";
