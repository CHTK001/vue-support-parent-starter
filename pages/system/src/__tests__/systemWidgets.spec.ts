/**
 * 测试 home 仪表板 widget 注册项（`@pages/system` 贡献的登录日志 / 个人设置）。
 *
 * 根因：widget 目录由 `WidgetLibrary.vue` 渲染，注册错误的 type 进面板后不会显示（目录
 * 本身没问题，但用户拖拽添加时，未注册的 type 渲染成不同的占位卡片；重复注册会覆盖别人的
 * 条目）。最便宜的防线是把 `@pages/system` 的贡献列表写成单测，断言每条注册项的
 * type / title / 权限 / 分类 / source / 组件加载器，并让注册表亲自报告目录过滤结果。
 *
 * 不在这里 mock 图标组件：只读注册项不渲染，`@element-plus/icons-vue` 原样导入即可。
 *
 * 运行：cd pages/system && pnpm test
 */
import { describe, beforeEach, it, expect } from "vitest";
import { canAccess } from "@repo/core";
import {
  getWidgetCatalog,
  getWidgetRegistration,
  registerWidgets,
} from "@repo/theme/koi/views/home/registry.ts";
import {
  filterCatalogByPermission,
  WIDGET_CATEGORY_LABEL,
  WIDGET_CATEGORY_ORDER,
  WIDGET_PERMISSION_LABEL,
} from "@repo/theme/koi/views/home/widgets.ts";
import { Document, User } from "@element-plus/icons-vue";
import { systemWidgets } from "../widgets/systemWidgets";

/** 登录日志注册项 */
const LOG_ITEM = () => systemWidgets.find((w) => w.type === "system-userlog");
/** 个人设置注册项 */
const SETTINGS_ITEM = () => systemWidgets.find((w) => w.type === "system-personal-settings");

/** 注册 @pages/system 的贡献（在测试组内只注册一次，避免 DEV 期重复覆盖警告） */
let registered = false;

describe("systemWidgets 注册列表", () => {
  it("恰好 2 条注册项", () => {
    expect(systemWidgets).toHaveLength(2);
  });

  it("登录日志注册项各字段完整", () => {
    const w = LOG_ITEM();
    expect(w).toBeDefined();
    expect(w?.type).toBe("system-userlog");
    expect(w?.title).toBe("登录日志");
    expect(w?.description).toBeDefined();
    expect(w?.icon).toBe("Document");
    // 模块贡献：不走 WidgetLibrary 的内置 ICON_MAP，必须带 iconComponent，否则静默退化成默认图标
    expect(w?.iconComponent).toBe(Document);
    expect(w?.defaultSize).toEqual({ w: 8, h: 6 });
    expect(w?.category).toBe("admin");
    expect(w?.environment).toBe("prod");
    expect(w?.requiredPermission).toBe("admin");
    expect(w?.maxCount).toBe(1);
    expect(w?.source).toBe("system");
    expect(typeof w?.component).toBe("function");
  });

  it("个人设置注册项各字段完整", () => {
    const w = SETTINGS_ITEM();
    expect(w).toBeDefined();
    expect(w?.type).toBe("system-personal-settings");
    expect(w?.title).toBe("个人设置");
    expect(w?.description).toBeDefined();
    expect(w?.icon).toBe("User");
    expect(w?.iconComponent).toBe(User);
    expect(w?.defaultSize).toEqual({ w: 8, h: 6 });
    expect(w?.category).toBe("personal");
    expect(w?.environment).toBe("prod");
    expect(w?.requiredPermission).toBe("user");
    expect(w?.maxCount).toBe(1);
    expect(w?.source).toBe("system");
    expect(typeof w?.component).toBe("function");
  });

  it("type 与内置目录不冲突", () => {
    const catalog = getWidgetCatalog(); // 11 条内置（widgets.ts 求值时已自注册）
    const types = systemWidgets.map((w) => w.type);
    expect(new Set(types).size).toBe(types.length);
    // 内置 type 列表就是 widgets.ts 里 BUILTIN_WIDGETS 的 11 条（注意 'system-config' 也走了
    // "system-" 前缀，不能按前缀做差异，否则会把内置的 system-config 误排除）
    const builtInTypes = [
      "calendar", "custom", "note", "client-info", "system-config", "alarm",
      "bookmark", "quick-access", "weather", "metals", "machine-info",
    ];
    expect(builtInTypes).toHaveLength(11);
    expect(catalog.map((w) => w.type)).toEqual(builtInTypes);
    for (const t of types) expect(builtInTypes).not.toContain(t);
  });
});

describe("注册表共识", () => {
  beforeEach(() => {
    if (registered) return;
    registered = true;
    registerWidgets(systemWidgets); // 11 条内置 + 2 条 system 贡献 = 13
  });

  it("登记后目录有、元字段完整", () => {
    const catalog = getWidgetCatalog();
    expect(catalog).toHaveLength(13);
    expect(catalog.map((w) => w.type)).toContain("system-userlog");
    expect(catalog.map((w) => w.type)).toContain("system-personal-settings");

    // 注册项：琳琅满目的元数据（源 + 图标组件）
    const registration = getWidgetRegistration("system-userlog");
    expect(registration).toMatchObject({
      title: "登录日志",
      icon: "Document",
      iconComponent: Document,
      source: "system",
      requiredPermission: "admin",
      maxCount: 1,
      defaultSize: { w: 8, h: 6 },
    });
    expect(registration?.type).toBe("system-userlog");
  });

  it("目录项只携带公共元数据", () => {
    const catalog = getWidgetCatalog();
    const entry = catalog.find((w) => w.type === "system-userlog");
    expect(entry).toMatchObject({
      title: "登录日志",
      description: entry?.description,
      icon: "Document",
      defaultSize: { w: 8, h: 6 },
      category: "admin",
      environment: "prod",
      requiredPermission: "admin",
      maxCount: 1,
    });
  });

  it("目录按权限分级过滤：user 看 user，admin 看 user + admin", () => {
    const catalog = getWidgetCatalog();

    const adminEntries = filterCatalogByPermission(catalog, "admin");
    const userEntries = filterCatalogByPermission(catalog, "user");
    const superadminEntries = filterCatalogByPermission(catalog, "superadmin");

    // 同已知情：'system-userlog' 标 admin，'system-personal-settings' 标 user
    expect(adminEntries.map((w) => w.type)).toContain("system-userlog");
    expect(userEntries.map((w) => w.type)).not.toContain("system-userlog");
    // user 能看 personal
    expect(userEntries.map((w) => w.type)).toContain("system-personal-settings");
    expect(adminEntries.map((w) => w.type)).toContain("system-personal-settings");
    expect(superadminEntries.map((w) => w.type)).toContain("system-personal-settings");

    // canAccess 口径与 app.yaml permissionConfig 一致：admin 级别高于 user
    expect(canAccess("user", "admin")).toBe(true);
    expect(canAccess("admin", "user")).toBe(false);
    expect(canAccess("admin", "superadmin")).toBe(true);
  });

  it("目录保持注册表插入顺序（面板不排序）", () => {
    const catalog = getWidgetCatalog();
    const order = catalog.map((w) => w.category);
    expect(order).toEqual([
      // 11 条内置
      "personal", // calendar
      "common", // custom
      "personal", // note
      "common", // client-info
      "admin", // system-config
      "personal", // alarm
      "personal", // bookmark
      "common", // quick-access
      "common", // weather
      "common", // metals
      "common", // machine-info
      // 2 条 system 贡献（续在最后）
      "admin", // system-userlog
      "personal", // system-personal-settings
    ]);
    // 分类标签直出版
    expect(WIDGET_CATEGORY_LABEL["admin"]).toBe("管理员");
    expect(WIDGET_PERMISSION_LABEL["admin"]).toBe("仅管理员");
    expect(WIDGET_PERMISSION_LABEL["user"]).toBe("全员可见");
    expect(WIDGET_CATEGORY_ORDER).toEqual(["common", "personal", "admin"]);
  });
});

describe("source 占位卡片口径", () => {
  it("source = system 的注册项随布局持久化，未启用本模块的 app 保留位置", () => {
    for (const w of systemWidgets) {
      expect(w.source).toBe("system");
      expect(w.type.startsWith("system-")).toBe(true);
    }
    // source 随已放置的 widget 写进 layout：未启用 system 模块的 app 读不到 type，
    // 但占位卡片把网格位置留着
    const entry = getWidgetRegistration("system-userlog");
    expect(entry?.source).toBe("system");
  });
});
