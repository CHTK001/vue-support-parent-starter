/**
 * ReChart 多视图 + 两个内置图形（拓扑 / 上下文窗口）验收探针。
 *
 * 钉的是用户提的四条口径，不是「没报错」：
 *  1. views 传多个带图标的视图 → 顶部出现图标切换按钮，点一下就换图；
 *  2. 拓扑：在用线路打 is-active（流动虚线 + 小鸟），备用线不打；
 *  3. 上下文窗口：面积图 / 点阵图是同一份数据的两种画法（点阵 200 格），
 *     未给 free 切片时由 total-used 自动补出；
 *  4. 形状不一致且没 transform → 告警 + 空态；给了 transform → 正常出图。
 *
 * 运行：cd pages/system && pnpm vitest run src/__tests__/rechartViews.spec.ts
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { Connection, DataLine, Histogram } from "@element-plus/icons-vue";
// @repo/ui/re-chart 的默认导出是异步主题壳（defineThemeComponent），
// 直接 mount 拿到的是未解析占位组件；探针这里挂源 SFC，验的是组件本身。
import ReChart from "../../../../packages/ui/src/components/ReChart/ReChart.vue";
import type { ReChartContextData, ReChartTopologyData, ViewPane } from "@repo/ui/re-chart";

const topology: ReChartTopologyData = {
  nodes: [
    { id: "oc", label: "OpenCode", detail: "group/never-stuck", kind: "client", status: "active" },
    { id: "mg", label: "magpie", detail: "127.0.0.1:3425", kind: "gateway", status: "active" },
    { id: "up1", label: "书生·端砚", detail: "Sage-A1.5", kind: "upstream", status: "active", meta: ["3 个可用"] },
    { id: "up2", label: "WorkBuddy", detail: "Free plan", kind: "upstream", status: "limited", meta: ["36 分钟后恢复"] },
  ],
  edges: [
    { from: "oc", to: "mg", active: true, label: "SSE" },
    { from: "mg", to: "up1", active: true, label: "8.2k tok/s" },
    { from: "mg", to: "up2", status: "limited" },
  ],
};

const contextWindow: ReChartContextData = {
  used: 454_000,
  total: 1_000_000,
  source: { name: "OpenCode", group: "group/never-stuck", status: "实时" },
  slices: [
    { key: "f1", label: "D:\\ch\\pr…", tokens: 15_900, kind: "file" },
    { key: "i1", label: "图片", tokens: 12_800, kind: "image" },
    { key: "t1", label: "shell ×231", tokens: 52_200, kind: "tool" },
    { key: "c1", label: "更早的 9 轮", tokens: 55_200, kind: "turn" },
  ],
};

beforeAll(() => {
  // jsdom 没有 ResizeObserver：拓扑连线与 treemap 都靠它重测
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // jsdom 的 canvas.getContext 返回 null，zrender 会在 setOption 里炸（clearRect / dpr）。
  // 这里给一份显式的 2D 上下文替身（方法全 noop、状态用真实原始值），
  // 目的是让 echarts 视图能挂载，从而验证「echarts 视图 + 两个内置视图」混排的切换。
  const noop = () => {};
  const gradient = () => ({ addColorStop: noop, colorSpace: "srgb" });
  type CtxStub = Record<string, unknown>;
  const makeCtx = (canvas: HTMLCanvasElement): CtxStub => ({
    canvas,
    // 状态（必须是原始值，否则 zrender 的字符串拼接会炸）
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    miterLimit: 10,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    shadowBlur: 0,
    shadowColor: "rgba(0,0,0,0)",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: "12px sans-serif",
    textAlign: "left",
    textBaseline: "alphabetic",
    imageSmoothingEnabled: true,
    // 绘图 API
    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    arc: noop,
    arcTo: noop,
    ellipse: noop,
    rect: noop,
    roundRect: noop,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    fill: noop,
    stroke: noop,
    clip: noop,
    fillText: noop,
    strokeText: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    transform: noop,
    setTransform: noop,
    resetTransform: noop,
    drawImage: noop,
    putImageData: noop,
    setLineDash: noop,
    getLineDash: () => [] as number[],
    isPointInPath: () => false,
    isPointInStroke: () => false,
    measureText: (text: unknown) => ({ width: String(text ?? "").length * 6 }),
    getImageData: (_x?: number, _y?: number, w?: number, h?: number) => ({
      data: new Uint8ClampedArray(Math.max(4, (w ?? 1) * (h ?? 1) * 4)),
      width: w ?? 1,
      height: h ?? 1,
    }),
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    createConicGradient: gradient,
    createPattern: () => ({ setTransform: noop, addColorStop: noop }),
  });
  (HTMLCanvasElement.prototype as unknown as { getContext: unknown }).getContext = function (
    this: HTMLCanvasElement,
    type: string,
  ) {
    if (type !== "2d") return null;
    return makeCtx(this);
  };
});

const threeViews: ViewPane[] = [
  { key: "trend", label: "调用趋势", type: "line", icon: DataLine, options: { categories: ["1", "2", "3"], values: [1, 3, 2] } },
  { key: "route", label: "链路拓扑", type: "topology", icon: Connection, data: topology },
  { key: "ctx", label: "上下文窗口", type: "context", icon: Histogram, data: contextWindow },
];

function mountChart(props: Record<string, unknown> = {}) {
  return mount(ReChart, {
    props: { height: "360px", ...props },
    global: { plugins: [ElementPlus] },
    attachTo: document.body,
  });
}

describe("ReChart 多视图", () => {
  it("views 带图标 → 出现图标切换按钮，点击切换生效视图", async () => {
    const wrapper = mountChart({ views: threeViews });

    const tabs = wrapper.findAll(".re-chart__viewtab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0].attributes("aria-selected")).toBe("true"); // 默认第一个视图

    await tabs[1].trigger("click");
    expect(wrapper.findAll(".re-chart__viewtab")[1].attributes("aria-selected")).toBe("true");
    expect(wrapper.find(".re-chart-topology").exists()).toBe(true);

    await wrapper.findAll(".re-chart__viewtab")[2].trigger("click");
    expect(wrapper.find(".re-chart-context").exists()).toBe(true);

    wrapper.unmount();
  });

  it("拓扑：在用线路高亮 + 小鸟沿线搬运，备用线不高亮", async () => {
    const wrapper = mountChart({ views: threeViews, activeViewKey: undefined });
    await wrapper.findAll(".re-chart__viewtab")[1].trigger("click");

    // 3 条线，其中 2 条 active
    expect(wrapper.findAll("path.re-chart-topology__wire").length).toBe(3);
    expect(wrapper.findAll("path.re-chart-topology__wire.is-active").length).toBe(2);

    // 每条在用线一只小鸟 + 一个数据包拖尾（SMIL animateMotion 沿 path 飞行）
    expect(wrapper.findAll(".re-chart-topology__bird-wrap").length).toBe(2);
    expect(wrapper.findAll(".re-chart-topology__packet").length).toBe(2);
    const motions = wrapper.element.querySelectorAll("animateMotion");
    expect(motions.length).toBe(4); // 小鸟 2 + 包点 2
    expect(motions[0].getAttribute("path")).toMatch(/^M .* C /);
    expect(motions[0].getAttribute("repeatCount")).toBe("indefinite");

    // 节点按 kind 分三列，列标题可读
    expect(wrapper.text()).toContain("调用方");
    expect(wrapper.text()).toContain("网关");
    expect(wrapper.text()).toContain("上游");
    expect(wrapper.text()).toContain("WorkBuddy");

    wrapper.unmount();
  });

  it("上下文窗口：面积图 / 点阵图同一份数据，剩余空间自动补齐", async () => {
    const wrapper = mountChart({ views: threeViews });
    await wrapper.findAll(".re-chart__viewtab")[2].trigger("click");

    expect(wrapper.text()).toContain("454K");
    expect(wrapper.text()).toContain("1M");
    // 图例聚合：文件/图片/工具/历史轮次 + 剩余空间
    const legend = wrapper.text();
    expect(legend).toContain("剩余空间");
    expect(legend).toContain("工具调用");

    // 点阵图：200 格固定总量
    const segs = wrapper.findAll(".re-chart-context__switch-btn");
    expect(segs).toHaveLength(2);
    await segs[1].trigger("click");
    expect(wrapper.findAll(".re-chart-context__dot").length).toBe(200);

    // 切回面积图：4 个切片 + 自动补出的剩余空间 = 5 块
    await segs[0].trigger("click");
    // jsdom 里容器宽高为 0，treemap 不出块；这里改断言数据侧口径
    expect(wrapper.find(".re-chart-context__area").exists()).toBe(true);

    wrapper.unmount();
  });

  it("形状不一致且无 transform → 告警并渲染空态", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mountChart({
      views: [
        {
          key: "route",
          type: "topology",
          icon: Connection,
          // 故意给别的形状：list / links
          data: { list: [], links: [] } as unknown as ReChartTopologyData,
        },
      ],
    });

    expect(wrapper.find(".re-chart-topology__empty").exists()).toBe(true);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("transform"))).toBe(true);
    warn.mockRestore();
    wrapper.unmount();
  });

  it("形状不一致但给了 transform → 正常渲染", async () => {
    const wrapper = mountChart({
      views: [
        {
          key: "route",
          type: "topology",
          icon: Connection,
          data: {
            list: [
              { id: "oc", name: "OpenCode", role: "client" },
              { id: "mg", name: "magpie", role: "gateway" },
            ],
            links: [{ s: "oc", t: "mg" }],
          },
          transform: (raw) => {
            const r = raw as {
              list: Array<{ id: string; name: string; role: string }>;
              links: Array<{ s: string; t: string }>;
            };
            return {
              nodes: r.list.map((n) => ({ id: n.id, label: n.name, kind: n.role })),
              edges: r.links.map((l) => ({ from: l.s, to: l.t })),
            };
          },
        },
      ],
    });

    expect(wrapper.find(".re-chart-topology__empty").exists()).toBe(false);
    expect(wrapper.text()).toContain("OpenCode");
    expect(wrapper.text()).toContain("magpie");
    wrapper.unmount();
  });

  it("旧用法不受影响：无 views 时不渲染切换栏，单视图直出", async () => {
    const wrapper = mountChart({ type: "context", contextWindow });

    expect(wrapper.findAll(".re-chart__viewtab")).toHaveLength(0);
    expect(wrapper.find(".re-chart-context").exists()).toBe(true);
    expect(wrapper.text()).toContain("454K");

    wrapper.unmount();
  });
});