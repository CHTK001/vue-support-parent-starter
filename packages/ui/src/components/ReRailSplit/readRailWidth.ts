/**
 * 读取记在 localStorage 里的左栏宽度偏好。
 *
 * <p>页面初始化时同步读一遍，避免先渲染默认值再跳到上次宽度造成闪烁；
 * 拖拽结束的写入由 {@link ReRailSplit} 负责。</p>
 *
 * @param key      偏好的 localStorage 键
 * @param fallback 读不到 / 超界时的默认宽度
 * @param min      左栏最小宽度
 * @param max      左栏最大宽度
 */
export function readRailWidth(key: string, fallback: number, min = 200, max = 560): number {
  try {
    const raw = Number(localStorage.getItem(key))
    if (!Number.isFinite(raw) || raw <= 0) return fallback
    return Math.min(max, Math.max(min, raw))
  } catch {
    return fallback
  }
}
