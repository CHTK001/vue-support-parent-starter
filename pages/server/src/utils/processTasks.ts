/**
 * 全局过程任务管理（project 模块）
 *
 * 业务侧触发项目操作/软件安装拿到 taskId 后调用 {@link trackTask} 注册跟踪：
 * - 订阅 socket（module=project, event=task）实时更新步骤/进度/日志/结果
 * - 立即拉一次任务快照（GET /ms/server/release/task/{taskId}）实现断点续传
 * - 未完成任务每 3 秒拉一次快照兜底：socket 丢帧 / 断线重连期间也能把进度补齐
 *   （实测 socket 偶发丢最后一帧，后端已 COMPLETE/100，浮层却停在 55%）
 *
 * 任务以浮层 ReProcessTask 展示（可拖拽、最小化到四角）。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { reactive } from "vue";
import { getGlobalSocketService } from "@repo/core";
import { http, unwrapResult } from "@repo/utils";

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
 * socket 是否已经绑定（同样挂 globalThis 去重，防止多实例重复 subscribe）
 */
function isSocketBound(): boolean {
  return !!g.__PROCESS_SOCKET_BOUND__;
}
function markSocketBound(): void {
  g.__PROCESS_SOCKET_BOUND__ = true;
}

/**
 * 绑定 socket 任务事件（全局仅一次）
 */
function bindSocket(): void {
  if (isSocketBound()) {
    return;
  }
  const socket = getGlobalSocketService();
  if (!socket) {
    return;
  }
  markSocketBound();
  socket.subscribe("project", "task", (msg: any) => {
    const data = msg?.data ?? msg;
    const task = tasks.find(t => t.taskId === data?.taskId);
    if (task) {
      applyMessage(task, data);
      // 以 socket 帧事件驱动的一次性兜底（非轮询）：
      // 收到非终态帧后短暂等待再拉一次快照，若中途有新帧则顺延；
      // 用于首帧竞态 / 中途丢帧后自动补齐。
      if (task.finished) {
        clearCatchUp(task);
      } else {
        scheduleCatchUp(task);
      }
    }
  });

  // socket（重新）连接成功：立即补拉所有未完成任务，解决重连期间的丢帧
  const rawSocket = (socket as any)?.socket;
  rawSocket?.on?.("connect", () => {
    tasks.forEach(t => {
      if (!t.finished) {
        void fetchSnapshot(t);
        scheduleCatchUp(t);
      }
    });
  });
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

/** 未完成任务快照轮询间隔（毫秒） */
const SNAPSHOT_POLL_MS = 3000;

/** 正在拉取快照的任务（避免轮询与一次性兜底并发重复请求） */
const snapshotInflight = new Set<string>();

/**
 * 确保全局快照轮询器已启动（多模块实例经 globalThis 去重）
 *
 * 轮询只针对未完成任务；任务结束后自动不再请求，无需额外清理。
 */
function ensureSnapshotPoller(): void {
  if (g.__PROCESS_TASK_POLLER__) {
    return;
  }
  g.__PROCESS_TASK_POLLER__ = setInterval(() => {
    for (const t of tasks) {
      if (!t.finished) {
        void fetchSnapshot(t);
      }
    }
  }, SNAPSHOT_POLL_MS);
}

/**
 * 应用一帧 socket 消息
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
  bindSocket();
  ensureSnapshotPoller();
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
