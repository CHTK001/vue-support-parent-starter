/**
 * 菜单显示规则回归测试（createMenuRouteResolver 的 visibleOnly 模式）。
 *
 * 锁定两条侧边栏规则，防止后续重构把「只有父菜单」的脏数据重新放进菜单树：
 *
 * - 规则 2：菜单没有任何可见子菜单，且自身也没有可用页面组件（component 为空
 *   或只是 Layout/ParentView 占位）→ 整个菜单不显示。
 *   这类行是历史脏数据（例如只建了父页面就再没配子菜单），点进去是空白页。
 * - 规则 2.1：目录只有一个可见子菜单且未开启「显示父级」
 *   （sysMenuShowParent=1 或未配置）→ 子菜单直接提升显示，父级目录不显示。
 *   sysMenuShowParent=0 表示保留父级，此时父子都显示。
 *
 * 规则只在 visibleOnly=true（侧边栏）时生效；面包屑模式必须保留完整层级，
 * 否则隐藏页面会从面包屑里消失、无法定位。
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
  getConfig: () => ({ route: { homePath: "/home" } }),
  resolveMenuDefaultIcon: () => "ep:menu",
}));

vi.mock("@repo/utils", () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { createMenuRouteResolver } from "../menu";

/** 后端菜单行（只保留本组用例关心的字段，字段名与 SysMenuVO 一致） */
interface MenuRow {
  sysMenuId: number;
  sysMenuPid: number;
  menuName: string;
  /** 1:目录 2:页面（后端 VO 的 menuType，不是 sys_menu_type） */
  menuType: number;
  path: string;
  component?: string;
  name: string;
  /** 0:显示父级 1/未配置:不显示父级 */
  sysMenuShowParent?: number;
  /** true 表示脱离菜单控制（只注册路由，不进侧边栏） */
  remind?: boolean;
  isVisible?: number;
  sysMenuPosition?: string;
}

/** 目录（menuType=1） */
function dir(id: number, name: string, extra: Partial<MenuRow> = {}): MenuRow {
  return { sysMenuId: id, sysMenuPid: 0, menuName: name, menuType: 1, path: `/${name}`, name, ...extra };
}

/** 页面（menuType=2） */
function page(id: number, name: string, extra: Partial<MenuRow> = {}): MenuRow {
  return {
    sysMenuId: id,
    sysMenuPid: 0,
    menuName: name,
    menuType: 2,
    path: `/${name}`,
    component: `system/${name}/index`,
    name,
    ...extra,
  };
}

const stub = { name: "stub" };
/** 侧边栏模式解析器（visibleOnly 由调用方按场景传入） */
function resolver() {
  return createMenuRouteResolver({
    viewModules: {},
    layoutComponent: stub,
    notFoundComponent: stub,
    menuTypeValue: "1",
  });
}

/** 递归收集标题，便于断言「父级是否被提升/剔除」 */
function titles(routes: any[]): string[] {
  const out: string[] = [];
  const walk = (list: any[]) => {
    list.forEach((r) => {
      out.push(String(r.meta?.title));
      if (Array.isArray(r.children)) {
        walk(r.children);
      }
    });
  };
  walk(routes);
  return out;
}

describe("菜单显示规则 · 规则 2（空父菜单不显示）", () => {
  it("没有可见子菜单且 component 为空的父菜单，整个不显示", () => {
    const rows = [page(1, "emptyParent", { component: "" })];
    expect(titles(resolver().generateRoutes(rows, 0, { visibleOnly: true }))).toEqual([]);
  });

  it("component 只是 Layout/ParentView 占位的父菜单，同样整个不显示", () => {
    const rows = [page(1, "layoutOnly", { component: "Layout" }), page(2, "parentViewOnly", { component: "ParentView" })];
    expect(titles(resolver().generateRoutes(rows, 0, { visibleOnly: true }))).toEqual([]);
  });

  it("有页面组件的单页面菜单不被规则 2 误伤", () => {
    const rows = [page(1, "singlePage")];
    const routes = resolver().generateRoutes(rows, 0, { visibleOnly: true });
    expect(titles(routes)).toEqual(["singlePage"]);
    expect(routes[0].children).toBeUndefined();
  });

  it("父菜单的子菜单全部脱离菜单控制时，父菜单也不显示", () => {
    const rows = [dir(1, "parent"), page(2, "detached", { sysMenuPid: 1, remind: true })];
    expect(titles(resolver().generateRoutes(rows, 0, { visibleOnly: true }))).toEqual([]);
  });

  it("父菜单有可见子菜单时不会被规则 2 剔除", () => {
    const rows = [
      dir(1, "parent", { sysMenuShowParent: 0 }),
      page(2, "childA", { sysMenuPid: 1 }),
      page(3, "childB", { sysMenuPid: 1 }),
    ];
    const routes = resolver().generateRoutes(rows, 0, { visibleOnly: true });
    expect(titles(routes)).toEqual(["parent", "childA", "childB"]);
  });
});

describe("菜单显示规则 · 规则 2.1（单子菜单不显示父级）", () => {
  it("目录只有一个子菜单且 sysMenuShowParent=1 → 子菜单直接显示，父级不显示", () => {
    const rows = [dir(1, "parent", { sysMenuShowParent: 1 }), page(2, "child", { sysMenuPid: 1 })];
    const routes = resolver().generateRoutes(rows, 0, { visibleOnly: true });
    expect(titles(routes)).toEqual(["child"]);
    expect(routes[0].meta.title).toBe("child");
  });

  it("目录只有一个子菜单且未配置 sysMenuShowParent → 同样不显示父级", () => {
    const rows = [dir(1, "parent"), page(2, "child", { sysMenuPid: 1 })];
    expect(titles(resolver().generateRoutes(rows, 0, { visibleOnly: true }))).toEqual(["child"]);
  });

  it("目录只有一个子菜单且 sysMenuShowParent=0（显示父级）→ 父子都保留", () => {
    const rows = [dir(1, "parent", { sysMenuShowParent: 0 }), page(2, "child", { sysMenuPid: 1 })];
    const routes = resolver().generateRoutes(rows, 0, { visibleOnly: true });
    expect(titles(routes)).toEqual(["parent", "child"]);
    expect(routes[0].children).toHaveLength(1);
  });

  it("目录有多个子菜单 → 保持目录，不做提升", () => {
    const rows = [
      dir(1, "parent", { sysMenuShowParent: 1 }),
      page(2, "childA", { sysMenuPid: 1 }),
      page(3, "childB", { sysMenuPid: 1 }),
    ];
    const routes = resolver().generateRoutes(rows, 0, { visibleOnly: true });
    expect(titles(routes)).toEqual(["parent", "childA", "childB"]);
    expect(routes[0].children).toHaveLength(2);
  });

  it("规则 2.1 在多级目录上逐级生效（孙目录单子菜单也提升）", () => {
    const rows = [
      dir(1, "root", { sysMenuShowParent: 0 }),
      dir(2, "mid", { sysMenuPid: 1, sysMenuShowParent: 1 }),
      page(3, "leaf", { sysMenuPid: 2 }),
    ];
    const routes = resolver().generateRoutes(rows, 0, { visibleOnly: true });
    expect(titles(routes)).toEqual(["root", "leaf"]);
  });
});

describe("菜单显示规则 · 面包屑模式保持完整层级", () => {
  it("未传 visibleOnly 时不剔除隐藏/脱离菜单控制的行，也不套用规则 2 / 2.1", () => {
    const rows = [
      page(1, "emptyParent", { component: "" }),
      dir(2, "single", { sysMenuShowParent: 1 }),
      page(3, "onlyChild", { sysMenuPid: 2 }),
      page(4, "detached", { remind: true }),
    ];
    const routes = resolver().generateRoutes(rows, 0);
    expect(titles(routes).sort()).toEqual(["detached", "emptyParent", "onlyChild", "single"]);
  });
});

describe("菜单元数据归一化", () => {
  it("meta.position 归一化为 top / standard", () => {
    const rows = [
      page(1, "topMenu", { sysMenuPosition: "top", remind: true }),
      page(2, "sideMenu", { sysMenuPosition: "standard" }),
      page(3, "noPosition"),
    ];
    const routes = resolver().generateRoutes(rows, 0);
    expect(routes.map((r) => r.meta.position)).toEqual(["top", "standard", "standard"]);
  });

  it("meta.showParent 归一化：DB 0 → 1（隐藏父级），DB 1/未配置 → 0（保留父级）", () => {
    const rows = [
      dir(1, "hideParent", { sysMenuShowParent: 1 }),
      dir(2, "keepParent", { sysMenuShowParent: 0 }),
      dir(3, "unsetParent"),
    ];
    const routes = resolver().generateRoutes(rows, 0);
    // meta.showParent 是「是否隐藏父级」：1 表示子菜单直接显示（规则 2.1 生效）
    expect(routes.map((r) => r.meta.showParent)).toEqual([0, 1, 0]);
    expect(routes.map((r) => r.meta.isDirectory)).toEqual([true, true, true]);
  });
});
