/**
 * 上下文窗口交互验收探针（ReChart type="context"）。
 *
 * 钉的是本轮提的五条口径：
 *  1. 悬停一块 → 同组（同 kind）保持清晰，其余类别虚化（is-dim）；
 *  2. 块内文字色被压深到可读范围（不是直接用浅色品类色）；
 *  3. 悬停浮层给出完整详情（类别 / 占用 / 占窗口 / 占已用），不依赖原生 title；
 *  4. 点击块直接在下方摊开「全部切片」，不弹对话框；再点收起；
 *  5. clickToExpand=false 时图只读。
 *
 * 运行：cd pages/system && pnpm vitest run src/__tests__/contextWindowChart.spec.ts
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ReChart from "../../../../packages/ui/src/components/ReChart/ReChart.vue";
import type { ReChartContextData } from "@repo/ui/re-chart";

/** 5 个切片：两个 file（同组）、一个 image、一个 tool，外加自动补出的剩余空间 */
const data: ReChartContextData = {
  used: 400_000,
  total: 1_000_000,
  slices: [
    { key: "f1", label: "a.ts", tokens: 120_000, kind: "file" },
    { key: "f2", label: "b.vue", tokens: 80_000, kind: "file" },
    { key: "i1", label: "截图", tokens: 60_000, kind: "image" },
    { key: "t1", label: "shell ×12", tokens: 140_000, kind: "tool" },
  ],
};

beforeAll(() => {
  // jsdom 没有布局：不 stub 尺寸 treemap 一个块都算不出来
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 640,
    height: 220,
    top: 0,
    left: 0,
    right: 640,
    bottom: 220,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
});

function mountChart(props: Record<string, unknown> = {}) {
  return mount(ReChart, {
    props: { type: "context", contextWindow: data, height: "280px", ...props },
    global: { stubs: { ContextModeIcon: true } },
  });
}

describe("上下文窗口交互", () => {
  it("悬停一块：同 kind 保持清晰，其余类别虚化", async () => {
    const wrapper = mountChart();
    await nextTick();
    await nextTick();

    const cells = wrapper.findAll(".re-chart-context__cell");
    expect(cells.length).toBe(5);

    // 按 data-key 取：布局按 token 降序，剩余空间（600K）才是第一块
    await wrapper.find('[data-key="f1"]').trigger("mouseenter");
    await nextTick();

    const dimmed = wrapper.findAll(".re-chart-context__cell.is-dim");
    const clear = wrapper.findAll(".re-chart-context__cell:not(.is-dim)");
    // 同组的另一块保持清晰：总共 5 块，虚化的应是 image / tool / free 三块
    expect(dimmed.length).toBe(3);
    expect(clear.length).toBe(2);
    expect(wrapper.find('[data-key="f2"]').classes()).not.toContain("is-dim");

    wrapper.unmount();
  });

  it("块内文字色被压深（不是浅色品类色），保证对比度", async () => {
    const wrapper = mountChart();
    await nextTick();
    await nextTick();

    const cell = wrapper.find('[data-key="f1"]');
    const color = (cell.element as HTMLElement).style.color;
    // readableTextColor 输出 rgb(...)，且相对亮度应压到 0.45 以下
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
    expect(m).not.toBeNull();
    const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])].map((v) => v / 255);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    expect(lum).toBeLessThan(0.45);

    wrapper.unmount();
  });

  it("悬停浮层给出完整详情（四行）", async () => {
    const wrapper = mountChart();
    await nextTick();
    await nextTick();

    await wrapper.find('[data-key="f1"]').trigger("mouseenter");
    await nextTick();

    const tip = wrapper.find(".re-chart-context__tip");
    expect(tip.exists()).toBe(true);
    const text = tip.text();
    expect(text).toContain("a.ts");
    expect(text).toContain("文件");
    expect(text).toContain("占窗口");
    expect(text).toContain("占已用");

    wrapper.unmount();
  });

  it("点击块在下方摊开全部切片，再点收起（不弹窗）", async () => {
    const wrapper = mountChart();
    await nextTick();
    await nextTick();

    expect(wrapper.find(".re-chart-context__detail").exists()).toBe(false);
    await wrapper.find('[data-key="f1"]').trigger("click");
    await nextTick();

    const detail = wrapper.find(".re-chart-context__detail");
    expect(detail.exists()).toBe(true);
    // 5 个切片全部列出（含剩余空间）
    expect(wrapper.findAll(".re-chart-context__detail-item").length).toBe(5);

    await wrapper.find('[data-key="f1"]').trigger("click");
    await nextTick();
    expect(wrapper.find(".re-chart-context__detail").exists()).toBe(false);

    wrapper.unmount();
  });

  it("clickToExpand=false 时图只读：点击不展开", async () => {
    const wrapper = mountChart({ contextClickToExpand: false });
    await nextTick();
    await nextTick();

    await wrapper.find('[data-key="f1"]').trigger("click");
    await nextTick();
    expect(wrapper.find(".re-chart-context__detail").exists()).toBe(false);

    wrapper.unmount();
  });
});
