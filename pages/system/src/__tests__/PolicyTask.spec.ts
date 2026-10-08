/**
 * 策略控制台页面（PolicyTask.vue）组件测试
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
    // PolicyOverviewTab.vue 的流水线第 4 节点用它
    "CircleCheck",
    // PolicyRateLimitTab.vue 的「全局闸门已关闭」横幅用它
    "WarningFilled",
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

describe("策略控制台 · 页签", () => {
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

describe("策略控制台 · 接口管控有效状态（action × status）", () => {
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

  /**
   * 取出接口管控表格第一行的**派生字段**
   *
   * <p>为什么不直接断言渲染出来的标签文案：{@code effectiveText} 是包在
   * {@code <ReTag>} 里的，而 ReTag 内部又依赖 element-plus 的 ElTag。
   * 这条链上任何一环在测试环境里没解析到，整段就渲染成 {@code <!---->}，
   * 标签里的文案随之消失 —— 2026-09-29 就在大改完文件、机器同时重编 10 个文件时
   * 偶发过一次（{@code transform} 33s）。断言渲染字符串等于把这份测试的稳定性
   * 押在那条链上。</p>
   *
   * <p>改成读表格桩持有的行数据：<b>与渲染无关、更稳定，而且更直接</b> ——
   * 验的就是 {@code effectiveStateOf(action, status)} 这个真正要守的逻辑本身，
   * 标签长什么样是另一回事（浏览器里验）。</p>
   *
   * @param w 挂载结果
   * @returns 第一行的派生字段
   */
  function firstRow(w: ReturnType<typeof mountPage>): Record<string, unknown> {
    const table = w.findComponent({ name: "ReTable" });
    const rows = (table.vm as unknown as { rows: Array<Record<string, unknown>> }).rows;
    expect(rows.length, "接口管控表格没有数据行").toBeGreaterThan(0);
    return rows[0];
  }

  it("规则停用：接口实际已放行，状态必须是「未生效」而不是「已拦截」", async () => {
    const w = await renderRoutes(
      [routeTarget("/v2/demo")],
      [routePolicy("/v2/demo", "DISABLE", 0)],
    );
    const row = firstRow(w);
    expect(row.effectiveText).toBe("policy.route.stateInactive");
    expect(row.effectiveTagType).toBe("info");
    // 白话说明是包在普通 span 里的，可以直接断渲染文本
    expect(w.text()).toContain("policy.route.stateNoteInactive");
    // 关键回归：不能显示成「已拦截」，否则用户会以为没生效而反复点开关
    expect(row.effectiveText).not.toBe("policy.route.stateBlocked");
  });

  it("规则启用 + 停用动作：状态是「已拦截」，说明里带响应码", async () => {
    const w = await renderRoutes(
      [routeTarget("/v2/demo")],
      [routePolicy("/v2/demo", "DISABLE", 1)],
    );
    const row = firstRow(w);
    expect(row.effectiveText).toBe("policy.route.stateBlocked");
    expect(row.effectiveTagType).toBe("danger");
    expect(w.text()).toContain('policy.route.stateNoteBlocked#{"code":"503"}');
    expect(row.effectiveText).not.toBe("policy.route.stateInactive");
  });

  it("转发动作：状态是「已转发」", async () => {
    const w = await renderRoutes(
      [routeTarget("/v2/demo")],
      [routePolicy("/v2/demo", "FORWARD", 1)],
    );
    const row = firstRow(w);
    expect(row.effectiveText).toBe("policy.route.stateForwarded");
    expect(row.effectiveTagType).toBe("warning");
    expect(w.text()).toContain("policy.route.stateNoteForwarded");
    expect(row.effectiveText).not.toBe("policy.route.stateBlocked");
  });

  it("没有配置规则的路由：状态是「未配置」，且不显示启停开关", async () => {
    const w = await renderRoutes([routeTarget("/v2/plain")], []);
    // 先钉住「表格确实出行了」。这条用例原本全是反向断言（不包含 xxx / 元素不存在），
    // 表格空的时候它们会**全部通过** —— 看着绿，其实什么都没验。
    expect(w.text(), "接口管控表格没有渲染出数据行").toContain("/v2/plain");
    const row = firstRow(w);
    // 「未配置」既是 effectiveText，也出现在 #status 的 v-else 分支（普通 span）
    expect(row.effectiveText).toBe("policy.common.notConfigured");
    expect(row.effectiveTagType).toBe("info");
    const text = w.text();
    expect(text).toContain("policy.common.notConfigured");
    expect(text).toContain("policy.route.stateNoteUnconfigured");
    // 未配置的行没有 policyId，#status 插槽走 v-else 分支，不该有开关
    expect(w.find(".policy-route-status").exists()).toBe(false);
  });

  it("只有策略、没有注册路由的自定义路径也要出现在列表里", async () => {
    const w = await renderRoutes([], [routePolicy("/v2/custom", "DISABLE", 1, 9)]);
    expect(firstRow(w).path).toBe("/v2/custom");
    expect(firstRow(w).registered).toBe(false);
    expect(firstRow(w).effectiveText).toBe("policy.route.stateBlocked");
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
describe("策略控制台 · 顶部刷新按当前页签分发", () => {
  /**
   * tab   —— 导航项下标（与 policy-nav__item 顺序一致）
   * hit   —— 刷新后必须被调到的接口，挑的是这一页签**独有**的那个，
   *          避免「总览和热更新都调 listHotReload」这种区分不开的组合
   * allow —— 这一页签刷新时允许出现的接口白名单。
   *          断言「实际调用的 ⊆ 白名单」比断言某几个接口「没被调」更严：
   *          旧缺陷正是分支漏写后落进「访问名单」，白名单会当场多出 pageForIp。
   */
  const CASES = [
    // loadOverview：一次 allSettled 打 7 个读接口，没有独立的「统计」接口。
    // getRateLimitGlobal 也在其中：总览要显示「N/M 条已启用 · 全局已关闭，都不生效」，
    // 就必须知道全局闸门，否则只数规则自己的开关会谎报限流在跑。
    {
      tab: 0,
      hit: "pageForAccountBw",
      allow: ["listHotReload", "listRateLimit", "pageForIp", "pageForAccountBw", "getRateLimitGlobal"],
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
describe("策略控制台 · 消息头行渲染", () => {
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

/**
 * 全局限流闸门 vs 规则自身开关：「生不生效」必须说得清。
 *
 * <p>缺陷：{@code rateEnabled} 只数规则自己的 {@code enabled === 1}，完全不知道
 * {@code getRateLimitGlobal} 那道闸门。闸门关着时（线上就是这个状态），
 * 总览仍然写「1/1 条已启用」，读者会以为限流正在跑；限流页签的「运行状态」列
 * 也只有一个裸开关，更看不出这一条其实不生效。唯一的解释在全局配置弹窗里，
 * 而那个弹窗要主动点开才看得到。</p>
 *
 * <p>用例要点：必须**真的给一条 enabled=1 的规则**。规则为空时
 * 「0/0 条已启用」和「都不生效」看上去一样，断言会假绿。</p>
 */
describe("策略控制台 · 全局限流闸门的「生不生效」说明", () => {
  /** 一条启用中的接口维度规则。
   *
   * <p>按维度区分返回值：{@code loadOverview} 会把 interface / ip / account 三个维度
   * 各拉一次，若三个都返回同一条，总数会变成 3，断言就得跟着这个假象写。</p>
   */
  function oneEnabledRule(): void {
    api.listRateLimit.mockImplementation((dimension: string) =>
      Promise.resolve({
        data:
          dimension === "interface"
            ? [{ sysRateLimitRuleId: 1, dimension: "interface", target: "/v2/user/page", qps: 100, burstSize: 200, enabled: 1 }]
            : [],
      }),
    );
  }

  /** 流水线第 2 个节点（流量限流）下面那行小字 */
  function rateNodeText(w: ReturnType<typeof mountPage>): string {
    return w.findAll(".policy-node")[1].find("small").text();
  }

  it("闸门关闭：总览的数字带上「都不生效」限定", async () => {
    oneEnabledRule();
    api.getRateLimitGlobal.mockResolvedValue({ data: { enabled: false, qps: 100 } });

    const w = mountPage();
    await settle(w);
    await waitFor(w, () => w.findAll(".policy-node").length === 4);

    const text = rateNodeText(w);
    expect(text, "总览仍在用不带限定的「已启用」文案").toContain("policy.overview.rateCountGlobalOff");
    expect(text).not.toBe("policy.overview.rateCount#{\"enabled\":1,\"total\":1}");
  });

  it("闸门开启：总览回到普通「已启用」文案", async () => {
    oneEnabledRule();
    api.getRateLimitGlobal.mockResolvedValue({ data: { enabled: true, qps: 100 } });

    const w = mountPage();
    await settle(w);
    await waitFor(w, () => w.findAll(".policy-node").length === 4);

    const text = rateNodeText(w);
    expect(text).toBe('policy.overview.rateCount#{"enabled":1,"total":1}');
    expect(text, "闸门开着就不该再显示「都不生效」").not.toContain("rateCountGlobalOff");
  });

  it("闸门关闭：限流页签出现白话提示", async () => {
    oneEnabledRule();
    api.getRateLimitGlobal.mockResolvedValue({ data: { enabled: false } });

    const w = mountPage();
    await settle(w);
    await w.findAll(".policy-nav__item")[2].trigger("click");
    await settle(w);
    await waitFor(w, () => w.find(".policy-view h2").text() === "policy.nav.ratelimit.label");

    const notice = w.find(".policy-gate-off-notice");
    expect(notice.exists(), "全局关着却没有任何「都不生效」的提示").toBe(true);
    expect(notice.text()).toContain("policy.rate.globalOffNotice");
  });

  it("闸门开启：限流页签不再显示该提示（反向断言配正向锚点）", async () => {
    oneEnabledRule();
    api.getRateLimitGlobal.mockResolvedValue({ data: { enabled: true } });

    const w = mountPage();
    await settle(w);
    await w.findAll(".policy-nav__item")[2].trigger("click");
    await settle(w);
    await waitFor(w, () => w.find(".policy-view h2").text() === "policy.nav.ratelimit.label");

    // 正向锚点：先证明限流页签真的渲染出来了。
    // 没有它，「提示不存在」这条反向断言在整页渲染失败时也会绿 —— 空表格时必假绿。
    expect(w.find(".policy-list-head h3").exists(), "限流页签没渲染出来").toBe(true);
    expect(w.findAll(".re-row").length, "限流表格没有数据行").toBe(1);
    expect(w.find(".policy-gate-off-notice").exists(), "闸门开着还在显示「都不生效」").toBe(false);
  });
});

/**
 * 访问名单的搜索过滤。
 *
 * <p>覆盖的是页面自己的那部分责任：{@code handleIpSearch} / {@code handleIpReset}
 * 把过滤区草稿值搬进查询对象，以及 {@code v-model:search-model} 的接线。
 * 浏览器验不了这块 —— browser.type 报 ok，但工具不暴露 input 的 value，
 * 「输入到底进没进去」无法确认（2026-09-29 实测）。</p>
 *
 * <p>为什么这几个分支值得单测：{@code handleIpSearch} 里有两处容易写错的转换 ——
 * {@code .trim() || undefined}（空白串要变成 undefined 而不是空串，否则后端
 * 收到 {@code sysIpIp: ""} 会被当成「精确匹配空串」而不是「不过滤」），
 * 以及下拉值必须保持数字类型（DOM 的 value 永远是字符串，
 * 不还原成 0/1 就会把「黑名单」查成查不到）。</p>
 */
describe("策略控制台 · 访问名单搜索过滤", () => {
  /** 切到访问名单页签并等表格就绪 */
  async function openBw() {
    const w = mountPage();
    await settle(w);
    await w.findAll(".policy-nav__item")[3].trigger("click");
    await settle(w);
    await waitFor(w, () => w.find(".policy-view h2").text() === "policy.nav.blackwhite.label");
    return w;
  }

  /** 某张表里的过滤项控件（data-filter-key 定位，避开同名控件） */
  function filterOf(w: ReturnType<typeof mountPage>, key: string, kind: "input" | "select" = "input") {
    return w.find(`.re-search-filter[data-filter-key="${key}"] .re-search-filter__${kind}`);
  }

  /** 过滤区里最后点搜索后，pageForIp 收到的查询参数 */
  async function searchAndReadQuery(w: ReturnType<typeof mountPage>): Promise<Record<string, unknown>> {
    await w.find(".re-search-query-btn").trigger("click");
    await settle(w);
    const calls = api.pageForIp.mock.calls;
    expect(calls.length, "点搜索后没有重新查询").toBeGreaterThan(0);
    return (calls[calls.length - 1][0] ?? {}) as Record<string, unknown>;
  }

  it("IP 过滤：输入值原样进入查询，且回到第一页", async () => {
    const w = await openBw();
    vi.clearAllMocks();

    await filterOf(w, "sysIpIp").setValue("203.0.113");
    const q = await searchAndReadQuery(w);
    expect(q.sysIpIp).toBe("203.0.113");
    expect(q.page, "换了过滤条件却停在旧页码").toBe(1);
  });

  it("IP 过滤：首尾空白被裁掉", async () => {
    const w = await openBw();
    vi.clearAllMocks();

    await filterOf(w, "sysIpIp").setValue("  192.0.2.88  ");
    const q = await searchAndReadQuery(w);
    expect(q.sysIpIp).toBe("192.0.2.88");
  });

  it("IP 过滤：只有空白时变成 undefined，而不是空串", async () => {
    const w = await openBw();
    vi.clearAllMocks();

    await filterOf(w, "sysIpIp").setValue("   ");
    const q = await searchAndReadQuery(w);
    // 空串会让后端按「IP 等于空串」精确匹配，返回空列表；这与「不过滤」不是一回事
    expect(q.sysIpIp, "纯空白被当成了过滤条件").toBeUndefined();
  });

  it("IP 过滤：下拉的 0 必须保持数字，不能变成字符串", async () => {
    const w = await openBw();
    vi.clearAllMocks();

    // 白名单=0 是 falsy，`value || undefined` 这类写法会把它吃掉 —— 这里钉住类型
    await filterOf(w, "sysIpType", "select").setValue("0");
    const q = await searchAndReadQuery(w);
    expect(q.sysIpType, "白名单(0)被丢成了 undefined").toBe(0);
  });

  it("重置：清空全部过滤条件并回到第一页", async () => {
    const w = await openBw();
    // 先搜出有过滤条件的查询对象
    await filterOf(w, "sysIpIp").setValue("203.0.113");
    await filterOf(w, "sysIpStatus", "select").setValue("1");
    await searchAndReadQuery(w);
    vi.clearAllMocks();

    await w.find(".re-search-reset-btn").trigger("click");
    await settle(w);
    const calls = api.pageForIp.mock.calls;
    expect(calls.length, "点重置后没有重新查询").toBeGreaterThan(0);
    const q = (calls[calls.length - 1][0] ?? {}) as Record<string, unknown>;
    expect(q.sysIpIp, "重置后 IP 过滤没清掉").toBeUndefined();
    expect(q.sysIpStatus, "重置后状态过滤没清掉").toBeUndefined();
    expect(q.page).toBe(1);
  });

  it("账号子表：过滤条件进的是账号接口，不是 IP 接口", async () => {
    const w = await openBw();
    // 切到账号子表（真实 ReTab 渲染，文案走 i18n 键）
    const accountTab = w.findAll(".policy-subnav *").find((n) => n.text() === "policy.nav.bw.account");
    expect(accountTab.exists(), "找不到账号子表页签").toBe(true);
    await accountTab!.trigger("click");
    await settle(w);
    await waitFor(w, () => filterOf(w, "account").exists());
    vi.clearAllMocks();

    await filterOf(w, "account").setValue("admin");
    await w.find(".re-search-query-btn").trigger("click");
    await settle(w);
    const calls = api.pageForAccountBw.mock.calls;
    expect(calls.length, "账号子表点搜索后没有重新查询").toBeGreaterThan(0);
    const q = (calls[calls.length - 1][0] ?? {}) as Record<string, unknown>;
    expect(q.account).toBe("admin");
    // 反向锚点：IP 接口不该被账号子表的搜索带动
    expect(api.pageForIp).not.toHaveBeenCalled();
  });
});
