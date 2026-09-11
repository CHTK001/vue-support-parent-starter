/**
 * Socket 地址负载均衡与降级选择器
 *
 * 三协议（socketio / websocket / sse）共用的多地址路由：
 *  - round-robin 轮询选取地址，避免单点热点
 *  - 连接失败（connect_error / onerror / onclose 未连接）将地址加入黑名单，
 *    黑名单地址在 TTL 内被跳过，到期后自动恢复重试
 *  - 全部地址都在黑名单时重置黑名单立即重试（极端场景降级为全量轮换）
 *
 * 用法：
 *   const selector = createUrlSelector({ urls, blacklistTtlMs: 60000 });
 *   const url = selector.next();      // 取下一个可用地址
 *   selector.markSuccess(url);        // 连接成功后调用（清除黑名单）
 *   selector.markFailure(url);        // 连接失败调用（进入黑名单）
 */

/** 地址选择器配置 */
export interface UrlSelectorOptions {
  /** 可用地址列表 */
  urls: string[];
  /** 失败地址黑名单缓存时长（毫秒），默认 60_000 */
  blacklistTtlMs?: number;
}

/** 地址选择器 */
export interface UrlSelector {
  /** 取下一个可用地址（黑名单到期自动恢复）；无可用时重置黑名单并返回首个 */
  next(): string | null;
  /** 连接成功：清除该地址黑名单，恢复权重 */
  markSuccess(url: string): void;
  /** 连接失败：将该地址加入黑名单 */
  markFailure(url: string): void;
  /** 清除全部黑名单 */
  reset(): void;
  /** 当前可连接地址数 */
  availableCount(): number;
}

/** 黑名单到期时间（毫秒时间戳）缓存 */
interface BlacklistEntry {
  expireAt: number;
}

/**
 * 创建地址选择器
 *
 * @param options 配置
 * @returns 选择器实例
 */
export function createUrlSelector(options: UrlSelectorOptions): UrlSelector {
  const urls = (options.urls ?? []).filter(Boolean);
  const blacklistTtlMs = options.blacklistTtlMs ?? 60_000;
  /** 黑名单：url -> 到期时间 */
  const blacklist = new Map<string, BlacklistEntry>();
  /** round-robin 游标 */
  let cursor = 0;

  const isBlacklisted = (url: string): boolean => {
    const entry = blacklist.get(url);
    if (!entry) return false;
    if (Date.now() >= entry.expireAt) {
      blacklist.delete(url);
      return false;
    }
    return true;
  };

  const next = (): string | null => {
    if (urls.length === 0) return null;
    // 全部黑名单时重置（避免永久无法连接），并立即返回游标处地址
    if (urls.every((u) => isBlacklisted(u))) {
      blacklist.clear();
    }
    // 从游标开始向后找第一个未黑名单地址
    for (let i = 0; i < urls.length; i++) {
      const index = (cursor + i) % urls.length;
      const candidate = urls[index];
      if (!isBlacklisted(candidate)) {
        cursor = (index + 1) % urls.length;
        return candidate;
      }
    }
    // 理论不可达（上面已清空黑名单），兜底返回游标地址
    const fallback = urls[cursor % urls.length];
    cursor = (cursor + 1) % urls.length;
    return fallback;
  };

  const markSuccess = (url: string): void => {
    blacklist.delete(url);
  };

  const markFailure = (url: string): void => {
    blacklist.set(url, { expireAt: Date.now() + blacklistTtlMs });
  };

  const reset = (): void => {
    blacklist.clear();
  };

  const availableCount = (): number => {
    return urls.filter((u) => !isBlacklisted(u)).length;
  };

  return { next, markSuccess, markFailure, reset, availableCount };
}

export default createUrlSelector;