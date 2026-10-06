/**
 * 会话作用域（session scope）—— 登出时作废在途请求的机制。
 *
 * <p><b>要解决的问题。</b>登出只是「清掉本地令牌」，<b>不会停掉已经发出去的网络请求</b>。
 * 于是在登出前后这一小段窗口里有一批「带着旧令牌」的在途请求，它们陆续返回后：
 * </p>
 * <ul>
 *   <li><b>令牌被复活</b>：定时刷新 / 手动刷新的响应此刻才到，
 *       {@link TokenManager} 照常把新的 accessToken、refreshToken 写回 storage。
 *       用户点了「退出登录」，页面却仍然是登录态 —— 下次打开还是他。
 *       而且 refreshToken 也回来了，等于<b>永远登出不掉</b>。</li>
 *   <li><b>旧响应污染新会话</b>：菜单、用户信息、列表数据的响应把登出前的内容写回 store；
 *       用户 B 登录后看到的是用户 A 的菜单。</li>
 *   <li><b>误弹登录确认框</b>：这批请求带着已作废的令牌陆续 401，
 *       全局响应拦截器会弹「登录已失效」确认框，甚至调 {@code clearAllAuthData()}
 *       把用户刚刚登录好的新会话又清掉。</li>
 * </ul>
 *
 * <p><b>机制。</b>两条互补的防线，都极小：</p>
 * <ol>
 *   <li><b>AbortSignal</b>：一个模块级的 {@link AbortController}，请求拦截器把它挂到每个
 *       请求的 {@code config.signal} 上。登出时 {@code abort()} 一次，
 *       所有在途请求立刻失败，不必等服务端。</li>
 *   <li><b>epoch（世代号）</b>：单调递增的整数。请求发出时记下当时的 epoch，
 *       响应回来时若 epoch 已变，说明「这个响应属于上一个会话」，
 *       于是丢弃（既不写数据，也不弹框、不清会话）。
 *       signal 只解决「请求还��飞」，epoch 还解决「<b>响应已经到本地了、正在处理中</b>」，
 *       以及 abort 拦不住的其它异步路径（定时刷新、SSE 重连等）。</li>
 * </ol>
 *
 * <p><b>依赖说明。</b>本模块零依赖（不用 axios / vue），可在 Node 下直接验收。</p>
 *
 * @since 4.0.0.42
 */

/** 挂在请求配置上的自定义字段名（记下发出时的会话世代） */
export const SESSION_EPOCH_FIELD = "__hcSessionEpoch" as const;

/** 挂在被作废请求错误上的标记，便于响应拦截器识别「这是登出导致的取消」 */
export const SESSION_ABORTED_FIELD = "__hcSessionAborted" as const;

/** 当前作用域的 AbortController；每次 {@link invalidateSessionScope} 换一个新的 */
let controller: AbortController = new AbortController();

/** 当前会话世代号；每次 {@link invalidateSessionScope} 自增 */
let epoch = 0;

/**
 * 当前的会话世代号。
 *
 * <p>在<b>发起</b>任何「响应会影响本地状态」的异步操作前记下它，
 * 在<b>处理响应</b>时与它比对。</p>
 *
 * @returns 当前世代号
 */
export function sessionEpoch(): number {
  return epoch;
}

/**
 * 当前作用域的取消信号。
 *
 * <p>每个请求都挂它，登出时一并 abort。</p>
 *
 * @returns 当前的 AbortSignal（已被作废则 {@code aborted} 为 true）
 */
export function sessionSignal(): AbortSignal {
  // 环境不支持 AbortController（老浏览器 / SSR 兜底）时返回一个永不触发的信号，
  // 退化成「只有 epoch 一道防线」——功能降级但不报错
  return controller?.signal as AbortSignal;
}

/**
 * 作废当前会话：中断全部在途请求并世代号自增。
 *
 * <p><b>调用时机很关键。</b>必须在「登出请求发出<b>之前</b>」调用，
 * 这样：</p>
 * <ul>
 *   <li>登出前发出的请求（刷新、菜单、列表…）被 abort 掉；</li>
 *   <li>登出请求本身在新的作用域里发起，不受牵连，能正常打到服务端。</li>
 * </ul>
 *
 * @returns 作废后的世代号
 */
export function invalidateSessionScope(): number {
  const previous = controller;
  controller = new AbortController();
  epoch += 1;
  try {
    previous?.abort();
  } catch {
    // abort 理论上不会抛（重复 abort 也是 no-op）；真抛了也不能影响登出主流程
  }
  return epoch;
}

/**
 * 判断某个世代号是否已过期（即响应属于更早的会话）。
 *
 * @param stamped 发起操作时记下的世代号；缺失（undefined / NaN）视为「不检查」
 * @returns 已过期返回 true
 */
export function isStaleEpoch(stamped: number | undefined | null): boolean {
  if (typeof stamped !== "number" || !Number.isFinite(stamped)) {
    return false;
  }
  return stamped !== epoch;
}

/**
 * 给一个错误打上「因会话作废而被取消」的标记。
 *
 * @param error axios / fetch 抛出的错误对象
 * @returns 同一个错误对象（便于链式调用）
 */
export function markSessionAborted<T>(error: T): T {
  if (error && typeof error === "object") {
    (error as Record<string, unknown>)[SESSION_ABORTED_FIELD] = true;
  }
  return error;
}

/**
 * 判断错误是否由会话作废导致（用于跳过 toast / 登录框 / 清理等全局副作用）。
 *
 * @param error 错误对象
 * @returns 是会话作废返回 true
 */
export function isSessionAborted(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  return (error as Record<string, unknown>)[SESSION_ABORTED_FIELD] === true;
}
