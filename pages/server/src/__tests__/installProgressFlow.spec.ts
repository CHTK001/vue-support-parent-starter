/**
 * 软件安装进度 → 浮层 的行为门禁
 *
 * <p>{@code installProgress.spec.ts} 钉住的是「帧怎么归一」，本文件钉住的是
 * 「归一后的帧怎么进浮层」。两者分开放，因为这里要模拟 socket 分发：
 * 用假的 {@code getGlobalSocketService} 捕获 subscribe 的 handler，
 * 再手动把帧喂进去，观察 {@link getProcessTasks} 里的任务怎么变。</p>
 *
 * <p>为什么必须真跑一遍而不是只扫源码：只扫源码时「任务进没进数组」「重复帧有没有
 * 写两行日志」「关掉后再来一帧会不会重建」都验证不到，而这些恰恰是用户唯一能看见的
 * 东西。编译通过 + 源码里有那行字符串，不等于跑起来是对的。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

/** 假 socket 捕获到的订阅 */
interface Captured {
  module: string;
  event: string;
  handler: (msg: unknown) => void;
}

const captured = vi.hoisted(() => ({ list: [] as Captured[] }));

/**
 * 替换全局 socket 服务
 *
 * <p>只 mock {@code @repo/core} 的取实例函数：订阅逻辑本身是被测对象，
 * 不能被 mock 掉，否则等于自己给自己发奖状。</p>
 */
vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/core")>();
  const fakeSocket = {
    protocol: "socketio",
    subscribe: (module: string, event: string, handler: (msg: unknown) => void) => {
      captured.list.push({ module, event, handler });
      return () => {
        const index = captured.list.findIndex(item => item.handler === handler);
        if (index >= 0) {
          captured.list.splice(index, 1);
        }
      };
    },
  };
  return {
    ...actual,
    getGlobalSocketService: () => fakeSocket as unknown,
  };
});

import {
  ensureInstallProgressSubscription,
  getProcessTasks,
  removeTask,
} from "../utils/processTasks";
import { INSTALL_EVENT, INSTALL_MODULE, INSTALL_TASK_PREFIX } from "../utils/installProgress";

/** 后端形态的完整消息 */
function message(data: Record<string, unknown>): Record<string, unknown> {
  return {
    module: INSTALL_MODULE,
    event: INSTALL_EVENT,
    data,
    dataId: data.recordId,
    timestamp: 1_700_000_000_000,
  };
}

/** 一条安装进度帧 */
function frame(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    recordId: "record-flow",
    dataId: "record-flow",
    softwareId: "software-flow",
    userId: "user-flow",
    deviceId: "device-flow",
    operation: "install",
    statusCode: 1,
    statusText: "安装中",
    progress: 20,
    percentage: 20,
    message: "正在下载",
    finished: false,
    ...overrides,
  };
}

/**
 * 取安装进度订阅的 handler
 *
 * <p>断言只注册了一条，避免「一个页面订阅两次 → 每帧处理两遍」这类回归。</p>
 */
function installHandler(): (msg: unknown) => void {
  const hits = captured.list.filter(item => item.module === INSTALL_MODULE && item.event === INSTALL_EVENT);
  expect(hits).toHaveLength(1);
  return hits[0].handler;
}

beforeEach(() => {
  getProcessTasks().splice(0);
  captured.list.length = 0;
  const g = globalThis as any;
  // socket 实例标记存的是实例本身，每个用例都要从零开始，否则第二个用例
  // 会因为「实例相同」而不重新订阅，captured.list 永远为空
  delete g.__PROCESS_INSTALL_SOCKET__;
  delete g.__PROCESS_INSTALL_FINGERPRINTS__;
});

describe("安装帧进入浮层", () => {
  it("首帧创建任务，字段来自归一结果", () => {
    ensureInstallProgressSubscription();
    installHandler()(message(frame()));

    const tasks = getProcessTasks();
    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.taskId).toBe(`${INSTALL_TASK_PREFIX}record-flow`);
    expect(task.title).toBe("安装 software-flow");
    expect(task.operation).toBe("install");
    expect(task.progress).toBe(20);
    expect(task.currentStep).toBe("安装中");
    expect(task.finished).toBe(false);
    expect(task.success).toBe(false);
    expect(task.logs).toEqual(["[安装中] 正在下载"]);
  });

  it("同一 recordId 的后续帧复用同一个任务，不新建条目", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame()));
    handler(message(frame({ progress: 55, message: "正在解压" })));

    const tasks = getProcessTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].progress).toBe(55);
    expect(tasks[0].logs).toEqual(["[安装中] 正在下载", "[安装中] 正在解压"]);
  });

  it("两个 recordId 各自成任务，进度不会串到一起", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame({ recordId: "a", progress: 10 })));
    handler(message(frame({ recordId: "b", progress: 70 })));

    const tasks = getProcessTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0].progress).toBe(10);
    expect(tasks[1].progress).toBe(70);
  });

  it("双通道重复投递只算一次，日志不会翻倍", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    // 后端对同一帧同时 broadcast + sendToUser，发起人会收到两次内容相同的帧
    const same = message(frame());
    handler(same);
    handler(JSON.parse(JSON.stringify(same)));

    const tasks = getProcessTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].logs).toEqual(["[安装中] 正在下载"]);
  });

  it("内容有可见变化的帧不会被去重误吞", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame({ message: "第一行" })));
    handler(message(frame({ message: "第二行" })));

    expect(getProcessTasks()[0].logs).toEqual(["[安装中] 第一行", "[安装中] 第二行"]);
  });
});

describe("终态", () => {
  it("安装成功(2) 收尾为完成、进度 100", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame({ progress: 90, message: "收尾" })));
    handler(message(frame({ statusCode: 2, statusText: "已安装", progress: 90, message: "完成", finished: true })));

    const task = getProcessTasks()[0];
    expect(task.finished).toBe(true);
    expect(task.success).toBe(true);
    expect(task.phase).toBe("COMPLETE");
    expect(task.progress).toBe(100);
    expect(task.currentStep).toBe("已安装");
  });

  it("安装失败(3) 收尾为异常，保留当时的进度与失败说明", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame({ statusCode: 3, statusText: "安装失败", progress: 45, message: "磁盘空间不足", finished: true })));

    const task = getProcessTasks()[0];
    expect(task.finished).toBe(true);
    expect(task.success).toBe(false);
    expect(task.phase).toBe("ERROR");
    expect(task.progress).toBe(45);
    expect(task.message).toBe("磁盘空间不足");
    expect(task.currentStep).toBe("安装失败");
  });

  it("终态帧之后不再有后续帧，任务保持不变", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame({ statusCode: 2, statusText: "已安装", progress: 100, finished: true })));
    handler(message(frame({ statusCode: 2, statusText: "已安装", progress: 100, finished: true })));

    expect(getProcessTasks()[0].logs).toHaveLength(1);
  });
});

describe("订阅生命周期", () => {
  it("重复调用只订阅一次，不会让每帧处理两遍", () => {
    ensureInstallProgressSubscription();
    ensureInstallProgressSubscription();
    ensureInstallProgressSubscription();
    expect(captured.list).toHaveLength(1);
  });

  it("欠格式帧被丢弃，不产生无主任务", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler({ module: INSTALL_MODULE, event: INSTALL_EVENT });
    handler({ module: INSTALL_MODULE, event: INSTALL_EVENT, data: { recordId: null } });

    expect(getProcessTasks()).toHaveLength(0);
  });

  it("关闭任务后同一帧重投仍能重建（指纹已清）", () => {
    ensureInstallProgressSubscription();
    const handler = installHandler();
    handler(message(frame()));
    removeTask(`${INSTALL_TASK_PREFIX}record-flow`);

    expect(getProcessTasks()).toHaveLength(0);
    handler(message(frame()));
    expect(getProcessTasks()).toHaveLength(1);
  });
});
