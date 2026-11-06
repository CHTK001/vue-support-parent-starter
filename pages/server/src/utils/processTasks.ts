/**
 * 全局过程任务管理（project 模块）
 *
 * 业务侧触发项目操作/软件安装拿到 taskId 后调用 {@link trackTask} 注册跟踪：
 * - 订阅发布管理全局 SSE（事件 {@code project-task}）实时更新步骤/进度/日志/结果
 * - 立即拉一次任务快照（GET /ms/server/release/task/{taskId}）实现断点续传
 * - 不再定时轮询：只在 SSE 重连后对未完成任务补拉一次快照，补齐断线期间丢掉的帧
 *
 * 任务以浮层 ReProcessTask 展示（可拖拽、最小化到四角）。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { reactive } from "vue";
import { getGlobalSocketService } from "@repo/core";
import { http, unwrapResult } from "@repo/utils";
import { releaseSse, type ProjectTaskPush } from "../services/releaseRealtime";
import {
  INSTALL_EVENT,
  INSTALL_MODULE,
  frameFingerprint,
  parseInstallProgress,
  type InstallProgressFrame,
} from "./installProgress";

/**
 * 过程任务状态
 */
export interface ProcessTask {
  /** 任务ID */
  taskId: string;
  /** 任务标题 */
  title: string;
  /** 操作类型 start/stop/restart/upgrade/backup/rollback/install */
  operation: string;
  /** 当前阶段 */
  phase: string;
  /** 当前步骤名 */
  currentStep: string;
  /** 进度 0~100 */
  progress: number;
  /** 日志行 */
  logs: string[];
  /** 是否结束 */
  finished: boolean;
  /** 是否成功 */
  success: boolean;
  /** 结果/错误信息 */
  message: string;
  /** 是否最小化 */
  minimized: boolean;
  /** 浮层坐标（拖拽后），null 表示按默认角落排布 */
  x: number | null;
  y: number | null;
  /** 开始时间 */
  startedAt: number;
}

/**
 * 单任务保留日志上限
 */
const MAX_LOGS = 800;

/**
 * 任务列表（全局单例）
 *
 * 注意：本模块同时被「主入口静态导入（ProcessHost）」与「路由异步 chunk
 * （ProjectsView）」引用，dev / 构建的不同模块图可能把本模块实例化两次。
 * 因此把状态数组挂到 globalThis 上做去重，确保任何实例拿到的都是同一个数组，
 * 避免 trackTask 写入与 ProcessHost 渲染指向不同对象。
 */
const g = globalThis as any;
const tasks: ProcessTask[] =
  g.__PROCESS_TASKS__ ?? (g.__PROCESS_TASKS__ = reactive<ProcessTask[]>([]));

/**
 * 任务事件是否已经绑定（同样挂 globalThis 去重，防止多实例重复订阅）
 */
function isRealtimeBound(): boolean {
  return !!g.__PROCESS_RELEASE_BOUND__;
}
function markRealtimeBound(): void {
  g.__PROCESS_RELEASE_BOUND__ = true;
}

/**
 * 绑定发布管理全局 SSE 的任务事件（全局仅一次）
 */
function bindRealtime(): void {
  if (isRealtimeBound()) {
    return;
  }
  markRealtimeBound();
  releaseSse.onProjectTask((frame: ProjectTaskPush) => {
    const task = tasks.find(t => t.taskId === frame.taskId);
    if (!task) {
      return;
    }
    applyMessage(task, frame);
    if (task.finished) {
      clearCatchUp(task);
      releaseConnection(task.taskId);
    }
  });

  // SSE（重新）连接成功：对未完成任务各补拉一次快照，补齐断线期间丢掉的帧
  releaseSse.onStatus((status) => {
    if (status !== "connected") {
      return;
    }
    tasks.forEach(t => {
      if (!t.finished) {
        void fetchSnapshot(t);
      }
    });
  });
}

/**
 * 跟踪中的任务持有的 SSE 连接（任务结束即释放，避免长时间空跑长连接）。
 *
 * <p>同样挂 globalThis：本模块可能被实例化两次，重复 open 会让持有者计数虚高。</p>
 */
function heldTaskIds(): Set<string> {
  return g.__PROCESS_SSE_HOLDERS__ ?? (g.__PROCESS_SSE_HOLDERS__ = new Set<string>());
}

/**
 * 为任务持有发布管理 SSE 连接（重复调用无副作用）。
 *
 * @param taskId 任务标识
 */
function holdConnection(taskId: string): void {
  const held = heldTaskIds();
  if (held.has(taskId)) {
    return;
  }
  held.add(taskId);
  releaseSse.open();
}

/**
 * 释放任务持有的 SSE 连接（任务结束 / 被移除）。
 *
 * @param taskId 任务标识
 */
function releaseConnection(taskId: string): void {
  const held = heldTaskIds();
  if (!held.delete(taskId)) {
    return;
  }
  releaseSse.close();
}

/**
 * 取消某任务的一次性兜底定时器
 */
function clearCatchUp(task: ProcessTask): void {
  const handle = catchUpTimers.get(task.taskId);
  if (handle !== undefined) {
    clearTimeout(handle);
    catchUpTimers.delete(task.taskId);
  }
}

/**
 * 安排一次性兜底快照拉取（由 socket 帧 / 连接事件触发，非定时轮询）
 */
function scheduleCatchUp(task: ProcessTask): void {
  clearCatchUp(task);
  const handle = setTimeout(() => {
    catchUpTimers.delete(task.taskId);
    if (!task.finished) {
      void fetchSnapshot(task);
    }
  }, CATCH_UP_DELAY_MS);
  catchUpTimers.set(task.taskId, handle);
}

/** 一次性兜底等待（毫秒）：略大于远端单步常见间隔 */
const CATCH_UP_DELAY_MS = 1500;

/** 任务一次性兜底定时器句柄 */
const catchUpTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** 正在进行中的快照请求（避免并发重复请求） */
const snapshotInflight = new Set<string>();

/**
 * 应用一帧任务消息（SSE {@code project-task}）
 */
function applyMessage(task: ProcessTask, data: any): void {
  if (typeof data.phase === "string") {
    task.phase = data.phase;
  }
  if (data.currentStep) {
    task.currentStep = data.currentStep;
  }
  if (typeof data.progress === "number") {
    task.progress = data.progress;
  }
  if (data.phase === "LOG" && typeof data.line === "string") {
    appendLog(task, data.line);
  }
  if (data.phase === "COMPLETE") {
    task.finished = true;
    task.success = true;
    task.progress = 100;
    task.currentStep = "完成";
    task.message = data.message || "操作成功";
  }
  if (data.phase === "ERROR") {
    task.finished = true;
    task.success = false;
    task.message = data.message || "执行失败";
  }
}

/**
 * 追加日志（限制上限）
 */
function appendLog(task: ProcessTask, line: string): void {
  task.logs.push(line);
  if (task.logs.length > MAX_LOGS) {
    task.logs.splice(0, task.logs.length - MAX_LOGS);
  }
}

/**
 * 拉取任务快照（断点续传）
 */
async function fetchSnapshot(task: ProcessTask): Promise<void> {
  if (snapshotInflight.has(task.taskId)) {
    return;
  }
  snapshotInflight.add(task.taskId);
  try {
    const res = await http().get(`/ms/server/release/task/${encodeURIComponent(task.taskId)}`);
    const snap = unwrapResult<any>(res);
    if (!snap) {
      return;
    }
    if (typeof snap.phase === "string") {
      task.phase = snap.phase;
    }
    if (snap.currentStep) {
      task.currentStep = snap.currentStep;
    }
    if (typeof snap.progress === "number") {
      task.progress = snap.progress;
    }
    if (Array.isArray(snap.logs)) {
      // 快照为权威全量缓冲，覆盖后再由实时消息追加
      task.logs.splice(0, task.logs.length, ...snap.logs.slice(-MAX_LOGS));
    }
    task.finished = !!snap.finished;
    task.success = !!snap.success;
    if (snap.message) {
      task.message = snap.message;
    }
    if (task.finished) {
      clearCatchUp(task);
      releaseConnection(task.taskId);
    }
  } catch {
    /* 快照拉取失败不影响实时跟踪 */
  } finally {
    snapshotInflight.delete(task.taskId);
  }
}

/**
 * 注册并跟踪一个任务
 *
 * @param taskId 任务ID
 * @param title   任务标题
 * @param operation 操作类型
 * @returns 任务状态对象
 */
export function trackTask(taskId: string, title: string, operation: string): ProcessTask {
  bindRealtime();
  // 任务在跑期间持有发布管理 SSE 连接；任务结束后释放（页面常驻持有另计）
  holdConnection(taskId);
  let task = tasks.find(t => t.taskId === taskId);
  if (!task) {
    task = reactive<ProcessTask>({
      taskId,
      title,
      operation,
      phase: "START",
      currentStep: "准备中",
      progress: 0,
      logs: [],
      finished: false,
      success: false,
      message: "",
      minimized: false,
      x: null,
      y: null,
      startedAt: Date.now(),
    });
    tasks.push(task);
  } else if (task.finished) {
    // 复用已结束的 taskId（理论上不会发生）：重新占用连接与状态
    task.finished = false;
    task.success = false;
  }
  void fetchSnapshot(task);
  // 覆盖「任务在订阅就绪前已跑完」的快速任务：首帧事件尚未到达也能兜底补齐
  scheduleCatchUp(task);
  return task;
}

/**
 * 移除任务
 */
export function removeTask(taskId: string): void {
  clearCatchUp({ taskId } as ProcessTask);
  releaseConnection(taskId);
  // 指纹一并清掉：任务关掉后同一帧重投要能重新建出任务
  installFingerprints().delete(taskId);
  const index = tasks.findIndex(t => t.taskId === taskId);
  if (index >= 0) {
    tasks.splice(index, 1);
  }
}

/**
 * 切换最小化
 */
export function toggleMinimize(taskId: string): void {
  const task = tasks.find(t => t.taskId === taskId);
  if (task) {
    task.minimized = !task.minimized;
  }
}

/**
 * 更新浮层坐标
 */
export function setTaskPosition(taskId: string, x: number, y: number): void {
  const task = tasks.find(t => t.taskId === taskId);
  if (task) {
    task.x = x;
    task.y = y;
  }
}

/**
 * 获取全部任务
 */
export function getProcessTasks(): ProcessTask[] {
  return tasks;
}

// ==================== 软件安装进度（socket，与发布管理 SSE 无关） ====================

/** 安装进度去重指纹表（taskId → 帧指纹），挂 globalThis 做多实例去重 */
function installFingerprints(): Map<string, string> {
  return g.__PROCESS_INSTALL_FINGERPRINTS__ ?? (g.__PROCESS_INSTALL_FINGERPRINTS__ = new Map<string, string>());
}

/**
 * 应用一帧安装进度（归一结果直接落到浮层字段）。
 *
 * @param frame 归一后的安装帧
 */
function applyInstallFrame(frame: InstallProgressFrame): void {
  const prints = installFingerprints();
  const fingerprint = frameFingerprint(frame);
  // 后端同一帧会同时 broadcast + sendToUser，发起人会收到两份：内容一致就跳过
  if (prints.get(frame.taskId) === fingerprint) {
    return;
  }
  prints.set(frame.taskId, fingerprint);

  let task = tasks.find(t => t.taskId === frame.taskId);
  if (!task) {
    task = reactive<ProcessTask>({
      taskId: frame.taskId,
      title: frame.title,
      operation: frame.operation,
      phase: "STEP",
      currentStep: frame.statusText || frame.operationText,
      progress: frame.progress,
      logs: [],
      finished: false,
      success: false,
      message: "",
      minimized: false,
      x: null,
      y: null,
      startedAt: Date.now(),
    });
    tasks.push(task);
  }

  task.operation = frame.operation;
  task.currentStep = frame.statusText || task.currentStep;
  task.progress = frame.finished && frame.success ? 100 : frame.progress;
  if (frame.message) {
    appendLog(task, `[${frame.statusText || frame.operationText}] ${frame.message}`);
  }
  if (frame.finished) {
    task.finished = true;
    task.success = frame.success;
    task.phase = frame.success ? "COMPLETE" : "ERROR";
    task.message = frame.message || frame.statusText || (frame.success ? "操作成功" : "操作失败");
  } else {
    task.phase = "STEP";
  }
}

/**
 * 确保软件安装进度订阅已建立（全局仅一次）。
 *
 * <p>安装进度由软件模块经全局 socket 广播（与发布管理的 SSE 是两条独立通道），
 * 重复调用只会订阅一次，避免每帧被处理两遍。</p>
 */
export function ensureInstallProgressSubscription(): void {
  const socket = getGlobalSocketService();
  if (!socket) {
    return;
  }
  // 存的是实例本身：换了 socket 实例（重连/切环境）要重新订阅
  if (g.__PROCESS_INSTALL_SOCKET__ === socket) {
    return;
  }
  g.__PROCESS_INSTALL_SOCKET__ = socket;
  socket.subscribe(INSTALL_MODULE, INSTALL_EVENT, (msg: unknown) => {
    const frame = parseInstallProgress(msg);
    if (!frame) {
      return;
    }
    applyInstallFrame(frame);
  });
}
