export type RouteSourceMode = "local-only" | "remote-only" | "hybrid";

export type RouteModeConfig = {
  RemoteMenu?: boolean;
  MergeLocalMenu?: boolean;
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
