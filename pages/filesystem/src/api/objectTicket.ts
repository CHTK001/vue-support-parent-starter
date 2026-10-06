/**
 * 对象直链票据解析：把「必须靠 URL 直达的请求」（`<img>` / iframe / `window.open` 下载）
 * 从「把访问令牌塞进查询参数」改成「先换一条短时一次性票据」。
 *
 * <p><b>为什么不能把令牌放进 URL。</b>令牌进 URL 会被复制到至少四处不受控的位置：
 * 浏览器历史（地址栏 + 下拉记录）、网关/反向代理的访问日志、被 {@code Referer} 带给
 * 页面里引用的任意第三方、以及用户的截图与工单。相比之下票据是 16 字节随机值、
 * 有 TTL、可随时失效，泄漏面只剩它自己那一份。</p>
 *
 * <p><b>为什么复用网关已有的一次性链接。</b>文件存储网关本来就提供
 * {@code POST /ot?bucket=&key=&type=expiry&expires=} 签发、{@code GET /ot/{token}} 消费，
 * 且签发端点已纳入私有桶鉴权（未鉴权无法为私有桶签发）。这里只是把它接上，
 * 不新增服务端概念。</p>
 *
 * <p><b>失败时怎么退化。</b>签发失败（网关版本较老没有 /ot、私有桶鉴权失败、
 * 网络抖动）一律退回到<b>不带任何令牌</b>的直接 URL。公共桶照常可用；私有桶则显示为
 * 加载失败 —— 这与修复前的可见结果一致，但绝不会再泄漏令牌。宁可少功能，
 * 不可把凭据拼回 URL。</p>
 */

/** 票据默认有效期（秒）。够看完一个预览，不够长期滥用。 */
export const DEFAULT_TICKET_TTL_SECONDS = 300;

/**
 * 缓存提前失效余量（秒）。
 *
 * <p>票据在服务端到期那一刻就会 410，而前端认为它还有效 —— 中间这段时间的请求
 * 会拿到 410 而不是内容。提前一点丢弃缓存重新签发，避免用户在预览中途看到报错。</p>
 */
export const TICKET_REFRESH_MARGIN_SECONDS = 30;

/** 票据签发结果 */
export interface OneTimeTicket {
  /** 票据令牌 */
  token: string;
  /** 服务端返回的相对路径，形如 {@code /ot/<token>} */
  url: string;
}

/** 票据解析依赖，注入以便脱离浏览器单测 */
export interface ObjectTicketDeps {
  /** 当前是否持有访问令牌 */
  hasToken: () => boolean;
  /** 签发一张票据 */
  mint: (bucket: string, key: string, ttlSeconds: number) => Promise<OneTimeTicket>;
  /** 构造不带任何凭据、且不含任何查询参数的对象直链（参数由本模块统一拼接） */
  directUrl: (bucket: string, key: string) => string;
  /** 当前时刻（毫秒），注入以便测试时间推进 */
  now?: () => number;
  /** 失败告警 */
  onWarn?: (message: string, error: unknown) => void;
  /** 票据缓存上限（默认 500），超出后逐出最早写入的条目 */
  maxCacheEntries?: number;
}

/** 单个对象的票据解析选项 */
export interface ResolveOptions {
  /** 附加查询参数，如 {@code preview=true}、{@code _cfg=...} 缓存击穿标记 */
  params?: Record<string, string>;
  /** 票据有效期（秒） */
  ttlSeconds?: number;
}

/** 一张已缓存票据 */
interface CachedTicket {
  /** 拼接好的完整票据 URL */
  url: string;
  /** 本地判定失效的时刻 */
  staleAt: number;
}

/**
 * 创建票据解析器。
 *
 * <p>单飞（single-flight）：同一对象的并发解析共用同一次签发。文件列表里
 * 同一个对象常被多处同时渲染（缩略图 + 行预览），没有单飞会在打开一个目录时
 * 对同一个 key 打出多次签发请求。</p>
 *
 * @param deps 依赖
 * @returns 票据解析器
 */
export function createObjectTicketResolver(
  deps: ObjectTicketDeps,
): (bucket: string, key: string, options?: ResolveOptions) => Promise<string> {
  const now = deps.now ?? ((): number => Date.now());
  const maxCacheEntries = deps.maxCacheEntries ?? 500;
  const cache = new Map<string, CachedTicket>();
  const inflight = new Map<string, Promise<string>>();

  /**
   * 写入缓存并维持上限。
   *
   * <p>浏览大目录会为每个对象各签一张票据，无上限时缓存会随浏览过的对象数单调增长。
   * Map 保持插入序，逐出首个键即可得到近似的 FIFO —— 对短 TTL 票据而言，
   * 「逐出最旧」与「逐出最没用」差别不大。</p>
   */
  function remember(key: string, ticket: CachedTicket): void {
    cache.delete(key);
    cache.set(key, ticket);
    while (cache.size > maxCacheEntries) {
      const oldest = cache.keys().next();
      if (oldest.done) {
        break;
      }
      cache.delete(oldest.value);
    }
  }

  /**
   * 按需拼接查询串。
   *
   * @param url  基础 URL
   * @param params 参数
   * @returns 拼接后的 URL
   */
  function withParams(url: string, params: Record<string, string>): string {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
    if (entries.length === 0) {
      return url;
    }
    const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
    return `${url}${url.includes("?") ? "&" : "?"}${query}`;
  }

  return async function resolveObjectUrl(
    bucket: string,
    key: string,
    options: ResolveOptions = {},
  ): Promise<string> {
    const params = options.params ?? {};
    const ttlSeconds = options.ttlSeconds ?? DEFAULT_TICKET_TTL_SECONDS;

    // 未登录：没有令牌就没有私有桶权限，直接给不带凭据的公共直链。
    if (!deps.hasToken()) {
      return withParams(deps.directUrl(bucket, key), params);
    }

    const cacheKey = `${bucket}\u0000${key}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.staleAt > now()) {
      return withParams(cached.url, params);
    }

    // 归一化：签发成功给票据 URL，失败（空串）给无凭据直链。
    // 发起者与「加入在途」的并发调用者都必须走这一步 —— 只在发起者一侧兜底的话，
    // 后到的并发调用者会拿到空串，<img src=""> 与 iframe 的 src="" 都表现为异常。
    const finalize = (resolved: string): string =>
      withParams(resolved || deps.directUrl(bucket, key), params);

    const existing = inflight.get(cacheKey);
    if (existing) {
      return finalize(await existing);
    }

    const minting = deps
      .mint(bucket, key, ttlSeconds)
      .then((ticket) => {
        remember(cacheKey, {
          url: ticket.url,
          // 本地到期时刻要比服务端早一段余量，否则会拿着已失效的票据去请求
          staleAt: now() + Math.max(0, ttlSeconds - TICKET_REFRESH_MARGIN_SECONDS) * 1000,
        });
        return ticket.url;
      })
      .catch((error: unknown) => {
        // 不缓存失败：网络抖动恢复后应能立刻重试。空串是「本次没拿到票据」的内部标记，
        // 由 finalize 统一转成无凭据直链，绝不落到调用方手上。
        deps.onWarn?.("签发对象直链票据失败，回退为不带令牌的直链", error);
        return "";
      })
      .finally(() => {
        if (inflight.get(cacheKey) === minting) {
          inflight.delete(cacheKey);
        }
      });

    inflight.set(cacheKey, minting);
    return finalize(await minting);
  };
}
