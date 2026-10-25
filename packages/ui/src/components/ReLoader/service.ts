/**
 * ReLoader 命令式服务。
 *
 * <p>为什么需要它：很多加载态不是由「一个响应式布尔值」驱动的 ——
 * 文件上传、批量任务、跨组件的长流程，调用点与渲染点根本不在一处。
 * 这种场景下声明式组件很别扭（要在某处存一个 ref、再想办法跨层传递），
 * 命令式 `ReLoader.open()` 返回一个句柄，谁发起谁推进进度、谁收尾。</p>
 *
 * <p>实现上挂一个独立的 Vue 应用实例到 body：不污染宿主 app 的组件上下文，
 * 也保证全屏遮罩不受父级 `overflow: hidden` / `transform` 影响。
 * ReLoader 内部按需引入 ElButton，因此该独立实例不依赖宿主是否全局注册了 Element Plus。</p>
 */
import { createApp, h, reactive, type App } from "vue";
import ReLoader from "./ReLoader.vue";
import { createProgressEstimator, type ProgressEstimator } from "./progressEstimator";
import { bindVisibilityPause } from "./visibility";
import type {
  ReLoaderCloseReason,
  ReLoaderHandle,
  ReLoaderProgressPayload,
  ReLoaderServiceOptions,
} from "./types";

/** 内部实例记录 */
interface InstanceRecord extends ReLoaderServiceOptions {
  id: string;
  /** 当前是否可见（由 ReLoader 的 loading 驱动） */
  visible: boolean;
  /** 进度 */
  progress: number | null;
  /** 已收尾标记，保证回调与 resolve 只走一次 */
  done: boolean;
  /** 调用方请求的关闭原因（覆盖 ReLoader 内部的 "auto"） */
  reason: ReLoaderCloseReason | null;
  /** whenClosed 的 resolve */
  resolve: (r: ReLoaderCloseReason) => void;
  /** 当前是否处于"失败态"（展示重试按钮，而非关闭） */
  failed: boolean;
  /** 失败时的错误信息 */
  errorMessage: string;
  /** 是否正在重试（防重复点击） */
  retrying: boolean;
}

const instances = reactive<InstanceRecord[]>([]);
let hostEl: HTMLElement | null = null;
let hostApp: App | null = null;
let seq = 0;

/** 句柄注册表：id → handle（onTimeout 等回调需要把句柄交回调用方） */
const handles = new Map<string, ReLoaderHandle>();

/**
 * 单例表：singletonKey → 实例 + 引用计数。
 *
 * <p>并发请求共用遮罩的实现基础：后到的 open 不新建遮罩，只把计数 +1；
 * 每个请求结束各自 close，计数归零才真正关闭。</p>
 */
const singletons = new Map<string, { handle: ReLoaderHandle; rec: InstanceRecord; refCount: number }>();

/** 可见性监听的解绑函数（宿主卸载时调用） */
let unbindVisibility: (() => void) | null = null;

function handleOf(rec: InstanceRecord): ReLoaderHandle {
  return handles.get(rec.id) as ReLoaderHandle;
}

function ensureHost() {
  if (hostApp) return;
  hostEl = document.createElement("div");
  hostEl.setAttribute("data-re-loader-host", "");
  document.body.appendChild(hostEl);
  // 页面不可见时暂停动画（省电）。与宿主创建解绑：宿主卸载时一并取消监听。
  unbindVisibility = bindVisibilityPause();
  hostApp = createApp({
    name: "ReLoaderHost",
    render() {
      return instances.map((rec, i) =>
        h(ReLoader, {
          key: rec.id,
          loading: rec.visible,
          variant: rec.variant,
          size: rec.size,
          color: rec.color,
          text: rec.text,
          percent: rec.progress,
          fullscreen: rec.fullscreen ?? true,
          mask: rec.mask ?? true,
          closable: rec.closable ?? false,
          cancelOnEsc: rec.cancelOnEsc ?? true,
          // 失败态：交给组件渲染「重试 / 关闭」，此时不显示动画与进度
          failed: rec.failed,
          errorMessage: rec.errorMessage,
          retrying: rec.retrying,
          errorText: rec.errorText,
          delay: rec.delay ?? 0,
          minDuration: rec.minDuration ?? 0,
          timeout: rec.timeout ?? 0,
          // 叠层时逐个抬高，保证后开的盖住先开的
          style: { zIndex: 2100 + i },
          onTimeout: () => rec.onTimeout?.(handleOf(rec)),
          onCancel: () => handleOf(rec)?.cancel(),
          onRetry: () => handleOf(rec)?.retry(),
          onClose: (reason: ReLoaderCloseReason) => finalize(rec, rec.reason ?? reason),
        }),
      );
    },
  });
  hostApp.mount(hostEl);
}

/** 收尾：回调 + resolve + 摘除实例；最后一个实例关闭时卸载宿主应用 */
function finalize(rec: InstanceRecord, reason: ReLoaderCloseReason) {
  if (rec.done) return;
  rec.done = true;
  const idx = instances.findIndex((r) => r.id === rec.id);
  if (idx >= 0) instances.splice(idx, 1);
  handles.delete(rec.id);
  // 单例表也要清：否则已关闭的实例会留在表里，后续 open 复用一个死实例
  if (rec.singleton) {
    const key = rec.singletonKey || "default";
    const single = singletons.get(key);
    if (single && single.rec.id === rec.id) singletons.delete(key);
  }
  try {
    rec.onClose?.(reason);
  } finally {
    rec.resolve(reason);
  }
  if (instances.length === 0) {
    // 延迟卸载：让离场过渡播完，同时避免"刚关完又开"造成宿主反复创建
    setTimeout(() => {
      if (instances.length === 0 && hostApp) {
        hostApp.unmount();
        hostEl?.remove();
        hostApp = null;
        hostEl = null;
        // 注意：可见性监听**不**在这里解绑 —— 它是进程级的页面状态，
        // 不是这个遮罩宿主的生命周期。跟着宿主一起解绑会导致「遮罩开一次
        // 关一次后，页面再切后台动画就不暂停了」（实测踩到）。
      }
    }, 260);
  }
}

/**
 * 打开一个加载态。
 *
 * @param options 见 {@link ReLoaderServiceOptions}
 * @returns 句柄：可 setProgress / error / close
 */
export function open(options: ReLoaderServiceOptions = {}): ReLoaderHandle {
  ensureHost();

  // 单例：同 key 复用已有实例，引用计数 +1
  if (options.singleton) {
    const key = options.singletonKey || "default";
    const exist = singletons.get(key);
    if (exist && !exist.rec.done) {
      exist.refCount++;
      // 用新 options 里"更具体"的文案/进度刷新外观（后开者通常知道得更清楚）
      if (options.text) exist.rec.text = options.text;
      if (options.variant) exist.rec.variant = options.variant;
      if (options.progress !== undefined && options.progress !== null) {
        exist.rec.progress = options.progress;
      }
      return exist.handle;
    }
  }

  const id = `re-loader-${++seq}`;
  let resolveClosed: (r: ReLoaderCloseReason) => void = () => {};
  const closed = new Promise<ReLoaderCloseReason>((res) => {
    resolveClosed = res;
  });

  // 注意：这里必须用 reactive 包一层，且**后续一律通过它读写**。
  // 若用普通对象 push 进 reactive 数组，宿主 render 读到的是数组返回的代理，
  // 而句柄闭包里改的是原始对象 —— 绕过代理不会触发依赖，表现为
  // 「close() 之后遮罩不消失、setProgress() 进度不动」（实测踩到过）。
  const rec: InstanceRecord = reactive({
    ...options,
    id,
    visible: true,
    // percent 与 progress 都接受（组件用 percent、命令式用 progress，历史上不统一）
    progress: options.percent ?? options.progress ?? null,
    done: false,
    reason: null,
    resolve: resolveClosed,
    failed: false,
    errorMessage: "",
    retrying: false,
  } as InstanceRecord) as InstanceRecord;

  /** 进度估算器（仅在 estimateProgress 时创建） */
  let estimator: ProgressEstimator | null = null;

  /** 平滑进度的补间定时器（同一时刻只允许一个） */
  let tweenTimer: ReturnType<typeof setInterval> | null = null;

  /** 停掉进行中的平滑补间 */
  const stopTween = () => {
    if (tweenTimer) {
      clearInterval(tweenTimer);
      tweenTimer = null;
    }
  };

  /** 统一写进度并回调（避免多处重复） */
  const applyProgress = (percent: number | null) => {
    rec.progress = percent;
    if (percent !== null) {
      const payload: ReLoaderProgressPayload = { percent, id };
      rec.onProgress?.(payload);
    }
  };

  /** 创建/重建进度估算器（reset 需要重启计时） */
  const startEstimator = () => {
    estimator?.stop();
    estimator = createProgressEstimator({
      ceiling: options.estimateCeiling,
      tau: options.estimateTau,
      onTick: (p) => {
        if (rec.done) return;
        applyProgress(Math.round(p));
      },
    });
  };

  /**
   * 取消用的 AbortController。
   *
   * <p>始终创建：即便调用方没传 onCancel，用户点取消时也应该能关掉遮罩；
   * 传了 onCancel 则把 signal 交出去，让底层请求真正中止。</p>
   */
  const abortController = new AbortController();

  const handle: ReLoaderHandle = {
    id,
    get visible() {
      return !rec.done;
    },
    get failed() {
      return rec.failed;
    },
    get percent() {
      return rec.progress;
    },
    setProgress(percent, opts) {
      if (rec.done) return handle;
      stopTween();
      // 真实进度到达：估算器让位，之后进度完全由调用方驱动
      if (percent !== null) estimator?.setReal(percent);

      const smooth = opts?.smooth;
      if (!smooth || percent === null || rec.progress === null) {
        // 不确定态 ↔ 确定态之间切换没有平滑的意义（起点未知），直接设
        applyProgress(percent);
        return handle;
      }

      const from = rec.progress;
      const to = Math.max(0, Math.min(100, percent));
      const duration = typeof smooth === "number" ? Math.max(0, smooth) : 320;
      if (duration === 0 || from === to) {
        applyProgress(to);
        return handle;
      }
      // easeOutCubic：起步快、收尾稳，比线性更像"真实推进"
      const startedAt = Date.now();
      tweenTimer = setInterval(() => {
        if (rec.done) {
          stopTween();
          return;
        }
        const k = Math.min(1, (Date.now() - startedAt) / duration);
        const eased = 1 - Math.pow(1 - k, 3);
        applyProgress(Math.round(from + (to - from) * eased));
        if (k >= 1) stopTween();
      }, 32);
      return handle;
    },
    reset(opts) {
      if (rec.done) return handle;
      stopTween();
      const target = opts?.percent === undefined ? 0 : opts.percent;
      estimator?.stop();
      applyProgress(target);
      /*
        默认**不**重启估算。
        之前默认重启，结果是 reset() 后估算器立刻往上走，200ms 内进度就从 0
        变成了 20% —— 调用方看到"重置后不是 0"，语义完全对不上。
        现在重启要显式传 { restartEstimate: true }。
      */
      if (options.estimateProgress && opts?.restartEstimate === true) {
        startEstimator();
      }
      return handle;
    },
    update(patch) {
      if (rec.done) return handle;
      // percent 是 progress 的别名，统一落到 rec.progress 上
      const p = { ...patch } as Partial<ReLoaderServiceOptions> & { percent?: number | null };
      if (p.percent !== undefined) {
        rec.progress = p.percent;
        delete p.percent;
      }
      Object.assign(rec, p);
      return handle;
    },
    error(err) {
      if (rec.done) return handle;
      estimator?.stop();
      // 约定：onError 显式返回 false 表示"我自己收尾，别关"
      const keep = rec.onError?.(err, handle);
      if (keep === false) return handle;

      // 可重试：**不关闭**，切到失败态让用户决定重试或关闭。
      // 网络抖一下就让人从头再走一遍流程，是比"多显示一个按钮"差得多的体验。
      if (rec.retryable && rec.onRetry) {
        rec.failed = true;
        rec.errorMessage =
          (err instanceof Error ? err.message : String(err ?? "")) || rec.errorText || "加载失败";
        return handle;
      }

      rec.reason = "error";
      rec.visible = false;
      return handle;
    },
    cancel() {
      if (rec.done) return;
      // 先通知调用方中止底层操作（传 signal），再关遮罩
      try {
        rec.onCancel?.(abortController.signal);
      } catch {
        // 调用方回调异常不能阻断关闭
      }
      if (!abortController.signal.aborted) {
        abortController.abort(new DOMException("用户取消", "AbortError"));
      }
      handle.close("cancel");
    },
    retry() {
      if (rec.done || !rec.failed || !rec.onRetry) return handle;
      if (rec.retrying) return handle;
      rec.retrying = true;
      // 回到"加载中"，清掉失败态
      rec.failed = false;
      rec.errorMessage = "";
      Promise.resolve()
        .then(() => rec.onRetry?.(handle))
        .then(() => {
          rec.retrying = false;
          // 重试成功：正常关闭
          handle.close("auto");
        })
        .catch((e: unknown) => {
          rec.retrying = false;
          // 再次失败：留在失败态，可继续重试
          rec.failed = true;
          rec.errorMessage =
            (e instanceof Error ? e.message : String(e ?? "")) || rec.errorText || "加载失败";
        });
      return handle;
    },
    close(reason: ReLoaderCloseReason = "manual") {
      if (rec.done) return;
      // 单例：引用计数未归零时只减不关（最后一个使用者才真正关闭）
      const key = rec.singletonKey || "default";
      const single = rec.singleton ? singletons.get(key) : undefined;
      if (single && single.refCount > 1) {
        single.refCount--;
        return;
      }
      stopTween();
      estimator?.finish();
      rec.reason = reason;
      rec.visible = false;
    },
    whenClosed: () => closed,
  };

  if (options.estimateProgress) {
    startEstimator();
  }

  if (options.singleton) {
    singletons.set(options.singletonKey || "default", { handle, rec, refCount: 1 });
  }

  handles.set(id, handle);
  instances.push(rec);
  // onOpen 要在 handle 就绪后回调（调用方常在此立刻 setProgress）
  queueMicrotask(() => {
    if (!rec.done) rec.onOpen?.(handle);
  });
  return handle;
}

/** 关闭所有加载态（登出 / 全局重置时兜底） */
export function closeAll(reason: ReLoaderCloseReason = "manual") {
  for (const rec of [...instances]) {
    rec.reason = reason;
    rec.visible = false;
  }
}

/**
 * 关闭"路由级"加载态（路由切换后调用）。
 *
 * <p>为什么不直接用 {@link closeAll}：页面内也可能有正当的局部加载态
 * （例如详情页自己的数据请求）。切路由时把这些一并关掉，虽然遮罩会消失，
 * 但页面的 loading 标志仍为 true，回来时会看到一个"永远转圈"的页面。</p>
 *
 * <p>因此这里只关闭**显式标记为路由级**的实例（{@code routerScoped: true}），
 * 通常由请求层联动在跨页请求上自动打标。普通页面内加载态不受影响。</p>
 *
 * @param reason 关闭原因
 * @returns 实际关闭的数量
 */
export function closeRouterScoped(reason: ReLoaderCloseReason = "auto"): number {
  let n = 0;
  for (const rec of [...instances]) {
    if (!rec.routerScoped) continue;
    rec.reason = reason;
    rec.visible = false;
    n++;
  }
  return n;
}

/** 当前打开的加载态数量 */
export function count(): number {
  return instances.length;
}

/** 对象风格聚合导出，便于 `import { loader } from "@repo/ui/re-loader"` */
export const loader = { open, closeAll, count };
