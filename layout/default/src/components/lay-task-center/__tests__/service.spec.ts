import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearTaskCenter,
  clearTaskCenterTriggerHandlers,
  configureTaskCenter,
  dismissTaskCenterTask,
  getTaskCenterTask,
  upsertTaskCenterTask,
  useTaskCenterState,
} from "../service";
import { resetOverlayStack, useOverlayStackState } from "../../lay-overlay-stack/service";

describe("task center service defaults", () => {
  beforeEach(() => {
    clearTaskCenter();
    clearTaskCenterTriggerHandlers();
    resetOverlayStack();
    configureTaskCenter({ maxVisible: 5, maxHistory: 80 });
  });

  it("uses maxVisible 5 and keeps autoClose disabled by default", () => {
    const taskId = upsertTaskCenterTask({
      id: "task-default",
      title: "默认任务",
    });

    const task = getTaskCenterTask(taskId);

    expect(useTaskCenterState().state.maxVisible).toBe(5);
    expect(useOverlayStackState().state.config.maxVisible).toBe(5);
    expect(task?.autoClose).toBe(false);
    expect(task?.overlayVisible).toBe(true);
    expect(useOverlayStackState().state.items[0]).toMatchObject({
      id: "task-default",
      source: "task-center",
      title: "默认任务",
    });
  });

  it("notifies onTrigger when task state changes", () => {
    const onTrigger = vi.fn();
    configureTaskCenter({ onTrigger });

    upsertTaskCenterTask({
      id: "task-trigger",
      title: "触发通知任务",
    });
    dismissTaskCenterTask("task-trigger");

    expect(onTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "add",
        taskId: "task-trigger",
      }),
    );
    expect(onTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "dismiss",
        taskId: "task-trigger",
      }),
    );
  });

  it("includes persistence fields in onTrigger payload", () => {
    const onTrigger = vi.fn();
    configureTaskCenter({ onTrigger });

    upsertTaskCenterTask({
      id: "task-persist",
      title: "持久化任务",
      bizType: "server-install",
      bizId: 1001,
      operator: "codex",
      traceId: "trace-001",
      persistKey: "install:1001",
    });

    expect(onTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "add",
        taskId: "task-persist",
        eventId: expect.any(String),
        persist: {
          bizType: "server-install",
          bizId: 1001,
          operator: "codex",
          traceId: "trace-001",
          persistKey: "install:1001",
        },
      }),
    );
  });
});
