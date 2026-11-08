/**
 * ReSplitLayout 面板拖拽重排序（`movePanel`）验收
 *
 * <p>模拟真实浏览器行为：在源面板拖拽手柄上按下，在目标面板的标签栏上松手，
 * 看 `change` 抛出的布局树是否已经重排序，DOM 里面板的先后顺序是否一致，
 * 大小比是否绑在移动的节点上</p>
 *
 * @author CH (auto-generated acceptance test)
 * @since 2026-11-06
 */
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import ReSplitLayout, { type PanelTab, type PanelNode, type SplitNode } from "@repo/ui/re-split-layout";

/* ---- 布局构造 ---- */

const tab = (id: string, label: string): PanelTab => ({ id, label, closable: true });

const makeLayout = (panelIds: string[]): SplitNode => ({
  type: "split",
  direction: "horizontal",
  sizes: panelIds.map(() => 100 / panelIds.length),
  children: panelIds.map((id) => ({
    type: "panel",
    id,
    tabs: [tab(`${id}-tab`)],
    activeTabId: `${id}-tab`,
  })),
});

/** 同步展开：跨嵌套 split 时递归展开 */
const panelOrder = (node: SplitNode): string => {
  const out: string[] = [];
  node.children.forEach((child) => {
    if ((child as unknown as PanelNode).type === "panel") out.push((child as unknown as PanelNode).id);
    else out.push(panelOrder(child));
  });
  return out.join(",");
};

const metrics = (layout: SplitNode) => ({ order: panelOrder(layout), sizes: layout.sizes.join(",") });

/* ---- mount ---- */

const mountLayout = (layout: SplitNode) => {
  const emits: unknown[] = [];
  const Harness = defineComponent({
    props: { layout: { type: Object as () => SplitNode, required: true } },
    setup(props) {
      return () =>
        h(ReSplitLayout, { defaultLayout: props.layout, onChange: (p: SplitNode) => emits.push(p) }, {
          panel: (arg: { activeTab: PanelTab; panel: { id: string } }) =>
            h("div", { class: "panel-session", "data-session": arg.activeTab.id }, `session ${arg.activeTab.id}`),
        });
    },
  });
  const wrapper = mount(Harness, { props: { layout } });
  return { wrapper, emits };
};

/* ---- 拖拽驱动 ---- */

/**
 * 把 `sourceId` 面板拖到第 `barIndex` 号面板的标签栏上（拖动落点 = 标签栏 = 插前）
 */
const dropOnBar = (wrapper: ReturnType<typeof mountLayout>["wrapper"], sourceId: string, barIndex: number) => {
  const dataTransfer = makeDataTransfer();
  dataTransfer.setData("application/json", JSON.stringify({ type: "panel", panelId: sourceId }));

  const bar = wrapper.element.querySelectorAll(".panel-tab-bar")[barIndex] as HTMLElement;
  bar.dispatchEvent(makeDragEvent("dragover", dataTransfer));
  bar.dispatchEvent(makeDragEvent("drop", dataTransfer));
};

const dragAndDrop = (wrapper: ReturnType<typeof mountLayout>["wrapper"], sourceId: string, barIndex: number) => {
  const handle = wrapper.element.querySelector(
    `.layout-panel[data-panel-id="${sourceId}"] > .panel-tab-bar > .panel-drag-handle`,
  ) as HTMLElement;
  const dataTransfer = makeDataTransfer();
  dataTransfer.setData("application/json", JSON.stringify({ type: "panel", panelId: sourceId }));
  handle.dispatchEvent(makeDragEvent("dragstart", dataTransfer));
  dropOnBar(wrapper, sourceId, barIndex);
};

const lastPayload = (emits: unknown[]): SplitNode => (emits.length ? (emits[emits.length - 1] as SplitNode) : undefined);

/* ---- 在 jsdom 里拼装事件（DragEvent/DataTransfer 均不存在） ---- */

const makeDataTransfer = (): DataTransfer => {
  const map: Record<string, string> = {};
  const dt: any = {
    effect: "move",
    setData: (format: string, value: string) => {
      map[format] = value;
    },
    getData: (format: string) => map[format] ?? "",
    setDragImage: () => {},
  };
  Object.defineProperty(dt, "effectAllowed", { get: () => dt.effect, set: (v) => {
    dt.effect = v;
  } });
  Object.defineProperty(dt, "dropEffect", { get: () => dt.effect, set: (v) => {
    dt.effect = v;
  } });
  return dt as unknown as DataTransfer;
};

const makeDragEvent = (type: string, dataTransfer: DataTransfer) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  return event as unknown as DragEvent;
};

/* ---- 场景 ---- */

describe("ReSplitLayout panel reorder via handle", () => {
  test("B 拖到 A 左侧 → 布局变为 B,A", async () => {
    const { wrapper, emits } = mountLayout(makeLayout(["panel-a", "panel-b"]));
    try {
      dragAndDrop(wrapper, "panel-b", 0);
      await wrapper.vm.$nextTick();
    } finally {
      wrapper.unmount();
    }
    expect(emits.length).toBeGreaterThanOrEqual(1);
    expect(metrics(lastPayload(emits) as SplitNode)).toEqual(metrics(makeLayout(["panel-b", "panel-a"])));
    expect(panelOrderDom(wrapper)).toBe("panel-b,panel-a");
  });

  test("C 拖到 A 左侧 → A,B,C 变成 C,A,B", async () => {
    const { wrapper, emits } = mountLayout(makeLayout(["panel-a", "panel-b", "panel-c"]));
    try {
      dragAndDrop(wrapper, "panel-c", 0);
      await wrapper.vm.$nextTick();
    } finally {
      wrapper.unmount();
    }
    expect(emits.length).toBeGreaterThanOrEqual(1);
    expect(metrics(lastPayload(emits) as SplitNode)).toEqual(metrics(makeLayout(["panel-c", "panel-a", "panel-b"])));
    expect(panelOrderDom(wrapper)).toBe("panel-c,panel-a,panel-b");
  });

  test("C 拖到 B 左侧 → A,C,B", async () => {
    const { wrapper, emits } = mountLayout(makeLayout(["panel-a", "panel-b", "panel-c"]));
    try {
      dragAndDrop(wrapper, "panel-c", 1);
      await wrapper.vm.$nextTick();
    } finally {
      wrapper.unmount();
    }
    expect(emits.length).toBeGreaterThanOrEqual(1);
    expect(metrics(lastPayload(emits) as SplitNode)).toEqual(metrics(makeLayout(["panel-a", "panel-c", "panel-b"])));
    expect(panelOrderDom(wrapper)).toBe("panel-a,panel-c,panel-b");
  });

  test("拖回自己（源=目标 A）不抛 change", () => {
    const { wrapper, emits } = mountLayout(makeLayout(["panel-a", "panel-b"]));
    try {
      dragAndDrop(wrapper, "panel-a", 0);
    } finally {
      wrapper.unmount();
    }
    expect(emits.length).toBe(0);
    expect(panelOrderDom(wrapper)).toBe("panel-a,panel-b");
  });

  test("拖拽手柄 + 面板内容有 2 对 2", () => {
    const { wrapper } = mountLayout(makeLayout(["panel-a", "panel-b"]));
    try {
      expect(wrapper.element.querySelectorAll(".panel-drag-handle").length).toBe(2);
      expect(wrapper.element.querySelectorAll(".panel-session").length).toBe(2);
    } finally {
      wrapper.unmount();
    }
  });
});

/** 以 DOM 先后顺序反映布局树顺序 */
const panelOrderDom = (wrapper: ReturnType<typeof mountLayout>["wrapper"]): string =>
  Array.from(wrapper.element.querySelectorAll(".layout-panel"))
    .map((el) => (el as HTMLElement).getAttribute("data-panel-id"))
    .filter(Boolean)
    .join(",");
