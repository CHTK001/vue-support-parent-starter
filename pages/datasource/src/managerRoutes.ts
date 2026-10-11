/**
 * 数据源中心的「打开管理」路由解析。
 *
 * <p><strong>为什么单独成模块</strong>：判定逻辑原先内联在 {@code ScDataSourceView}
 * 里，失败时只弹一句「未注册 /prometheus 管理页」。这句话无法区分三种完全不同的情况：
 * 路由真的没注册、注册了但路径写法不一致、当前应用压根不是拥有管理页的那个应用 ——
 * 而这三种的修法完全不同（改路由表 / 改判定 / 别在这个应用里点）。
 * 所以把判定和诊断一起收在这里：判定放宽到等价路径，失败时给出最接近的已注册路径。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import type { Router } from "vue-router";

/**
 * 归一化路径用于比较。
 *
 * <p>业务路由是通过 {@code addRoute("layout", route)} 挂到布局下的（见
 * {@code turbo/app/src/createVueApp.ts} 的 {@code registerRoutesUnderLayout}），
 * 子路由若写成绝对路径 {@code /prometheus}，而别处写成 {@code prometheus/}
 * 或多一个尾斜杠，直接用 {@code ===} 比就会得出「没注册」的结论。
 * 比较前统一去掉首尾斜杠与重复斜杠。</p>
 *
 * @param p 路径
 * @returns 归一化结果
 */
export function normalizeRoutePath(p: string): string {
  const trimmed = (p ?? "").trim().replace(/\/{2,}/g, "/");
  const noTail = trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
  return noTail.startsWith("/") ? noTail : `/${noTail}`;
}

/**
 * 当前应用是否注册了某条路径。
 *
 * @param router 路由实例
 * @param path   目标路径
 * @returns 是否已注册
 */
export function hasRoutePath(router: Router, path: string): boolean {
  const want = normalizeRoutePath(path);
  return router.getRoutes().some((r) => normalizeRoutePath(r.path) === want);
}

/**
 * 找出与目标路径最接近的已注册路径，用于失败提示。
 *
 * <p>只取同一层的第一段相同者（例如目标是 {@code /prometheus} 就找所有
 * {@code /prometheus*}），并且最多给 5 条：提示是用来定位的，不是用来刷屏的。</p>
 *
 * @param router 路由实例
 * @param path   目标路径
 * @returns 候选路径（可能为空）
 */
export function nearbyRoutePaths(router: Router, path: string): string[] {
  const want = normalizeRoutePath(path);
  const first = want.split("/")[1] ?? "";
  const out: string[] = [];
  for (const r of router.getRoutes()) {
    const p = normalizeRoutePath(r.path);
    if (p === want) {
      continue;
    }
    if (first && p.split("/")[1] === first) {
      out.push(r.path);
      if (out.length >= 5) {
        break;
      }
    }
  }
  return out;
}