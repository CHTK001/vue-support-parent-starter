/**
 * 预览资源预热。
 *
 * <p>预览慢的大头不在「取文件字节」，而在**首次打开时要现拉几 MB 的渲染器 chunk**
 * （{@code @file-viewer/vue3-full} + {@code preset-office} + 样式）。这些 chunk 与
 * 用户点开哪个文件无关，只与「有没有预览过」有关。</p>
 *
 * <p>策略：文件列表加载完之后，在浏览器空闲时段把这几块拉下来（不阻塞首屏、
 * 不抢正在进行的请求），这样第一次点「预览」时只剩取字节与解析两步。</p>
 *
 * <p>三条纪律：① 只跑一次；② 空闲回调不可用时退回 setTimeout；③
 * {@code navigator.connection.saveData} 为 true 或网络类型是 2g/3g 时**不预热** ——
 * 省流量优先于省一次点击等待。</p>
 */

/** 预热是否已开始（避免重复触发） */
let warmed = false;

/** 在途任务（并发调用共用） */
let warming: Promise<void> | null = null;

/**
 * 当前网络是否值得预热
 *
 * @returns true = 可以预热
 */
function networkAllows(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const conn = nav.connection;
  if (!conn) {
    return true;
  }
  if (conn.saveData) {
    return false;
  }
  const type = conn.effectiveType ?? "";
  return !(type === "slow-2g" || type === "2g" || type === "3g");
}

/**
 * 预热 file-viewer 的 Office 预览依赖
 *
 * <p>与 {@code PreviewOfficePanel.ensureFileViewerLoaded} 拉的是同一批模块：
 * 模块系统自身有缓存，这里先拉一次，面板再 import 时直接命中缓存。</p>
 *
 * @returns 预热完成的 Promise（失败静默，不影响任何功能）
 */
export function warmOfficePreview(): Promise<void> {
  if (warmed) {
    return warming ?? Promise.resolve();
  }
  warmed = true;
  warming = Promise.all([
    import("@file-viewer/vue3-full"),
    import("@file-viewer/preset-office"),
    import("@file-viewer/vue3/dist/file-viewer3.css"),
  ])
    .then(() => undefined)
    .catch((e) => {
      // 预热失败只是回到「首次点开时再加载」，不需要打扰用户
      console.warn("[preview-warmup] 预热失败", e);
    });
  return warming;
}

/**
 * 在浏览器空闲时安排一次预热
 *
 * @param delayMs 至少延迟多久（默认 1500ms，避开首屏渲染高峰）
 */
export function scheduleOfficeWarmup(delayMs = 1500): void {
  if (warmed) {
    return;
  }
  if (!networkAllows()) {
    return;
  }
  const run = (): void => {
    void warmOfficePreview();
  };
  const later = (): void => {
    window.setTimeout(run, delayMs);
  };
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;
  if (typeof idle === "function") {
    idle(run, { timeout: delayMs + 3000 });
  } else {
    later();
  }
}
