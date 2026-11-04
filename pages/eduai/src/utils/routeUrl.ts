/**
 * 把「站内路由」转换成可直接交给 window.open / location.assign 的完整 URL。
 *
 * <p>本应用默认使用 hash 路由（createWebHashHistory）：手拼 `/edu/xxx` 的地址在
 * 新标签页打开时，路由启动归一化会把它改写成 `/?...#/home`，用户看到的不是目标页
 * （阅卷详情、代入学生、成语卡都踩过同一个坑）。这里统一走 router.resolve 拿到
 * 带 `#` 的 href，再以当前地址补全 origin/base，history 与 hash 两种模式都正确。</p>
 */
import type { RouteLocationRaw, Router } from "vue-router";

/** 站内路由 → 完整 URL（含 origin 与 hash/history 前缀） */
export function routeUrl(router: Router, to: RouteLocationRaw): string {
  const { href } = router.resolve(to);
  return new URL(href, window.location.href).href;
}
