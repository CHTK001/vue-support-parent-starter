/** 支付模块路由前缀，可被外部设置以避免嵌入时路由冲突 */
let _routePrefix = "";

export function setPaymentRoutePrefix(prefix: string) {
  _routePrefix = prefix.replace(/\/+$/, "");
}

export function getPaymentRoutePrefix(): string {
  return _routePrefix;
}

/** 为指定路径添加路由前缀 */
export function withPrefix(path: string): string {
  if (!_routePrefix) return path || "/";
  if (path === "/" || !path) return _routePrefix || "/";
  return `${_routePrefix}${path}`;
}

/** 为 vue-router 路由表批量添加前缀 */
export function prefixRoutes(routes: { path: string; name?: string; component: any }[]) {
  return routes.map((r) => ({
    ...r,
    path: withPrefix(r.path),
  }));
}
