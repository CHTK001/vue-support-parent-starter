/**
 * KeepAlive 名称解析（koi 布局）
 *
 * <p>布局的 `<keep-alive :include="keepAliveStore.keepAliveName">` 做的是
 * {@code KeepAlive.matches(include, name)} = {@code include.split(",").includes(name)}，
 * 即按组件名精确匹配，而不是路由名。因此登记在 keepAliveStore 里的值必须是组件名
 * （SFC 的 {@code name} 或编译器从文件基名生成的 {@code __name}），路由名
 * （如 {@code SystemUser}）永远匹配不上，表现为菜单点击后的页面进不了缓存。</p>
 *
 * <p>解析来源：vue-router 在导航时为进入记录调用 {@code extractComponentsGuards}，
 * 把路由记录里的懒加载函数解析为真实组件并覆写 {@code record.components[name]}；
 * 所以导航已完成的 {@code route.matched} 里已经挂着已解析的组件对象（或仍未解析
 * 的 loader 函数）。</p>
 *
 * <p>与 Vue 3.5 {@code getComponentName} 对齐：
 * {@code isFunction(Component) ? Component.displayName || Component.name
 *  : Component.name || Component.__name}，
 * 确保 include 列表与 Vue 实际匹配的命名逻辑一致。</p>
 */

import type { RouteLocationNormalized } from "vue-router";

/** 把路由记录里的原始组件值解析为组件名；解不出来时返回 null */
export function componentDisplayName(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "function") {
    // 尚未解析的 loader / defineAsyncComponent 产物，拿不到组件名
    const fn = raw as any;
    return (fn.displayName || fn.name || null) as string | null;
  }
  const obj = raw as Record<string, unknown>;
  // defineAsyncComponent 产物：真实组件挂在 __asyncResolved 上
  if (obj.__asyncResolved) return componentDisplayName(obj.__asyncResolved);
  // 与 getComponentName 对齐：name 优先（defineComponent 写在 name 上），其次 __name
  const name = obj.name as string | undefined;
  const inferred = obj.__name as string | undefined;
  return name || inferred || null;
}

/**
 * 从当前路由解析 KeepAlive 应登记的组件名（取最内层记录，优先 default key）。
 *
 * <p>按从深到浅的顺序扫描 {@code route.matched}，只取最内层页面对应的记录上
 * {@code components.default}（或其他 key）解析出的组件名。取不到时退化回到
 * {@code route.name}（未解析成对象的 loader 尚未提供名字，退回旧有口径）。</p>
 *
 * @param route 当前路由（已导航完成，组件已被解析）
 * @returns 组件名，未解析出时退回路由名
 */
export function resolveKeepAliveName(route: RouteLocationNormalized): string {
  // 从最深记录（叶子）开始找，避免外部 layout 的记录先被成功
  for (let i = route.matched.length - 1; i >= 0; i--) {
    const record = route.matched[i];
    if (!record || !record.components) continue;
    const keys = Object.keys(record.components);
    // default key 最先：最内层 RouterView 读的正是 currentName === "default"
    const order = ["default", ...keys.filter((k) => k !== "default")];
    for (const key of order) {
      const name = componentDisplayName(record.components[key]);
      if (name) return name;
    }
  }
  // 兜底：未解析出组件名时退回路由名（旧有的登记口径）
  return String(route.name);
}
