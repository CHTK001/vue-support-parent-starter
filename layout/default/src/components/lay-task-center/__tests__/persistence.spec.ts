import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTaskCenter,
  clearTaskCenterTriggerHandlers,
  configureTaskCenter,
  upsertTaskCenterTask,
} from "../service";
import {
  clearTaskCenterPersistRecords,
  persistTaskCenterTrigger,
  useTaskCenterPersistState,
} from "../persistence";

describe("task center persistence", () => {
  beforeEach(() => {
    clearTaskCenter();
    clearTaskCenterTriggerHandlers();
    clearTaskCenterPersistRecords();
  });

  it("stores trigger records locally when onTrigger persists them", () => {
    configureTaskCenter({
      onTrigger: persistTaskCenterTrigger,
    });

    upsertTaskCenterTask({
      id: "task-record",
      title: "记录任务",
      bizType: "server",
      bizId: 1,
      persistKey: "server:1",
    });

    expect(useTaskCenterPersistState().state.records[0]).toMatchObject({
      type: "add",
      taskId: "task-record",
      persist: {
        bizType: "server",
        bizId: 1,
        persistKey: "server:1",
      },
    });
  });
});
