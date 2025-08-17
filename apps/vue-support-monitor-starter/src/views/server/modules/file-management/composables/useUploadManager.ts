import { ref } from "vue";
import type { UploadQueueStatus } from "@/api/monitor/filesystem";

export interface UploadTask {
  id: number;
  name: string; // 文件名 + 目标标识
  run: (
    signal: AbortSignal,
    onProgress: (percent: number) => Promise<void> | void
  ) => Promise<void>;
  meta?: any; // 透传元数据（例如 file、dirPath 等）
}

interface Options {
  concurrency?: number;
  maxRetries?: number; // 默认2次
  queueMap: Map<number, UploadQueueStatus>;
}

type TaskStatus =
  | "pending"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

export function useUploadManager(opts: Options) {
  const concurrency = opts.concurrency ?? 3;
  const maxRetries = opts.maxRetries ?? 2;

  const queueMap = opts.queueMap;
  const waiting: UploadTask[] = [];
  const running = new Map<
    number,
    { task: UploadTask; controller: AbortController; retries: number }
  >();
  const status = ref<{ active: number; total: number }>({
    active: 0,
    total: 0,
  });
  const taskStore = new Map<number, UploadTask>();

  function setQueueItem(id: number, patch: Partial<UploadQueueStatus>) {
    const prev = queueMap.get(id) || ({} as UploadQueueStatus);
    queueMap.set(id, {
      fileId: id,
      fileName: prev.fileName || String(id),
      progress: 0,
      status: "uploading",
      ...prev,
      ...patch,
    });
  }

  async function exec(task: UploadTask) {
    const controller = new AbortController();
    running.set(task.id, { task, controller, retries: 0 });
    setQueueItem(task.id, {
      status: "uploading",
      message: "开始上传",
      progress: 0,
    });

    const onProgress = (p: number) =>
      setQueueItem(task.id, { progress: p, message: `已上传 ${p}%` });

    try {
      await task.run(controller.signal, onProgress);
      setQueueItem(task.id, {
        status: "completed",
        progress: 100,
        message: "上传完成",
      });
    } catch (e: any) {
      // 若被取消
      if (controller.signal.aborted) {
        setQueueItem(task.id, { status: "failed", message: "已取消" });
      } else {
        const rec = running.get(task.id);
        if (rec && rec.retries < maxRetries) {
          rec.retries += 1;
          setQueueItem(task.id, {
            status: "uploading",
            message: `重试第 ${rec.retries} 次`,
          });
          // 指数退避
          await new Promise((r) =>
            setTimeout(r, Math.min(2000 * rec.retries, 8000))
          );
          await task
            .run(controller.signal, onProgress)
            .then(() => {
              setQueueItem(task.id, {
                status: "completed",
                progress: 100,
                message: "上传完成",
              });
            })
            .catch(() => {
              setQueueItem(task.id, {
                status: "failed",
                message: e?.message || "上传失败",
              });
            });
        } else {
          setQueueItem(task.id, {
            status: "failed",
            message: e?.message || "上传失败",
          });
        }
      }
    } finally {
      running.delete(task.id);
      pump();
    }
  }

  function pump() {
    while (running.size < concurrency && waiting.length > 0) {
      const t = waiting.shift()!;
      exec(t);
    }
    status.value = {
      active: running.size,
      total: running.size + waiting.length,
    };
  }

  function enqueue(tasks: UploadTask[]) {
    for (const t of tasks) {
      waiting.push(t);
      taskStore.set(t.id, t);
      // 初始化队列项
      setQueueItem(t.id, {
        fileName: t.name,
        progress: 0,
        status: "uploading",
        message: "等待上传" as any,
      });
    }
    pump();
  }

  function pauseAll() {
    // 通过取消当前请求达到暂停效果，未开始的任务保留在 waiting
    for (const { controller } of running.values()) {
      controller.abort();
    }
  }

  function resumeAll() {
    pump();
  }

  function cancelTask(id: number) {
    const r = running.get(id);
    if (r) {
      r.controller.abort();
      setQueueItem(id, { status: "failed", message: "已取消" });
      running.delete(id);
      pump();
      return;
    }
    // 若在等待队列，直接移除
    const idx = waiting.findIndex((t) => t.id === id);
    if (idx >= 0) waiting.splice(idx, 1);
    setQueueItem(id, { status: "failed", message: "已取消" });
  }

  function cancelAll() {
    for (const { controller } of running.values()) controller.abort();
    waiting.length = 0;
  }

  function clearCompleted() {
    for (const [id, item] of Array.from(queueMap.entries())) {
      if (item.status === "completed" || item.status === "failed") {
        queueMap.delete(id);
      }
    }
  }

  function getTaskMeta(id: number) {
    return taskStore.get(id)?.meta;
  }

  return {
    enqueue,
    pauseAll,
    resumeAll,
    cancelTask,
    cancelAll,
    clearCompleted,
    status,
    getTaskMeta,
  };
}
