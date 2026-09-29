/**
 * 策略任务页面（PolicyTask.vue）组件测试
 *
 * 重点覆盖两处最容易再次回归、且单靠肉眼看不出来的逻辑：
 *
 * 1. **接口管控的有效状态 = action × status**（本文件最贵的一个 bug）
 *    规则「想做什么」（action，停用/转发）和「有没有在跑」（status 开关）是两个独立的轴。
 *    以前只渲染 action，于是把 status 关掉（接口其实已放行）后行上仍写「停用」，
 *    用户以为没生效又点一次开关，反而把接口重新拦了回去 —— 表现为「停用了却恢复不了」。
 *    这里用四条数据把 action/status 的各种组合都钉死。
 *
 * 2. **页签切换**
 *    7 个页签共用一个 v-else-if 链，历史上出过「v-else 失去相邻 v-if」这类问题，
 *    所以逐个点过去断言标题，确保每个页签都能进入（含独立成组件的灰度页签）。
 *
 * 另附：接口管控的「生效」列必须同时给出状态标签和白话说明（生不生效），
 *      否则用户只能靠标签猜规则有没有在跑。
 *
 * 运行：pnpm --filter @pages/system test  （详见 __tests__/README）
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("element-plus", () => ({
  ElMessage: ep.msg,
  ElMessageBox: ep.box,
}));
vi.mock("@element-plus/icons-vue", () => {
  // 显式列出 PolicyTask.vue 用到的图标：只用 Proxy 的 get 兜底过不了 vitest 的
  // 导出校验（它查的是键是否存在，不是取不取得到），会报
  // No "Xxx" export is defined on the mock；而这个错会被组件的 onErrorCaptured
  // 吞掉，在测试结果里完全看不见，等于凭空多一个盲区。
  const stub = { name: "IconStub", template: "<i />" };
  const names = [
    "InfoFilled",
    "Stopwatch",
    "Setting",
    "User",
    "Search",
    "Plus",
    "Delete",
    "Edit",
    "Refresh",
    "Download",
    "Warning",
    "Clock",
    "Document",
  ];
  const mod: Record<string, unknown> = { __esModule: true };
  for (const n of names) {
    mod[n] = stub;
  }
  return mod;
});

/**
 * vue-i18n 部分 mock：只替换 useI18n 让 t() 回显键名（断言写键名而不是中文，
 * 改文案时测试不必跟着改），其余导出必须保留真实实现 ——
 * @repo/languages 在模块顶层就调用 createI18n，只给 useI18n 会直接加载失败。
 */
vi.mock("vue-i18n", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, arg?: Record<string, unknown>) =>
        arg === undefined ? key : `${key}#${JSON.stringify(arg)}`,
    }),
  };
});

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

/** 默认空响应，按用例覆写。pagePolicyConfig 的数据在 data.records 下（不是 data.data） */
const api = vi.hoisted(() => ({
  listHotReload: vi.fn(),
  listRateLimit: vi.fn(),
  listApiRouteTargets: vi.fn(),
  listHeaderRules: vi.fn(),
  listHeaderPresets: vi.fn(),
  pageForIp: vi.fn(),
  pageForAccountBw: vi.fn(),
  pagePolicyConfig: vi.fn(),
  getRateLimitGlobal: vi.fn(),
  // usePolicyHit.ts 要的命中统计两个接口。必须列进来：模块被整体替换后，
  // 没列到的导出是 undefined，而页面是用 `void loadHitCounts()` 调它的 ——
  // 抛错变成游离的 unhandled rejection，既不会让用例红，也不会在结果里显形。
  policyHitCounts: vi.fn(),
  policyHitDetail: vi.fn(),
  refreshHeaderRules: vi.fn(),
  refreshApiRoute: vi.fn(),
  reloadHotReload: vi.fn(),
  applyRateLimitGlobal: vi.fn(),
  saveHotReload: vi.fn(),
  saveRateLimit: vi.fn(),
  updateRateLimit: vi.fn(),
  deleteRateLimit: vi.fn(),
  saveIp: vi.fn(),
  updateIp: vi.fn(),
  deleteIp: vi.fn(),
  saveAccountBw: vi.fn(),
  updateAccountBw: vi.fn(),
  deleteAccountBw: vi.fn(),
  savePolicyConfig: vi.fn(),
  updatePolicyConfig: vi.fn(),
  deletePolicyConfig: vi.fn(),
  togglePolicyConfig: vi.fn(),
}));
vi.mock("../api/systemApi", () => api);

import PolicyTask from "../views/monitor/PolicyTask.vue";
import {
  makeReTableStub,
  ReButtonStub,
  ReInputStub,
  ReSelectStub,
  ReSwitchStub,
  ReInputNumberStub,
  ReTagStub,
  ReDialogStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

/** 接口管控表格用到的具名插槽（与 PolicyTask.vue 模板里的 <template #…> 对应） */
const ROUTE_SLOTS = ["method", "actionText", "hit", "status", "action"];

function mountPage() {
  return mount(PolicyTask, {
    global: {
      stubs: {
        ReTable: makeReTableStub(ROUTE_SLOTS),
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReSwitch: ReSwitchStub,
        ReInputNumber: ReInputNumberStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ReDrawer: { template: "<div><slot /></div>" },
        ReIcon: { template: "<i />" },
        ReEChart: { template: "<div class='echart-stub' />" },
        ...elementPlusLayoutStubs(),
      },
      directives: { loading: {} },
    },
  });
}

/**
 * 等某个条件成立，而不是等固定轮数
 *
 * <p>页签拆成独立组件后 loader 链更长（组件边界 + 两个并发请求 + 并集 + 过滤 + 切片），
 * 需要的异步轮数不固定。这里轮询到条件成立为止，与机器负载无关；
 * 顺带比「空转固定轮数」快得多（全量用例耗时从 14~79s 降到 10~13s）。</p>
 *
 * <p>等待条件一定要是<b>可观测的渲染结果</b>（如「表格出行了」），
 * 不能是「时间到了」—— 否则表格空的时候，正向断言红、反向断言假绿，两种都防不住。</p>
 *
 * @param w 挂载结果
 * @param done 判定条件
 * @param tries 最多尝试次数
 */
async function waitFor(
  w: { vm: { $nextTick: () => Promise<void> } },
  done: () => boolean,
  tries = 60,
): Promise<void> {
  for (let i = 0; i < tries; i++) {
    if (done()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await w.vm.$nextTick();
  }
}

/** 一条已注册路由 */
function routeTarget(path: string, method = "GET", handler = "DemoController#demo") {
  return { path, method, handler, key: `${method} ${path}`, registered: true };
}

/**
 * 一条 API_ROUTE 策略。
 * 注意 config 里的 `status` 是**停用响应码**（不是启用开关），
 * 启用开关是外层 PolicyConfig.status —— 两个 status 同名但含义不同。
 */
function routePolicy(
  path: string,
  action: "DISABLE" | "FORWARD" | "PASS",
  enabled: number,
  id = 1,
) {
  return {
    sysPolicyConfigId: id,
    type: "API_ROUTE",
    bizKey: path,
    dimension: "",
    listType: 0,
    status: enabled,
    sort: 0,
    remark: "",
    config: JSON.stringify({ action, status: 503, message: "已拦截" }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listHotReload.mockResolvedValue({ data: [] });
  api.listRateLimit.mockResolvedValue({ data: [] });
  api.listApiRouteTargets.mockResolvedValue({ data: [] });
  api.listHeaderRules.mockResolvedValue({ data: [] });
  api.listHeaderPresets.mockResolvedValue({ data: { groups: {}, flat: [] } });
  api.pagePolicyConfig.mockResolvedValue({ data: { records: [] } });
  api.pageForIp.mockResolvedValue({ data: { total: 0, data: [] } });
  api.pageForAccountBw.mockResolvedValue({ data: { total: 0, data: [] } });
  api.getRateLimitGlobal.mockResolvedValue({ data: {} });
  api.policyHitCounts.mockResolvedValue({ data: {} });
  api.policyHitDetail.mockResolvedValue({ data: { total: 0, data: [] } });
});

describe("策略任务 · 页签", () => {
  it("7 个页签都能点进去，标题各不相同", async () => {
    const w = mountPage();
    await settle(w);
    const nav = w.findAll(".policy-nav__item");
    expect(nav).toHaveLength(7);
    expect(w.find(".policy-view h2").text()).toBe("policy.overview.chain");

    const titles = [
      "policy.hotreload.title",
      "policy.nav.ratelimit.label",
      "policy.nav.blackwhite.label",
      "policy.nav.gray.label",
      "policy.nav.header.label",
      "policy.nav.route.label",
    ];
    const seen = new Set<string>();
    for (let i = 0; i < titles.length; i++) {
      await nav[i + 1].trigger("click");
      await settle(w);
      const h2 = w.find(".policy-view h2").text();
      expect(h2, `第 ${i + 2} 个页签标题不对`).toBe(titles[i]);
      seen.add(h2);
    }
    // 6 个子页签标题互不相同，否则说明 v-else-if 链串了
    expect(seen.size).toBe(6);
  });

  it("所有表格都关掉了布局切换器（本页是单一表格视图）", async () => {
    const w = mountPage();
    await settle(w);
    const nav = w.findAll(".policy-nav__item");
    for (let i = 0; i < nav.length; i++) {
      await nav[i].trigger("click");
      await settle(w);
      const tables = w.findAllComponents({ name: "ReTable" });
      for (const tb of tables) {
        // layoutSwitch 未在桩里声明成 prop，所以落到 attrs 上
        expect(tb.attributes("layout-switch"), `第 ${i + 1} 个页签的表格没关切换器`).toBe("false");
        expect(tb.attributes("layout")).toBeUndefined();
      }
    }
  });
});

describe("策略任务 · 接口管控有效状态（action × status）", () => {
  /**
   * 进入接口管控页签并**等表格真的出行**
   *
   * <p>用 {@link waitFor} 等行出现，不用固定轮数：这个页签已拆成独立组件，
   * loader 链是「组件边界 + 两个并发请求 + 并集 + 过滤 + 切片」，
   * 需要几轮异步不固定（实测同样代码耗时在 14s~79s 间跳）。
   * 表格空的时候，下面多数「文本应包含 xxx」的断言会直接红，
   * 而反向断言（「不包含 xxx」）会**假绿** —— 两种都得防。</p>
   */
  async function renderRoutes(targets: unknown[], policies: unknown[]) {
    api.listApiRouteTargets.mockResolvedValue({ data: targets });
    api.pagePolicyConfig.mockResolvedValue({ data: { records: policies } });
    const w = mountPage();
    await settle(w);
    await w.findAll(".policy-nav__item")[6].trigger("click");
    await waitFor(w, () => w.findAll(".re-row").length > 0);
    return w;
  }

  it("规则停用：接口实际已放行，状态必须是「未生效」而不是「已拦截」", async () => {
    const w = await renderRoutes(
      [routeTarget("/v2/demo")],
      [routePolicy("/v2/demo", "DISABLE", 0)],
    );
    const text = w.text();
    expect(text).toContain("policy.route.stateInactive");
    expect(text).toContain("policy.route.stateNoteInactive");
    // 关键回归：不能显示成「已拦截」，否则用户会以为没生效而反复点开关
    expect(text).not.toContain("policy.route.stateBlocked");
  });

  it("规则启用 + 停用动作：状态是「已拦截」，说明里带响应码", async () => {
    const w = await renderRoutes(
      [routeTarget("/v2/demo")],
      [routePolicy("/v2/demo", "DISABLE", 1)],
    );
    const text = w.text();
    expect(text).toContain("policy.route.stateBlocked");
    expect(text).toContain('policy.route.stateNoteBlocked#{"code":"503"}');
    expect(text).not.toContain("policy.route.stateInactive");
  });

  it("转发动作：状态是「已转发」", async () => {
    const w = await renderRoutes(
      [routeTarget("/v2/demo")],
      [routePolicy("/v2/demo", "FORWARD", 1)],
    );
    const text = w.text();
    expect(text).toContain("policy.route.stateForwarded");
    expect(text).toContain("policy.route.stateNoteForwarded");
    expect(text).not.toContain("policy.route.stateBlocked");
  });

  it("没有配置规则的路由：状态是「未配置」，且不显示启停开关", async () => {
    const w = await renderRoutes([routeTarget("/v2/plain")], []);
    // 先钉住「表格确实出行了」。这条用例原本全是反向断言（不包含 xxx / 元素不存在），
    // 表格空的时候它们会**全部通过** —— 看着绿，其实什么都没验。
    expect(w.text(), "接口管控表格没有渲染出数据行").toContain("/v2/plain");
    const text = w.text();
    expect(text).toContain("policy.common.notConfigured");
    expect(text).toContain("policy.route.stateNoteUnconfigured");
    // 未配置的行没有 policyId，#status 插槽走 v-else 分支，不该有开关
    expect(w.find(".policy-route-status").exists()).toBe(false);
  });

  it("只有策略、没有注册路由的自定义路径也要出现在列表里", async () => {
    const w = await renderRoutes([], [routePolicy("/v2/custom", "DISABLE", 1, 9)]);
    const text = w.text();
    expect(text).toContain("/v2/custom");
    expect(text).toContain("policy.route.stateBlocked");
  });
});

/**
 * 顶部「刷新」按钮的页签分发。
 *
 * 修的是一个**静默空操作**：refreshCurrentSection 原来只显式处理了
 * overview / hotreload / ratelimit 三个分支，剩下的一律落进最后的「访问名单」分支，
 * 而访问名单的两个表格 ref 在其它页签下根本没挂载（值为 undefined），
 * 可选链一短路就结束了 —— header / route / gray 三个页签点刷新**什么都不发生，也不报错**。
 * 这种缺陷编译绿、页面不红、只有人肉点一遍才能发现，所以在这里钉死。
 */
describe("策略任务 · 顶部刷新按当前页签分发", () => {
  /**
   * tab   —— 导航项下标（与 policy-nav__item 顺序一致）
   * hit   —— 刷新后必须被调到的接口，挑的是这一页签**独有**的那个，
   *          避免「总览和热更新都调 listHotReload」这种区分不开的组合
   * allow —— 这一页签刷新时允许出现的接口白名单。
   *          断言「实际调用的 ⊆ 白名单」比断言某几个接口「没被调」更严：
   *          旧缺陷正是分支漏写后落进「访问名单」，白名单会当场多出 pageForIp。
   */
  const CASES = [
    // loadOverview：一次 allSettled 打 6 个读接口，没有独立的「统计」接口
    {
      tab: 0,
      hit: "pageForAccountBw",
      allow: ["listHotReload", "listRateLimit", "pageForIp", "pageForAccountBw"],
    },
    // loadHotReload：只读自己那一张
    { tab: 1, hit: "listHotReload", allow: ["listHotReload"] },
    // loadRateWorkspace = loadGlobal(全局配置) + loadRateList(当前维度规则)
    { tab: 2, hit: "listRateLimit", allow: ["listRateLimit", "getRateLimitGlobal"] },
    // 访问名单默认停在 ip 子表；收尾统一刷一次命中统计
    { tab: 3, hit: "pageForIp", allow: ["pageForIp", "policyHitCounts"] },
    // 灰度已拆成独立组件，刷新走它自己 expose 出来的 reload
    { tab: 4, hit: "pagePolicyConfig", allow: ["pagePolicyConfig"] },
    { tab: 5, hit: "listHeaderRules", allow: ["listHeaderRules", "policyHitCounts"] },
    // loadRoute = loadRouteTargets(已注册路由) + loadRoutePolicies(策略表)
    {
      tab: 6,
      hit: "listApiRouteTargets",
      allow: ["listApiRouteTargets", "pagePolicyConfig", "policyHitCounts"],
    },
  ] as const;

  it("7 个页签的刷新都打回自己的数据源", async () => {
    const w = mountPage();
    await settle(w);
    const nav = w.findAll(".policy-nav__item");
    expect(nav).toHaveLength(CASES.length);

    for (const c of CASES) {
      const label = `第 ${c.tab + 1} 个页签`;
      await nav[c.tab].trigger("click");
      await settle(w);

      // 只清调用记录，不动实现：clearAllMocks 不会重置 mockResolvedValue
      vi.clearAllMocks();

      const btn = w.find('.policy-hero__actions [data-icon="Refresh"]');
      expect(btn.exists(), `${label} 找不到顶部刷新按钮`).toBe(true);
      await btn.trigger("click");
      await waitFor(w, () => true);

      const called = Object.keys(api).filter((k) => api[k as keyof typeof api].mock.calls.length > 0);
      expect(called, `${label} 刷新没有调用 ${c.hit}（按钮是空操作）`).toContain(c.hit);

      const extra = called.filter((k) => !(c.allow as readonly string[]).includes(k));
      expect(extra, `${label} 刷新打到了不属于本页签的接口：${extra.join(", ")}`).toEqual([]);
    }
  });
});

/**
 * 回归：消息头表格有数据行时，行的「命中次数」列必须能渲染出来。
 *
 * <p>曾经的缺陷：{@code headerHitCount} 用了 {@code hitCountOf}，而 PolicyTask.vue
 * 从 {@code usePolicyHit()} 解构时漏了这一项。行插槽求值 → ReferenceError →
 * Vue 同步 patch 被中断 → nav 的高亮已经打好（nav 在 {@code <main>} 之前），
 * {@code <main>} 保留旧内容。表现是「侧栏切了、内容没换」，完全不像报错，
 * 浏览器里也没有任何提示。</p>
 *
 * <p>为什么以前测不出来：{@code beforeEach} 把 listHeaderRules mock 成空数组，
 * 没有行就永远不会求值行插槽里的 {@code headerHitCount}。所以这条用例的关键
 * 是**必须给一行真实数据**。</p>
 */
describe("策略任务 · 消息头行渲染", () => {
  it("有行时能算出并渲染命中次数（回归：hitCountOf 漏解构导致 patch 中断）", async () => {
    api.listHeaderRules.mockResolvedValue({
      data: [
        {
          sysPolicyConfigId: 306,
          headerName: "User-Agent",
          status: 1,
          remark: "默认·拦截爬虫与自动化客户端",
          parsed: true,
          matchType: "CONTAINS",
          patterns: ["Googlebot", "python-requests"],
          action: "BLOCK",
          blockStatus: 403,
        },
      ],
    });
    // 命中键 = `HEADER|{头名小写}|{特征原样}`（见 headerHitCount / hitKeyOf）
    api.policyHitCounts.mockResolvedValue({ data: { "HEADER|user-agent|Googlebot": 12 } });

    const w = mountPage();
    await settle(w);
    const nav = w.findAll(".policy-nav__item");
    // 06 消息头拦截
    await nav[5].trigger("click");
    // 等行出现而不是等固定轮数，理由同 renderRoutes
    await waitFor(w, () => w.findAll(".policy-hit-cell").length > 0);

    // 命中单元格渲染出来了 —— 它的 :count 正是 headerHitCount(row) 的返回值。
    // 断言值而不是只断言节点存在：值能出来才说明
    // 「mock 的命中数 → headerHitCount 加总 → PolicyHitCell」整条链是通的
    const cells = w.findAll(".policy-hit-cell");
    expect(cells, "消息头表格没有渲染出数据行（命中单元格缺失）").toHaveLength(1);
    expect(cells[0].text()).toBe("12");

    // 切走再切回来：曾经就是这一跳让内容卡在上一页
    await nav[0].trigger("click");
    await settle(w);
    expect(w.find(".policy-view h2").text()).toBe("policy.overview.chain");
    await nav[5].trigger("click");
    await waitFor(w, () => w.findAll(".policy-hit-cell").length > 0);
    expect(w.find(".policy-view h2").text()).toBe("policy.nav.header.label");
    expect(w.findAll(".policy-hit-cell"), "切回消息头后行丢了").toHaveLength(1);
  });
});
