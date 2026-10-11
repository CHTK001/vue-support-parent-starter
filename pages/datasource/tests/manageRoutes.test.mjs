/**
 * 数据源管理页路由收敛的单元测试（node:test，无第三方依赖）。
 *
 * <p>运行：`node --test tests/`（或 `pnpm test`）。</p>
 *
 * <p>针对的缺陷：管理页路由过去由每个宿主应用在自己的 routes.ts 里各抄一份，
 * 采集调度应用抄漏了 Prometheus，于是「打开管理」只对 Prometheus 数据源报
 * 「当前应用未注册 /prometheus 管理页」——这类缺项全在 showLink:false 的隐藏区，
 * 菜单上看不出来，只能逐类点过去才暴露。</p>
 *
 * <p>收敛后路由表与「类型→路径」映射同在 {@code src/routes.ts}，所以这个对应关系
 * 可以被直接断言，不必再靠人工对账或逐类手点。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  MANAGER_ROUTE_MAP,
  MANAGER_ROUTE_PATHS,
  createDatasourceManageRoutes,
  managerRouteFor
} from "../src/routes.ts";

/** 路由表产出的全部 path（去重前，用于查重复声明） */
const declaredPaths = createDatasourceManageRoutes({ activeMenu: "/x" }).map(r => r.path);

test("每种数据源类型的映射都有对应的路由声明", () => {
  const missing = Object.entries(MANAGER_ROUTE_MAP)
    .filter(([, path]) => !declaredPaths.includes(path))
    .map(([type, path]) => `${type} -> ${path}`);
  assert.deepEqual(missing, [], "映射里有类型没有对应路由条目，会稳定弹「未注册」");
});

test("路由条目没有重复 path（重复声明会让 vue-router 静默丢弃后者）", () => {
  const dup = declaredPaths.filter((p, i) => declaredPaths.indexOf(p) !== i);
  assert.deepEqual(dup, []);
});

test("路由条目没有重复 name（name 是 registerRoutesUnderLayout 的幂等键）", () => {
  const names = createDatasourceManageRoutes({ activeMenu: "/x" }).map(r => String(r.name));
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  assert.deepEqual(dup, []);
});

test("MANAGER_ROUTE_PATHS 与映射同源，不会各写一份", () => {
  assert.deepEqual(MANAGER_ROUTE_PATHS, Object.values(MANAGER_ROUTE_MAP));
});

test("未知类型取不到路径，交给调用方提示「开发中」而不是硬凑一个", () => {
  assert.equal(managerRouteFor("kafka"), undefined);
  assert.equal(managerRouteFor("jdbc"), "/db-manager");
});

test("activeMenu 落到每个非 standalone 路由上，缺省 /datasource", () => {
  const custom = createDatasourceManageRoutes({ activeMenu: "/collect/datasource/list" });
  for (const r of custom) {
    if (r.meta?.standalone) continue;
    assert.equal(r.meta?.activeMenu, "/collect/datasource/list", `${r.path} 未回指宿主列表`);
  }
  const fallback = createDatasourceManageRoutes();
  for (const r of fallback) {
    if (r.meta?.standalone) continue;
    assert.equal(r.meta?.activeMenu, "/datasource");
  }
});

test("全部条目都在顶层隐藏区：showLink:false 且无 children", () => {
  for (const r of createDatasourceManageRoutes({ activeMenu: "/x" })) {
    assert.equal(r.meta?.showLink, false, `${r.path} 会被渲染进侧边栏`);
    // 菜单过滤 getShowStaticAndDynamicMenuList 的「顶层剔除」不递归：
    // 挂在分组 children 下时子项的 showLink:false 拦不住
    assert.equal(r.children, undefined, `${r.path} 不应挂在分组 children 下`);
  }
});

test("嵌入页是 standalone（不套 layout），供其他系统 iframe 直接开", () => {
  const embed = createDatasourceManageRoutes({ activeMenu: "/x" })
    .filter(r => /\/embed\/:token$/.test(r.path));
  assert.ok(embed.length >= 1, "嵌入页声明丢了");
  for (const r of embed) {
    assert.equal(r.meta?.standalone, true, `${r.path} 必须 standalone，否则 iframe 里会套出布局`);
  }
});
