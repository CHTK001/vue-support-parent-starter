import type { ElegantConstRoute } from '@elegant-router/types';
import { request } from '../request';

/** get constant routes */
export function fetchGetConstantRoutes() {
  return request<Api.Route.MenuRoute[]>({ url: '/route/getConstantRoutes' });
}

/** get user routes */
export function fetchGetUserRoutes() {
  return request<ElegantConstRoute[]>({ url: '/v2/user/menu' });
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({
    url: '/route/isRouteExist',
    params: { routeName }
  });
}
