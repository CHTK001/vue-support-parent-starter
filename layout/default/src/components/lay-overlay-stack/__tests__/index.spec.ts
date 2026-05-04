import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LayOverlayStack from "../index.vue";
import {
  configureOverlayStack,
  resetOverlayStack,
  upsertOverlayStackItem,
  useOverlayStackState,
} from "../service";

describe("LayOverlayStack", () => {
  beforeEach(() => {
    resetOverlayStack();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetOverlayStack();
  });

  it("closes the oldest overlay first when maxVisible is exceeded", async () => {
    configureOverlayStack({ maxVisible: 5 });

    mount(LayOverlayStack, {
      global: {
        stubs: {
          Teleport: true,
          IconifyIconOnline: true,
        },
      },
    });

    Array.from({ length: 6 }, (_, index) =>
      upsertOverlayStackItem({
        id: `task-${index + 1}`,
        title: `任务 ${index + 1}`,
        createdAt: index + 1,
      }),
    );

    await nextTick();

    expect(useOverlayStackState().state.items).toHaveLength(5);
    expect(
      useOverlayStackState().state.items.some((item) => item.id === "task-1"),
    ).toBe(false);
  });

  it("removes the item when autoClose is enabled", async () => {
    vi.useFakeTimers();

    mount(LayOverlayStack, {
      global: {
        stubs: {
          Teleport: true,
          IconifyIconOnline: true,
        },
      },
    });

    upsertOverlayStackItem({
      id: "task-auto",
      title: "自动关闭任务",
      autoClose: true,
      autoCloseDelay: 1200,
    });

    await nextTick();
    vi.advanceTimersByTime(1200);
    await nextTick();

    expect(useOverlayStackState().state.items).toHaveLength(0);
  });

  it("renders overlay details collapsed by default and expands on toggle", async () => {
    const wrapper = mount(LayOverlayStack, {
      global: {
        stubs: {
          Teleport: true,
          IconifyIconOnline: true,
        },
      },
    });

    upsertOverlayStackItem({
      id: "task-detail",
      title: "详情默认折叠任务",
      timestamp: 1777280000000,
      latestMessage: "任务日志摘要",
    });

    await nextTick();

    expect(wrapper.find(".overlay-stack-detail.is-collapsed").exists()).toBe(
      true,
    );
    expect(wrapper.find(".overlay-stack-detail-summary").exists()).toBe(true);
    expect(wrapper.find(".overlay-stack-detail-panel").exists()).toBe(false);

    await wrapper.find(".overlay-stack-icon-btn").trigger("click");
    await nextTick();

    expect(wrapper.find(".overlay-stack-detail.is-collapsed").exists()).toBe(
      false,
    );
    expect(wrapper.find(".overlay-stack-detail-panel").exists()).toBe(true);
  });
});
