/**
 * 浏览器端持久化的两个通用原语：localStorage 的带命名空间读写 + 批量合并写。
 *
 * <p>用在高频、可丢的场景（拖拽几何、窗口状态）：调用方在交互过程中随意调用，写盘由这里合并，
 * 不会因为一次拖拽产生上百次 `setItem`。</p>
 */

/** 默认命名空间（用 `:` 结尾，键形如 `koi:xxx`） */
const DEFAULT_NS = "koi:";

/** 按命名空间读写 localStorage；隐私模式下不可用会静默降级为内存 */
export function createPersist(prefix = DEFAULT_NS) {
  const ns = prefix.endsWith(":") ? prefix : `${prefix}:`;
  const memory = new Map<string, string>();

  function getRaw(key: string): string | null {
    try {
      return localStorage.getItem(ns + key);
    } catch {
      return memory.get(key) ?? null;
    }
  }

  function setRaw(key: string, value: string): void {
    try {
      localStorage.setItem(ns + key, value);
    } catch {
      memory.set(key, value);
    }
  }

  /** 读取并反序列化；解析失败按“没有”处理 */
  function get<T>(key: string, fallback?: T): T | undefined {
    const raw = getRaw(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /** 立即写入 */
  function set<T>(key: string, value: T): void {
    try {
      setRaw(key, JSON.stringify(value));
    } catch {
      // 值不可序列化：忽略这条写入
    }
  }

  function remove(key: string): void {
    try {
      localStorage.removeItem(ns + key);
    } catch {
      memory.delete(key);
    }
    memory.delete(key);
  }

  return { get, set, getRaw, setRaw, remove, namespace: ns };
}

/** 全局默认命名空间的便捷实例 */
export const persist = createPersist();

/**
 * 合并写：同一个 key 在 `wait` 毫秒内的多次写入只落盘一次（取最后一次的值）。
 * 拖拽每帧都可以调用，落盘频率由 wait 控制。
 */
export function createCoalescer(wait = 250) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const latest = new Map<string, () => void>();

  /** 提交一次（同一 key 的调用会被合并） */
  function push(key: string, write: () => void): void {
    latest.set(key, write);
    if (timers.has(key)) return;
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        const fn = latest.get(key);
        latest.delete(key);
        if (fn) fn();
      }, wait),
    );
  }

  /** 立刻写完挂起的所有 key（页面卸载前调用） */
  function flush(): void {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    const pending = Array.from(latest.values());
    latest.clear();
    pending.forEach((fn) => {
      try {
        fn();
      } catch {
        // 单个写入失败不影响其它
      }
    });
  }

  /** 取消某个 key 的挂起写入 */
  function cancel(key: string): void {
    const t = timers.get(key);
    if (t) clearTimeout(t);
    timers.delete(key);
    latest.delete(key);
  }

  return { push, flush, cancel };
}
