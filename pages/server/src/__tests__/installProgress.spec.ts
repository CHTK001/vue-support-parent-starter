/**
 * 软件安装进度帧归一的门禁
 *
 * <p>后端在安装、卸载、更新的每个落库点都会经全局 socket 广播一帧
 * {@code {module:"software", event:"install-progress", data:{...}}}。
 * 这一层负责把帧翻译成浮层能吃的字段。它错的表现不是报错，而是
 * 「进度条不动」「任务永远不结束」「两台机器的进度串成一条」——
 * 全都不会让编译或构建变红，所以必须逐条钉住。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  INSTALL_EVENT,
  INSTALL_MODULE,
  INSTALL_TASK_PREFIX,
  frameFingerprint,
  parseInstallProgress,
} from "../utils/installProgress";

/** 构造一条后端真实形态的消息（module/event/data/dataId/timestamp） */
function frame(data: Record<string, unknown>): Record<string, unknown> {
  return {
    module: INSTALL_MODULE,
    event: INSTALL_EVENT,
    data,
    dataId: data.recordId,
    timestamp: 1_700_000_000_000,
  };
}

/** 一条安装中的真实帧 data */
function installing(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    recordId: "record-1",
    dataId: "record-1",
    softwareId: "software-1",
    userId: "user-1",
    deviceId: "device-1",
    operation: "install",
    statusCode: 1,
    statusText: "安装中",
    progress: 30,
    percentage: 30,
    message: "准备安装",
    finished: false,
    ...overrides,
  };
}

/** 解析一条帧（断言非空后返回，省掉调用点的 `!`） */
function parse(data: Record<string, unknown>) {
  const parsed = parseInstallProgress(frame(data));
  expect(parsed).not.toBeNull();
  return parsed!;
}

describe("订阅键与后端对齐", () => {
  it("模块、事件、任务前缀与后端常量一致", () => {
    expect(INSTALL_MODULE).toBe("software");
    expect(INSTALL_EVENT).toBe("install-progress");
    expect(INSTALL_TASK_PREFIX).toBe("software:");
  });
});

describe("帧解析", () => {
  it("接受完整消息、也接受已取出的 data", () => {
    const whole = parseInstallProgress(frame(installing()));
    const inner = parseInstallProgress(installing());
    expect(whole).not.toBeNull();
    expect(inner).not.toBeNull();
    expect(whole).toEqual(inner);
  });

  it("记录标识缺失时丢弃整帧，不产生无主任务", () => {
    expect(parseInstallProgress(frame(installing({ recordId: null, dataId: null })))).toBeNull();
    expect(parseInstallProgress(null)).toBeNull();
    expect(parseInstallProgress("not-an-object")).toBeNull();
    expect(parseInstallProgress(undefined)).toBeNull();
  });

  it("taskId 带前缀，与项目任务永不撞键", () => {
    expect(parse(installing()).taskId).toBe(`${INSTALL_TASK_PREFIX}record-1`);
  });

  it("进度取 progress，缺失时回退 percentage", () => {
    expect(parse(installing()).progress).toBe(30);
    expect(parse(installing({ progress: null })).progress).toBe(30);
  });

  it("进度越界被收敛到 0~100，不让进度条溢出", () => {
    expect(parse(installing({ progress: 140, percentage: 140 })).progress).toBe(100);
    expect(parse(installing({ progress: -7 })).progress).toBe(0);
  });

  it("非数值进度按 0 处理，不产生 NaN", () => {
    expect(parse(installing({ progress: "abc", percentage: null })).progress).toBe(0);
  });
});

describe("终态判定", () => {
  it("已安装(2) 与已卸载(5) 是成功终态", () => {
    for (const code of [2, 5]) {
      const parsed = parse(installing({ statusCode: code, finished: true }));
      expect(parsed.finished).toBe(true);
      expect(parsed.success).toBe(true);
    }
  });

  it("失败(3) 与更新失败(7) 是失败终态", () => {
    for (const code of [3, 7]) {
      const parsed = parse(installing({ statusCode: code, finished: true }));
      expect(parsed.finished).toBe(true);
      expect(parsed.success).toBe(false);
    }
  });

  it("非终态不会因为高进度被误判为完成", () => {
    const parsed = parse(installing({ statusCode: 1, progress: 99, percentage: 99 }));
    expect(parsed.finished).toBe(false);
    expect(parsed.success).toBe(false);
  });

  it("后端未给 finished 时按状态码推断，兼容旧版本服务端", () => {
    expect(parse(installing({ statusCode: 2, finished: undefined })).finished).toBe(true);
    expect(parse(installing({ statusCode: 1, finished: undefined })).finished).toBe(false);
  });
});

describe("操作与标题", () => {
  it("update 归一为 upgrade，浮层才显示中文「升级」", () => {
    const parsed = parse(installing({ operation: "update" }));
    expect(parsed.operation).toBe("upgrade");
    expect(parsed.operationText).toBe("升级");
  });

  it("缺软件标识时标题只留操作，不出现 undefined", () => {
    expect(parse(installing({ softwareId: "" })).title).toBe("安装");
  });

  it("有软件标识时标题带出标识", () => {
    expect(parse(installing()).title).toBe("安装 software-1");
  });
});

describe("重复投递去重", () => {
  it("同一帧的指纹不同字段分开，可见变化一定产生不同指纹", () => {
    const base = parse(installing());
    expect(frameFingerprint(base)).toBe(frameFingerprint(parse(installing())));

    for (const patch of [
      { progress: 31 },
      { statusCode: 2, statusText: "已安装", finished: true },
      { message: "换行说明" },
    ]) {
      expect(frameFingerprint(parse(installing(patch)))).not.toBe(frameFingerprint(base));
    }
  });

  it("指纹不包含时间戳类字段，重复投递不会被误判为新帧", () => {
    expect(frameFingerprint(parse(installing()))).toBe(frameFingerprint(parse(installing())));
  });
});

describe("processTasks 接线", () => {
  const SOURCE = readFileSync(join(process.cwd(), "src", "utils", "processTasks.ts"), "utf8");

  it("订阅走 software/install-progress，而不是 project/task", () => {
    expect(SOURCE).toContain("socket.subscribe(INSTALL_MODULE, INSTALL_EVENT");
  });

  it("安装任务的快照轮询被短路，避免刷 4xx", () => {
    const body = SOURCE.slice(SOURCE.indexOf("async function fetchSnapshot"));
    const head = body.slice(0, body.indexOf("snapshotInflight.add"));
    expect(body.indexOf("isInstallTask(task.taskId)")).toBeGreaterThan(-1);
    expect(head).toContain("isInstallTask(task.taskId)");
  });

  it("插入浮层的任务挂在同一个全局单例数组上", () => {
    const body = SOURCE.slice(SOURCE.indexOf("function applyInstallFrame"));
    expect(body).toContain("tasks.push(task)");
    expect(body).toContain("frame.finished");
  });

  it("安装订阅幂等且能跟随 socket 重建，不会被项目订阅挡掉", () => {
    expect(SOURCE).toContain("__PROCESS_INSTALL_SOCKET__");
    // 存实例而不是布尔标记：socket 重建后必须能重新订阅
    const body = SOURCE.slice(SOURCE.indexOf("function bindInstallSocket"));
    expect(body).toContain("installSocketBoundTo() === socket");
  });

  it("进入浮层前按指纹去重，避免双通道投递让日志翻倍", () => {
    const body = SOURCE.slice(SOURCE.indexOf("function applyInstallFrame"));
    const head = body.slice(0, body.indexOf("tasks.find"));
    expect(head).toContain("isDuplicateInstallFrame(frame)");
  });
});
