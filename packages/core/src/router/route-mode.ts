export type RouteSourceMode = "local-only" | "remote-only" | "hybrid";

export type RouteModeConfig = {
  RemoteMenu?: boolean;
  MergeLocalMenu?: boolean;
  LocalRouteModulePaths?: string | string[];
  EnableLocalModuleDiscovery?: boolean;
};

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

const toBoolean = (value: unknown, defaultValue = false): boolean => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return defaultValue;
};

export const resolveLocalRouteModulePaths = (
  config: RouteModeConfig = {},
): string[] => {
  const source = config.LocalRouteModulePaths;
  const values = Array.isArray(source) ? source : [source];
  return values
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
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

export const shouldEnableLocalModuleDiscovery = (
  config: RouteModeConfig = {},
): boolean =>
  shouldLoadLocalBusinessRoutes(config) &&
  toBoolean(config.EnableLocalModuleDiscovery, false);
